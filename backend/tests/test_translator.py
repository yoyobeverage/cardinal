"""Tests for the LLM translator + deterministic fallback path."""
from unittest.mock import MagicMock, patch

import pytest

from app.llm import fallback_spec, translate
from app.schemas import Chain, FormInput, QuerySpec, TaxWrapper


@pytest.fixture(autouse=True)
def _disable_groq_in_tests():
    """All translator tests run with the Groq layer disabled - we exercise
    only the Gemini path and the deterministic last-resort. Patches the
    cached client factory to return None (the same code path as 'no GROQ_API_KEY')."""
    with patch("app.llm._groq_client", return_value=None):
        yield


@pytest.fixture
def basic_form() -> FormInput:
    return FormInput(
        capital_usd=100_000,
        horizon_months=12,
        tax_wrapper=TaxWrapper.TAXABLE,
        excluded_chains=[],
        min_audit_count=2,
        min_tvl_usd=0,
        max_lockup_days=None,
        freeform="want RWA T-bill exposure, no algorithmic stablecoins",
    )


def test_fallback_returns_valid_spec(basic_form):
    spec = fallback_spec(basic_form)
    assert isinstance(spec, QuerySpec)
    assert len(spec.positive_anchors) == 1


def test_fallback_respects_min_audit_count(basic_form):
    basic_form.min_audit_count = 5
    spec = fallback_spec(basic_form)
    assert spec.hard_filters.min_audit_count == 5


def test_fallback_for_ira_biases_to_rwa_or_savings():
    form = FormInput(
        capital_usd=50_000,
        horizon_months=24,
        tax_wrapper=TaxWrapper.TRADITIONAL_IRA,
        freeform="",
    )
    spec = fallback_spec(form)
    assert len(spec.positive_anchors) == 1
    from app.catalog import load_catalog
    cat = load_catalog()
    anchor_payload = cat[spec.positive_anchors[0]]
    rwa_or_savings_exists = any(
        p.category.value in ("rwa_treasury", "savings_rate") for p in cat.values()
    )
    if rwa_or_savings_exists:
        assert anchor_payload.category.value in ("rwa_treasury", "savings_rate")


def test_fallback_respects_excluded_chains():
    form = FormInput(
        capital_usd=10_000,
        horizon_months=12,
        tax_wrapper=TaxWrapper.TAXABLE,
        excluded_chains=[Chain.SOLANA],
        freeform="",
    )
    spec = fallback_spec(form)
    from app.catalog import load_catalog
    cat = load_catalog()
    anchor_chains = cat[spec.positive_anchors[0]].chains
    assert Chain.SOLANA not in anchor_chains
    assert Chain.SOLANA in spec.hard_filters.excluded_chains


def test_translate_falls_back_when_client_raises(basic_form):
    """Gemini raises -> Groq disabled -> deterministic fallback fires."""
    with patch("app.llm._gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.side_effect = RuntimeError(
            "simulated Gemini failure"
        )
        spec = translate(basic_form)
        assert isinstance(spec, QuerySpec)
        assert len(spec.positive_anchors) >= 1


def test_translate_filters_hallucinated_ids(basic_form):
    """Gemini returns valid QuerySpec with hallucinated ids -> filtered out."""
    from app.catalog import catalog_ids

    valid_id = catalog_ids()[0]
    fake_spec = QuerySpec(
        positive_anchors=["fake_protocol_xyz", valid_id],
        negative_anchors=["another_fake"],
    )
    mock_response = MagicMock()
    mock_response.parsed = fake_spec

    with patch("app.llm._gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = mock_response
        spec = translate(basic_form)
        assert "fake_protocol_xyz" not in spec.positive_anchors
        assert "another_fake" not in spec.negative_anchors
        assert valid_id in spec.positive_anchors


def test_translate_falls_back_when_no_parsed_object(basic_form):
    """Gemini parsed=None and text='' -> drops to Groq (disabled) -> deterministic."""
    mock_response = MagicMock()
    mock_response.parsed = None
    mock_response.text = ""  # explicit: no JSON fallback to parse
    with patch("app.llm._gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = mock_response
        spec = translate(basic_form)
        assert isinstance(spec, QuerySpec)
        assert len(spec.positive_anchors) >= 1


def test_translate_merges_form_min_audit_as_floor(basic_form):
    """If LLM extracts min_audit_count=1 but form says 3, the stricter (3) wins."""
    basic_form.min_audit_count = 4
    weak_spec = QuerySpec(
        positive_anchors=["lido_ethereum_steth"],
        hard_filters={"min_audit_count": 1},
    )
    mock_response = MagicMock()
    mock_response.parsed = weak_spec
    with patch("app.llm._gemini_client") as mock_client:
        mock_client.return_value.models.generate_content.return_value = mock_response
        spec = translate(basic_form)
        assert spec.hard_filters.min_audit_count == 4
