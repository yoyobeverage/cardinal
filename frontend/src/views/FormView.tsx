import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { fetchPortfolio, type OptimizerName } from "../api";
import DrawdownSwipeStack from "../components/DrawdownSwipe";
import YieldSourceRank from "../components/YieldSourceRank";
import {
  BG,
  BORDER,
  BORDER_BRIGHT,
  DANGER,
  DANGER_BG,
  INK,
  INK_2,
  INK_3,
  MINT,
  MINT_BG,
  MINT_BRIGHT,
  MONO,
  SANS,
  SURFACE,
  SURFACE_2,
} from "../theme";
import type {
  Allocation,
  Chain,
  DrawdownSwipe,
  FormInput,
  TaxWrapper,
  YieldSource,
} from "../types";

const ALL_CHAINS: { value: Chain; label: string }[] = [
  { value: "ethereum",  label: "Ethereum" },
  { value: "base",      label: "Base" },
  { value: "arbitrum",  label: "Arbitrum" },
  { value: "optimism",  label: "Optimism" },
  { value: "polygon",   label: "Polygon" },
  { value: "solana",    label: "Solana" },
  { value: "bsc",       label: "BSC" },
  { value: "avalanche", label: "Avalanche" },
];

const WRAPPERS: { value: TaxWrapper; label: string; hint: string }[] = [
  { value: "taxable",         label: "Taxable",       hint: "Brokerage / on-chain wallet" },
  { value: "traditional_ira", label: "Trad. IRA",     hint: "Pre-tax, taxed on withdrawal" },
  { value: "roth_ira",        label: "Roth IRA",      hint: "After-tax, withdrawals tax-free" },
  { value: "hsa",             label: "HSA",           hint: "Health Savings Account" },
];

// Each lens has a plain-English explainer shown on hover. `d` = dimensions
// (the number of features in each protocol's vector for this lens). The
// distance metric is whatever math best fits the data shape: cosine for
// direction-only embeddings (text, mixes, correlations), Euclidean for
// real-magnitude numbers (risk profile), dot product for graph embeddings
// where both direction and magnitude matter (composability).
const LENS_INDEX: {
  lens: string;
  dim: number;
  metric: string;
  explainer: string;
}[] = [
  {
    lens: "narrative",
    dim: 1024,
    metric: "cosine",
    explainer:
      "What this protocol is *about*. A text-embedding model (BGE-large) converts the description, product, and audit profile into 1024 numbers. Cosine = compares the meaning, not the length.",
  },
  {
    lens: "risk",
    dim: 32,
    metric: "euclid",
    explainer:
      "Hand-engineered safety profile: drawdown, audit count, audit-firm reputation, lockup days, custody type, oracle diversity, etc. Each of the 32 numbers is in [0,1] so straight-line (Euclidean) distance is the right way to compare.",
  },
  {
    lens: "yield_source",
    dim: 16,
    metric: "cosine",
    explainer:
      "Where the yield actually comes from: real cash flow, lending spread, AMM fees, points/airdrops, restaking rewards, etc. Cosine compares the mix of sources, not the total amount.",
  },
  {
    lens: "correlation",
    dim: 8,
    metric: "cosine",
    explainer:
      "How this protocol's APY moves with macro assets: BTC, ETH, S&P 500, US Treasuries, gold, etc. Useful for spotting hidden concentration risk — protocols that look unrelated may all move with ETH.",
  },
  {
    lens: "tax_treatment",
    dim: 12,
    metric: "cosine",
    explainer:
      "How the IRS treats this yield: ordinary income, qualified dividend, capital gain, return of capital, QBI, etc. Used to tilt the allocation toward tax-optimal products for your account type.",
  },
  {
    lens: "composability",
    dim: 64,
    metric: "dot",
    explainer:
      "Which other protocols accept this one's receipt tokens (e.g., stETH gets deposited into Aave, Morpho, Pendle, Curve). Computed by running node2vec on a hand-curated graph. Dot product preserves both direction and magnitude so high-degree hubs register prominently.",
  },
];

interface Props {
  onAllocation: (a: Allocation) => void;
}

interface FormDraft extends Omit<FormInput, "max_lockup_days"> {
  max_lockup_days: number | "" | null;
}

interface Persona {
  label: string;
  description: string;
  preset: FormDraft;
}

const PERSONAS: Persona[] = [
  {
    label: "House-buyer",
    description: "$100k · 12mo · conservative",
    preset: {
      capital_usd: 100_000,
      horizon_months: 12,
      tax_wrapper: "taxable",
      excluded_chains: [],
      min_audit_count: 2,
      min_tvl_usd: 0,
      max_lockup_days: 270,
      freeform:
        "I need real liquidity by month 10 because I'm buying a house. Keep things conservative; avoid anything that could lose 20%+ of principal.",
    },
  },
  {
    label: "Retiree",
    description: "$500k IRA · max safety",
    preset: {
      capital_usd: 500_000,
      horizon_months: 36,
      tax_wrapper: "traditional_ira",
      excluded_chains: ["solana", "bsc"],
      min_audit_count: 3,
      min_tvl_usd: 50_000_000,
      max_lockup_days: 30,
      freeform:
        "I cannot lose principal. T-bills and the most audited stablecoin yields only.",
    },
  },
  {
    label: "Degen",
    description: "$10k · 6mo · points",
    preset: {
      capital_usd: 10_000,
      horizon_months: 6,
      tax_wrapper: "taxable",
      excluded_chains: [],
      min_audit_count: 0,
      min_tvl_usd: 0,
      max_lockup_days: null,
      freeform:
        "Max yield, I know the risks. Give me points, emissions, LRTs, basis trade - the spicy stuff.",
    },
  },
];

export default function FormView({ onAllocation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizer, setOptimizer] = useState<OptimizerName>("weighted_sum");
  const [swipes, setSwipes] = useState<DrawdownSwipe[]>([]);
  const [yieldRanking, setYieldRanking] = useState<YieldSource[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormDraft>({
    defaultValues: {
      capital_usd: 100_000,
      horizon_months: 12,
      tax_wrapper: "taxable",
      excluded_chains: [],
      min_audit_count: 2,
      min_tvl_usd: 0,
      max_lockup_days: "",
      freeform: "",
    },
  });

  const currentWrapper = watch("tax_wrapper");
  const capital = watch("capital_usd");
  const horizon = watch("horizon_months");

  const onSubmit: SubmitHandler<FormDraft> = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const payload: FormInput = {
        capital_usd: Number(data.capital_usd),
        horizon_months: Number(data.horizon_months),
        tax_wrapper: data.tax_wrapper,
        excluded_chains: data.excluded_chains,
        min_audit_count: Number(data.min_audit_count) || 0,
        min_tvl_usd: Number(data.min_tvl_usd) || 0,
        max_lockup_days:
          data.max_lockup_days === "" || data.max_lockup_days == null
            ? null
            : Number(data.max_lockup_days),
        drawdown_swipes: swipes.length > 0 ? swipes : null,
        yield_source_ranking: yieldRanking.length > 0 ? yieldRanking : null,
        freeform: data.freeform,
      };
      const alloc = await fetchPortfolio(payload, optimizer);
      onAllocation(alloc);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const helperCls = "text-xs";

  return (
    <div style={{ background: BG, color: INK, fontFamily: SANS, minHeight: "100vh" }}>
      {/* Top nav */}
      <header className="border-b" style={{ borderColor: BORDER, background: SURFACE }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: MINT }} />
            <span className="text-sm font-semibold" style={{ color: INK }}>
              cardinal
            </span>
            <span className="text-xs" style={{ color: INK_3 }}>
              / yield-discovery
            </span>
          </div>
          <div className="hidden items-center gap-6 text-xs sm:flex" style={{ color: INK_2 }}>
            <Stat n="83" label="protocols" />
            <Stat n="6" label="vector lenses" />
            <Stat n="$2.4B" label="addressable TVL" />
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={{ background: MINT_BG, color: MINT }}
            >
              ● live
            </span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <main className="mx-auto max-w-6xl px-6 py-12">
          {/* Hero */}
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: BORDER_BRIGHT, color: INK_2, background: SURFACE }}
              >
                <span className="font-mono" style={{ color: MINT }}>v1.0</span>
                <span>·</span>
                <span>Qdrant Hackathon 2026</span>
              </div>
              <h1
                className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
                style={{ color: INK, letterSpacing: "-0.03em" }}
              >
                Qdrant indexes every yield product{" "}
                <span style={{ color: MINT }}>six different ways</span>.
              </h1>
              <p
                className="mt-5 max-w-xl text-base leading-relaxed"
                style={{ color: INK_2 }}
              >
                Each of our 83 yield products — DeFi lending, liquid staking, tokenized
                Treasury bills, and more — lives in Qdrant as six separate vectors:{" "}
                <span style={{ color: INK }}>narrative</span>,{" "}
                <span style={{ color: INK }}>risk</span>,{" "}
                <span style={{ color: INK }}>yield-source</span>,{" "}
                <span style={{ color: INK }}>correlation</span>,{" "}
                <span style={{ color: INK }}>tax</span>, and{" "}
                <span style={{ color: INK }}>composability</span>. Cardinal queries all six
                in a single round-trip and assembles the eight protocols that fit your
                situation. The LLM only translates your input and narrates the result —
                every selection decision is vector math.
              </p>
            </div>

            {/* Lens-index card */}
            <div
              className="rounded-md p-5"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="mb-3 flex items-baseline justify-between text-xs"
                style={{ color: INK_3 }}
              >
                <span>Lens index</span>
                <span className="italic">hover any row for details</span>
              </div>
              <div className="space-y-2">
                {LENS_INDEX.map(({ lens, dim, metric, explainer }) => (
                  <div key={lens} className="group relative">
                    <div
                      className="flex cursor-help items-center justify-between rounded border px-3 py-1.5 text-xs transition group-hover:border-current"
                      style={{
                        borderColor: BORDER,
                        background: SURFACE_2,
                        fontFamily: MONO,
                        color: INK_3,
                      }}
                    >
                      <span style={{ color: INK }}>{lens}</span>
                      <span>
                        <span style={{ color: MINT }}>{dim}d</span> · {metric}
                      </span>
                    </div>
                    {/* Tooltip: pops to the LEFT of the card, doesn't block hover on other rows */}
                    <div
                      className="pointer-events-none absolute right-full top-1/2 z-50 mr-3 hidden w-80 -translate-y-1/2 rounded-md px-4 py-3 text-xs leading-relaxed shadow-xl group-hover:block"
                      style={{
                        background: INK,
                        color: "#e6eaf2",
                        fontFamily: SANS,
                      }}
                    >
                      <div
                        className="mb-1.5 font-semibold"
                        style={{ color: MINT, fontFamily: MONO }}
                      >
                        {lens} · {dim} dimensions · {metric}
                      </div>
                      <div>{explainer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personas */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: INK_3 }}>
              quick start →
            </span>
            {PERSONAS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => reset(p.preset)}
                className="rounded border bg-white px-3 py-1.5 text-sm transition hover:border-current"
                style={{ borderColor: BORDER_BRIGHT, color: INK }}
              >
                <span className="font-medium">{p.label}</span>
                <span className="ml-2 font-mono text-xs" style={{ color: INK_3 }}>
                  {p.description}
                </span>
              </button>
            ))}
          </div>

          {/* Main form grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Capital" hint="USD principal you want allocated">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl" style={{ color: INK_3, fontFamily: MONO }}>$</span>
                <input
                  {...register("capital_usd", { required: true, valueAsNumber: true })}
                  type="number"
                  step="1000"
                  className="w-full bg-transparent text-4xl font-semibold outline-none"
                  style={{
                    color: INK,
                    fontFamily: MONO,
                    letterSpacing: "-0.02em",
                    caretColor: MINT_BRIGHT,
                  }}
                />
              </div>
              <p className={helperCls} style={{ color: INK_3, marginTop: 8 }}>
                {Number(capital || 0).toLocaleString()} USD · round numbers are fine
              </p>
            </Card>

            <Card title="Horizon" hint="Months you plan to hold before needing the funds">
              <div className="flex items-baseline justify-between">
                <input
                  {...register("horizon_months", {
                    required: true,
                    valueAsNumber: true,
                    min: 1,
                    max: 60,
                  })}
                  type="number"
                  min={1}
                  max={60}
                  className="w-24 bg-transparent text-4xl font-semibold outline-none"
                  style={{
                    color: INK,
                    fontFamily: MONO,
                    letterSpacing: "-0.02em",
                    caretColor: MINT_BRIGHT,
                  }}
                />
                <span className="text-sm" style={{ color: INK_3 }}>months</span>
              </div>
              {/* Real draggable slider, synced to the same form field via setValue.
                  The gradient background visualizes the fill (mint left of thumb,
                  border-gray right of it). */}
              <input
                type="range"
                min={1}
                max={60}
                value={Number(horizon || 12)}
                onChange={(e) =>
                  setValue("horizon_months", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  accentColor: MINT,
                  background: `linear-gradient(90deg, ${MINT_BRIGHT} 0%, ${MINT} ${
                    (Number(horizon || 12) / 60) * 100
                  }%, ${BORDER} ${(Number(horizon || 12) / 60) * 100}%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs" style={{ color: INK_3 }}>
                <span>1mo</span>
                <span>30mo</span>
                <span>60mo</span>
              </div>
            </Card>

            <Card
              title="Account"
              hint="Tax wrapper determines which yields are optimal for you"
              full
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WRAPPERS.map((w) => (
                  <label
                    key={w.value}
                    className="block cursor-pointer rounded px-3 py-2.5 text-left text-sm transition"
                    style={{
                      background: currentWrapper === w.value ? MINT_BG : SURFACE,
                      border: `1px solid ${currentWrapper === w.value ? MINT : BORDER}`,
                      color: currentWrapper === w.value ? MINT : INK,
                      fontWeight: currentWrapper === w.value ? 600 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      value={w.value}
                      {...register("tax_wrapper")}
                      className="sr-only"
                    />
                    <div>{w.label}</div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{
                        color: currentWrapper === w.value ? MINT : INK_3,
                        fontWeight: 400,
                      }}
                    >
                      {w.hint}
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card
              title="Safety floors"
              hint="Hard filters — protocols below these are excluded entirely"
              full
            >
              <div className="grid grid-cols-3 gap-2">
                <SafetyChip label="audits ≥">
                  <input
                    {...register("min_audit_count", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    className="w-full bg-transparent text-xl font-semibold outline-none"
                    style={{ color: INK, fontFamily: MONO, caretColor: MINT_BRIGHT }}
                  />
                </SafetyChip>
                <SafetyChip label="TVL ≥ USD">
                  <input
                    {...register("min_tvl_usd", { valueAsNumber: true })}
                    type="number"
                    step="1000000"
                    className="w-full bg-transparent text-xl font-semibold outline-none"
                    style={{ color: INK, fontFamily: MONO, caretColor: MINT_BRIGHT }}
                  />
                </SafetyChip>
                <SafetyChip label="lockup ≤ days">
                  <input
                    {...register("max_lockup_days")}
                    type="number"
                    min={0}
                    placeholder="any"
                    className="w-full bg-transparent text-xl font-semibold outline-none placeholder:font-normal placeholder:italic"
                    style={{ color: INK, fontFamily: MONO, caretColor: MINT_BRIGHT }}
                  />
                </SafetyChip>
              </div>
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="mt-3 text-xs transition hover:text-current"
                style={{ color: MINT }}
              >
                {advancedOpen ? "− hide" : "+ advanced"} (excluded chains)
              </button>
              {advancedOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ALL_CHAINS.map((c) => (
                    <label
                      key={c.value}
                      className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition hover:border-current"
                      style={{ borderColor: BORDER_BRIGHT, color: INK_2, background: SURFACE_2 }}
                    >
                      <input
                        type="checkbox"
                        value={c.value}
                        {...register("excluded_chains")}
                        style={{ accentColor: MINT }}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </Card>

            {/* Personalize (collapsible optional shapers) */}
            <Card
              title="Personalize"
              hint="Optional. Rank preferred yield sources, calibrate risk tolerance, or change the optimizer."
              full
            >
              <div className="space-y-3">
                <YieldSourceRank ranking={yieldRanking} onChange={setYieldRanking} />
                <DrawdownSwipeStack decisions={swipes} onChange={setSwipes} />
                <div
                  className="rounded-md p-4"
                  style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}
                >
                  <div className="mb-2 text-sm font-medium" style={{ color: INK }}>
                    Math approach
                  </div>
                  <div
                    className="inline-flex rounded border p-1"
                    style={{ borderColor: BORDER_BRIGHT, background: SURFACE }}
                  >
                    {[
                      ["weighted_sum", "Risk-weighted average"],
                      ["mean_variance", "Markowitz (min-variance)"],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOptimizer(val as OptimizerName)}
                        className="rounded px-3 py-1 text-sm transition"
                        style={{
                          background: optimizer === val ? MINT : "transparent",
                          color: optimizer === val ? SURFACE : INK_2,
                          fontWeight: optimizer === val ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={helperCls} style={{ color: INK_3, marginTop: 8 }}>
                    {optimizer === "weighted_sum"
                      ? "Default. Best matches by similarity, weighted by safety (lower drawdown gets more allocation)."
                      : "Classical mean-variance. Minimizes portfolio variance subject to a return floor; tends to find unrelated protocols."}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Freeform" hint="Plain English — translated to a structured query." full>
              <textarea
                {...register("freeform")}
                rows={3}
                placeholder="e.g. 'I need the money in 10 months for a house down payment. Keep it boring.'"
                className="w-full resize-none bg-transparent text-base outline-none placeholder:italic"
                style={{ color: INK, caretColor: MINT_BRIGHT }}
              />
              <p className={helperCls} style={{ color: INK_3 }}>
                Mention life events, protocols you trust or avoid, anything context-specific.
                A sentence like "I need the money in 10 months" automatically caps the lockup
                duration considered.
              </p>
            </Card>
          </div>

          {error && (
            <div
              className="mt-4 rounded-md border px-4 py-3 text-sm"
              style={{
                background: DANGER_BG,
                borderColor: DANGER,
                color: DANGER,
              }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-md p-5"
            style={{ background: SURFACE, border: `1px solid ${BORDER_BRIGHT}` }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: INK }}>
                Ready to query the index.
              </div>
              <div className="mt-0.5 text-xs" style={{ color: INK_3, fontFamily: MONO }}>
                estimated p50 latency: 2.1s · vector ops: 6 · payload filter: 4
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: MINT, color: SURFACE }}
            >
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.35"
                    strokeWidth="4"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {loading ? "Running allocation…" : "Run allocation →"}
            </button>
          </div>

          <footer
            className="mt-12 border-t pt-6 text-xs"
            style={{ borderColor: BORDER, color: INK_3 }}
          >
            <span>Cardinal · Qdrant Hackathon 2026 · </span>
            <a
              href="https://github.com/yoyobeverage/cardinal"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: MINT }}
              className="hover:underline"
            >
              github
            </a>
          </footer>
        </main>
      </form>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
  full,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <section
      className={"rounded-md p-5 " + (full ? "lg:col-span-2" : "")}
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: INK_2 }}>
          {title}
        </h3>
        <span className="text-xs" style={{ color: INK_3 }}>
          {hint}
        </span>
      </div>
      {children}
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <span>
      <span className="font-semibold" style={{ color: INK, fontFamily: MONO }}>
        {n}
      </span>{" "}
      <span style={{ color: INK_3 }}>{label}</span>
    </span>
  );
}

function SafetyChip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded border px-3 py-2"
      style={{ borderColor: BORDER, background: SURFACE_2 }}
    >
      <div className="text-xs" style={{ color: INK_3 }}>
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
