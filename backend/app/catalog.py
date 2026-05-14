"""In-memory catalog loaded once from data/cache.sqlite.

Consumers:
- app/main.py warms it at startup
- app/llm.py inlines catalog_summary_for_prompt() into the translator system prompt
- scripts/upsert_qdrant.py iterates payloads to push into Qdrant
"""
from __future__ import annotations

import json
import sqlite3
from datetime import date
from functools import lru_cache
from pathlib import Path

from app.schemas import PointPayload

CACHE_PATH = Path(__file__).parent.parent / "data" / "cache.sqlite"


@lru_cache(maxsize=1)
def load_catalog() -> dict[str, PointPayload]:
    """Return {protocol_id: PointPayload}. Cached after first call."""
    conn = sqlite3.connect(CACHE_PATH)
    rows = conn.execute(
        "SELECT id, protocol, product, category, chains, current_apy, tvl_usd, "
        "audit_count, audit_firms, max_drawdown_1y, lockup_days, launched_at, "
        "tax_treatment, yield_source_mix, description, url FROM protocols ORDER BY id"
    ).fetchall()
    conn.close()
    catalog: dict[str, PointPayload] = {}
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
        catalog[r[0]] = payload
    return catalog


def catalog_ids() -> list[str]:
    return sorted(load_catalog().keys())


def catalog_summary_for_prompt() -> str:
    """One line per protocol for the translator system prompt.

    Format: id | protocol | category | current_apy% | tvl_m
    """
    lines = []
    for pid, p in sorted(load_catalog().items()):
        tvl_m = p.tvl_usd / 1_000_000
        lines.append(
            f"{pid} | {p.protocol} | {p.category.value} | "
            f"{p.current_apy:.2f}% | ${tvl_m:.0f}M"
        )
    return "\n".join(lines)
