import { useEffect, useMemo, useState } from "react";

import {
  BORDER,
  CATEGORY_COLOR_LIGHT,
  INK,
  INK_2,
  INK_3,
  MINT,
  SURFACE_2,
} from "../theme";

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

  const presentCategories = useMemo(() => {
    const set = new Set(points.map((p) => p.category));
    return Array.from(set).sort();
  }, [points]);

  if (error) return <div style={{ color: "#b91c1c" }}>Failed to load universe: {error}</div>;
  if (points.length === 0) return <div style={{ color: INK_3 }}>Loading universe…</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed" style={{ color: INK_3 }}>
        2D UMAP projection of the{" "}
        <span style={{ color: INK }}>{LENS_LABEL_SHORT[currentLens]}</span> vector. Protocols
        that cluster together are similar in {LENS_DESCRIPTION[currentLens]}. Axes are
        unitless — only relative position matters. Click any dot for details.
      </p>

      <svg
        width="100%"
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="rounded"
        style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}
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
          const color = CATEGORY_COLOR_LIGHT[p.category] ?? INK_3;
          const baseR = isAllocated ? 8 : 4;
          const r = isHovered ? baseR + 2 : baseR;
          const baseOpacity = isAllocated ? 1 : 0.55;
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
                stroke={isAllocated ? INK : isHovered ? color : "none"}
                strokeWidth={isAllocated ? 2 : 1.5}
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: INK_2 }}>
        {presentCategories.map((cat) => (
          <div key={cat} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLOR_LIGHT[cat] ?? INK_3 }}
            />
            <span>{CATEGORY_LABEL[cat] ?? cat}</span>
          </div>
        ))}
        <div className="ml-auto inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: MINT, border: `2px solid ${INK}` }}
          />
          <span style={{ color: INK_3 }}>= in your allocation</span>
        </div>
      </div>
    </div>
  );
}
