"""Build per-vector embeddings for every catalog row. Output backend/data/vectors.json.

Day 2 vectors:
- narrative (1024d, cosine) via BGE-large-en-v1.5
- risk (32d, Euclidean) hand-engineered per the plan's dimension spec

Stretch vectors (yield_source, correlation, composability) are stubbed for Days 10/11/14.

Run from backend/:
    .venv/Scripts/python.exe scripts/build_vectors.py
"""
import json
import math
import sqlite3
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from sentence_transformers import SentenceTransformer

from app.schemas import PointPayload

CACHE_PATH = Path(__file__).parent.parent / "data" / "cache.sqlite"
VECTORS_PATH = Path(__file__).parent.parent / "data" / "vectors.json"
NARRATIVE_MODEL = "BAAI/bge-large-en-v1.5"

# Positional index order for the yield_source vector. First 11 slots map to the
# YieldSource enum values; last 5 are reserved padding so the vector is 16d.
YIELD_SOURCE_ORDER = [
    "real_yield",
    "lending_spread",
    "amm_fees",
    "options_premium",
    "points_airdrop",
    "emissions",
    "mev_capture",
    "basis_trade",
    "restaking_reward",
    "stablecoin_issuance",
    "validator_commission",
]
YIELD_SOURCE_DIM = 16

# Correlation vector — 8d cosine. Index order:
#   [BTC, ETH, SPX, IEF, HYG, DXY, GOLD, USDC_rate]
# Values are eyeballed expected 1y rolling Pearson correlations per category.
# In a fuller build these would be computed from real historical APY series;
# for the hackathon we use category-defaults so the lens still produces
# meaningful clusters: T-bills with savings rates (IEF/USDC_rate), LSTs with
# LRTs (ETH-heavy), AMMs/perps/options together (BTC+ETH beta), stable AMMs
# near zero.
CORRELATION_DIM = 8
CATEGORY_DEFAULT_CORRELATION: dict[str, list[float]] = {
    "lending":               [0.30, 0.40, 0.20,  0.00, 0.30, -0.10, 0.00, 0.40],
    "fixed_rate":            [0.20, 0.30, 0.10,  0.10, 0.20,  0.00, 0.00, 0.30],
    "lst":                   [0.50, 0.95, 0.30,  0.00, 0.20, -0.20, 0.00, 0.10],
    "lrt":                   [0.50, 0.95, 0.30,  0.00, 0.20, -0.20, 0.00, 0.10],
    "stable_amm":            [0.10, 0.10, 0.05,  0.00, 0.10,  0.00, 0.00, 0.10],
    "volatile_amm":          [0.65, 0.70, 0.35, -0.10, 0.30, -0.20, 0.00, 0.00],
    "options_vault":         [0.70, 0.60, 0.30,  0.00, 0.30, -0.20, 0.00, 0.00],
    "rwa_treasury":          [0.00, 0.00, 0.20,  0.85, 0.50,  0.10, 0.00, 0.95],
    "institutional_lending": [0.10, 0.10, 0.30,  0.50, 0.70,  0.00, 0.00, 0.70],
    "perps_lp":              [0.65, 0.70, 0.30, -0.10, 0.30, -0.20, 0.00, 0.00],
    "basis_trade":           [0.40, 0.50, 0.20,  0.00, 0.30, -0.10, 0.00, 0.30],
    "yield_aggregator":      [0.30, 0.40, 0.20,  0.10, 0.30, -0.10, 0.00, 0.30],
    "savings_rate":          [0.00, 0.00, 0.10,  0.80, 0.40,  0.10, 0.00, 0.95],
    "stablecoin_issuance":   [0.20, 0.30, 0.10,  0.20, 0.30, -0.10, 0.00, 0.50],
}

AUDIT_FIRM_SCORES: dict[str, float] = {
    "trail_of_bits": 0.95, "openzeppelin": 0.95, "consensys_diligence": 0.9,
    "chainsecurity": 0.9, "certora": 0.9, "runtime_verification": 0.9,
    "spearbit": 0.9, "code4rena": 0.85, "abdk": 0.85, "sigp": 0.85,
    "sigma_prime": 0.85, "mixbytes": 0.8, "peckshield": 0.8,
    "quantstamp": 0.75, "certik": 0.65, "halborn": 0.75, "nethermind": 0.8,
    "omniscia": 0.7, "solidified": 0.7, "zellic": 0.85, "pashov": 0.85,
    "cantina": 0.85, "ackee": 0.75, "statemind": 0.75, "secure3": 0.7,
    "guardian": 0.7, "sherlock": 0.8, "pessimistic": 0.7, "paladin": 0.7,
    "chainsafe": 0.75, "three_sigma": 0.75, "ottersec": 0.85,
    "neodyme": 0.8, "offside_labs": 0.75, "kudelski_security": 0.85,
    "phabc": 0.7, "dapphub": 0.75, "trust_security": 0.75,
    "wattpad-security": 0.5,
}
DEFAULT_AUDIT_SCORE = 0.6

L1_CHAINS = {"ethereum", "bsc"}
L2_CHAINS = {"base", "arbitrum", "optimism", "polygon"}
ALT_L1_CHAINS = {"solana", "avalanche"}

LIQUIDATION_RISK_CATEGORIES = {"lending", "perps_lp", "options_vault"}

CUSTODY_BY_CATEGORY: dict[str, str] = {
    "rwa_treasury": "custodial",
    "institutional_lending": "hybrid",
}


def load_catalog() -> list[tuple[str, PointPayload]]:
    conn = sqlite3.connect(CACHE_PATH)
    rows = conn.execute(
        "SELECT id, protocol, product, category, chains, current_apy, tvl_usd, "
        "audit_count, audit_firms, max_drawdown_1y, lockup_days, launched_at, "
        "tax_treatment, yield_source_mix, description, url "
        "FROM protocols ORDER BY id"
    ).fetchall()
    conn.close()
    catalog: list[tuple[str, PointPayload]] = []
    for r in rows:
        payload = PointPayload(
            id=r[0],
            protocol=r[1],
            product=r[2],
            category=r[3],
            chains=json.loads(r[4]),
            current_apy=r[5],
            tvl_usd=r[6],
            audit_count=r[7],
            audit_firms=json.loads(r[8]),
            max_drawdown_1y=r[9],
            lockup_days=r[10],
            launched_at=date.fromisoformat(r[11]),
            tax_treatment=r[12],
            yield_source_mix=json.loads(r[13]),
            description=r[14],
            url=r[15],
        )
        catalog.append((r[0], payload))
    return catalog


def build_narrative(catalog: list[tuple[str, PointPayload]]) -> dict[str, list[float]]:
    print(f"  Loading {NARRATIVE_MODEL} (one-time ~1.3GB download on first run)...")
    model = SentenceTransformer(NARRATIVE_MODEL)

    texts: list[str] = []
    ids: list[str] = []
    for pid, p in catalog:
        text = (
            f"{p.protocol} -- {p.product}. {p.description} "
            f"Category: {p.category.value}. "
            f"Audited by: {', '.join(p.audit_firms) if p.audit_firms else 'unaudited'}."
        )
        texts.append(text)
        ids.append(pid)

    print(f"  Encoding {len(texts)} narratives...")
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return {pid: emb.tolist() for pid, emb in zip(ids, embeddings)}


def build_risk(catalog: list[tuple[str, PointPayload]]) -> dict[str, list[float]]:
    today = date.today()
    ages_days = [(today - p.launched_at).days for _, p in catalog]
    age_mean = float(np.mean(ages_days))
    age_std = float(np.std(ages_days)) or 1.0

    out: dict[str, list[float]] = {}
    for pid, p in catalog:
        v = [0.0] * 32

        age_days = (today - p.launched_at).days
        v[0] = (age_days - age_mean) / age_std
        v[1] = math.log1p(p.audit_count) / math.log1p(10.0)

        scores = [AUDIT_FIRM_SCORES.get(f, DEFAULT_AUDIT_SCORE) for f in p.audit_firms]
        v[2] = sum(scores) / len(scores) if scores else 0.0

        v[3] = 0.5  # tvl_stability — no historical data yet
        v[4] = max(0.0, min(1.0, p.max_drawdown_1y))
        v[5] = 0.0  # depeg_events_count_norm
        v[6] = 0.25  # oracle_diversity default

        primary_chain = p.chains[0].value
        v[7] = 1.0 if primary_chain in L1_CHAINS else 0.0
        v[8] = 1.0 if primary_chain in L2_CHAINS else 0.0
        v[9] = 1.0 if primary_chain in ALT_L1_CHAINS else 0.0

        custody = CUSTODY_BY_CATEGORY.get(p.category.value, "non_custodial")
        v[10] = 1.0 if custody == "custodial" else 0.0
        v[11] = 1.0 if custody == "non_custodial" else 0.0
        v[12] = 1.0 if custody == "hybrid" else 0.0

        v[13] = 1.0 if p.category.value in LIQUIDATION_RISK_CATEGORIES else 0.0
        v[14] = 1.0  # pause_function_flag — conservative default
        v[15] = min(1.0, math.log10(max(p.tvl_usd, 1)) / 10.0)
        v[16] = 0.2  # apy_volatility default
        # 17-31 padding stays 0

        out[pid] = v
    return out


def build_yield_source(catalog: list[tuple[str, PointPayload]]) -> dict[str, list[float]]:
    """Soft one-hot of yield_source_mix in YIELD_SOURCE_ORDER. 16d cosine."""
    out: dict[str, list[float]] = {}
    for pid, p in catalog:
        v = [0.0] * YIELD_SOURCE_DIM
        for source, weight in p.yield_source_mix.items():
            if source in YIELD_SOURCE_ORDER:
                v[YIELD_SOURCE_ORDER.index(source)] = float(weight)
        out[pid] = v
    return out


def build_correlation(catalog: list[tuple[str, PointPayload]]) -> dict[str, list[float]]:
    """8d cosine vector per protocol using category-default correlations.

    Future work: pull DefiLlama /chart/{pool_id} historical APY and compute
    actual rolling correlations vs the 8 reference asset return series.
    """
    out: dict[str, list[float]] = {}
    default = [0.0] * CORRELATION_DIM
    for pid, p in catalog:
        out[pid] = list(CATEGORY_DEFAULT_CORRELATION.get(p.category.value, default))
    return out


def main() -> int:
    print(f"Loading catalog from {CACHE_PATH} ...")
    catalog = load_catalog()
    print(f"  {len(catalog)} protocols loaded")

    print("\nBuilding narrative vector (1024d, BGE)...")
    narrative = build_narrative(catalog)
    dim_narrative = len(next(iter(narrative.values())))
    print(f"  {len(narrative)} narrative vectors x {dim_narrative}d")

    print("\nBuilding risk vector (32d, hand-engineered)...")
    risk = build_risk(catalog)
    dim_risk = len(next(iter(risk.values())))
    print(f"  {len(risk)} risk vectors x {dim_risk}d")

    print("\nBuilding yield_source vector (16d, soft one-hot)...")
    yield_source = build_yield_source(catalog)
    dim_ys = len(next(iter(yield_source.values())))
    print(f"  {len(yield_source)} yield_source vectors x {dim_ys}d")

    print("\nBuilding correlation vector (8d, category-default fallback)...")
    correlation = build_correlation(catalog)
    dim_c = len(next(iter(correlation.values())))
    print(f"  {len(correlation)} correlation vectors x {dim_c}d")

    output = {
        "narrative": narrative,
        "risk": risk,
        "yield_source": yield_source,
        "correlation": correlation,
    }

    VECTORS_PATH.parent.mkdir(exist_ok=True)
    with open(VECTORS_PATH, "w") as fh:
        json.dump(output, fh)
    print(f"\nWrote {VECTORS_PATH} ({VECTORS_PATH.stat().st_size / 1024:.0f} KB)")

    # Sanity check: nearest neighbors on the narrative axis for a few protocols
    print("\n=== Sanity check: narrative nearest neighbors ===")
    for needle in ["lido", "ondo", "uniswap", "pendle", "blackrock"]:
        anchor = next((pid for pid, _ in catalog if needle in pid.lower()), None)
        if anchor is None:
            continue
        anchor_vec = np.array(narrative[anchor])
        sims = []
        for pid in narrative:
            if pid == anchor:
                continue
            cos = float(np.dot(anchor_vec, np.array(narrative[pid])))
            sims.append((pid, cos))
        sims.sort(key=lambda x: -x[1])
        print(f"\n  {anchor}:")
        for pid, score in sims[:4]:
            print(f"    {score:.4f}  {pid}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
