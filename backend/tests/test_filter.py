"""Tests for HardFilters -> Qdrant Filter translation (no live services)."""
from qdrant_client.http import models as qm

from app.qdrant_client import build_filter
from app.schemas import Chain, HardFilters


def _ranges(flt: qm.Filter) -> dict[str, qm.Range]:
    """Map each must-condition's field key to its Range (for range conditions)."""
    out: dict[str, qm.Range] = {}
    for cond in flt.must or []:
        if isinstance(cond, qm.FieldCondition) and cond.range is not None:
            out[cond.key] = cond.range
    return out


def test_no_constraints_returns_none():
    assert build_filter(HardFilters()) is None


def test_min_apy_produces_current_apy_gte():
    flt = build_filter(HardFilters(min_apy=7.0))
    assert flt is not None
    ranges = _ranges(flt)
    assert "current_apy" in ranges
    assert ranges["current_apy"].gte == 7.0


def test_min_apy_zero_is_ignored():
    # A 0% floor is meaningless (every protocol clears it); should not add a condition.
    assert build_filter(HardFilters(min_apy=0)) is None


def test_min_apy_composes_with_other_filters():
    flt = build_filter(
        HardFilters(min_apy=8.0, min_audit_count=3, excluded_chains=[Chain.SOLANA])
    )
    ranges = _ranges(flt)
    assert ranges["current_apy"].gte == 8.0
    assert ranges["audit_count"].gte == 3
    # excluded chain lands in must_not
    must_not_keys = {c.key for c in (flt.must_not or [])}
    assert "chains" in must_not_keys
