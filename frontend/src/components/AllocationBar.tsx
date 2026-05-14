import type { Position } from "../types";

const COLORS = [
  "bg-emerald-500", "bg-sky-500",     "bg-violet-500", "bg-amber-500",
  "bg-rose-500",    "bg-fuchsia-500", "bg-teal-500",   "bg-orange-500",
];

interface Props {
  positions: Position[];
}

export default function AllocationBar({ positions }: Props) {
  if (positions.length === 0) {
    return <div className="text-zinc-500">No positions to display.</div>;
  }

  const total = positions.reduce((sum, p) => sum + p.dollars, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-14 overflow-hidden rounded border border-zinc-800">
        {positions.map((p, i) => (
          <div
            key={p.protocol_id}
            className={`${COLORS[i % COLORS.length]} flex items-center justify-center text-xs font-medium text-white`}
            style={{ width: `${p.weight * 100}%` }}
            title={
              `${p.payload.protocol} — ${p.payload.product}\n` +
              `Weight: ${(p.weight * 100).toFixed(1)}% ($${p.dollars.toFixed(0)})\n` +
              `APY: ${p.payload.current_apy.toFixed(2)}%`
            }
          >
            {p.weight > 0.05 ? `${(p.weight * 100).toFixed(0)}%` : ""}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="py-2 text-left font-medium">Protocol</th>
              <th className="py-2 text-left font-medium">Product</th>
              <th className="py-2 text-right font-medium">Weight</th>
              <th className="py-2 text-right font-medium">Allocation</th>
              <th className="py-2 text-right font-medium">APY</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={p.protocol_id} className="border-t border-zinc-800">
                <td className="py-2">
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-block h-3 w-3 rounded ${COLORS[i % COLORS.length]}`} />
                    {p.payload.protocol}
                  </span>
                </td>
                <td className="py-2 text-zinc-400">{p.payload.product}</td>
                <td className="py-2 text-right">{(p.weight * 100).toFixed(1)}%</td>
                <td className="py-2 text-right">
                  ${p.dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="py-2 text-right">{p.payload.current_apy.toFixed(2)}%</td>
              </tr>
            ))}
            <tr className="border-t border-zinc-800 font-medium">
              <td colSpan={3} className="py-2 text-right">Total</td>
              <td className="py-2 text-right">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
