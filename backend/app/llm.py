"""Translator + narrator for Cardinal. Wraps google-genai 2.x.

Surfaces:
- translate(form): Single Gemini call with response_schema=QuerySpec. On any failure
  (network error, validation error, hallucinated ids), returns fallback_spec(form).
  Merges form-level hard filters in as a floor (stricter constraint wins).
- fallback_spec(form): Deterministic QuerySpec from form fields only. Picks a sensible
  anchor protocol based on tax wrapper + audit/TVL/lockup filters.
- narrate(allocation): Day 4 ships a deterministic markdown summary. Day 7 swaps in
  a Gemini-narrated explanation card.
"""
from __future__ import annotations

import logging
from functools import lru_cache

from google import genai

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


@lru_cache(maxsize=1)
def _client() -> genai.Client:
    return genai.Client(api_key=settings.GOOGLE_API_KEY)


@lru_cache(maxsize=1)
def _system_prompt() -> str:
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


def _user_message(form: FormInput) -> str:
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
    """Drop any anchor ids that aren't in the live catalog."""
    valid = set(catalog_ids())
    spec.positive_anchors = [a for a in spec.positive_anchors if a in valid]
    spec.negative_anchors = [n for n in spec.negative_anchors if n in valid]
    return spec


def translate(form: FormInput) -> QuerySpec:
    """Freeform string + form -> QuerySpec. Falls back on any failure."""
    try:
        response = _client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=_user_message(form),
            config={
                "system_instruction": _system_prompt(),
                "response_mime_type": "application/json",
                "response_schema": QuerySpec,
            },
        )
        spec = response.parsed
        if spec is None or not isinstance(spec, QuerySpec):
            log.warning("Gemini returned no parsed QuerySpec; using fallback_spec")
            return fallback_spec(form)
        spec = _filter_hallucinations(spec)
        spec = _merge_form_filters(spec, form)
        if not spec.positive_anchors:
            # No usable anchors after hallucination filter - fall back to deterministic anchor
            fb = fallback_spec(form)
            spec.positive_anchors = fb.positive_anchors
        return spec
    except Exception:
        log.exception("translator failed; using fallback_spec")
        return fallback_spec(form)


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
        valid = list(cat.items())  # filters too strict - soften

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


_NARRATOR_SYSTEM_PROMPT = """You are a financial assistant. You will receive a portfolio of crypto yield products that was already selected by a quantitative vector-search system; you are NOT making the selection, just explaining it.

Write a roughly 150-word markdown explanation of why this portfolio fits the user's stated concerns. Use these rules:

- Open with one sentence describing the overall strategy in plain English.
- Then one sentence per major position (top 3 by weight) naming the protocol and what role it plays.
- Close with one sentence acknowledging how the portfolio addresses each user concern.
- Do not recommend changes. Do not invent risks or properties not in the data.
- Use plain markdown (bold/italic ok). Never use headers (#).
- Be concrete, not generic. Reference actual protocol names and APYs."""


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
    """Single Gemini call producing a ~150-word markdown explanation card."""
    if not allocation.positions:
        return "No allocation could be produced from your input."
    try:
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

        user_message = (
            "Portfolio positions (already selected by the quantitative system):\n"
            + "\n".join(position_lines)
            + f"\n\nUser's concerns: {concerns_str}\n\n"
            "Write the ~150-word markdown explanation now."
        )

        response = _client().models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_message,
            config={
                "system_instruction": _NARRATOR_SYSTEM_PROMPT,
            },
        )
        text = (response.text or "").strip()
        if not text:
            return _fallback_narration(allocation)
        return text
    except Exception:
        log.exception("narrator failed; using deterministic fallback")
        return _fallback_narration(allocation)
