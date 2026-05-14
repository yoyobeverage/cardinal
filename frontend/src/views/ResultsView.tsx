import { useMemo, useState } from "react";

import AllocationBar from "../components/AllocationBar";
import LensScatter from "../components/LensScatter";
import LensSelector from "../components/LensSelector";
import type { Allocation } from "../types";

interface Props {
  allocation: Allocation;
  onBack: () => void;
}

const AVAILABLE_LENSES = ["narrative", "risk"];

export default function ResultsView({ allocation, onBack }: Props) {
  const [lens, setLens] = useState<string>("narrative");
  const allocatedIds = useMemo(
    () => new Set(allocation.positions.map((p) => p.protocol_id)),
    [allocation.positions],
  );

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

      <AllocationBar positions={allocation.positions} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm text-zinc-400">Universe map · same portfolio, different lens</h3>
          <LensSelector
            lenses={AVAILABLE_LENSES}
            current={lens}
            onChange={setLens}
          />
        </div>
        <LensScatter currentLens={lens} allocatedIds={allocatedIds} />
        <p className="mt-2 text-xs text-zinc-500">
          Highlighted dots are the {allocatedIds.size} protocols in your allocation. Switch lenses
          to see how the same portfolio rearranges across orthogonal similarity axes.
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
        <h3 className="mb-2 text-sm text-zinc-400">Explanation</h3>
        <pre className="whitespace-pre-wrap rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
{allocation.explanation}
        </pre>
      </div>
    </div>
  );
}
