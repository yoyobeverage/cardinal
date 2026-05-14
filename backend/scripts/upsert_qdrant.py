"""Create the Qdrant collection (idempotent) and upsert all 40 catalog points with
their populated vectors. Reads from data/cache.sqlite and data/vectors.json.

Run from backend/:
    .venv/Scripts/python.exe scripts/upsert_qdrant.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import catalog, qdrant_client

VECTORS_PATH = Path(__file__).parent.parent / "data" / "vectors.json"


def main() -> int:
    print("Loading catalog from SQLite ...")
    cat = catalog.load_catalog()
    print(f"  {len(cat)} protocols")

    print(f"Loading vectors from {VECTORS_PATH} ...")
    with open(VECTORS_PATH) as fh:
        vectors = json.load(fh)
    populated = {name: len(vecs) for name, vecs in vectors.items()}
    print(f"  Populated lenses: {populated}")

    # Wipe and recreate so stale points from prior ingests don't linger.
    print(f"Recreating Qdrant collection '{qdrant_client.COLLECTION}' ...")
    client = qdrant_client.get_client()
    try:
        client.delete_collection(qdrant_client.COLLECTION)
    except Exception:
        pass
    qdrant_client.create_collection_if_missing()

    print("Upserting points ...")
    n_upserted = qdrant_client.upsert_points(list(cat.values()), vectors)
    print(f"  Upserted {n_upserted} points")

    info = qdrant_client.get_client().get_collection(qdrant_client.COLLECTION)
    print(f"\nCollection now holds {info.points_count} points "
          f"({info.indexed_vectors_count} indexed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
