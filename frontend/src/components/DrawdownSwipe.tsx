import { lazy, Suspense, useState } from "react";

import type { DrawdownSwipe } from "../types";

// Lazy chart so recharts isn't paid until the user expands the swipe stack.
const DrawdownChart = lazy(() => import("./DrawdownChart"));

interface Scenario {
  id: string;
  title: string;
  date: string;
  description: string;
  chartData: { d: number; v: number }[];
  /** Catalog id the "held" position implicitly favors. */
  heldAnchor: string;
  /** Catalog id the "sold" position implicitly favors. */
  soldAnchor: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "terra",
    title: "Terra/Luna collapse",
    date: "May 2022",
    description: "UST algorithmic stablecoin lost peg; Luna fell from $80 to ~$0 in a week.",
    chartData: drawdownSeries([1, 1, 0.99, 0.95, 0.7, 0.4, 0.15, 0.05, 0.04, 0.03]),
    heldAnchor: "ethena-usde_ethereum_susde",
    soldAnchor: "ondo-yield-assets_ethereum_usdy",
  },
  {
    id: "ftx",
    title: "FTX collapse",
    date: "November 2022",
    description: "FTX/Alameda insolvency. Centralized custody risk became real overnight.",
    chartData: drawdownSeries([1, 1, 1, 0.95, 0.6, 0.2, 0.1, 0.1, 0.1, 0.1]),
    heldAnchor: "blackrock_buidl",
    soldAnchor: "sparklend_ethereum_usds",
  },
  {
    id: "usdc_depeg",
    title: "USDC depeg (SVB)",
    date: "March 2023",
    description: "Silicon Valley Bank failure cratered USDC reserves; peg dipped to ~$0.88 briefly.",
    chartData: drawdownSeries([1, 1, 0.99, 0.92, 0.88, 0.93, 0.97, 0.995, 1, 1]),
    heldAnchor: "spark-savings_ethereum_usdc",
    soldAnchor: "ondo-yield-assets_ethereum_usdy",
  },
  {
    id: "steth_discount",
    title: "stETH discount",
    date: "June 2022",
    description: "stETH traded 5–6% below ETH during 3AC unwind; LST liquidity premium spiked.",
    chartData: drawdownSeries([0.998, 0.995, 0.99, 0.96, 0.93, 0.94, 0.96, 0.98, 0.99, 0.998]),
    heldAnchor: "lido_ethereum_steth",
    soldAnchor: "rocket-pool_ethereum_reth",
  },
  {
    id: "btc_drawdown",
    title: "BTC ~70% drawdown",
    date: "Nov 2021 – Nov 2022",
    description: "BTC fell from $69k to $15k over a year; entire crypto market bottomed.",
    chartData: drawdownSeries([1, 0.92, 0.78, 0.62, 0.5, 0.4, 0.32, 0.28, 0.25, 0.22]),
    heldAnchor: "ether_fi-stake_ethereum_weeth",
    soldAnchor: "ondo-yield-assets_ethereum_usdy",
  },
];

function drawdownSeries(points: number[]): { d: number; v: number }[] {
  // Linear-interpolate to ~30 points for smoother charts.
  const dense: { d: number; v: number }[] = [];
  const segments = points.length - 1;
  const perSegment = 3;
  for (let i = 0; i < segments; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let j = 0; j < perSegment; j++) {
      const t = j / perSegment;
      dense.push({ d: i * perSegment + j, v: a + (b - a) * t });
    }
  }
  dense.push({ d: segments * perSegment, v: points[points.length - 1] });
  return dense;
}

interface Props {
  decisions: DrawdownSwipe[];
  onChange: (next: DrawdownSwipe[]) => void;
}

export default function DrawdownSwipeStack({ decisions, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const byId = new Map(decisions.map((d) => [d.scenario_id, d.decision]));

  const setDecision = (scenarioId: string, choice: "held" | "sold") => {
    const next = decisions.filter((d) => d.scenario_id !== scenarioId);
    next.push({ scenario_id: scenarioId, decision: choice });
    onChange(next);
  };

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm text-zinc-200">
            How did you feel during past crashes? · optional
          </div>
          <div className="text-xs text-zinc-500">
            {decisions.length === 0
              ? "Skip - or answer 5 quick questions about real historical crashes to calibrate your risk tolerance."
              : `${decisions.length} / 5 answered`}
          </div>
        </div>
        <span className="text-zinc-400">{open ? "▼" : "▶"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3">
          <p className="text-xs text-zinc-500">
            Each card shows what really happened during a famous crypto blow-up. Tell us whether
            you would have held through it or sold - your answers steer the recommendations toward
            protocols that match the risk appetite your choices reveal.
          </p>
          {SCENARIOS.map((s) => {
            const choice = byId.get(s.id);
            return (
              <div
                key={s.id}
                className="rounded border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-200">
                      {s.title} · {s.date}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">{s.description}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-16 w-32">
                    <Suspense fallback={<div className="h-full w-full animate-pulse rounded bg-zinc-900" />}>
                      <DrawdownChart data={s.chartData} />
                    </Suspense>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision(s.id, "held")}
                      className={
                        "rounded px-3 py-1.5 text-xs " +
                        (choice === "held"
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-700 text-zinc-300 hover:border-emerald-500")
                      }
                    >
                      I held
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision(s.id, "sold")}
                      className={
                        "rounded px-3 py-1.5 text-xs " +
                        (choice === "sold"
                          ? "bg-rose-600 text-white"
                          : "border border-zinc-700 text-zinc-300 hover:border-rose-500")
                      }
                    >
                      I sold
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Builds discovery context_pairs from collected decisions. Exported for use in FormView. */
export function decisionsToContextPairs(
  decisions: DrawdownSwipe[],
): { positive: string; negative: string }[] {
  return decisions
    .map((d) => {
      const s = SCENARIOS.find((x) => x.id === d.scenario_id);
      if (!s) return null;
      return d.decision === "held"
        ? { positive: s.heldAnchor, negative: s.soldAnchor }
        : { positive: s.soldAnchor, negative: s.heldAnchor };
    })
    .filter((p): p is { positive: string; negative: string } => p !== null);
}
