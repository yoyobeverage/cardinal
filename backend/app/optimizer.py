"""Portfolio optimizers.

- weighted_sum: ships as the default. Allocates inversely to drawdown, scaled
  by Qdrant similarity score, with an optional tax_wrapper-aware multiplier
  that mirrors real-world placement logic (ordinary-income yields are better
  sheltered in IRAs; qualified-dividend / cap-gain products are better in
  taxable accounts).
- mean_variance: Markowitz minimum-variance subject to an expected-return floor.
  Covariance approximated by the pairwise cosine-similarity matrix of the
  protocols' correlation vectors. Math-Econ flex for Day 14. Not tax-aware —
  tax-aware Markowitz is a research area we don't tackle at hackathon scope.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
from scipy.optimize import minimize

from app.schemas import PointPayload, Position

log = logging.getLogger(__name__)


# (tax_wrapper, tax_treatment) -> multiplier applied before weight normalization.
# Encodes the asset-location rule of thumb: ordinary-income yields belong in
# tax-deferred accounts; qualified-dividend / cap-gain / return-of-capital
# products belong in taxable accounts where the preferential rates kick in.
_TAX_MULTIPLIER: dict[tuple[str, str], float] = {
    ("traditional_ira", "ordinary_income"):     1.20,
    ("roth_ira",        "ordinary_income"):     1.20,
    ("hsa",             "ordinary_income"):     1.20,
    ("taxable",         "qualified_dividend"):  1.20,
    ("taxable",         "capital_gain"):        1.20,
    ("taxable",         "return_of_capital"):   1.15,
    ("taxable",         "qbi"):                 1.15,
    ("taxable",         "ordinary_income"):     0.90,  # tax-drag penalty
}


def tax_multiplier(tax_wrapper: str, tax_treatment: str) -> float:
    """Asset-location boost factor for (wrapper, treatment) combinations. 1.0 default."""
    return _TAX_MULTIPLIER.get((tax_wrapper, tax_treatment), 1.0)


def weighted_sum(
    candidates: list[Any],
    capital_usd: float,
    max_position_pct: float = 0.25,
    target_count: int = 8,
    tax_wrapper: str = "taxable",
) -> list[Position]:
    """Take top target_count candidates by Qdrant score, weight by
    (score x risk_factor x tax_multiplier), cap each position at
    max_position_pct, redistribute excess to non-capped positions. Returns
    Position list in descending weight order, summing to 1.0.

    risk_factor = 1 / (1 + max_drawdown_1y), so lower-drawdown protocols get larger weight.
    tax_multiplier = lookup on (tax_wrapper, payload.tax_treatment) — boosts ordinary-income
    products in IRA/HSA wrappers and qualified-dividend / cap-gain / qbi products in taxable
    accounts. Default 1.0 for unmatched combinations.
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
        tax_mult = tax_multiplier(tax_wrapper, p.tax_treatment.value)
        raw.append(sim * risk_factor * tax_mult)

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


def mean_variance(
    candidates: list[Any],
    correlation_vectors: dict[str, list[float]],
    capital_usd: float,
    max_position_pct: float = 0.25,
    target_count: int = 8,
    return_floor_frac: float = 0.6,
) -> list[Position]:
    """Markowitz min-variance subject to a return floor.

    Objective: minimize w^T Σ w
    Subject to:
      w^T r >= return_floor (= return_floor_frac * mean candidate APY)
      sum(w) = 1
      0 <= w_i <= max_position_pct

    Σ is the pairwise cosine-similarity matrix of normalized correlation
    vectors — a stand-in for the actual covariance matrix, which would
    require historical return data we don't have at hackathon scope.

    Falls back to weighted_sum on solver failure or missing correlation data.
    """
    if not candidates:
        return []
    top = candidates[:target_count]
    payloads = [PointPayload(**c.payload) for c in top]
    n = len(payloads)

    returns = np.array([p.current_apy / 100.0 for p in payloads])

    corr_matrix = np.array([
        correlation_vectors.get(p.id, [0.0] * 8) for p in payloads
    ])
    if corr_matrix.shape[1] == 0 or np.all(corr_matrix == 0):
        log.warning("mean_variance: no correlation data; falling back to weighted_sum")
        return weighted_sum(candidates, capital_usd, max_position_pct, target_count)

    norms = np.linalg.norm(corr_matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    corr_norm = corr_matrix / norms
    sigma = corr_norm @ corr_norm.T  # pairwise cosine similarity, n x n
    sigma = sigma + 1e-6 * np.eye(n)  # tiny diagonal jitter for solver stability

    return_floor = float(np.mean(returns) * return_floor_frac)

    def objective(w: np.ndarray) -> float:
        return float(w @ sigma @ w)

    constraints = [
        {"type": "eq", "fun": lambda w: float(np.sum(w) - 1.0)},
        {"type": "ineq", "fun": lambda w: float(returns @ w - return_floor)},
    ]
    bounds = [(0.0, max_position_pct) for _ in range(n)]
    w0 = np.full(n, 1.0 / n)

    result = minimize(
        objective, w0,
        method="SLSQP",
        constraints=constraints,
        bounds=bounds,
        options={"maxiter": 200, "ftol": 1e-9},
    )

    if not result.success:
        log.warning("mean_variance: SLSQP failed (%s); falling back to weighted_sum", result.message)
        return weighted_sum(candidates, capital_usd, max_position_pct, target_count)

    weights = result.x
    # Numerical cleanup: clip tiny negatives, renormalize
    weights = np.maximum(weights, 0.0)
    total = weights.sum()
    if total <= 0:
        return weighted_sum(candidates, capital_usd, max_position_pct, target_count)
    weights = weights / total

    positions = [
        Position(
            protocol_id=p.id,
            payload=p,
            weight=float(w),
            dollars=float(w * capital_usd),
            score=float(c.score),
            per_lens_scores={},
        )
        for w, p, c in zip(weights, payloads, top)
    ]
    positions.sort(key=lambda x: -x.weight)
    return positions
