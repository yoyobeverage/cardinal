import AllocationBar from "../components/AllocationBar";
import type { Allocation } from "../types";

interface Props {
  allocation: Allocation;
  onBack: () => void;
}

export default function ResultsView({ allocation, onBack }: Props) {
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
