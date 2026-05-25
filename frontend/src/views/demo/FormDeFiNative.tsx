// DeFi-native variant. Hyperliquid / Pendle / actual top-tier DeFi UI feel.
// Keeps the cypherpunk legitimacy of Terminal but readable - sans for UI text,
// mono only for numerics, deep navy + mint instead of all-black amber.

import { useState } from "react";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";

const BG = "#080c14";
const SURFACE = "#0e1422";
const SURFACE_2 = "#141d30";
const BORDER = "#1c2741";
const BORDER_BRIGHT = "#243456";
const INK = "#e6eaf2";
const INK_2 = "#9ba6bd";
const INK_3 = "#5e6982";
const MINT = "#5eead4";
const MINT_DIM = "#2dd4bf";
const GLOW = "rgba(94,234,212,0.15)";

export default function FormDeFiNative() {
  const [capital, setCapital] = useState("100000");
  const [horizon, setHorizon] = useState(12);
  const [wrapper, setWrapper] = useState("taxable");
  const [freeform, setFreeform] = useState("");

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, fontFamily: SANS }}>
      {/* Top nav */}
      <header
        className="border-b"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <a
              href="/demo"
              className="text-xs transition hover:text-white"
              style={{ color: INK_3 }}
            >
              ← demos
            </a>
            <div className="h-4 w-px" style={{ background: BORDER }} />
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: MINT, boxShadow: `0 0 8px ${MINT}` }}
              />
              <span className="text-sm font-semibold" style={{ color: INK }}>
                cardinal
              </span>
              <span className="text-xs" style={{ color: INK_3 }}>
                / yield-discovery
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-xs sm:flex" style={{ color: INK_2 }}>
            <Stat n="83" label="protocols" />
            <Stat n="6" label="vector lenses" />
            <Stat n="$2.4B" label="addressable TVL" />
            <span
              className="rounded-full border px-2 py-0.5 font-medium"
              style={{ borderColor: MINT, color: MINT }}
            >
              ● live
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: BORDER_BRIGHT, color: INK_2 }}
            >
              <span className="font-mono" style={{ color: MINT }}>v1.0</span>
              <span>·</span>
              <span>Qdrant Hackathon 2026</span>
            </div>
            <h1
              className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ color: INK, letterSpacing: "-0.03em" }}
            >
              Yield discovery,{" "}
              <span style={{ color: MINT }}>
                without the
                <br />
                hallucinations
              </span>
              .
            </h1>
            <p
              className="mt-5 max-w-xl text-base leading-relaxed"
              style={{ color: INK_2 }}
            >
              Six named-vector indexes over an 83-product catalog (DeFi lending,
              liquid-staking, RWA T-bills). The LLM only translates your input and
              narrates the result. Every selection is vector math.
            </p>
          </div>

          {/* Live data card */}
          <div
            className="rounded-md p-5"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              backgroundImage: `linear-gradient(180deg, ${SURFACE_2}, ${SURFACE})`,
            }}
          >
            <div
              className="mb-3 flex items-center justify-between text-xs"
              style={{ color: INK_3 }}
            >
              <span>Lens index</span>
              <span style={{ color: MINT }}>● synced 2s ago</span>
            </div>
            <div className="space-y-2">
              {[
                ["narrative", 1024, "cosine"],
                ["risk", 32, "euclid"],
                ["yield_source", 16, "cosine"],
                ["correlation", 8, "cosine"],
                ["tax_treatment", 12, "cosine"],
                ["composability", 64, "dot"],
              ].map(([lens, dim, metric]) => (
                <div
                  key={lens}
                  className="flex items-center justify-between rounded border px-3 py-1.5 text-xs"
                  style={{ borderColor: BORDER, background: SURFACE_2, fontFamily: MONO }}
                >
                  <span style={{ color: INK }}>{lens}</span>
                  <span style={{ color: INK_3 }}>
                    <span style={{ color: MINT_DIM }}>{dim}d</span> · {metric}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personas */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: INK_3 }}>
            quick start →
          </span>
          {[
            ["House-buyer", "$100k · 12mo"],
            ["Retiree", "$500k IRA"],
            ["Degen", "$10k · 6mo"],
          ].map(([name, desc]) => (
            <button
              key={name}
              type="button"
              className="rounded border px-3 py-1.5 text-sm transition hover:border-current"
              style={{ borderColor: BORDER_BRIGHT, color: INK }}
            >
              <span className="font-medium">{name}</span>
              <span className="ml-2 font-mono text-xs" style={{ color: INK_3 }}>
                {desc}
              </span>
            </button>
          ))}
        </div>

        {/* Main form grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Capital" hint="USD principal you want allocated">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl" style={{ color: INK_3, fontFamily: MONO }}>$</span>
              <input
                value={Number(capital || 0).toLocaleString()}
                onChange={(e) => setCapital(e.target.value.replace(/,/g, ""))}
                className="w-full bg-transparent text-4xl font-semibold outline-none"
                style={{ color: INK, fontFamily: MONO, letterSpacing: "-0.02em" }}
              />
            </div>
          </Card>

          <Card title="Horizon" hint="Months you plan to hold before needing the funds">
            <div className="flex items-baseline justify-between">
              <input
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value) || 0)}
                type="number"
                className="w-24 bg-transparent text-4xl font-semibold outline-none"
                style={{ color: INK, fontFamily: MONO, letterSpacing: "-0.02em" }}
              />
              <span className="text-sm" style={{ color: INK_3 }}>months</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: SURFACE_2 }}>
              <div
                className="h-full"
                style={{
                  width: `${(horizon / 60) * 100}%`,
                  background: `linear-gradient(90deg, ${MINT_DIM}, ${MINT})`,
                  boxShadow: `0 0 12px ${GLOW}`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs" style={{ color: INK_3 }}>
              <span>1mo</span>
              <span>60mo</span>
            </div>
          </Card>

          <Card title="Account" hint="Tax wrapper determines which yields are optimal for you" full>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["taxable", "Taxable"],
                ["traditional_ira", "Trad IRA"],
                ["roth_ira", "Roth IRA"],
                ["hsa", "HSA"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWrapper(val)}
                  className="rounded px-3 py-2.5 text-sm transition"
                  style={{
                    background: wrapper === val ? GLOW : SURFACE_2,
                    border: `1px solid ${wrapper === val ? MINT : BORDER}`,
                    color: wrapper === val ? MINT : INK,
                    fontFamily: SANS,
                    fontWeight: wrapper === val ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <Card
            title="Safety floors"
            hint="Hard filters — protocols below these are excluded entirely"
            full
          >
            <div className="grid grid-cols-3 gap-2 text-xs">
              <SafetyChip label="audits ≥" value="2" />
              <SafetyChip label="TVL ≥" value="$5M" />
              <SafetyChip label="lockup ≤" value="any" />
            </div>
            <button
              type="button"
              className="mt-3 text-xs transition hover:text-white"
              style={{ color: MINT_DIM }}
            >
              + advanced (chains, oracle diversity, custody type)
            </button>
          </Card>

          <Card title="Freeform" hint="Plain English. Translated to a structured query." full>
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={3}
              placeholder="need the money in 10 months for a house down payment. keep it boring."
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:italic"
              style={{ color: INK, fontFamily: SANS, caretColor: MINT }}
            />
          </Card>
        </div>

        {/* CTA */}
        <div
          className="mt-8 flex items-center justify-between rounded-md p-5"
          style={{
            background: `linear-gradient(135deg, ${SURFACE_2}, ${SURFACE})`,
            border: `1px solid ${BORDER_BRIGHT}`,
          }}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: INK }}>
              Ready to query the index.
            </div>
            <div className="mt-0.5 text-xs" style={{ color: INK_3, fontFamily: MONO }}>
              estimated p50 latency: 2.1s · vector ops: 6 · payload filter: 4
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("Preview only — return to / for the working form.")}
            className="rounded px-5 py-2.5 text-sm font-semibold transition hover:brightness-110"
            style={{
              background: MINT,
              color: BG,
              boxShadow: `0 0 24px ${GLOW}, 0 0 4px ${MINT}`,
            }}
          >
            Run allocation →
          </button>
        </div>

        <footer
          className="mt-12 border-t pt-6 text-center text-xs"
          style={{ borderColor: BORDER, color: INK_3 }}
        >
          DeFi-native preview · Cardinal · Qdrant Hackathon 2026
        </footer>
      </main>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
  full,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <section
      className={"rounded-md p-5 " + (full ? "lg:col-span-2" : "")}
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: INK_2 }}>
          {title}
        </h3>
        <span className="text-xs" style={{ color: INK_3 }}>
          {hint}
        </span>
      </div>
      {children}
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <span>
      <span className="font-semibold" style={{ color: INK, fontFamily: MONO }}>
        {n}
      </span>{" "}
      <span style={{ color: INK_3 }}>{label}</span>
    </span>
  );
}

function SafetyChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded border px-3 py-2"
      style={{ borderColor: BORDER, background: SURFACE_2 }}
    >
      <div className="text-xs" style={{ color: INK_3 }}>
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold" style={{ color: INK, fontFamily: MONO }}>
        {value}
      </div>
    </div>
  );
}
