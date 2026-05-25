import { useMemo, useState } from "react";

import { fetchProtocol } from "../api";
import AllocationBar from "../components/AllocationBar";
import DrilldownDrawer, { type DrilldownSubject } from "../components/DrilldownDrawer";
import ExplanationCard from "../components/ExplanationCard";
import LensScatter from "../components/LensScatter";
import LensSelector from "../components/LensSelector";
import {
  BG,
  BORDER,
  INK,
  INK_2,
  INK_3,
  MINT,
  MINT_BG,
  SANS,
  SURFACE,
} from "../theme";
import type { Allocation, Position } from "../types";

interface Props {
  allocation: Allocation;
  onBack: () => void;
}

const AVAILABLE_LENSES = [
  "narrative",
  "risk",
  "yield_source",
  "correlation",
  "tax_treatment",
  "composability",
];

export default function ResultsView({ allocation, onBack }: Props) {
  const [lens, setLens] = useState<string>("narrative");
  const [subject, setSubject] = useState<DrilldownSubject | null>(null);
  const [loadingPid, setLoadingPid] = useState<string | null>(null);

  const allocatedIds = useMemo(
    () => new Set(allocation.positions.map((p) => p.protocol_id)),
    [allocation.positions],
  );

  const positionById = useMemo(() => {
    const map = new Map<string, Position>();
    for (const p of allocation.positions) {
      map.set(p.protocol_id, p);
    }
    return map;
  }, [allocation.positions]);

  const anchorIds = allocation.query_spec.positive_anchors;

  const openAllocatedPosition = (p: Position) => {
    setSubject({
      payload: p.payload,
      perLensScores: p.per_lens_scores,
      position: p,
    });
  };

  const handlePointClick = async (id: string) => {
    const pos = positionById.get(id);
    if (pos) {
      openAllocatedPosition(pos);
      return;
    }
    setLoadingPid(id);
    try {
      const detail = await fetchProtocol(id, anchorIds);
      setSubject({
        payload: detail.payload,
        perLensScores: detail.per_lens_scores,
      });
    } catch (e) {
      console.error("Failed to fetch protocol detail:", e);
    } finally {
      setLoadingPid(null);
    }
  };

  return (
    <div style={{ background: BG, color: INK, fontFamily: SANS, minHeight: "100vh" }}>
      {/* Top nav matches FormView */}
      <header className="border-b" style={{ borderColor: BORDER, background: SURFACE }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: MINT }} />
            <span className="text-sm font-semibold" style={{ color: INK }}>
              cardinal
            </span>
            <span className="text-xs" style={{ color: INK_3 }}>
              / allocation
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded border px-3 py-1.5 text-xs transition hover:border-current"
            style={{ borderColor: BORDER, color: INK_2 }}
          >
            ← back to form
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        {/* Allocation bar section */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: INK }}>
              Your allocation
            </h2>
            <span className="text-xs uppercase tracking-wider" style={{ color: INK_3 }}>
              {allocation.positions.length} positions · click any to inspect
            </span>
          </div>
          <AllocationBar
            positions={allocation.positions}
            onPositionClick={openAllocatedPosition}
          />
        </section>

        {/* Lens scatter section */}
        <section
          className="rounded-md p-5"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: INK_2 }}
              >
                Universe map
              </h3>
              <p className="mt-0.5 text-xs" style={{ color: INK_3 }}>
                Same portfolio, different similarity lens
              </p>
            </div>
            <LensSelector lenses={AVAILABLE_LENSES} current={lens} onChange={setLens} />
          </div>
          <LensScatter
            currentLens={lens}
            allocatedIds={allocatedIds}
            onPointClick={handlePointClick}
          />
          <p className="mt-3 text-xs" style={{ color: INK_3 }}>
            The {allocatedIds.size} highlighted dots are your allocation. Smaller dots are other
            catalog protocols — click any to see why it didn't make the cut.
            {loadingPid ? " Loading…" : ""}
          </p>
        </section>

        {/* Concerns */}
        {allocation.extracted_concerns.length > 0 && (
          <section>
            <h3
              className="mb-2 text-sm font-semibold uppercase tracking-wider"
              style={{ color: INK_2 }}
            >
              Concerns addressed
            </h3>
            <div className="flex flex-wrap gap-2">
              {allocation.extracted_concerns.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-sm"
                  style={{ background: MINT_BG, color: MINT }}
                >
                  {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Explanation */}
        <section
          className="rounded-md p-6"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <h3
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: INK_2 }}
          >
            Why this allocation
          </h3>
          <ExplanationCard markdown={allocation.explanation} />
        </section>
      </main>

      <DrilldownDrawer subject={subject} onClose={() => setSubject(null)} />
    </div>
  );
}
