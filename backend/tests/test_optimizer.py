"""Tests for the weighted-sum optimizer."""
from unittest.mock import MagicMock

from app.optimizer import weighted_sum
from app.schemas import Category, Chain, TaxTreatment


def _mock_candidate(
    pid: str,
    score: float,
    max_dd: float = 0.05,
    apy: float = 5.0,
    tvl: int = 100_000_000,
):
    """Build a mock qdrant ScoredPoint with a complete PointPayload dict."""
    payload = {
        "id": pid,
        "protocol": pid,
        "product": pid,
        "category": Category.LENDING.value,
        "chains": [Chain.ETHEREUM.value],
        "current_apy": apy,
        "tvl_usd": tvl,
        "audit_count": 3,
        "audit_firms": ["abc"],
        "max_drawdown_1y": max_dd,
        "lockup_days": 0,
        "launched_at": "2023-01-01",
        "tax_treatment": TaxTreatment.ORDINARY_INCOME.value,
        "yield_source_mix": {"lending_spread": 1.0},
        "description": "test",
        "url": "https://example.com",
    }
    point = MagicMock()
    point.score = score
    point.payload = payload
    return point


def test_empty_candidates_returns_empty_list():
    assert weighted_sum([], capital_usd=100_000) == []


def test_weights_sum_to_one():
    cands = [_mock_candidate(f"id{i}", score=1.0 - i * 0.1) for i in range(8)]
    positions = weighted_sum(cands, capital_usd=100_000)
    total = sum(p.weight for p in positions)
    assert abs(total - 1.0) < 1e-6


def test_max_position_cap_is_respected():
    cands = [_mock_candidate("dominant", score=10.0, max_dd=0.01)] + [
        _mock_candidate(f"weak{i}", score=0.1, max_dd=0.5) for i in range(7)
    ]
    positions = weighted_sum(cands, capital_usd=100_000, max_position_pct=0.25)
    for p in positions:
        assert p.weight <= 0.25 + 1e-6


def test_positions_sorted_by_weight_descending():
    cands = [_mock_candidate(f"id{i}", score=1.0 - i * 0.1) for i in range(5)]
    positions = weighted_sum(cands, capital_usd=100_000)
    weights = [p.weight for p in positions]
    assert weights == sorted(weights, reverse=True)


def test_dollars_match_capital():
    cands = [_mock_candidate(f"id{i}", score=1.0 - i * 0.1) for i in range(5)]
    capital = 250_000
    positions = weighted_sum(cands, capital_usd=capital)
    total = sum(p.dollars for p in positions)
    assert abs(total - capital) < 1.0


def test_lower_drawdown_gets_higher_weight_with_equal_score():
    """Holding score constant, smaller max_drawdown_1y should pull more weight.

    Uses a non-binding cap so the risk-tilt isn't washed out by post-cap renormalization.
    """
    cands = [
        _mock_candidate("safe", score=1.0, max_dd=0.01),
        _mock_candidate("risky", score=1.0, max_dd=0.5),
    ]
    positions = weighted_sum(cands, capital_usd=100_000, target_count=2, max_position_pct=0.99)
    safe = next(p for p in positions if p.protocol_id == "safe")
    risky = next(p for p in positions if p.protocol_id == "risky")
    assert safe.weight > risky.weight


def test_zero_scores_falls_back_to_equal_weights():
    cands = [_mock_candidate(f"id{i}", score=0.0) for i in range(4)]
    positions = weighted_sum(cands, capital_usd=100_000)
    weights = [p.weight for p in positions]
    assert all(abs(w - 0.25) < 1e-6 for w in weights)


def test_respects_target_count():
    cands = [_mock_candidate(f"id{i}", score=1.0 - i * 0.05) for i in range(20)]
    positions = weighted_sum(cands, capital_usd=100_000, target_count=5)
    assert len(positions) == 5
