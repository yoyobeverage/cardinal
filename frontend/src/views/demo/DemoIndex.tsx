// Landing page at /demo - lets Nicholas pick a visual direction.

interface Variant {
  path: string;
  name: string;
  tagline: string;
  vibe: string;
  status: "round-1" | "round-2" | "round-3";
  bg: string;
  fg: string;
  accent: string;
  font: string;
  sample: string;
}

const VARIANTS: Variant[] = [
  // Round 3 (newest) - derivatives of winners Swiss + DeFi-native.
  {
    path: "/demo/swiss-dark",
    name: "Swiss-dark",
    tagline: "Swiss, inverted",
    vibe: "Same brutal asymmetric Swiss grid + oversized serif numerals, but on near-black with mint accent. Design school meets the terminal.",
    status: "round-3",
    bg: "#0a0a0a",
    fg: "#fafafa",
    accent: "#5eead4",
    font: "'Instrument Serif', serif",
    sample: "Eighty-three.",
  },
  {
    path: "/demo/defi-light",
    name: "DeFi-light",
    tagline: "DeFi-native, inverted",
    vibe: "Cream paper, deep navy ink, mint accent kept. Same lens-index card in the hero. Stripe Atlas meets Pendle.",
    status: "round-3",
    bg: "#f8f5ee",
    fg: "#0a1f4a",
    accent: "#0d7378",
    font: "Inter, system-ui, sans-serif",
    sample: "cardinal /yield",
  },
  {
    path: "/demo/hybrid",
    name: "Hybrid",
    tagline: "Swiss × DeFi marriage",
    vibe: "Swiss skeleton (asymmetric 12-col grid, oversized serif 01/02/03 numerals, heavy white rules) on the DeFi navy palette with mint glow. Lens-index card in the hero. The literal mash-up of both winners.",
    status: "round-3",
    bg: "#0a1020",
    fg: "#f0f3f8",
    accent: "#5eead4",
    font: "'Instrument Serif', serif",
    sample: "01  Capital",
  },

  // Round 2 (kept for comparison).
  {
    path: "/demo/defi",
    name: "DeFi-native",
    tagline: "Hyperliquid / Pendle feel",
    vibe: "Readable evolution of Terminal. Deep navy + mint, sans for UI, mono only for numerics. Lens-index card baked into the hero. Looks like a real top-tier DeFi product.",
    status: "round-2",
    bg: "#0e1422",
    fg: "#e6eaf2",
    accent: "#5eead4",
    font: "Inter, system-ui, sans-serif",
    sample: "cardinal /yield",
  },
  {
    path: "/demo/swiss",
    name: "Swiss",
    tagline: "Brutalist + Müller-Brockmann",
    vibe: "White paper, pure black type, burnt-orange accent. Oversized serif numerals + sans body. Asymmetric grid, heavy 3px rules. Confident and designed without being cold.",
    status: "round-2",
    bg: "#ffffff",
    fg: "#0a0a0a",
    accent: "#ff4d00",
    font: "'Instrument Serif', serif",
    sample: "Eighty-three ways.",
  },
  {
    path: "/demo/magazine",
    name: "Magazine",
    tagline: "Bloomberg Businessweek cover",
    vibe: "Navy + mustard + red, oversized italic Instrument Serif, layered editorial spread. Pull quotes, numbered features, cover headline that goes hard. Looks like a real publication.",
    status: "round-2",
    bg: "#0a1f4a",
    fg: "#fff8eb",
    accent: "#f5b833",
    font: "'Instrument Serif', serif",
    sample: "How to build.",
  },

  // Round 1 (older, kept for comparison).
  {
    path: "/demo/ft",
    name: "Editorial",
    tagline: "Financial Times article",
    vibe: "Cream paper, double-rule masthead, numbered § sections. Reads as a long-form article in a serious money paper. (Round 1 - 'too newspapery'.)",
    status: "round-1",
    bg: "#fff1e5",
    fg: "#1a1a1a",
    accent: "#990033",
    font: "'IBM Plex Serif', Georgia, serif",
    sample: "Cardinal No. 1",
  },
  {
    path: "/demo/terminal",
    name: "Terminal",
    tagline: "Bloomberg cypherpunk",
    vibe: "Pure black, JetBrains Mono, ASCII banner, Bloomberg amber, F-key shortcuts. (Round 1 - 'sick but unreadable'.)",
    status: "round-1",
    bg: "#000000",
    fg: "#ffb000",
    accent: "#00ff66",
    font: "'JetBrains Mono', Consolas, monospace",
    sample: "> CARDINAL.TERMINAL",
  },
  {
    path: "/demo/mercury",
    name: "Mercury",
    tagline: "Modern fintech / Linear",
    vibe: "Off-white cards, teal accent, generic-good SaaS app. (Round 1 - 'bad'.)",
    status: "round-1",
    bg: "#fafaf7",
    fg: "#0a0a0a",
    accent: "#0d7378",
    font: "Inter, system-ui, sans-serif",
    sample: "Build your folio",
  },
];

export default function DemoIndex() {
  const round3 = VARIANTS.filter((v) => v.status === "round-3");
  const round2 = VARIANTS.filter((v) => v.status === "round-2");
  const round1 = VARIANTS.filter((v) => v.status === "round-1");

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <a
            href="/"
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
          >
            ← back to cardinal
          </a>
          <h1 className="mt-2 text-3xl font-semibold">Pick a visual direction.</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Nine front-page mockups across three rounds. Round 3 (top) is built off your
            feedback that <span className="text-emerald-400">Swiss</span> and{" "}
            <span className="text-emerald-400">DeFi-native</span> are winning. Older rounds
            are kept below, dimmed, for reference.
          </p>
        </header>

        {/* Round 3 - latest, derivatives of winners */}
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Round 3 · variations on the winners
            </h2>
            <span className="text-xs text-zinc-500">click to preview</span>
          </div>
          <Grid variants={round3} highlight />
        </section>

        {/* Round 2 */}
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Round 2 · the originals you liked
            </h2>
          </div>
          <Grid variants={round2} highlight={false} />
        </section>

        {/* Round 1 */}
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-600">
              Round 1 · earliest attempts
            </h2>
          </div>
          <Grid variants={round1} highlight={false} />
        </section>

        <footer className="border-t border-zinc-900 pt-6 text-xs text-zinc-500">
          Previews are interactive but non-submitting. Reply with the variant name (or a
          hybrid like "Hybrid but lighter") and I'll promote the winner to <code>/</code>.
        </footer>
      </div>
    </div>
  );
}

function Grid({ variants, highlight }: { variants: Variant[]; highlight: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {variants.map((v) => (
        <a
          key={v.path}
          href={v.path}
          className={
            "group block overflow-hidden rounded-lg border transition " +
            (highlight
              ? "border-zinc-700 hover:border-emerald-500"
              : "border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100")
          }
        >
          {/* Visual preview thumbnail */}
          <div
            className="flex h-48 items-center justify-center border-b border-zinc-800 px-4 transition group-hover:brightness-110"
            style={{ background: v.bg, color: v.fg, fontFamily: v.font }}
          >
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] opacity-60">
                Cardinal · May 25
              </div>
              <div className="mt-2 text-2xl font-semibold leading-tight">{v.sample}</div>
              <div className="mt-3 inline-block border-b" style={{ borderColor: v.accent }}>
                <span className="text-xs" style={{ color: v.accent }}>
                  Start with $100,000 →
                </span>
              </div>
            </div>
          </div>
          {/* Meta */}
          <div className="space-y-2 bg-zinc-900 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-medium text-zinc-100">{v.name}</h2>
              <span className="text-xs text-zinc-500">{v.tagline}</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{v.vibe}</p>
            <div
              className={
                "pt-2 text-xs " +
                (highlight ? "text-emerald-400" : "text-zinc-500")
              }
            >
              Open preview →
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
