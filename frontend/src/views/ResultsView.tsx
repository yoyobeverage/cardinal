import { useMemo, useState } from "react";

import { fetchProtocol } from "../api";
import AllocationBar from "../components/AllocationBar";
import DrilldownDrawer, { type DrilldownSubject } from "../components/DrilldownDrawer";
import ExplanationCard from "../components/ExplanationCard";
import LensScatter from "../components/LensScatter";
import LensSelector from "../components/LensSelector";
import type { Allocation, Position } from "../types";

interface Props {
  allocation: Allocation;
  onBack: () => void;
}

const AVAILABLE_LENSES = ["narrative", "risk", "yield_source", "correlation", "tax_treatment", "composability"];

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
    // Non-allocated → fetch payload + per_lens_scores from backend
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Allocation</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← back to form
        </button>
      </div>

      <AllocationBar
        positions={allocation.positions}
        onPositionClick={openAllocatedPosition}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm text-zinc-400">
            Universe map · same portfolio, different lens
          </h3>
          <LensSelector lenses={AVAILABLE_LENSES} current={lens} onChange={setLens} />
        </div>
        <LensScatter
          currentLens={lens}
          allocatedIds={allocatedIds}
          onPointClick={handlePointClick}
        />
        <p className="mt-2 text-xs text-zinc-500">
          The {allocatedIds.size} highlighted dots are your allocation. Smaller dots are other
          catalog protocols — click any of them to see why they didn't make the cut.
          {loadingPid ? " Loading…" : ""}
        </p>
      </div>

      {allocation.extracted_concerns.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm text-zinc-400">Concerns addressed</h3>
          <div className="flex flex-wrap gap-2">
            {allocation.extracted_concerns.map((c, i) => (
              <span key={i} className="rounded bg-zinc-800 px-3 py-1 text-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm text-zinc-400">Why this allocation</h3>
        <ExplanationCard markdown={allocation.explanation} />
      </div>

      <DrilldownDrawer subject={subject} onClose={() => setSubject(null)} />
    </div>
  );
}
