"""Exercise every Qdrant query pattern Cardinal will use. Day 3 sanity check.

Run from backend/:
    .venv/Scripts/python.exe scripts/explore.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import catalog, qdrant_client
from app.schemas import Category, Chain, HardFilters, LensWeights

VECTORS_PATH = Path(__file__).parent.parent / "data" / "vectors.json"


def show(title: str, points: list, n: int = 8) -> None:
    print(f"\n=== {title} ===")
    if not points:
        print("  (no results)")
        return
    for p in points[:n]:
        pl = p.payload
        apy = pl.get("current_apy", 0)
        cat = pl.get("category", "?")
        chains = pl.get("chains", [])
        print(f"  {p.score:7.4f}  {pl['id']:55s}  {apy:5.2f}%  {cat:20s}  {chains}")


def find(catalog_dict: dict, needle: str) -> str:
    for pid in catalog_dict:
        if needle.lower() in pid.lower():
            return pid
    raise KeyError(f"No catalog id matching {needle!r}")


def main() -> int:
    cat = catalog.load_catalog()
    print(f"Loaded {len(cat)} catalog protocols.")

    with open(VECTORS_PATH) as fh:
        vecs = json.load(fh)

    # ---- Scenario 1: filtered k-NN via recommend, with audit and chain filters ----
    lido = find(cat, "lido_ethereum_steth")
    hf = HardFilters(min_audit_count=4, excluded_chains=[Chain.SOLANA])
    pts = qdrant_client.recommend(
        positive=[lido], negative=[], using="narrative",
        hard_filters=hf, limit=8,
    )
    show("Scenario 1: like Lido on NARRATIVE, min 4 audits, no Solana", pts)

    # ---- Scenario 2: recommend with negative anchor ----
    ondo = find(cat, "ondo")  # USDY or OUSG, whichever made the catalog
    renzo = find(cat, "renzo_ethereum_ezeth")
    pts = qdrant_client.recommend(
        positive=[ondo], negative=[renzo], using="narrative",
        hard_filters=HardFilters(), limit=8,
    )
    show("Scenario 2: like Ondo OUSG, NOT like Renzo ezETH", pts)

    # ---- Scenario 3: multi-vector prefetch + RRF (narrative + risk) ----
    target = {
        "narrative": vecs["narrative"][lido],
        "risk":      vecs["risk"][lido],
    }
    weights = LensWeights(narrative=0.5, risk=0.5)
    pts = qdrant_client.multi_vector_prefetch(target, weights, HardFilters(), limit=8)
    show("Scenario 3: like Lido on NARRATIVE+RISK (RRF fusion)", pts)

    # ---- Scenario 4: lens-swap workhorse ----
    pts_n = qdrant_client.lens_query([lido], "narrative", HardFilters(), limit=8)
    show("Scenario 4a: Lido neighborhood by NARRATIVE (the lens-swap query)", pts_n)
    pts_r = qdrant_client.lens_query([lido], "risk", HardFilters(), limit=8)
    show("Scenario 4b: Lido neighborhood by RISK", pts_r)

    # ---- Scenario 5: hard filter sanity — Solana-only ----
    all_non_solana = [c for c in Chain if c != Chain.SOLANA]
    hf_solana_only = HardFilters(excluded_chains=all_non_solana)
    pts = qdrant_client.recommend(
        positive=[lido], negative=[], using="narrative",
        hard_filters=hf_solana_only, limit=8,
    )
    show("Scenario 5: Solana-only candidates (Lido as anchor)", pts)

    # ---- Scenario 6: exclude RWA — useful for crypto-only personas ----
    hf_no_rwa = HardFilters(
        excluded_categories=[Category.RWA_TREASURY, Category.INSTITUTIONAL_LENDING]
    )
    blackrock = find(cat, "blackrock_buidl")
    pts = qdrant_client.recommend(
        positive=[blackrock], negative=[], using="narrative",
        hard_filters=hf_no_rwa, limit=8,
    )
    show("Scenario 6: like BlackRock BUIDL, but exclude RWA + institutional lending", pts)

    # ---- Scenario 7: high-yield seeker (no audit floor, no constraints) ----
    pendle = find(cat, "pendle")
    pts = qdrant_client.recommend(
        positive=[pendle], negative=[], using="narrative",
        hard_filters=HardFilters(), limit=8,
    )
    show("Scenario 7: like Pendle (points/yield-trading neighborhood)", pts)

    return 0


if __name__ == "__main__":
    sys.exit(main())
