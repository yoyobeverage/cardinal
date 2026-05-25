import { lazy, Suspense, useEffect } from "react";

import {
  BORDER,
  INK,
  INK_2,
  INK_3,
  MINT,
  MINT_BG,
  SURFACE,
  SURFACE_2,
} from "../theme";
import type { PointPayload, Position } from "../types";

const RadarPanel = lazy(() => import("./RadarPanel"));

// Two modes:
// - allocation: clicked an allocated dot/row. Position has weight/dollars/score.
// - exploration: clicked any other dot. No allocation block, payload + per-lens only.
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
      <div
        className="fixed inset-0 z-30"
        style={{ background: "rgba(10,31,74,0.45)" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto shadow-xl"
        style={{ background: SURFACE, borderLeft: `1px solid ${BORDER}` }}
        role="dialog"
        aria-label={`${p.protocol} details`}
      >
        <div
          className="flex items-start justify-between border-b px-6 py-4"
          style={{ borderColor: BORDER, background: SURFACE_2 }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: INK }}>
              {p.protocol}
            </h2>
            <p className="text-sm" style={{ color: INK_2 }}>
              {p.product}
            </p>
            {!isAllocation && (
              <p
                className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs"
                style={{ background: MINT_BG, color: MINT }}
              >
                Not in your allocation - exploring
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition"
            style={{ color: INK_3 }}
            aria-label="Close drilldown"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = SURFACE_2;
              e.currentTarget.style.color = INK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = INK_3;
            }}
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
            <Detail
              label="Lockup"
              value={p.lockup_days === 0 ? "none" : `${p.lockup_days}d`}
            />
            <Detail
              label="Audits"
              value={`${p.audit_count} (${p.audit_firms.slice(0, 2).join(", ")}${
                p.audit_firms.length > 2 ? "…" : ""
              })`}
            />
            <Detail
              label="Max drawdown (1y)"
              value={`${(p.max_drawdown_1y * 100).toFixed(1)}%`}
            />
            <Detail label="Tax treatment" value={p.tax_treatment.replace(/_/g, " ")} />
            <Detail label="Launched" value={p.launched_at} />
          </div>

          {radarData.length > 0 && (
            <div>
              <h3
                className="mb-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: INK_2 }}
              >
                {isAllocation
                  ? "Per-lens similarity to your anchors"
                  : "Per-lens similarity vs your anchor set"}
              </h3>
              {radarData.length >= 3 ? (
                <div
                  className="flex justify-center rounded p-2"
                  style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}
                >
                  <Suspense
                    fallback={
                      <div
                        className="h-[280px] w-[420px] animate-pulse rounded"
                        style={{ background: SURFACE_2 }}
                      />
                    }
                  >
                    <RadarPanel data={radarData} />
                  </Suspense>
                </div>
              ) : (
                <div
                  className="space-y-2 rounded p-4"
                  style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}
                >
                  {radarData.map((d) => (
                    <div key={d.lens}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span style={{ color: INK_2 }}>{d.lens}</span>
                        <span style={{ color: INK_3, fontFamily: "monospace" }}>
                          {(d.score / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 rounded" style={{ background: BORDER }}>
                        <div
                          className="h-full rounded"
                          style={{ width: `${d.score}%`, background: MINT }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs" style={{ color: INK_3 }}>
                Similarity to your anchor set on each lens, normalized to [0, 1].
                {!isAllocation &&
                  " High scores on lenses you care about may explain why this protocol nearly made the cut."}
              </p>
            </div>
          )}

          <div>
            <h3
              className="mb-2 text-sm font-semibold uppercase tracking-wider"
              style={{ color: INK_2 }}
            >
              About this protocol
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: INK_2 }}>
              {p.description}
            </p>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm hover:underline"
              style={{ color: MINT }}
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
      <div
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: INK_3 }}
      >
        {label}
      </div>
      <div className="mt-0.5" style={{ color: INK }}>
        {value}
      </div>
    </div>
  );
}
