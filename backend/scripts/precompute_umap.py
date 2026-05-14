"""Project every populated vector to 2D via UMAP and normalize per-lens to the
unit square so cross-lens animations don't teleport. Output backend/data/umap.json.

Run from backend/:
    .venv/Scripts/python.exe scripts/precompute_umap.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import umap

VECTORS_PATH = Path(__file__).parent.parent / "data" / "vectors.json"
UMAP_PATH = Path(__file__).parent.parent / "data" / "umap.json"

METRICS: dict[str, str] = {
    "narrative":     "cosine",
    "risk":          "euclidean",
    "yield_source":  "cosine",
    "correlation":   "cosine",
    "tax_treatment": "cosine",
    "composability": "cosine",
}


def project(vectors: dict[str, list[float]], metric: str) -> dict[str, tuple[float, float]]:
    ids = list(vectors.keys())
    matrix = np.array([vectors[i] for i in ids])
    n_neighbors = min(15, max(2, len(ids) - 1))
    reducer = umap.UMAP(
        n_components=2,
        metric=metric,
        random_state=42,
        n_neighbors=n_neighbors,
        min_dist=0.1,
    )
    coords = reducer.fit_transform(matrix)
    coord_min = coords.min(axis=0)
    coord_max = coords.max(axis=0)
    span = coord_max - coord_min
    span[span == 0] = 1.0
    coords = (coords - coord_min) / span
    return {pid: (float(x), float(y)) for pid, (x, y) in zip(ids, coords)}


def main() -> int:
    print(f"Loading vectors from {VECTORS_PATH} ...")
    with open(VECTORS_PATH) as fh:
        vectors = json.load(fh)
    print(f"  Populated lenses: {list(vectors.keys())}")

    out: dict[str, dict[str, tuple[float, float]]] = {}
    for lens, vecs in vectors.items():
        if not vecs:
            continue
        metric = METRICS.get(lens, "cosine")
        print(f"Projecting {lens} ({metric}, {len(vecs)} points) ...")
        out[lens] = project(vecs, metric)

    UMAP_PATH.write_text(json.dumps(out))
    print(f"Wrote {UMAP_PATH} ({UMAP_PATH.stat().st_size / 1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
