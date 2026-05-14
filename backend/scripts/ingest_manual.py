"""Load data/manual.yaml, validate each entry through PointPayload, and write to
data/cache.sqlite alongside the DefiLlama-sourced rows.

Run from the backend/ directory:
    .venv/Scripts/python.exe scripts/ingest_manual.py
"""
import json
import sqlite3
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import yaml

from app.schemas import PointPayload

MANUAL_PATH = Path(__file__).parent.parent / "data" / "manual.yaml"
CACHE_PATH = Path(__file__).parent.parent / "data" / "cache.sqlite"


def insert_payload(conn: sqlite3.Connection, payload: PointPayload, raw: dict) -> None:
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
            "manual",
            json.dumps(raw, default=str),
        ),
    )


def main() -> int:
    print(f"Loading {MANUAL_PATH} ...")
    with open(MANUAL_PATH, encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    entries = data.get("protocols", [])
    print(f"  Found {len(entries)} entries")

    conn = sqlite3.connect(CACHE_PATH)
    # Wipe prior manual rows so re-runs are clean
    conn.execute("DELETE FROM protocols WHERE source='manual'")

    inserted = 0
    errors: list[tuple[str, str]] = []
    for entry in entries:
        entry_id = entry.get("id", "<no id>")
        try:
            # YAML dates may parse as date objects; if not, coerce.
            if isinstance(entry.get("launched_at"), str):
                entry["launched_at"] = date.fromisoformat(entry["launched_at"])
            payload = PointPayload(**entry)
            insert_payload(conn, payload, entry)
            inserted += 1
        except Exception as e:
            errors.append((entry_id, str(e)))

    conn.commit()
    total_manual = conn.execute("SELECT COUNT(*) FROM protocols WHERE source='manual'").fetchone()[0]
    total_all = conn.execute("SELECT COUNT(*) FROM protocols").fetchone()[0]
    conn.close()

    print(f"\nInserted: {inserted}")
    if errors:
        print(f"Errors ({len(errors)}):")
        for who, why in errors:
            print(f"  - {who}: {why}")
    print(f"Total manual rows: {total_manual}")
    print(f"Total catalog rows (all sources): {total_all}")
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
