import { useEffect, useMemo, useState } from "react";

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

const CATEGORY_LABEL: Record<string, string> = {
  lending: "Lending",
  fixed_rate: "Fixed-rate",
  lst: "LST",
  lrt: "LRT",
  stable_amm: "Stable AMM",
  volatile_amm: "Volatile AMM",
  options_vault: "Options vault",
  rwa_treasury: "RWA T-bill",
  institutional_lending: "Institutional lending",
  perps_lp: "Perps LP",
  basis_trade: "Basis trade",
  yield_aggregator: "Yield aggregator",
  savings_rate: "Savings rate",
  stablecoin_issuance: "Stablecoin issuance",
};

const LENS_DESCRIPTION: Record<string, string> = {
  narrative: "their descriptions, products, and audit profiles",
  risk: "their risk profiles (drawdown, audits, custody, chain type)",
  yield_source: "where their yield comes from",
  correlation: "their macro-asset correlations (BTC, ETH, SPX, IEF, …)",
  tax_treatment: "how their yield is taxed",
  composability: "which downstream protocols accept their receipt tokens",
};

const LENS_LABEL_SHORT: Record<string, string> = {
  narrative: "narrative",
  risk: "risk",
  yield_source: "yield-source",
  correlation: "correlation",
  tax_treatment: "tax-treatment",
  composability: "composability",
};

export default function LensScatter({ currentLens, allocatedIds, onPointClick }: Props) {
  const [points, setPoints] = useState<UniversePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/universe`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then(setPoints)
      .catch((e) => setError(String(e)));
  }, []);

  // Distinct categories present in the catalog — drives the legend.
  const presentCategories = useMemo(() => {
    const set = new Set(points.map((p) => p.category));
    return Array.from(set).sort();
  }, [points]);

  if (error) return <div className="text-red-400">Failed to load universe: {error}</div>;
  if (points.length === 0) return <div className="text-zinc-500">Loading universe…</div>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        2D UMAP projection of the <span className="text-zinc-300">{LENS_LABEL_SHORT[currentLens]}</span> vector.
        Protocols that cluster together are similar in {LENS_DESCRIPTION[currentLens]}. Axes themselves are unitless —
        only relative position matters. Click any dot for details.
      </p>

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
          const isHovered = hoveredId === p.id;
          const color = CATEGORY_COLOR[p.category] ?? "#71717a";
          const baseR = isAllocated ? 8 : 4;
          const r = isHovered ? baseR + 2 : baseR;
          const baseOpacity = isAllocated ? 1 : 0.5;
          return (
            <g
              key={p.id}
              style={{
                transform: `translate(${cx}px, ${cy}px)`,
                transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <circle
                r={r}
                fill={color}
                stroke={isAllocated || isHovered ? "#fafafa" : "none"}
                strokeWidth={1.5}
                opacity={isHovered ? 1 : baseOpacity}
                style={{
                  transition: "r 150ms ease, opacity 150ms ease",
                  cursor: onPointClick ? "pointer" : "default",
                }}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onPointClick?.(p.id)}
              >
                <title>
                  {p.protocol} — {p.product}
                  {"\n"}
                  {CATEGORY_LABEL[p.category] ?? p.category} · {p.current_apy.toFixed(2)}% APY · ${(p.tvl_usd / 1e6).toFixed(0)}M TVL
                  {"\n"}
                  {isAllocated ? "(in your allocation — click for drilldown)" : "(click to inspect)"}
                </title>
              </circle>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
        {presentCategories.map((cat) => (
          <div key={cat} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLOR[cat] ?? "#71717a" }}
            />
            <span>{CATEGORY_LABEL[cat] ?? cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
