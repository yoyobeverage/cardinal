"""Tests for the weighted-sum and target-yield optimizers."""
from unittest.mock import MagicMock

from app.optimizer import target_yield, weighted_sum
from app.schemas import Category, Chain, TaxTreatment


def _mock_candidate(
    pid: str,
    score: float,
    max_dd: float = 0.05,
    apy: float = 5.0,
    tvl: int = 100_000_000,
    tax_treatment: str = TaxTreatment.ORDINARY_INCOME.value,
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
        "tax_treatment": tax_treatment,
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


def test_tax_wrapper_boosts_ordinary_income_in_ira():
    """In a traditional IRA, ordinary-income products should outweigh capital-gain products
    given equal score and drawdown."""
    cands = [
        _mock_candidate("ord", score=1.0, tax_treatment=TaxTreatment.ORDINARY_INCOME.value),
        _mock_candidate("cap", score=1.0, tax_treatment=TaxTreatment.CAPITAL_GAIN.value),
    ]
    positions = weighted_sum(
        cands, capital_usd=100_000, target_count=2, max_position_pct=0.99,
        tax_wrapper="traditional_ira",
    )
    ord_pos = next(p for p in positions if p.protocol_id == "ord")
    cap_pos = next(p for p in positions if p.protocol_id == "cap")
    assert ord_pos.weight > cap_pos.weight


def test_tax_wrapper_penalizes_ordinary_income_in_taxable():
    """In a taxable account, ordinary-income products should be penalized vs
    capital-gain products at equal score/drawdown."""
    cands = [
        _mock_candidate("ord", score=1.0, tax_treatment=TaxTreatment.ORDINARY_INCOME.value),
        _mock_candidate("cap", score=1.0, tax_treatment=TaxTreatment.CAPITAL_GAIN.value),
    ]
    positions = weighted_sum(
        cands, capital_usd=100_000, target_count=2, max_position_pct=0.99,
        tax_wrapper="taxable",
    )
    ord_pos = next(p for p in positions if p.protocol_id == "ord")
    cap_pos = next(p for p in positions if p.protocol_id == "cap")
    assert cap_pos.weight > ord_pos.weight


# ---------------------------------------------------------------------------
# target_yield: hit an exact blended APY while maximizing preference-match.
# ---------------------------------------------------------------------------
def _spread_candidates():
    """8 protocols spanning 2%..16% APY so a target in-between is blendable."""
    return [_mock_candidate(f"p{i}", score=1.0, apy=apy)
            for i, apy in enumerate([2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0])]


def _blended_apy(positions) -> float:
    return sum(p.weight * p.payload.current_apy for p in positions)


def test_target_yield_hits_exact_target():
    positions, clamped = target_yield(_spread_candidates(), 100_000, target_apy_pct=7.0)
    assert clamped is None
    assert abs(_blended_apy(positions) - 7.0) < 0.05
    assert abs(sum(p.weight for p in positions) - 1.0) < 1e-6


def test_target_yield_does_not_overshoot():
    """The reported bug: asking 7% must not drift to 13%. Equality keeps it at 7."""
    positions, _ = target_yield(_spread_candidates(), 100_000, target_apy_pct=7.0)
    assert _blended_apy(positions) <= 7.5


def test_target_yield_respects_cap():
    positions, _ = target_yield(
        _spread_candidates(), 100_000, target_apy_pct=9.0, max_position_pct=0.25
    )
    assert all(p.weight <= 0.25 + 1e-6 for p in positions)


def test_target_yield_clamps_when_above_achievable_max():
    """Cap 0.25 -> 4 names -> max blend = mean(top4 APY) = (16+14+12+10)/4 = 13%.
    Asking 20% is infeasible; it clamps to ~13% and reports the gap."""
    positions, clamped = target_yield(
        _spread_candidates(), 100_000, target_apy_pct=20.0, max_position_pct=0.25
    )
    assert clamped is not None
    assert abs(clamped - 13.0) < 0.5
    assert _blended_apy(positions) <= 13.5


def test_target_yield_prefers_higher_desirability_at_target():
    """Two ways to hit 6%: the higher-score basket should win. Give a high-score
    pair that averages 6% and a low-score pair that also averages 6%."""
    cands = [
        _mock_candidate("good_lo", score=5.0, apy=4.0),
        _mock_candidate("good_hi", score=5.0, apy=8.0),   # good pair avg 6%
        _mock_candidate("bad_lo", score=0.2, apy=5.0),
        _mock_candidate("bad_hi", score=0.2, apy=7.0),    # bad pair avg 6%
    ]
    positions, _ = target_yield(cands, 100_000, target_apy_pct=6.0, max_position_pct=0.5)
    by_id = {p.protocol_id: p.weight for p in positions}
    good_weight = by_id.get("good_lo", 0) + by_id.get("good_hi", 0)
    bad_weight = by_id.get("bad_lo", 0) + by_id.get("bad_hi", 0)
    assert good_weight > bad_weight


def test_target_yield_empty_candidates():
    positions, clamped = target_yield([], 100_000, target_apy_pct=7.0)
    assert positions == []
    assert clamped is None
