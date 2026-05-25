// Landing page at /demo - lets Nicholas pick a visual direction.

interface Variant {
  path: string;
  name: string;
  tagline: string;
  vibe: string;
  bg: string;
  fg: string;
  accent: string;
  font: string;
  sample: string;
}

const VARIANTS: Variant[] = [
  {
    path: "/demo/ft",
    name: "Editorial",
    tagline: "Financial Times feel",
    vibe: "Cream paper, serif headlines, wine-red accent. Reads like an article in a respected money paper.",
    bg: "#fff1e5",
    fg: "#1a1a1a",
    accent: "#990033",
    font: "'IBM Plex Serif', Georgia, serif",
    sample: "Cardinal No. 1",
  },
  {
    path: "/demo/terminal",
    name: "Terminal",
    tagline: "Bloomberg / DeFi-native",
    vibe: "Pure black, amber monospace, ASCII borders. For users who already live in a CLI.",
    bg: "#000000",
    fg: "#ffb000",
    accent: "#00ff66",
    font: "'JetBrains Mono', Consolas, monospace",
    sample: "> CARDINAL.TERMINAL",
  },
  {
    path: "/demo/mercury",
    name: "Mercury",
    tagline: "Modern fintech, Linear-style",
    vibe: "Off-white, large rounded cards, muted teal accent. The 'just a really good startup app' aesthetic.",
    bg: "#fafaf7",
    fg: "#0a0a0a",
    accent: "#0d7378",
    font: "Inter, system-ui, sans-serif",
    sample: "Build your folio",
  },
];

export default function DemoIndex() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <a
            href="/"
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
          >
            ← back to cardinal
          </a>
          <h1 className="mt-2 text-3xl font-semibold">Pick a visual direction.</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Three alternate front-page designs. The current production form leans on Tailwind's
            stock zinc + emerald palette (a.k.a. "Claudy"). Each preview below is a different
            answer to "what should this look like instead?" Click through to interact with each.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VARIANTS.map((v) => (
            <a
              key={v.path}
              href={v.path}
              className="group block overflow-hidden rounded-lg border border-zinc-800 transition hover:border-zinc-600"
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
                <div className="pt-2 text-xs text-emerald-400 group-hover:text-emerald-300">
                  Open preview →
                </div>
              </div>
            </a>
          ))}
        </div>

        <footer className="mt-10 border-t border-zinc-900 pt-6 text-xs text-zinc-500">
          Previews are interactive but non-submitting. Reply with the variant name and I'll
          promote it to the live form.
        </footer>
      </div>
    </div>
  );
}
