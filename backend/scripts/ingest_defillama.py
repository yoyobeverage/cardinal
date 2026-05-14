"""Pull pools from DefiLlama /yields/pools, filter to whitelisted projects + healthy
parameters, validate through PointPayload, and write to data/cache.sqlite.

Run from the backend/ directory:
    .venv/Scripts/python.exe scripts/ingest_defillama.py
"""
import json
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx

from app.schemas import Chain, PointPayload
from protocol_meta import PROTOCOL_META, get_meta

DEFILLAMA_URL = "https://yields.llama.fi/pools"
CACHE_PATH = Path(__file__).parent.parent / "data" / "cache.sqlite"

ALLOWED_CHAINS: dict[str, Chain] = {
    "Ethereum": Chain.ETHEREUM,
    "Base": Chain.BASE,
    "Arbitrum": Chain.ARBITRUM,
    "Optimism": Chain.OPTIMISM,
    "Polygon": Chain.POLYGON,
    "Solana": Chain.SOLANA,
    "BSC": Chain.BSC,
    "Avalanche": Chain.AVALANCHE,
}

MIN_TVL_USD = 5_000_000
VOLATILE_AMM_MIN_TVL = 10_000_000  # tighter floor for IL-prone pools
MIN_APY_PCT = 0.5  # filter out dormant pools with sub-0.5% APY
MAX_PER_PROJECT = 3
GLOBAL_MAX_POOLS = 70


def make_id(project: str, chain: str, symbol: str) -> str:
    clean = "".join(c if c.isalnum() else "_" for c in symbol.lower())
    project_clean = project.lower().replace(".", "_")
    return f"{project_clean}_{chain.lower()}_{clean}"[:60]


def setup_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS protocols (
            id TEXT PRIMARY KEY,
            protocol TEXT NOT NULL,
            product TEXT NOT NULL,
            category TEXT NOT NULL,
            chains TEXT NOT NULL,
            current_apy REAL NOT NULL,
            tvl_usd INTEGER NOT NULL,
            audit_count INTEGER NOT NULL,
            audit_firms TEXT NOT NULL,
            max_drawdown_1y REAL NOT NULL,
            lockup_days INTEGER NOT NULL,
            launched_at TEXT NOT NULL,
            tax_treatment TEXT NOT NULL,
            yield_source_mix TEXT NOT NULL,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            source TEXT NOT NULL,
            raw_data TEXT
        )
        """
    )
    conn.commit()


def filter_pools(pools: list[dict]) -> list[dict]:
    """Whitelist + chain filter + TVL floor + APY sanity + per-project + global caps."""
    candidates = []
    for p in pools:
        if p.get("project") not in PROTOCOL_META:
            continue
        if p.get("chain") not in ALLOWED_CHAINS:
            continue
        tvl = p.get("tvlUsd") or 0
        if tvl < MIN_TVL_USD:
            continue
        apy = p.get("apy")
        if apy is None or apy < MIN_APY_PCT or apy >= 100:
            continue

        meta = PROTOCOL_META[p["project"]]
        if meta["category"].value == "volatile_amm" and tvl < VOLATILE_AMM_MIN_TVL:
            continue
        candidates.append(p)

    by_project: dict[str, list[dict]] = defaultdict(list)
    for p in candidates:
        by_project[p["project"]].append(p)

    # Round-robin: every project contributes its top-TVL pool first so the catalog
    # stays diverse. Then fill remaining global slots from secondary pools by TVL.
    primary: list[dict] = []
    secondary: list[dict] = []
    for pl in by_project.values():
        pl.sort(key=lambda x: x.get("tvlUsd", 0), reverse=True)
        if pl:
            primary.append(pl[0])
        if len(pl) > 1:
            secondary.extend(pl[1:MAX_PER_PROJECT])

    primary.sort(key=lambda x: x.get("tvlUsd", 0), reverse=True)
    secondary.sort(key=lambda x: x.get("tvlUsd", 0), reverse=True)
    return (primary + secondary)[:GLOBAL_MAX_POOLS]


def to_payload(pool: dict) -> PointPayload | None:
    meta = get_meta(pool["project"])
    if meta is None:
        return None

    chain_enum = ALLOWED_CHAINS[pool["chain"]]
    pool_id = make_id(pool["project"], pool["chain"], pool["symbol"])

    return PointPayload(
        id=pool_id,
        protocol=pool["project"].replace("-", " ").title(),
        product=f"{pool['symbol']} on {pool['chain']}",
        category=meta["category"],
        chains=[chain_enum],
        current_apy=float(pool["apy"]),
        tvl_usd=int(pool["tvlUsd"]),
        audit_count=meta["audit_count"],
        audit_firms=meta["audit_firms"],
        max_drawdown_1y=meta["max_drawdown_1y"],
        lockup_days=meta["lockup_days"],
        launched_at=meta["launched_at"],
        tax_treatment=meta["tax_treatment"],
        yield_source_mix=meta["yield_source_mix"],
        description=meta["description"],
        url=meta["url"],
    )


def insert_payload(conn: sqlite3.Connection, payload: PointPayload, raw: dict, source: str) -> None:
    conn.execute(
        """
        INSERT OR REPLACE INTO protocols (
            id, protocol, product, category, chains, current_apy, tvl_usd,
            audit_count, audit_firms, max_drawdown_1y, lockup_days, launched_at,
            tax_treatment, yield_source_mix, description, url, source, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.id,
            payload.protocol,
            payload.product,
            payload.category.value,
            json.dumps([c.value for c in payload.chains]),
            payload.current_apy,
            payload.tvl_usd,
            payload.audit_count,
            json.dumps(payload.audit_firms),
            payload.max_drawdown_1y,
            payload.lockup_days,
            payload.launched_at.isoformat(),
            payload.tax_treatment.value,
            json.dumps(payload.yield_source_mix),
            payload.description,
            payload.url,
            source,
            json.dumps(raw),
        ),
    )


def main() -> int:
    print(f"Fetching {DEFILLAMA_URL} ...")
    response = httpx.get(DEFILLAMA_URL, timeout=60.0)
    response.raise_for_status()
    pools = response.json()["data"]
    print(f"  DefiLlama returned {len(pools)} pools")

    selected = filter_pools(pools)
    print(f"  Selected {len(selected)} pools after filtering")

    CACHE_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(CACHE_PATH)
    setup_db(conn)

    # Wipe prior defillama rows so re-runs are clean
    conn.execute("DELETE FROM protocols WHERE source='defillama'")

    inserted = 0
    skipped: list[tuple[str, str]] = []
    for pool in selected:
        try:
            payload = to_payload(pool)
            if payload is None:
                skipped.append((f"{pool.get('project')}/{pool.get('symbol')}", "no meta"))
                continue
            insert_payload(conn, payload, pool, source="defillama")
            inserted += 1
        except Exception as e:
            skipped.append((f"{pool.get('project')}/{pool.get('symbol')} on {pool.get('chain')}", str(e)))

    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM protocols WHERE source='defillama'").fetchone()[0]
    conn.close()

    print(f"\nInserted: {inserted}")
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for who, why in skipped:
            print(f"  - {who}: {why}")
    print(f"Total defillama rows in cache: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
