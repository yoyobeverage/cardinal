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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import catalog, llm, optimizer, qdrant_client
from app.schemas import Allocation, FormInput, LensWeights, QuerySpec

# Mirror of YIELD_SOURCE_ORDER in scripts/build_vectors.py - keep in sync.
# First 11 slots map to the YieldSource enum; last 5 are reserved padding.
_YIELD_SOURCE_ORDER = [
    "real_yield", "lending_spread", "amm_fees", "options_premium",
    "points_airdrop", "emissions", "mev_capture", "basis_trade",
    "restaking_reward", "stablecoin_issuance", "validator_commission",
]
_YIELD_SOURCE_DIM = 16
# Weights applied to the user's top-5 drag-rank picks.
_RANK_WEIGHTS = [0.4, 0.25, 0.15, 0.1, 0.05]


def _ranking_to_yield_source_target(ranking: list[str]) -> list[float]:
    """Build a 16d target vector from the user's yield_source_ranking."""
    vec = [0.0] * _YIELD_SOURCE_DIM
    for i, source in enumerate(ranking[: len(_RANK_WEIGHTS)]):
        if source in _YIELD_SOURCE_ORDER:
            vec[_YIELD_SOURCE_ORDER.index(source)] = _RANK_WEIGHTS[i]
    return vec

UMAP_PATH = Path(__file__).parent.parent / "data" / "umap.json"
VECTORS_PATH = Path(__file__).parent.parent / "data" / "vectors.json"


def _correlation_vectors() -> dict[str, list[float]]:
    if not VECTORS_PATH.exists():
        return {}
    data = json.loads(VECTORS_PATH.read_text())
    return data.get("correlation", {})


# scenario_id -> (held_anchor_protocol_id, sold_anchor_protocol_id)
# Mirrors the SCENARIOS array in frontend/src/components/DrawdownSwipe.tsx.
SCENARIO_ANCHORS: dict[str, tuple[str, str]] = {
    "terra":          ("ethena-usde_ethereum_susde",   "ondo-yield-assets_ethereum_usdy"),
    "ftx":            ("blackrock_buidl",              "sparklend_ethereum_usds"),
    "usdc_depeg":     ("spark-savings_ethereum_usdc",  "ondo-yield-assets_ethereum_usdy"),
    "steth_discount": ("lido_ethereum_steth",          "rocket-pool_ethereum_reth"),
    "btc_drawdown":   ("ether_fi-stake_ethereum_weeth","ondo-yield-assets_ethereum_usdy"),
}


def _swipes_to_context_pairs(swipes) -> list[tuple[str, str]]:
    """DrawdownSwipe decisions -> (positive_id, negative_id) pairs for Discovery API."""
    pairs: list[tuple[str, str]] = []
    for s in swipes:
        if s.scenario_id not in SCENARIO_ANCHORS:
            continue
        held, sold = SCENARIO_ANCHORS[s.scenario_id]
        pairs.append((held, sold) if s.decision == "held" else (sold, held))
    return pairs

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

# Open CORS: Cardinal exposes only unauthenticated read-only and idempotent endpoints,
# so the standard concerns around credentialed cross-site requests don't apply. The
# deployed Vercel URL is not known until after first deploy, so wildcarding avoids a
# chicken-and-egg redeploy cycle.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    # No anchors - scroll-style enumeration on the primary lens (no scoring against anchor).
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


@app.get("/api/protocol/{protocol_id}")
def protocol_detail(protocol_id: str, anchors: str = "") -> dict:
    """Return one protocol's payload + (optionally) per-lens similarity scores
    against a comma-separated list of anchor ids. Used by the scatter when the
    user clicks a non-allocated dot - there's no Position for these points but
    we still want to show why-or-why-not similarity in the drilldown radar.
    """
    cat = catalog.load_catalog()
    payload = cat.get(protocol_id)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"unknown protocol_id: {protocol_id}")

    per_lens_scores: dict[str, float] = {}
    anchor_list = [a.strip() for a in anchors.split(",") if a.strip()]
    if anchor_list:
        try:
            raw = qdrant_client.per_lens_similarity_batch([protocol_id], anchor_list)
            per_lens_scores = {
                lens: _normalize_lens_score(lens, score)
                for lens, score in raw.get(protocol_id, {}).items()
            }
        except Exception:
            log.exception("per_lens_similarity_batch failed for %s", protocol_id)

    return {
        "id": protocol_id,
        "payload": payload.model_dump(mode="json"),
        "per_lens_scores": per_lens_scores,
    }


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


_COSINE_LENSES = {"narrative", "yield_source", "correlation", "composability"}


def _normalize_lens_score(lens: str, raw: float) -> float:
    """Map raw Qdrant scores to [0,1] similarity (1 = best match) for radar display."""
    if lens in _COSINE_LENSES:
        return max(0.0, min(1.0, raw))
    if lens == "risk":
        # Euclidean: smaller distance = closer. Map to [0,1] via 1/(1+d).
        return 1.0 / (1.0 + max(0.0, raw))
    return raw


def _attach_per_lens_scores(positions: list, anchor_ids: list[str]) -> list:
    if not positions or not anchor_ids:
        return positions
    point_ids = [p.protocol_id for p in positions]
    raw = qdrant_client.per_lens_similarity_batch(point_ids, anchor_ids)
    for pos in positions:
        pos.per_lens_scores = {
            lens: _normalize_lens_score(lens, score)
            for lens, score in raw.get(pos.protocol_id, {}).items()
        }
    return positions


@app.post("/api/portfolio")
def portfolio(form: FormInput, optimizer_name: str = "weighted_sum") -> Allocation:
    """Optimizer choice via ?optimizer_name=weighted_sum|mean_variance."""
    log.info("portfolio: capital=$%s optimizer=%s freeform=%r",
             form.capital_usd, optimizer_name, form.freeform[:80])

    spec = llm.translate(form)
    log.info(
        "spec: anchors=%s negatives=%s lens=%s concerns=%s",
        spec.positive_anchors,
        spec.negative_anchors,
        spec.lens_weights.model_dump(),
        spec.extracted_concerns,
    )

    # If the user answered drawdown-swipe scenarios, run a Discovery API walk on
    # the risk axis and prepend whatever it surfaces to spec.positive_anchors so
    # the main recommend reflects the revealed risk tolerance.
    if form.drawdown_swipes:
        pairs = _swipes_to_context_pairs(form.drawdown_swipes)
        if pairs:
            try:
                discovery = qdrant_client.discovery_walk(pairs, using="risk", limit=5)
                discovered = [p.payload["id"] for p in discovery if p.payload]
                merged = list(dict.fromkeys(discovered + spec.positive_anchors))
                log.info("discovery_walk surfaced %s; final anchors=%s", discovered, merged)
                spec.positive_anchors = merged
            except Exception:
                log.exception("discovery_walk failed; continuing without swipe anchors")

    # If the user drag-ranked yield sources, route through multi_vector_prefetch
    # with a yield_source target instead of the anchor-based recommend.
    if form.yield_source_ranking:
        ranking_values = [s.value for s in form.yield_source_ranking]
        target = _ranking_to_yield_source_target(ranking_values)
        log.info("yield_source_ranking: %s -> target nonzero @ %s",
                 ranking_values, [i for i, v in enumerate(target) if v > 0])
        try:
            candidates = qdrant_client.multi_vector_prefetch(
                target_vectors={"yield_source": target},
                weights=LensWeights(yield_source=1.0),
                hard_filters=spec.hard_filters,
                limit=20,
            )
        except Exception:
            log.exception("multi_vector_prefetch failed; falling back to _run_query")
            candidates = _run_query(spec)
    else:
        candidates = _run_query(spec)
    log.info("qdrant: %d candidates", len(candidates))

    if optimizer_name == "mean_variance":
        positions = optimizer.mean_variance(
            candidates, _correlation_vectors(), form.capital_usd,
        )
    else:
        positions = optimizer.weighted_sum(
            candidates, form.capital_usd,
            tax_wrapper=form.tax_wrapper.value,
        )

    positions = _attach_per_lens_scores(positions, spec.positive_anchors)
    log.info("optimizer=%s -> %d positions, weights=%s",
             optimizer_name, len(positions), [round(p.weight, 3) for p in positions])

    allocation = Allocation(
        positions=positions,
        explanation="",
        extracted_concerns=spec.extracted_concerns,
        query_spec=spec,
    )
    allocation.explanation = llm.narrate(allocation)
    return allocation
