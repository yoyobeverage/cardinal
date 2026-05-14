import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { fetchPortfolio } from "../api";
import type { Allocation, Chain, FormInput, TaxWrapper } from "../types";

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

export default function FormView({ onAllocation }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<FormDraft>({
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
        freeform: data.freeform,
      };
      const alloc = await fetchPortfolio(payload);
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

      <label className={labelCls}>
        <span className={labelTextCls}>Anything else worth knowing? (optional)</span>
        <textarea
          rows={4}
          placeholder="e.g. 'I got rugged by Anchor in 2022. I need real liquidity by month 10 because I'm buying a house.'"
          {...register("freeform")}
          className={inputCls}
        />
      </label>

      {error && (
        <div className="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Generating allocation…" : "Generate allocation"}
      </button>
    </form>
  );
}
