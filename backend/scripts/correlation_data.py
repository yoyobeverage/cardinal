"""Fetch and cache historical data for the real correlation vector.

- DefiLlama `/chart/{pool_id}`: daily APY history per pool.
- yfinance: daily price returns for 8 reference assets (BTC, ETH, SPX, IEF,
  HYG, DXY, GOLD, USDC_rate-proxy).
- Caches both to data/correlation_cache.json so build_vectors.py reruns don't
  re-hit the network.

Used by scripts/build_vectors.py:build_correlation().
"""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from pathlib import Path

import httpx
import pandas as pd

log = logging.getLogger(__name__)

CACHE_PATH = Path(__file__).parent.parent / "data" / "correlation_cache.json"

# Reference assets keyed by our internal label; values are yfinance tickers.
# Order matches the correlation vector dimensions [BTC, ETH, SPX, IEF, HYG, DXY, GOLD, USDC_rate].
REFERENCE_TICKERS: dict[str, str] = {
    "BTC":       "BTC-USD",
    "ETH":       "ETH-USD",
    "SPX":       "^GSPC",
    "IEF":       "IEF",        # iShares 7-10y Treasury ETF
    "HYG":       "HYG",        # iShares High Yield Corporate Bond ETF
    "DXY":       "DX-Y.NYB",   # US Dollar Index
    "GOLD":      "GLD",        # SPDR Gold Trust
    "USDC_rate": "^IRX",       # 13-week T-bill (short-rate proxy)
}
REFERENCE_ORDER = list(REFERENCE_TICKERS.keys())

MIN_OBSERVATIONS = 60  # require 60+ overlapping days before computing correlation


def _load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text())
        except Exception:
            log.warning("correlation cache corrupt, starting fresh")
    return {"reference_returns": None, "pool_apy": {}}


def _save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(json.dumps(cache))


def fetch_reference_returns(window_days: int = 365, *, force: bool = False) -> pd.DataFrame:
    """Daily pct-change returns for each reference asset over the trailing window.

    Cached after first call (and reused across protocol-correlation computations).
    """
    cache = _load_cache()
    cached = cache.get("reference_returns")
    if cached and not force:
        # Reconstruct DataFrame from cached dict
        df = pd.DataFrame(cached["data"], index=pd.to_datetime(cached["index"]))
        return df

    import yfinance as yf

    end = date.today()
    start = end - timedelta(days=window_days + 30)
    data = yf.download(
        tickers=list(REFERENCE_TICKERS.values()),
        start=start.isoformat(),
        end=end.isoformat(),
        progress=False,
        auto_adjust=False,
        group_by="column",
    )
    closes = data["Close"]
    if isinstance(closes, pd.Series):
        # Single ticker case shouldn't happen here, but guard.
        closes = closes.to_frame()
    # Rename columns from yfinance tickers to our internal labels.
    inverse = {v: k for k, v in REFERENCE_TICKERS.items()}
    closes = closes.rename(columns=inverse)
    # Ensure all expected columns present; missing ones become NaN
    for label in REFERENCE_ORDER:
        if label not in closes.columns:
            closes[label] = float("nan")
    closes = closes[REFERENCE_ORDER]
    returns = closes.pct_change(fill_method=None).dropna(how="all")

    # Cache as JSON-friendly form
    cache["reference_returns"] = {
        "index": [d.isoformat() for d in returns.index.date],
        "data": returns.to_dict(orient="list"),
    }
    _save_cache(cache)
    return returns


def fetch_pool_apy(pool_id: str, *, force: bool = False) -> pd.Series | None:
    """Daily APY history for a DefiLlama pool. Cached. None on failure."""
    cache = _load_cache()
    pool_cache = cache.get("pool_apy", {})
    if pool_id in pool_cache and not force:
        entry = pool_cache[pool_id]
        if entry is None:
            return None
        return pd.Series(entry["values"], index=pd.to_datetime(entry["index"]))

    try:
        r = httpx.get(f"https://yields.llama.fi/chart/{pool_id}", timeout=30)
        r.raise_for_status()
        data = r.json().get("data", [])
    except Exception:
        log.warning("failed to fetch DefiLlama chart for %s", pool_id)
        pool_cache[pool_id] = None
        cache["pool_apy"] = pool_cache
        _save_cache(cache)
        return None

    if not data:
        pool_cache[pool_id] = None
        cache["pool_apy"] = pool_cache
        _save_cache(cache)
        return None

    df = pd.DataFrame(data)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp").sort_index()
    series = df["apy"].astype(float)
    pool_cache[pool_id] = {
        "index": [d.isoformat() for d in series.index.date],
        "values": series.tolist(),
    }
    cache["pool_apy"] = pool_cache
    _save_cache(cache)
    return series


def compute_protocol_correlation(
    apy: pd.Series,
    reference_returns: pd.DataFrame,
) -> list[float] | None:
    """Pearson correlation of daily APY changes vs each reference return. 8d list."""
    apy_returns = apy.diff().dropna()
    if len(apy_returns) < MIN_OBSERVATIONS:
        return None
    # Align indexes - both are date-indexed
    apy_returns.index = pd.to_datetime(apy_returns.index).date
    ref_returns = reference_returns.copy()
    ref_returns.index = pd.to_datetime(ref_returns.index).date
    df = pd.concat([apy_returns.rename("apy"), ref_returns], axis=1).dropna(subset=["apy"])
    if len(df.dropna(how="any")) < MIN_OBSERVATIONS:
        return None
    out = []
    for label in REFERENCE_ORDER:
        if label not in df.columns:
            out.append(0.0)
            continue
        pair = df[["apy", label]].dropna()
        if len(pair) < MIN_OBSERVATIONS:
            out.append(0.0)
            continue
        corr = pair["apy"].corr(pair[label])
        out.append(0.0 if pd.isna(corr) else float(corr))
    return out
