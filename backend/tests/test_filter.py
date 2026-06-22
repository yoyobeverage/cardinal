"""Tests for HardFilters -> Qdrant Filter translation (no live services)."""
from qdrant_client.http import models as qm

from app.qdrant_client import build_filter
from app.schemas import Category, Chain, HardFilters


def _ranges(flt: qm.Filter) -> dict[str, qm.Range]:
    out: dict[str, qm.Range] = {}
    for cond in flt.must or []:
        if isinstance(cond, qm.FieldCondition) and cond.range is not None:
            out[cond.key] = cond.range
    return out


def test_no_constraints_returns_none():
    assert build_filter(HardFilters()) is None


def test_audit_and_tvl_floors_become_gte_ranges():
    flt = build_filter(HardFilters(min_audit_count=3, min_tvl_usd=50_000_000))
    ranges = _ranges(flt)
    assert ranges["audit_count"].gte == 3
    assert ranges["tvl_usd"].gte == 50_000_000


def test_max_lockup_becomes_lte_range():
    flt = build_filter(HardFilters(max_lockup_days=30))
    assert _ranges(flt)["lockup_days"].lte == 30


def test_excluded_chains_and_categories_go_to_must_not():
    flt = build_filter(
        HardFilters(excluded_chains=[Chain.SOLANA], excluded_categories=[Category.PERPS_LP])
    )
    must_not_keys = {c.key for c in (flt.must_not or [])}
    assert "chains" in must_not_keys
    assert "category" in must_not_keys
