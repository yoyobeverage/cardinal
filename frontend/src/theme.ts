// Single source of truth for the DeFi-light palette. Pick from here in every
// component so the form, results, drawer, scatter, and ancillary components
// stay consistent. Tailwind classes (text-zinc-*, bg-zinc-*) are deprecated
// in the production UI - use inline `style={{ color: ink, background: surface }}`
// or arbitrary-value classes (`bg-[var(--bg)]`) instead.

export const BG = "#f8f5ee"; // warm cream paper
export const SURFACE = "#ffffff";
export const SURFACE_2 = "#fbf8f1"; // very subtle warm tint
export const SURFACE_3 = "#f0ebdc"; // sunken / disabled

export const BORDER = "#e6e1d3";
export const BORDER_BRIGHT = "#d4cdb8";
export const BORDER_HEAVY = "#0a1f4a"; // matches ink, for strong rules

export const INK = "#0a1f4a"; // deep navy
export const INK_2 = "#3a4a6a"; // body
export const INK_3 = "#7d8499"; // muted / hint / metadata

export const MINT = "#0d7378"; // primary accent (dark enough for cream contrast)
export const MINT_BRIGHT = "#10a3aa"; // hover / focus / brighter accent
export const MINT_BG = "#e8f4f3"; // tinted background for selected states
export const MINT_BORDER = "#0d7378";

export const DANGER = "#b91c1c";
export const DANGER_BG = "#fee2e2";

export const SANS = "Inter, system-ui, sans-serif";
export const MONO = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";

// Category color scheme for the LensScatter dots. These need to be
// distinguishable on a cream background (the dark variants from the old
// theme were tuned for zinc-950).
export const CATEGORY_COLOR_LIGHT: Record<string, string> = {
  lending: "#2563eb",
  fixed_rate: "#7c3aed",
  lst: "#0d9488",
  lrt: "#059669",
  stable_amm: "#d97706",
  volatile_amm: "#ea580c",
  options_vault: "#db2777",
  rwa_treasury: "#0891b2",
  institutional_lending: "#0284c7",
  perps_lp: "#e11d48",
  basis_trade: "#a21caf",
  yield_aggregator: "#ca8a04",
  savings_rate: "#0e7490",
  stablecoin_issuance: "#7c2d92",
};
