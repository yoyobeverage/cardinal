"""Translator + narrator for Cardinal. Layered multi-provider LLM chain.

Each task (translate or narrate) tries a chain of providers in order:

    1. Google Gemini 2.5 Flash  (primary, free tier)
    2. Groq + Llama 3.3 70B     (secondary, free tier, different infra)
    3. Groq + Llama 3.1 8B      (tertiary, smaller/faster, last LLM try)
    4. Deterministic template   (final fallback, no LLM, intentionally mechanical)

Each layer has a hard 10s timeout. Failures (network errors, malformed
output, rate limits) drop the request to the next layer. The deterministic
template is now essentially unreachable in normal operation - it only fires
if Google AND Groq are both down simultaneously, which independent
infrastructure makes vanishingly unlikely.

Surfaces:
- translate(form):  freeform string + form  ->  validated QuerySpec
- narrate(allocation):  Allocation  ->  ~150-word markdown
- fallback_spec(form):  deterministic last-resort QuerySpec (still exported
  for direct use and tests)
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any

from google import genai
from groq import Groq

from app.catalog import catalog_ids, catalog_summary_for_prompt, load_catalog
from app.config import settings
from app.schemas import (
    Allocation,
    FormInput,
    HardFilters,
    LensWeights,
    QuerySpec,
    TaxWrapper,
)

log = logging.getLogger(__name__)


# ----------------------------------------------------------------------------
# Provider clients (lazy, cached)
# ----------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _gemini_client() -> genai.Client:
    return genai.Client(api_key=settings.GOOGLE_API_KEY)


@lru_cache(maxsize=1)
def _groq_client() -> Groq | None:
    if not settings.GROQ_API_KEY:
        return None
    return Groq(api_key=settings.GROQ_API_KEY, timeout=settings.LLM_TIMEOUT_S)


# ----------------------------------------------------------------------------
# Translator
# ----------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _translator_system_prompt() -> str:
    return f"""You are a parser. Read a user's freeform statement about their crypto yield investment preferences and combine it with their structured form values into a JSON object matching the QuerySpec schema. Do not add commentary. Do not recommend protocols beyond the catalog ids listed below.

Catalog of available protocols (use ONLY these ids in positive_anchors and negative_anchors):
{catalog_summary_for_prompt()}

Field guidance:
- positive_anchors: 1-3 catalog ids the user is likely to be interested in based on their words. If the user mentions Anchor/Terra/algorithmic-stablecoin trauma -> RWA T-bill anchors (ondo, blackrock, hashnote, openeden). If they mention staking ETH -> LST/LRT anchors (lido, rocket-pool, ether.fi). If they want stable income -> savings_rate or lending anchors.
- negative_anchors: catalog ids the user explicitly does NOT want. If "no LRTs" -> renzo, kelp, swell. If "no Curve" -> curve-dex pools. Empty list is fine.
- lens_weights: how much each axis matters (narrative, risk, yield_source, correlation, composability). Default narrative=0.5, risk=0.5. Boost risk when user emphasizes safety. Sum doesn't need to be exactly 1.0.
- hard_filters: ONLY set what the user explicitly states. "I need liquidity by month 10" -> max_lockup_days=270 (months*30). "min 3 audits" -> min_audit_count=3. "no Solana" -> excluded_chains=["solana"]. Leave fields null/empty otherwise.
- extracted_concerns: 1-4 short strings that paraphrase the user's qualitative concerns. These will be surfaced in the explanation card.

Never invent protocol ids. If a user's request doesn't match any catalog id, leave positive_anchors empty rather than guessing."""


def _translator_user_message(form: FormInput) -> str:
    return f"""Structured form values:
- capital_usd: {form.capital_usd}
- horizon_months: {form.horizon_months}
- tax_wrapper: {form.tax_wrapper.value}
- excluded_chains: {[c.value for c in form.excluded_chains]}
- min_audit_count: {form.min_audit_count}
- min_tvl_usd: {form.min_tvl_usd}
- max_lockup_days: {form.max_lockup_days}

Freeform statement:
\"\"\"{form.freeform}\"\"\"

Return only valid JSON matching the QuerySpec schema."""


def _qs_from_json_dict(raw: dict[str, Any]) -> QuerySpec:
    """Build a QuerySpec from a raw dict that may have missing/extra fields."""
    return QuerySpec.model_validate(raw)


def _gemini_translate(form: FormInput) -> QuerySpec | None:
    """Try Gemini structured-output. None on any failure."""
    try:
        response = _gemini_client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=_translator_user_message(form),
            config={
                "system_instruction": _translator_system_prompt(),
                "response_mime_type": "application/json",
                "response_schema": QuerySpec,
            },
        )
        spec = response.parsed
        if isinstance(spec, QuerySpec):
            return spec
        # Sometimes response.parsed is None but response.text contains valid JSON
        text = (response.text or "").strip()
        if text:
            return _qs_from_json_dict(json.loads(text))
        log.warning("gemini translate: empty response")
        return None
    except Exception as e:
        log.warning("gemini translate failed: %s: %s", type(e).__name__, e)
        return None


def _groq_translate(form: FormInput, model: str) -> QuerySpec | None:
    """Try Groq with JSON-mode. None on any failure."""
    client = _groq_client()
    if client is None:
        return None
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _translator_system_prompt()},
                {"role": "user", "content": _translator_user_message(form)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500,
        )
        text = (resp.choices[0].message.content or "").strip()
        if not text:
            log.warning("groq[%s] translate: empty response", model)
            return None
        return _qs_from_json_dict(json.loads(text))
    except Exception as e:
        log.warning("groq[%s] translate failed: %s: %s", model, type(e).__name__, e)
        return None


def _merge_form_filters(spec: QuerySpec, form: FormInput) -> QuerySpec:
    """Form-level filters override / tighten LLM-extracted filters."""
    if form.min_audit_count and (spec.hard_filters.min_audit_count or 0) < form.min_audit_count:
        spec.hard_filters.min_audit_count = form.min_audit_count
    if form.min_tvl_usd and (spec.hard_filters.min_tvl_usd or 0) < form.min_tvl_usd:
        spec.hard_filters.min_tvl_usd = form.min_tvl_usd
    if form.max_lockup_days is not None:
        existing = spec.hard_filters.max_lockup_days
        spec.hard_filters.max_lockup_days = (
            form.max_lockup_days if existing is None else min(existing, form.max_lockup_days)
        )
    for ch in form.excluded_chains:
        if ch not in spec.hard_filters.excluded_chains:
            spec.hard_filters.excluded_chains.append(ch)
    return spec


def _filter_hallucinations(spec: QuerySpec) -> QuerySpec:
    valid = set(catalog_ids())
    spec.positive_anchors = [a for a in spec.positive_anchors if a in valid]
    spec.negative_anchors = [n for n in spec.negative_anchors if n in valid]
    return spec


def translate(form: FormInput) -> QuerySpec:
    """Layered provider chain: Gemini -> Groq 70B -> Groq 8B -> deterministic."""
    chain = [
        ("gemini-flash", lambda: _gemini_translate(form)),
        ("groq-llama-70b", lambda: _groq_translate(form, settings.GROQ_MODEL_PRIMARY)),
        ("groq-llama-8b", lambda: _groq_translate(form, settings.GROQ_MODEL_FAST)),
    ]
    for layer_name, attempt in chain:
        spec = attempt()
        if spec is None:
            continue
        spec = _filter_hallucinations(spec)
        spec = _merge_form_filters(spec, form)
        if not spec.positive_anchors:
            # Even a valid response with zero usable anchors is a partial fail.
            # Backfill from deterministic to keep going.
            fb = fallback_spec(form)
            spec.positive_anchors = fb.positive_anchors
        log.info("translate served by %s", layer_name)
        return spec

    log.error("translate: all LLM providers failed; serving deterministic fallback_spec")
    return fallback_spec(form)


# ----------------------------------------------------------------------------
# Deterministic last-resort spec (still exported for tests + final fallback)
# ----------------------------------------------------------------------------
def fallback_spec(form: FormInput) -> QuerySpec:
    """Deterministic spec from form fields only. Always produces a non-empty positive_anchors."""
    cat = load_catalog()

    valid = []
    for pid, p in cat.items():
        if form.min_audit_count and p.audit_count < form.min_audit_count:
            continue
        if form.min_tvl_usd and p.tvl_usd < form.min_tvl_usd:
            continue
        if form.max_lockup_days is not None and p.lockup_days > form.max_lockup_days:
            continue
        if any(c in form.excluded_chains for c in p.chains):
            continue
        valid.append((pid, p))

    if not valid:
        valid = list(cat.items())

    ira_categories = {"rwa_treasury", "savings_rate"}
    if form.tax_wrapper in (TaxWrapper.TRADITIONAL_IRA, TaxWrapper.ROTH_IRA):
        valid.sort(key=lambda kv: (kv[1].category.value not in ira_categories, -kv[1].tvl_usd))
    else:
        valid.sort(key=lambda kv: -kv[1].tvl_usd)
    anchor_id = valid[0][0]

    hf = HardFilters(
        max_lockup_days=form.max_lockup_days,
        min_audit_count=form.min_audit_count or None,
        min_tvl_usd=form.min_tvl_usd or None,
        excluded_chains=list(form.excluded_chains),
    )

    return QuerySpec(
        positive_anchors=[anchor_id],
        negative_anchors=[],
        lens_weights=LensWeights(narrative=0.5, risk=0.5),
        hard_filters=hf,
        extracted_concerns=[],
    )


# ----------------------------------------------------------------------------
# Narrator
# ----------------------------------------------------------------------------
_NARRATOR_SYSTEM_PROMPT = """You are a financial assistant. You will receive a portfolio of crypto yield products that was already selected by a quantitative vector-search system; you are NOT making the selection, just explaining it.

Write a roughly 150-word markdown explanation of why this portfolio fits the user's stated concerns. Use these rules:

- Open with one sentence describing the overall strategy in plain English.
- Then one sentence per major position (top 3 by weight) naming the protocol and what role it plays.
- Close with one sentence acknowledging how the portfolio addresses each user concern.
- Do not recommend changes. Do not invent risks or properties not in the data.
- Use plain markdown (bold/italic ok). Never use headers (#).
- Be concrete, not generic. Reference actual protocol names and APYs."""


def _narrator_user_message(allocation: Allocation) -> str:
    position_lines = []
    for pos in allocation.positions:
        position_lines.append(
            f"- {pos.payload.protocol} ({pos.payload.product}, {pos.payload.category.value}): "
            f"{pos.weight * 100:.1f}% allocation (${pos.dollars:,.0f}), "
            f"{pos.payload.current_apy:.2f}% APY, "
            f"max drawdown {pos.payload.max_drawdown_1y:.1%}, "
            f"{pos.payload.audit_count} audits, {pos.payload.lockup_days}d lockup"
        )
    concerns_str = "; ".join(allocation.extracted_concerns) or "(none specifically stated)"
    return (
        "Portfolio positions (already selected by the quantitative system):\n"
        + "\n".join(position_lines)
        + f"\n\nUser's concerns: {concerns_str}\n\n"
        "Write the ~150-word markdown explanation now."
    )


def _gemini_narrate(allocation: Allocation) -> str | None:
    try:
        response = _gemini_client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=_narrator_user_message(allocation),
            config={"system_instruction": _NARRATOR_SYSTEM_PROMPT},
        )
        text = (response.text or "").strip()
        return text or None
    except Exception as e:
        log.warning("gemini narrate failed: %s: %s", type(e).__name__, e)
        return None


def _groq_narrate(allocation: Allocation, model: str) -> str | None:
    client = _groq_client()
    if client is None:
        return None
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _NARRATOR_SYSTEM_PROMPT},
                {"role": "user", "content": _narrator_user_message(allocation)},
            ],
            temperature=0.6,
            max_tokens=400,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or None
    except Exception as e:
        log.warning("groq[%s] narrate failed: %s: %s", model, type(e).__name__, e)
        return None


def _fallback_narration(allocation: Allocation) -> str:
    if not allocation.positions:
        return "No allocation could be produced from your input."
    lines = [f"Allocated across {len(allocation.positions)} protocols:"]
    for pos in allocation.positions[:3]:
        lines.append(
            f"- **{pos.payload.protocol}** ({pos.payload.product}): "
            f"{pos.weight * 100:.1f}% at {pos.payload.current_apy:.2f}% APY"
        )
    if allocation.extracted_concerns:
        lines.append("Addresses concerns: " + ", ".join(allocation.extracted_concerns))
    return "\n".join(lines)


def narrate(allocation: Allocation) -> str:
    """Layered provider chain: Gemini -> Groq 70B -> Groq 8B -> deterministic."""
    if not allocation.positions:
        return "No allocation could be produced from your input."

    chain = [
        ("gemini-flash", lambda: _gemini_narrate(allocation)),
        ("groq-llama-70b", lambda: _groq_narrate(allocation, settings.GROQ_MODEL_PRIMARY)),
        ("groq-llama-8b", lambda: _groq_narrate(allocation, settings.GROQ_MODEL_FAST)),
    ]
    for layer_name, attempt in chain:
        text = attempt()
        if text:
            log.info("narrate served by %s", layer_name)
            return text

    log.error("narrate: all LLM providers failed; serving deterministic fallback")
    return _fallback_narration(allocation)
