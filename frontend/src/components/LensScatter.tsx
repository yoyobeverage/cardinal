import { useEffect, useState } from "react";

interface UniversePoint {
  id: string;
  protocol: string;
  product: string;
  category: string;
  current_apy: number;
  tvl_usd: number;
  coords: Record<string, [number, number]>;
}

interface Props {
  currentLens: string;
  allocatedIds: Set<string>;
  onPointClick?: (id: string) => void;
}

const VIEW_SIZE = 480;
const PADDING = 30;
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

const CATEGORY_COLOR: Record<string, string> = {
  lending: "#60a5fa",
  fixed_rate: "#a78bfa",
  lst: "#34d399",
  lrt: "#10b981",
  stable_amm: "#fbbf24",
  volatile_amm: "#f59e0b",
  options_vault: "#f472b6",
  rwa_treasury: "#22d3ee",
  institutional_lending: "#0ea5e9",
  perps_lp: "#fb7185",
  basis_trade: "#e879f9",
  yield_aggregator: "#facc15",
  savings_rate: "#5eead4",
  stablecoin_issuance: "#c084fc",
};

export default function LensScatter({ currentLens, allocatedIds, onPointClick }: Props) {
  const [points, setPoints] = useState<UniversePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/universe`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then(setPoints)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="text-red-400">Failed to load universe: {error}</div>;
  if (points.length === 0) return <div className="text-zinc-500">Loading universe…</div>;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className="rounded border border-zinc-800 bg-zinc-950"
      data-current-lens={currentLens}
    >
      {points.map((p) => {
        const coord = p.coords[currentLens];
        if (!coord) return null;
        const [nx, ny] = coord;
        const cx = PADDING + nx * (VIEW_SIZE - 2 * PADDING);
        const cy = PADDING + ny * (VIEW_SIZE - 2 * PADDING);
        const isAllocated = allocatedIds.has(p.id);
        const color = CATEGORY_COLOR[p.category] ?? "#71717a";
        return (
          <g
            key={p.id}
            style={{
              transform: `translate(${cx}px, ${cy}px)`,
              transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <circle
              r={isAllocated ? 8 : 4}
              fill={color}
              stroke={isAllocated ? "#fafafa" : "none"}
              strokeWidth={1.5}
              opacity={isAllocated ? 1 : 0.4}
              style={{
                transition: "r 200ms ease, opacity 200ms ease",
                cursor: isAllocated && onPointClick ? "pointer" : "default",
              }}
              onClick={() => isAllocated && onPointClick?.(p.id)}
            >
              <title>
                {p.protocol} — {p.product}
                {"\n"}
                {p.category} · {p.current_apy.toFixed(2)}% APY · ${(p.tvl_usd / 1e6).toFixed(0)}M TVL
              </title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
