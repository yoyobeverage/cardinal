import { BORDER, INK, INK_2, INK_3, MONO, SURFACE_2 } from "../theme";
import type { Position } from "../types";

// Per-slice colors. Picked to be distinguishable on a cream background.
const COLORS = [
  "#0d7378", // mint
  "#2563eb", // blue
  "#a16207", // amber
  "#7c3aed", // violet
  "#dc2626", // red
  "#0891b2", // cyan
  "#ca8a04", // yellow
  "#a21caf", // fuchsia
];

interface Props {
  positions: Position[];
  onPositionClick?: (p: Position) => void;
}

export default function AllocationBar({ positions, onPositionClick }: Props) {
  if (positions.length === 0) {
    return <div style={{ color: INK_3 }}>No positions to display.</div>;
  }

  const total = positions.reduce((sum, p) => sum + p.dollars, 0);

  return (
    <div className="space-y-4">
      <div
        className="flex h-14 overflow-hidden rounded"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {positions.map((p, i) => (
          <button
            key={p.protocol_id}
            type="button"
            onClick={() => onPositionClick?.(p)}
            className="flex items-center justify-center text-xs font-medium text-white transition hover:brightness-110"
            style={{ width: `${p.weight * 100}%`, background: COLORS[i % COLORS.length] }}
            title={
              `${p.payload.protocol} - ${p.payload.product}\n` +
              `Weight: ${(p.weight * 100).toFixed(1)}% ($${p.dollars.toFixed(0)})\n` +
              `APY: ${p.payload.current_apy.toFixed(2)}%`
            }
          >
            {p.weight > 0.05 ? `${(p.weight * 100).toFixed(0)}%` : ""}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ color: INK_3 }}>
            <tr>
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider">
                Protocol
              </th>
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider">
                Product
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                Weight
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                Allocation
              </th>
              <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider">
                APY
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr
                key={p.protocol_id}
                onClick={() => onPositionClick?.(p)}
                className={onPositionClick ? "cursor-pointer transition" : ""}
                style={{ borderTop: `1px solid ${BORDER}` }}
                onMouseEnter={(e) => {
                  if (onPositionClick) e.currentTarget.style.background = SURFACE_2;
                }}
                onMouseLeave={(e) => {
                  if (onPositionClick) e.currentTarget.style.background = "transparent";
                }}
              >
                <td className="py-2.5" style={{ color: INK }}>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {p.payload.protocol}
                  </span>
                </td>
                <td className="py-2.5" style={{ color: INK_2 }}>
                  {p.payload.product}
                </td>
                <td className="py-2.5 text-right" style={{ color: INK, fontFamily: MONO }}>
                  {(p.weight * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 text-right" style={{ color: INK, fontFamily: MONO }}>
                  ${p.dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="py-2.5 text-right" style={{ color: INK, fontFamily: MONO }}>
                  {p.payload.current_apy.toFixed(2)}%
                </td>
              </tr>
            ))}
            <tr
              style={{
                borderTop: `2px solid ${BORDER}`,
                background: SURFACE_2,
              }}
            >
              <td
                colSpan={3}
                className="py-2.5 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: INK_3 }}
              >
                Total
              </td>
              <td
                className="py-2.5 text-right font-semibold"
                style={{ color: INK, fontFamily: MONO }}
              >
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td style={{ background: SURFACE_2 }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
