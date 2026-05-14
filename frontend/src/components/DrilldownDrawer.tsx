import { lazy, Suspense, useEffect } from "react";

import type { PointPayload, Position } from "../types";

// recharts is heavy (~250 KB). Lazy-import so it only loads when the drawer opens.
const RadarPanel = lazy(() => import("./RadarPanel"));

// The drawer can open in two modes:
// - "allocation" mode: user clicked an allocated dot or position row. Position has weight/dollars/score.
// - "exploration" mode: user clicked any other dot in the scatter. No allocation block; payload + per-lens
//   similarity to current anchors only. per_lens_scores fetched on-demand via /api/protocol.
export interface DrilldownSubject {
  payload: PointPayload;
  perLensScores: Record<string, number>;
  position?: Position;
}

interface Props {
  subject: DrilldownSubject | null;
  onClose: () => void;
}

const LENS_LABEL: Record<string, string> = {
  narrative: "Narrative",
  risk: "Risk",
  yield_source: "Yield Source",
  correlation: "Correlation",
  tax_treatment: "Tax",
  composability: "Composability",
};

export default function DrilldownDrawer({ subject, onClose }: Props) {
  useEffect(() => {
    if (!subject) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [subject, onClose]);

  if (!subject) return null;

  const radarData = Object.entries(subject.perLensScores).map(([lens, score]) => ({
    lens: LENS_LABEL[lens] ?? lens,
    score: Math.max(0, Math.min(1, score)) * 100,
    fullMark: 100,
  }));

  const p = subject.payload;
  const position = subject.position;
  const isAllocation = !!position;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/60" onClick={onClose} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-xl"
        role="dialog"
        aria-label={`${p.protocol} details`}
      >
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{p.protocol}</h2>
            <p className="text-sm text-zinc-400">{p.product}</p>
            {!isAllocation && (
              <p className="mt-1 text-xs text-amber-400">
                Not in your current allocation — exploring this protocol
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close drilldown"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {position && (
              <Detail
                label="Allocation"
                value={`$${position.dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(position.weight * 100).toFixed(1)}%)`}
              />
            )}
            <Detail label="Current APY" value={`${p.current_apy.toFixed(2)}%`} />
            <Detail label="TVL" value={`$${(p.tvl_usd / 1e6).toFixed(0)}M`} />
            <Detail label="Category" value={p.category.replace(/_/g, " ")} />
            <Detail label="Chains" value={p.chains.join(", ")} />
            <Detail label="Lockup" value={p.lockup_days === 0 ? "none" : `${p.lockup_days}d`} />
            <Detail
              label="Audits"
              value={`${p.audit_count} (${p.audit_firms.slice(0, 2).join(", ")}${p.audit_firms.length > 2 ? "…" : ""})`}
            />
            <Detail label="Max drawdown (1y)" value={`${(p.max_drawdown_1y * 100).toFixed(1)}%`} />
            <Detail label="Tax treatment" value={p.tax_treatment.replace(/_/g, " ")} />
            <Detail label="Launched" value={p.launched_at} />
          </div>

          {radarData.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm text-zinc-400">
                {isAllocation ? "Per-lens similarity to your anchors" : "Per-lens similarity vs your anchor set"}
              </h3>
              {radarData.length >= 3 ? (
                <div className="flex justify-center rounded border border-zinc-800 bg-zinc-900 p-2">
                  <Suspense fallback={<div className="h-[280px] w-[420px] animate-pulse rounded bg-zinc-900" />}>
                    <RadarPanel data={radarData} />
                  </Suspense>
                </div>
              ) : (
                <div className="space-y-2 rounded border border-zinc-800 bg-zinc-900 p-4">
                  {radarData.map((d) => (
                    <div key={d.lens}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-zinc-300">{d.lens}</span>
                        <span className="font-mono text-zinc-400">{(d.score / 100).toFixed(2)}</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-800">
                        <div
                          className="h-full rounded bg-emerald-500"
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Similarity to your anchor set on each lens, normalized to [0, 1].
                {!isAllocation && " High scores on lenses you care about may explain why this protocol nearly made the cut."}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm text-zinc-400">About this protocol</h3>
            <p className="text-sm leading-relaxed text-zinc-300">{p.description}</p>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-emerald-400 hover:underline"
            >
              Visit {new URL(p.url).hostname} ↗
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-zinc-500 text-xs uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-zinc-200">{value}</div>
    </div>
  );
}
