import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { fetchPortfolio, type OptimizerName } from "../api";
import DrawdownSwipeStack from "../components/DrawdownSwipe";
import YieldSourceRank from "../components/YieldSourceRank";
import type { Allocation, Chain, DrawdownSwipe, FormInput, TaxWrapper, YieldSource } from "../types";

const ALL_CHAINS: Chain[] = [
  "ethereum", "base", "arbitrum", "optimism", "polygon", "solana", "bsc", "avalanche",
];
const WRAPPERS: TaxWrapper[] = ["taxable", "traditional_ira", "roth_ira", "hsa"];

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
    label: "House-buyer (anchor trauma)",
    description: "Mid-size capital, 12 months, needs liquidity, scarred by Anchor",
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
    description: "Large IRA, 36 months, T-bills only, max safety",
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
    description: "Small bag, 6 months, points and emissions over safety",
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
  const { register, handleSubmit, reset } = useForm<FormDraft>({
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

  const labelCls = "block";
  const labelTextCls = "text-sm text-zinc-400";
  const inputCls =
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 focus:border-emerald-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-sm text-zinc-400">Or start from a sample persona:</div>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => reset(p.preset)}
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-left text-sm hover:border-emerald-500"
              title={p.description}
            >
              <div className="font-medium text-zinc-200">{p.label}</div>
              <div className="text-xs text-zinc-500">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className={labelTextCls}>Capital (USD)</span>
          <input
            type="number"
            step="1000"
            {...register("capital_usd", { required: true })}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Horizon (months)</span>
          <input
            type="number"
            min={1}
            max={60}
            {...register("horizon_months", { required: true })}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Tax wrapper</span>
          <select {...register("tax_wrapper")} className={inputCls}>
            {WRAPPERS.map((w) => (
              <option key={w} value={w}>{w.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Min audit count</span>
          <input
            type="number"
            min={0}
            {...register("min_audit_count")}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Min TVL (USD)</span>
          <input
            type="number"
            step="1000000"
            {...register("min_tvl_usd")}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={labelTextCls}>Max lockup days (blank = any)</span>
          <input
            type="number"
            min={0}
            {...register("max_lockup_days")}
            className={inputCls}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-zinc-400">Excluded chains</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_CHAINS.map((c) => (
            <label
              key={c}
              className="inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
            >
              <input type="checkbox" value={c} {...register("excluded_chains")} />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <YieldSourceRank ranking={yieldRanking} onChange={setYieldRanking} />

      <DrawdownSwipeStack decisions={swipes} onChange={setSwipes} />

      <label className={labelCls}>
        <span className={labelTextCls}>Anything else worth knowing? (optional)</span>
        <textarea
          rows={4}
          placeholder="e.g. 'I got rugged by Anchor in 2022. I need real liquidity by month 10 because I'm buying a house.'"
          {...register("freeform")}
          className={inputCls}
        />
      </label>

      <div className="rounded border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 text-sm text-zinc-400">Optimizer</div>
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
            Weighted sum
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
            Mean-variance (Markowitz)
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {optimizer === "weighted_sum"
            ? "Score × 1/(1+drawdown), capped per-position. Default; respects qualitative preferences."
            : "Min wᵀΣw subject to a return floor. Pure variance minimization; can produce surprising diversifications."}
        </p>
      </div>

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
        {loading ? "Generating allocation…" : "Generate allocation"}
      </button>
    </form>
  );
}
