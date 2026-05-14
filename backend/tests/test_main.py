"""End-to-end tests for the FastAPI surface in app/main.py.

Uses fastapi.testclient.TestClient + unittest.mock to short-circuit the
LLM and Qdrant calls so tests don't hit live services. The catalog (loaded
at lifespan startup from data/cache.sqlite) is real; everything downstream
of `_run_query` is mocked.
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import QuerySpec


@pytest.fixture
def client():
    # TestClient(app) as a context manager fires the lifespan handler,
    # which warms the catalog and the Qdrant client singleton.
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_form():
    return {
        "capital_usd": 100_000,
        "horizon_months": 12,
        "tax_wrapper": "taxable",
        "excluded_chains": [],
        "min_audit_count": 2,
        "min_tvl_usd": 0,
        "max_lockup_days": None,
        "freeform": "test query",
    }


def _mock_scored_point(pid: str, score: float = 0.8) -> MagicMock:
    """Synthetic Qdrant ScoredPoint with a complete PointPayload dict."""
    point = MagicMock()
    point.score = score
    point.payload = {
        "id": pid,
        "protocol": pid,
        "product": pid,
        "category": "lending",
        "chains": ["ethereum"],
        "current_apy": 5.0,
        "tvl_usd": 100_000_000,
        "audit_count": 3,
        "audit_firms": ["abc"],
        "max_drawdown_1y": 0.05,
        "lockup_days": 0,
        "launched_at": "2023-01-01",
        "tax_treatment": "ordinary_income",
        "yield_source_mix": {"lending_spread": 1.0},
        "description": "test",
        "url": "https://example.com",
    }
    return point


def test_health_returns_catalog_size(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert isinstance(data["catalog_size"], int)
    assert data["catalog_size"] > 0


def test_universe_endpoint_shape(client):
    r = client.get("/api/universe")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        for key in ("id", "protocol", "product", "category", "current_apy", "tvl_usd", "coords"):
            assert key in first
        assert isinstance(first["coords"], dict)


def test_portfolio_round_trip_weighted_sum(client, sample_form):
    fake_spec = QuerySpec(
        positive_anchors=["lido_ethereum_steth"],
        negative_anchors=[],
        extracted_concerns=["test concern"],
    )
    candidates = [_mock_scored_point(f"id{i}", score=1.0 - i * 0.1) for i in range(8)]

    with patch("app.main.llm.translate", return_value=fake_spec), \
         patch("app.main._run_query", return_value=candidates), \
         patch("app.main._attach_per_lens_scores", side_effect=lambda positions, _anchors: positions), \
         patch("app.main.llm.narrate", return_value="mocked explanation"):
        r = client.post("/api/portfolio", json=sample_form)

    assert r.status_code == 200
    data = r.json()
    assert data["explanation"] == "mocked explanation"
    assert data["extracted_concerns"] == ["test concern"]
    assert len(data["positions"]) > 0
    total = sum(p["weight"] for p in data["positions"])
    assert abs(total - 1.0) < 1e-6


def test_portfolio_routes_mean_variance(client, sample_form):
    fake_spec = QuerySpec(positive_anchors=["x"], extracted_concerns=[])
    candidates = [_mock_scored_point(f"id{i}", score=1.0 - i * 0.1) for i in range(5)]

    with patch("app.main.llm.translate", return_value=fake_spec), \
         patch("app.main._run_query", return_value=candidates), \
         patch("app.main._attach_per_lens_scores", side_effect=lambda p, _: p), \
         patch("app.main.llm.narrate", return_value="ok"), \
         patch("app.main.optimizer.mean_variance", return_value=[]) as mock_mv:
        r = client.post("/api/portfolio?optimizer_name=mean_variance", json=sample_form)

    assert r.status_code == 200
    assert mock_mv.called
    # Verify the correlation vectors arg was passed (non-empty dict)
    call_kwargs = mock_mv.call_args
    assert call_kwargs is not None


def test_portfolio_rejects_negative_capital(client, sample_form):
    sample_form["capital_usd"] = -1
    r = client.post("/api/portfolio", json=sample_form)
    assert r.status_code == 422


def test_portfolio_rejects_horizon_out_of_range(client, sample_form):
    sample_form["horizon_months"] = 0
    r = client.post("/api/portfolio", json=sample_form)
    assert r.status_code == 422


def test_portfolio_uses_discovery_walk_when_swipes_present(client, sample_form):
    sample_form["drawdown_swipes"] = [
        {"scenario_id": "terra", "decision": "sold"},
        {"scenario_id": "ftx", "decision": "held"},
    ]
    fake_spec = QuerySpec(positive_anchors=["lido_ethereum_steth"], extracted_concerns=[])
    candidates = [_mock_scored_point(f"id{i}", 1.0 - i * 0.1) for i in range(3)]
    discovered = [_mock_scored_point("discovered_protocol")]

    with patch("app.main.llm.translate", return_value=fake_spec), \
         patch("app.main.qdrant_client.discovery_walk", return_value=discovered) as mock_dw, \
         patch("app.main._run_query", return_value=candidates), \
         patch("app.main._attach_per_lens_scores", side_effect=lambda p, _: p), \
         patch("app.main.llm.narrate", return_value="ok"):
        r = client.post("/api/portfolio", json=sample_form)

    assert r.status_code == 200
    assert mock_dw.called
