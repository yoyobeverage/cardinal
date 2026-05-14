"""All Qdrant interaction. Lazy singleton client, parameterized query functions.

The collection holds five named vectors per point (narrative, risk, yield_source,
correlation, composability), with seven payload indexes covering every field used
in HardFilters. Point ids are UUID5 deterministically derived from each protocol's
human-readable id, so re-running the upsert produces the same point ids.
"""
from __future__ import annotations

import uuid
from functools import lru_cache
from typing import Sequence

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

from app.config import settings
from app.schemas import HardFilters, LensWeights, PointPayload

COLLECTION = settings.QDRANT_COLLECTION
_NAMESPACE = uuid.UUID("a3f5b2c1-7e8d-4a9b-9c0d-1e2f3a4b5c6d")

VECTOR_CONFIGS: dict[str, qm.VectorParams] = {
    "narrative":     qm.VectorParams(size=1024, distance=qm.Distance.COSINE),
    "risk":          qm.VectorParams(size=32,   distance=qm.Distance.EUCLID),
    "yield_source":  qm.VectorParams(size=16,   distance=qm.Distance.COSINE),
    "correlation":   qm.VectorParams(size=8,    distance=qm.Distance.COSINE),
    "composability": qm.VectorParams(size=64,   distance=qm.Distance.DOT),
}

PAYLOAD_INDEXES: list[tuple[str, qm.PayloadSchemaType]] = [
    ("category",       qm.PayloadSchemaType.KEYWORD),
    ("chains",         qm.PayloadSchemaType.KEYWORD),
    ("tvl_usd",        qm.PayloadSchemaType.FLOAT),
    ("audit_count",    qm.PayloadSchemaType.INTEGER),
    ("lockup_days",    qm.PayloadSchemaType.INTEGER),
    ("launched_at",    qm.PayloadSchemaType.DATETIME),
    ("tax_treatment",  qm.PayloadSchemaType.KEYWORD),
]


@lru_cache(maxsize=1)
def get_client() -> QdrantClient:
    return QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)


def point_uuid(readable_id: str) -> str:
    """Deterministic UUID5 from a readable protocol id. Stable across runs."""
    return str(uuid.uuid5(_NAMESPACE, readable_id))


def create_collection_if_missing() -> None:
    client = get_client()
    existing = {c.name for c in client.get_collections().collections}
    if COLLECTION in existing:
        return
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VECTOR_CONFIGS,
    )
    for field, schema in PAYLOAD_INDEXES:
        client.create_payload_index(
            collection_name=COLLECTION,
            field_name=field,
            field_schema=schema,
        )


def upsert_points(
    payloads: list[PointPayload],
    vectors: dict[str, dict[str, list[float]]],
    batch_size: int = 50,
) -> int:
    """vectors[vector_name][readable_id] = embedding. Returns count upserted."""
    client = get_client()
    points: list[qm.PointStruct] = []
    for p in payloads:
        vec_map: dict[str, list[float]] = {}
        for name in VECTOR_CONFIGS:
            if name in vectors and p.id in vectors[name]:
                vec_map[name] = vectors[name][p.id]
        if not vec_map:
            continue
        points.append(
            qm.PointStruct(
                id=point_uuid(p.id),
                vector=vec_map,
                payload=p.model_dump(mode="json"),
            )
        )
    for i in range(0, len(points), batch_size):
        client.upsert(collection_name=COLLECTION, points=points[i:i + batch_size])
    return len(points)


def build_filter(hf: HardFilters) -> qm.Filter | None:
    """Compose a Qdrant Filter from HardFilters. Returns None if no constraints."""
    must: list[qm.FieldCondition] = []
    must_not: list[qm.FieldCondition] = []

    if hf.min_audit_count is not None and hf.min_audit_count > 0:
        must.append(qm.FieldCondition(
            key="audit_count", range=qm.Range(gte=hf.min_audit_count)
        ))
    if hf.min_tvl_usd is not None and hf.min_tvl_usd > 0:
        must.append(qm.FieldCondition(
            key="tvl_usd", range=qm.Range(gte=float(hf.min_tvl_usd))
        ))
    if hf.max_lockup_days is not None:
        must.append(qm.FieldCondition(
            key="lockup_days", range=qm.Range(lte=hf.max_lockup_days)
        ))
    for chain in hf.excluded_chains:
        must_not.append(qm.FieldCondition(
            key="chains", match=qm.MatchValue(value=chain.value)
        ))
    for cat in hf.excluded_categories:
        must_not.append(qm.FieldCondition(
            key="category", match=qm.MatchValue(value=cat.value)
        ))

    if not must and not must_not:
        return None
    return qm.Filter(must=must or None, must_not=must_not or None)


def recommend(
    positive: Sequence[str],
    negative: Sequence[str],
    using: str,
    hard_filters: HardFilters,
    limit: int = 20,
) -> list:
    """Pattern 1: recommend with positive + negative anchors on a single named vector."""
    client = get_client()
    return client.query_points(
        collection_name=COLLECTION,
        query=qm.RecommendQuery(
            recommend=qm.RecommendInput(
                positive=[point_uuid(p) for p in positive],
                negative=[point_uuid(n) for n in negative] if negative else None,
                strategy=qm.RecommendStrategy.BEST_SCORE,
            )
        ),
        using=using,
        query_filter=build_filter(hard_filters),
        limit=limit,
        with_payload=True,
    ).points


def multi_vector_prefetch(
    target_vectors: dict[str, list[float]],
    weights: LensWeights,
    hard_filters: HardFilters,
    limit: int = 20,
) -> list:
    """Pattern 2: per-lens prefetch + RRF fusion. Skips lenses with weight <= 0."""
    client = get_client()
    prefetches: list[qm.Prefetch] = []
    for name, vec in target_vectors.items():
        w = getattr(weights, name, 0.0)
        if w <= 0:
            continue
        prefetches.append(qm.Prefetch(
            query=vec,
            using=name,
            limit=max(20, limit * 2),
        ))
    if not prefetches:
        raise ValueError("multi_vector_prefetch needs at least one lens weight > 0")
    return client.query_points(
        collection_name=COLLECTION,
        prefetch=prefetches,
        query=qm.FusionQuery(fusion=qm.Fusion.RRF),
        query_filter=build_filter(hard_filters),
        limit=limit,
        with_payload=True,
    ).points


def lens_query(
    anchor_ids: Sequence[str],
    lens_name: str,
    hard_filters: HardFilters,
    limit: int = 200,
) -> list:
    """Pattern 5: re-rank full universe by a single named vector, anchored by user's picks.

    Used by the frontend lens-swap scatter. If no anchors, falls back to scroll-style
    enumeration of the lens (any order).
    """
    client = get_client()
    if not anchor_ids:
        return client.query_points(
            collection_name=COLLECTION,
            using=lens_name,
            query_filter=build_filter(hard_filters),
            limit=limit,
            with_payload=True,
        ).points
    return client.query_points(
        collection_name=COLLECTION,
        query=qm.RecommendQuery(
            recommend=qm.RecommendInput(
                positive=[point_uuid(a) for a in anchor_ids],
                strategy=qm.RecommendStrategy.AVERAGE_VECTOR,
            )
        ),
        using=lens_name,
        query_filter=build_filter(hard_filters),
        limit=limit,
        with_payload=True,
    ).points


def discovery_walk(
    swipe_pairs: Sequence[tuple[str, str]],
    using: str = "risk",
    hard_filters: HardFilters | None = None,
    limit: int = 10,
) -> list:
    """Qdrant Discovery API. Each (pos_id, neg_id) pair tells Qdrant "closer to
    pos, farther from neg" on the given lens. Returns up to `limit` protocols
    whose vector profile best matches the revealed preferences.

    Used by Day 13's drawdown-swipe stack: each scenario decision becomes one
    ContextPair on the risk axis.
    """
    if not swipe_pairs:
        return []
    client = get_client()
    context = [
        qm.ContextPair(
            positive=point_uuid(pos),
            negative=point_uuid(neg),
        )
        for pos, neg in swipe_pairs
    ]
    # Context-only mode (no target vector) -> ContextQuery, not DiscoverQuery.
    # Qdrant's DiscoverQuery requires a target; ContextQuery accepts pairs only
    # and returns points consistent with the steering direction they imply.
    return client.query_points(
        collection_name=COLLECTION,
        query=qm.ContextQuery(context=context),
        using=using,
        query_filter=build_filter(hard_filters) if hard_filters else None,
        limit=limit,
        with_payload=True,
    ).points


def per_lens_similarity(point_id: str, anchor_ids: Sequence[str]) -> dict[str, float]:
    """Returns {lens_name: raw_similarity_score} for a single point vs averaged anchors.

    Caller should normalize across distance metrics — cosine scores live in [-1, 1],
    Euclidean (risk) returns raw distance where smaller is closer.
    """
    return per_lens_similarity_batch([point_id], anchor_ids).get(point_id, {})


def per_lens_similarity_batch(
    point_ids: Sequence[str],
    anchor_ids: Sequence[str],
) -> dict[str, dict[str, float]]:
    """{point_id: {lens: raw_score}} for many points in 1 query per lens.

    For each populated lens, runs a single recommend against the averaged anchors,
    pulls up to 1000 results, then maps each target point_id to its score. Lenses
    that aren't populated (stretch vectors before they're built) return empty maps.
    """
    if not anchor_ids or not point_ids:
        return {pid: {} for pid in point_ids}
    client = get_client()
    target_uuids = {pid: point_uuid(pid) for pid in point_ids}
    uuid_to_id = {uuid: pid for pid, uuid in target_uuids.items()}
    out: dict[str, dict[str, float]] = {pid: {} for pid in point_ids}
    for lens in VECTOR_CONFIGS:
        try:
            res = client.query_points(
                collection_name=COLLECTION,
                query=qm.RecommendQuery(
                    recommend=qm.RecommendInput(
                        positive=[point_uuid(a) for a in anchor_ids],
                        strategy=qm.RecommendStrategy.AVERAGE_VECTOR,
                    )
                ),
                using=lens,
                limit=1000,
                with_payload=False,
            ).points
        except Exception:
            continue
        for p in res:
            pid = uuid_to_id.get(str(p.id))
            if pid is not None:
                out[pid][lens] = float(p.score)
    return out
