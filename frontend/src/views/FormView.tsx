import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { fetchPortfolio, type OptimizerName } from "../api";
import DrawdownSwipeStack from "../components/DrawdownSwipe";
import YieldSourceRank from "../components/YieldSourceRank";
import type { Allocation, Chain, DrawdownSwipe, FormInput, TaxWrapper, YieldSource } from "../types";

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
  { value: "traditional_ira", label: "Traditional IRA", hint: "Pre-tax, taxed on withdrawal" },
  { value: "roth_ira",        label: "Roth IRA",      hint: "After-tax, withdrawals tax-free" },
  { value: "hsa",             label: "HSA",           hint: "Health Savings Account" },
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
    description: "$100k for 12 months. Burned by Anchor, needs liquidity by month 10.",
    preset: {
      capital_usd: 100_000,
      horizon_months: 12,
      tax_wrapper: "taxable",
      excluded_chains: [],
      min_audit_count: 2,
      min_tvl_usd: 0,
      max_lockup_days: 270,
      freeform: "I got rugged by Anchor in 2022. I need real liquidity by month 10 because I'm buying a house.",
    },
  },
  {
    label: "Conservative retiree",
    description: "$500k IRA for 36 months. T-bills only, max safety.",
    preset: {
      capital_usd: 500_000,
      horizon_months: 36,
      tax_wrapper: "traditional_ira",
      excluded_chains: ["solana", "bsc"],
      min_audit_count: 3,
      min_tvl_usd: 50_000_000,
      max_lockup_days: 30,
      freeform: "I cannot lose principal. T-bills and the most audited stablecoin yields only.",
    },
  },
  {
    label: "Degen seeker",
    description: "$10k for 6 months. Points and emissions over safety.",
    preset: {
      capital_usd: 10_000,
      horizon_months: 6,
      tax_wrapper: "taxable",
      excluded_chains: [],
      min_audit_count: 0,
      min_tvl_usd: 0,
      max_lockup_days: null,
      freeform: "Max yield, I know the risks. Give me points, emissions, LRTs, basis trade — the spicy stuff.",
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
  const { register, handleSubmit, reset, watch } = useForm<FormDraft>({
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

  const inputCls =
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 focus:border-emerald-500 focus:outline-none";
  const helperCls = "mt-1 text-xs text-zinc-500";
  const labelTextCls = "text-sm font-medium text-zinc-200";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Hero */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-100">
          Find a yield portfolio that fits your situation.
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Cardinal searches <span className="text-zinc-200">83 yield products</span> — DeFi lending,
          liquid staking, tokenized Treasury bills, and more — and returns a diversified allocation
          tailored to who you are. Tell us a few things below; you don't need to know crypto jargon.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Step n={1} title="You describe yourself">
            How much, how long, what's your risk tolerance.
          </Step>
          <Step n={2} title="Our AI translates">
            Plain-English notes become a search query.
          </Step>
          <Step n={3} title="You get an allocation">
            A diversified mix with per-protocol explanations.
          </Step>
        </div>
      </section>

      {/* Quick-start personas */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-1 text-sm font-medium text-zinc-200">
          New here? Start with a scenario.
        </div>
        <div className="mb-3 text-xs text-zinc-500">
          Click one to fill the form, then tweak whatever you want.
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PERSONAS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => reset(p.preset)}
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-left text-sm transition hover:border-emerald-500"
            >
              <div className="font-medium text-zinc-100">{p.label}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{p.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Section: investment basics */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-800 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
          About your investment
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelTextCls}>How much are you investing?</span>
            <input
              type="number"
              step="1000"
              {...register("capital_usd", { required: true })}
              className={inputCls}
            />
            <p className={helperCls}>In US dollars. Round numbers are fine.</p>
          </label>

          <label className="block">
            <span className={labelTextCls}>For how long?</span>
            <input
              type="number"
              min={1}
              max={60}
              {...register("horizon_months", { required: true })}
              className={inputCls}
            />
            <p className={helperCls}>
              Months you plan to hold these positions before needing the money back. 1–60.
            </p>
          </label>
        </div>
      </section>

      {/* Section: account type */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-800 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
          What kind of account?
        </h3>
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WRAPPERS.map((w) => (
              <label
                key={w.value}
                className={
                  "block cursor-pointer rounded border px-3 py-2 text-left transition " +
                  (currentWrapper === w.value
                    ? "border-emerald-500 bg-zinc-900"
                    : "border-zinc-700 bg-zinc-950 hover:border-zinc-500")
                }
              >
                <input
                  type="radio"
                  value={w.value}
                  {...register("tax_wrapper")}
                  className="sr-only"
                />
                <div className="text-sm font-medium text-zinc-100">{w.label}</div>
                <div className="text-xs text-zinc-500">{w.hint}</div>
              </label>
            ))}
          </div>
          <p className={helperCls}>
            Account type affects which yields are tax-optimal for you. IRAs and HSAs shelter
            lending interest and T-bill coupons (which would otherwise be taxed as ordinary income).
            Taxable accounts work fine for anything but tilt slightly toward products with
            capital-gains treatment when possible.
          </p>
        </div>
      </section>

      {/* Section: safety filters (collapsible) */}
      <section className="rounded-lg border border-zinc-800">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-zinc-900"
        >
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
              Safety filters
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Hard floors on audits, protocol size, and lockup duration. Optional — defaults are reasonable.
            </div>
          </div>
          <span className="text-zinc-400">{advancedOpen ? "▼" : "▶"}</span>
        </button>

        {advancedOpen && (
          <div className="space-y-4 border-t border-zinc-800 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelTextCls}>Min security audits</span>
                <input
                  type="number"
                  min={0}
                  {...register("min_audit_count")}
                  className={inputCls}
                />
                <p className={helperCls}>
                  Independent security reviews of the protocol's smart contracts. More audits =
                  generally safer code. <span className="text-zinc-400">0</span> = no minimum.
                  <span className="text-zinc-400"> 3+</span> for conservative.
                </p>
              </label>

              <label className="block">
                <span className={labelTextCls}>Min protocol size (USD)</span>
                <input
                  type="number"
                  step="1000000"
                  {...register("min_tvl_usd")}
                  className={inputCls}
                />
                <p className={helperCls}>
                  Total Value Locked — roughly how much money is currently in the protocol.
                  Bigger = more battle-tested. Suggested ≥ $5M; pickier users use $50M+.
                </p>
              </label>

              <label className="block">
                <span className={labelTextCls}>Max lockup (days)</span>
                <input
                  type="number"
                  min={0}
                  placeholder="any"
                  {...register("max_lockup_days")}
                  className={inputCls}
                />
                <p className={helperCls}>
                  Days your funds may be inaccessible. Some yields require a lockup for higher
                  returns. Leave blank for no maximum.
                </p>
              </label>
            </div>

            <fieldset>
              <legend className={labelTextCls}>Blockchains to avoid</legend>
              <p className={helperCls + " mb-2"}>
                Different blockchain networks have different security profiles and ecosystems.
                Check any you want to exclude entirely.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_CHAINS.map((c) => (
                  <label
                    key={c.value}
                    className="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm hover:border-zinc-500"
                  >
                    <input type="checkbox" value={c.value} {...register("excluded_chains")} />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </section>

      {/* Section: personalize (existing collapsible components) */}
      <section className="space-y-3">
        <h3 className="border-b border-zinc-800 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Personalize (optional)
        </h3>
        <p className="text-xs text-zinc-500">
          Three optional ways to shape the result — rank your preferred yield types, tell us how
          you behaved in past crashes, or choose how we weight the math.
        </p>

        <YieldSourceRank ranking={yieldRanking} onChange={setYieldRanking} />
        <DrawdownSwipeStack decisions={swipes} onChange={setSwipes} />

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-1 text-sm font-medium text-zinc-200">Math approach</div>
          <div className="mb-2 text-xs text-zinc-500">
            How we choose weights within the candidate set.
          </div>
          <div className="inline-flex rounded border border-zinc-700 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setOptimizer("weighted_sum")}
              className={
                "rounded px-3 py-1 text-sm " +
                (optimizer === "weighted_sum"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200")
              }
            >
              Risk-weighted average
            </button>
            <button
              type="button"
              onClick={() => setOptimizer("mean_variance")}
              className={
                "rounded px-3 py-1 text-sm " +
                (optimizer === "mean_variance"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200")
              }
            >
              Markowitz (min-variance)
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {optimizer === "weighted_sum"
              ? "Default. Picks the best matches by similarity to your inputs, then weights by safety (lower drawdown gets more allocation). Respects what you said you care about."
              : "Classical portfolio theory: minimize total variance subject to a return floor. Tends to spread weight to find unrelated protocols. Can produce surprising diversifications, possibly lower yield."}
          </p>
        </div>
      </section>

      {/* Section: freeform */}
      <section className="space-y-2">
        <h3 className="border-b border-zinc-800 pb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
          In your own words (optional)
        </h3>
        <label className="block">
          <span className={labelTextCls}>Anything else worth knowing?</span>
          <textarea
            rows={4}
            placeholder="e.g. 'I got rugged by Anchor in 2022. I need real liquidity by month 10 because I'm buying a house.'"
            {...register("freeform")}
            className={inputCls}
          />
          <p className={helperCls}>
            Tell us about life events you're saving for, specific protocols you trust or distrust,
            yields that burned you in the past, or anything else context-specific. Our AI translates
            this into search filters and concerns — so a sentence like "I need the money in 10
            months" automatically caps the lockup duration we'll consider.
          </p>
        </label>
      </section>

      {error && (
        <div className="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {loading ? "Generating your allocation…" : "Generate my allocation"}
      </button>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {n}
        </span>
        <span className="text-sm font-medium text-zinc-200">{title}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{children}</p>
    </div>
  );
}
