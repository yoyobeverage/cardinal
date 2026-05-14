"""Cardinal FastAPI app.

Day 4 surface:
- POST /api/portfolio: FormInput -> Allocation. Calls translator, queries Qdrant,
  runs optimizer, attaches deterministic explanation.
- GET /health: liveness.

/api/protocol/{id} and /api/lens land in Day 7.
"""
from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import catalog, llm, optimizer, qdrant_client
from app.schemas import Allocation, FormInput, QuerySpec

UMAP_PATH = Path(__file__).parent.parent / "data" / "umap.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("cardinal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Warming catalog and Qdrant client ...")
    catalog.load_catalog()
    qdrant_client.get_client()
    log.info("Startup complete (%d protocols loaded)", len(catalog.load_catalog()))
    yield


app = FastAPI(title="Cardinal", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_query(spec: QuerySpec) -> list:
    primary_lens = "risk" if spec.lens_weights.risk > spec.lens_weights.narrative else "narrative"
    if spec.positive_anchors:
        return qdrant_client.recommend(
            positive=spec.positive_anchors,
            negative=spec.negative_anchors,
            using=primary_lens,
            hard_filters=spec.hard_filters,
            limit=20,
        )
    # No anchors — scroll-style enumeration on the primary lens (no scoring against anchor).
    client = qdrant_client.get_client()
    pts, _ = client.scroll(
        collection_name=qdrant_client.COLLECTION,
        scroll_filter=qdrant_client.build_filter(spec.hard_filters),
        limit=20,
        with_payload=True,
    )
    for p in pts:
        p.score = 1.0  # uniform for downstream optimizer compatibility
    return pts


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "catalog_size": len(catalog.load_catalog())}


@app.get("/api/universe")
def universe() -> list[dict]:
    """Every catalog point with per-lens UMAP coords (for the scatter plot)."""
    cat = catalog.load_catalog()
    if not UMAP_PATH.exists():
        return []
    umap_data = json.loads(UMAP_PATH.read_text())

    out: list[dict] = []
    for pid, p in cat.items():
        coords = {lens: m.get(pid) for lens, m in umap_data.items()}
        if not all(c is not None for c in coords.values()):
            continue
        out.append({
            "id": pid,
            "protocol": p.protocol,
            "product": p.product,
            "category": p.category.value,
            "current_apy": p.current_apy,
            "tvl_usd": p.tvl_usd,
            "coords": coords,
        })
    return out


@app.post("/api/portfolio")
def portfolio(form: FormInput) -> Allocation:
    log.info("portfolio: capital=$%s freeform=%r", form.capital_usd, form.freeform[:80])

    spec = llm.translate(form)
    log.info(
        "spec: anchors=%s negatives=%s lens=%s concerns=%s",
        spec.positive_anchors,
        spec.negative_anchors,
        spec.lens_weights.model_dump(),
        spec.extracted_concerns,
    )

    candidates = _run_query(spec)
    log.info("qdrant: %d candidates", len(candidates))

    positions = optimizer.weighted_sum(candidates, form.capital_usd)
    log.info("optimizer: %d positions, weights=%s", len(positions), [round(p.weight, 3) for p in positions])

    allocation = Allocation(
        positions=positions,
        explanation="",
        extracted_concerns=spec.extracted_concerns,
        query_spec=spec,
    )
    allocation.explanation = llm.narrate(allocation)
    return allocation
