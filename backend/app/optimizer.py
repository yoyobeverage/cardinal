"""Portfolio optimizer. Day 4 ships weighted-sum; mean-variance is Day 14 stretch."""
from __future__ import annotations

from typing import Any

from app.schemas import PointPayload, Position


def weighted_sum(
    candidates: list[Any],
    capital_usd: float,
    max_position_pct: float = 0.25,
    target_count: int = 8,
) -> list[Position]:
    """Take top target_count candidates by Qdrant score, weight by (score x risk_factor),
    cap each position at max_position_pct, redistribute excess to non-capped positions.
    Returns Position list in descending weight order, summing to 1.0.

    risk_factor = 1 / (1 + max_drawdown_1y), so lower-drawdown protocols get larger weight.
    Qdrant scores are normalized via max(score, 0) so Euclidean (which can be >0) and cosine
    (which can be negative for dissimilar pairs) both produce non-negative weighting.
    """
    if not candidates:
        return []

    top = candidates[:target_count]
    payloads = [PointPayload(**c.payload) for c in top]

    raw = []
    for cand, p in zip(top, payloads):
        sim = max(float(cand.score), 0.0)
        risk_factor = 1.0 / (1.0 + p.max_drawdown_1y)
        raw.append(sim * risk_factor)

    total = sum(raw)
    if total <= 0:
        weights = [1.0 / len(top)] * len(top)
    else:
        weights = [s / total for s in raw]

    capped = [min(w, max_position_pct) for w in weights]
    deficit = 1.0 - sum(capped)
    movers = [i for i, w in enumerate(capped) if w < max_position_pct - 1e-9]
    while deficit > 1e-9 and movers:
        per = deficit / len(movers)
        next_movers = []
        for i in movers:
            new_w = min(max_position_pct, capped[i] + per)
            deficit -= (new_w - capped[i])
            capped[i] = new_w
            if capped[i] < max_position_pct - 1e-9:
                next_movers.append(i)
        if next_movers == movers:
            break
        movers = next_movers

    total = sum(capped)
    if total > 0:
        capped = [w / total for w in capped]

    positions = [
        Position(
            protocol_id=p.id,
            payload=p,
            weight=w,
            dollars=w * capital_usd,
            score=float(c.score),
            per_lens_scores={},
        )
        for w, p, c in zip(capped, payloads, top)
    ]
    positions.sort(key=lambda x: -x.weight)
    return positions
