"""Run node2vec over the receipt-token composability graph to produce 64d
embeddings per catalog protocol. Called by scripts/build_vectors.py:main().

Protocols with no edges in PROJECT_GRAPH get a self-loop so node2vec still
emits a vector for them (otherwise the random walks would crash on isolated
nodes). They end up isolated in embedding space — which is the right semantic:
"no known composability."
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import networkx as nx
from node2vec import Node2Vec

from app.schemas import PointPayload

# composability vector dim — must match qdrant_client.VECTOR_CONFIGS["composability"]
COMPOSABILITY_DIM = 64


def _catalog_ids_for_project(catalog_ids: list[str], project_slug: str) -> list[str]:
    """Return all catalog ids whose protocol slug matches project_slug.

    DefiLlama-sourced ids look like `lido_ethereum_steth` (slug + chain + symbol).
    Manual.yaml ids may be exact matches (`blackrock_buidl`).
    """
    matches = []
    prefix = f"{project_slug.lower()}_"
    for cid in catalog_ids:
        if cid.lower() == project_slug.lower() or cid.lower().startswith(prefix):
            matches.append(cid)
    return matches


def build_composability(catalog: list[tuple[str, PointPayload]]) -> dict[str, list[float]]:
    """Build a directed graph from PROJECT_GRAPH expanded to catalog ids, then
    run node2vec to produce a 64d embedding per protocol."""
    from composability_graph import PROJECT_GRAPH

    catalog_ids = [pid for pid, _ in catalog]
    catalog_set = set(catalog_ids)

    g = nx.DiGraph()
    for cid in catalog_ids:
        g.add_node(cid)

    edge_count = 0
    for source_project, target_projects in PROJECT_GRAPH.items():
        source_ids = _catalog_ids_for_project(catalog_ids, source_project)
        if not source_ids:
            continue
        for tgt in target_projects:
            target_ids = _catalog_ids_for_project(catalog_ids, tgt)
            for s in source_ids:
                for t in target_ids:
                    if s != t:
                        g.add_edge(s, t)
                        edge_count += 1

    # Isolated nodes -> self-loop so node2vec random walks have something to traverse
    isolates = list(nx.isolates(g))
    for node in isolates:
        g.add_edge(node, node)

    print(f"  graph: {g.number_of_nodes()} nodes, {edge_count} cross-edges, {len(isolates)} isolates (self-looped)")

    node2vec = Node2Vec(
        g,
        dimensions=COMPOSABILITY_DIM,
        walk_length=10,
        num_walks=50,
        p=1.0,
        q=1.0,
        workers=1,
        quiet=True,
        seed=42,
    )
    model = node2vec.fit(window=5, min_count=1, batch_words=4, seed=42)

    out: dict[str, list[float]] = {}
    for cid in catalog_ids:
        if cid in model.wv:
            out[cid] = model.wv[cid].astype(float).tolist()
        else:
            # Shouldn't happen — every node gets a vector after self-loop.
            out[cid] = [0.0] * COMPOSABILITY_DIM
    return out


if __name__ == "__main__":
    # Standalone smoke test
    import json
    import sqlite3
    from datetime import date

    CACHE_PATH = Path(__file__).parent.parent / "data" / "cache.sqlite"
    conn = sqlite3.connect(CACHE_PATH)
    rows = conn.execute(
        "SELECT id, protocol, product, category, chains, current_apy, tvl_usd, "
        "audit_count, audit_firms, max_drawdown_1y, lockup_days, launched_at, "
        "tax_treatment, yield_source_mix, description, url FROM protocols ORDER BY id"
    ).fetchall()
    conn.close()
    cat = []
    for r in rows:
        p = PointPayload(
            id=r[0], protocol=r[1], product=r[2], category=r[3],
            chains=json.loads(r[4]), current_apy=r[5], tvl_usd=r[6],
            audit_count=r[7], audit_firms=json.loads(r[8]),
            max_drawdown_1y=r[9], lockup_days=r[10],
            launched_at=date.fromisoformat(r[11]), tax_treatment=r[12],
            yield_source_mix=json.loads(r[13]), description=r[14], url=r[15],
        )
        cat.append((r[0], p))
    out = build_composability(cat)
    print(f"  emitted {len(out)} composability vectors")
