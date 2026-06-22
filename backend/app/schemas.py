"""Pydantic models - the single source of truth for inter-module contracts.

Consumers:
- scripts/ingest_*.py validate each protocol row through PointPayload.
- app/llm.py uses FormInput as input and QuerySpec as Gemini response_schema.
- app/qdrant_client.py builds Qdrant Filters from HardFilters.
- app/optimizer.py emits list[Position] sized by Allocation.
- app/main.py serializes Allocation as the /api/portfolio response.
"""

from datetime import date
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Chain(str, Enum):
    ETHEREUM = "ethereum"
    BASE = "base"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    POLYGON = "polygon"
    SOLANA = "solana"
    BSC = "bsc"
    AVALANCHE = "avalanche"


class Category(str, Enum):
    LENDING = "lending"
    FIXED_RATE = "fixed_rate"
    LST = "lst"
    LRT = "lrt"
    STABLE_AMM = "stable_amm"
    VOLATILE_AMM = "volatile_amm"
    OPTIONS_VAULT = "options_vault"
    RWA_TREASURY = "rwa_treasury"
    INSTITUTIONAL_LENDING = "institutional_lending"
    PERPS_LP = "perps_lp"
    BASIS_TRADE = "basis_trade"
    YIELD_AGGREGATOR = "yield_aggregator"
    SAVINGS_RATE = "savings_rate"
    STABLECOIN_ISSUANCE = "stablecoin_issuance"


class TaxTreatment(str, Enum):
    ORDINARY_INCOME = "ordinary_income"
    QUALIFIED_DIVIDEND = "qualified_dividend"
    CAPITAL_GAIN = "capital_gain"
    RETURN_OF_CAPITAL = "return_of_capital"
    QBI = "qbi"
    UNCERTAIN = "uncertain"


class TaxWrapper(str, Enum):
    TAXABLE = "taxable"
    TRADITIONAL_IRA = "traditional_ira"
    ROTH_IRA = "roth_ira"
    HSA = "hsa"


class YieldSource(str, Enum):
    REAL_YIELD = "real_yield"
    LENDING_SPREAD = "lending_spread"
    AMM_FEES = "amm_fees"
    OPTIONS_PREMIUM = "options_premium"
    POINTS_AIRDROP = "points_airdrop"
    EMISSIONS = "emissions"
    MEV_CAPTURE = "mev_capture"
    BASIS_TRADE = "basis_trade"
    RESTAKING_REWARD = "restaking_reward"
    STABLECOIN_ISSUANCE = "stablecoin_issuance"
    VALIDATOR_COMMISSION = "validator_commission"


class PointPayload(BaseModel):
    """One row of the catalog. Stored as the Qdrant payload of a point."""

    id: str
    protocol: str
    product: str
    category: Category
    chains: list[Chain]
    current_apy: float = Field(ge=0)
    tvl_usd: int = Field(ge=0)
    audit_count: int = Field(ge=0)
    audit_firms: list[str]
    max_drawdown_1y: float = Field(ge=0, le=1)
    lockup_days: int = Field(ge=0)
    launched_at: date
    tax_treatment: TaxTreatment
    yield_source_mix: dict[str, float]
    description: str
    url: str

    @field_validator("yield_source_mix")
    @classmethod
    def _mix_sums_to_one(cls, v: dict[str, float]) -> dict[str, float]:
        total = sum(v.values())
        if abs(total - 1.0) > 0.05:
            raise ValueError(f"yield_source_mix must sum to ~1.0, got {total:.3f}")
        return v


class DrawdownSwipe(BaseModel):
    scenario_id: str
    decision: Literal["held", "sold"]


class FormInput(BaseModel):
    """User-submitted form, POSTed to /api/portfolio."""

    capital_usd: float = Field(gt=0)
    horizon_months: int = Field(ge=1, le=60)
    tax_wrapper: TaxWrapper
    excluded_chains: list[Chain] = []
    min_audit_count: int = Field(default=0, ge=0)
    min_tvl_usd: int = Field(default=0, ge=0)
    max_lockup_days: int | None = Field(default=None, ge=0)
    yield_source_ranking: list[YieldSource] | None = None
    drawdown_swipes: list[DrawdownSwipe] | None = None
    freeform: str = ""


class LensWeights(BaseModel):
    narrative: float = Field(default=0.5, ge=0, le=1)
    risk: float = Field(default=0.5, ge=0, le=1)
    yield_source: float = Field(default=0.0, ge=0, le=1)
    correlation: float = Field(default=0.0, ge=0, le=1)
    composability: float = Field(default=0.0, ge=0, le=1)


class HardFilters(BaseModel):
    max_lockup_days: int | None = Field(default=None, ge=0)
    min_audit_count: int | None = Field(default=None, ge=0)
    min_tvl_usd: int | None = Field(default=None, ge=0)
    # Per-protocol APY floor (percent, e.g. 7.0 for "I require 7% yield"). Every
    # protocol in the candidate set must yield at least this; since each component
    # clears the floor, the weighted-average portfolio APY does too. Relaxed by
    # main.py if it leaves too few candidates to build a sensible basket.
    min_apy: float | None = Field(default=None, ge=0)
    excluded_chains: list[Chain] = []
    excluded_categories: list[Category] = []


class QuerySpec(BaseModel):
    """Gemini structured output - translator emits this."""

    positive_anchors: list[str] = []
    negative_anchors: list[str] = []
    lens_weights: LensWeights = LensWeights()
    hard_filters: HardFilters = HardFilters()
    extracted_concerns: list[str] = []


class Position(BaseModel):
    protocol_id: str
    payload: PointPayload
    weight: float = Field(ge=0, le=1)
    dollars: float = Field(ge=0)
    score: float
    per_lens_scores: dict[str, float] = {}


class Allocation(BaseModel):
    """/api/portfolio response."""

    positions: list[Position]
    explanation: str = ""
    extracted_concerns: list[str] = []
    query_spec: QuerySpec
