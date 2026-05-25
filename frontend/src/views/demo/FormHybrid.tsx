// Hybrid variant. Combines Swiss skeleton (asymmetric 12-col grid, oversized
// serif section numerals, heavy rules) with DeFi-native palette (deep navy,
// mint accent, mono numerics, lens-index hero card). The literal marriage
// of the two winners.

import { useState } from "react";

const SANS = "Inter, system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
const DISPLAY = "'Instrument Serif', Georgia, serif";

const BG = "#0a1020";
const SURFACE = "#10182a";
const SURFACE_2 = "#172238";
const BORDER = "#1f2d4a";
const BORDER_BRIGHT = "#2c3e64";
const RULE_HEAVY = "#fafafa";
const INK = "#f0f3f8";
const INK_2 = "#a8b3c9";
const INK_3 = "#6b7892";
const MINT = "#5eead4";
const MINT_DIM = "#2dd4bf";
const GLOW = "rgba(94,234,212,0.18)";

export default function FormHybrid() {
  const [capital, setCapital] = useState(100_000);
  const [horizon, setHorizon] = useState(12);
  const [wrapper, setWrapper] = useState("taxable");
  const [freeform, setFreeform] = useState("");

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, fontFamily: SANS }}>
      {/* Heavy white-rule header */}
      <header className="border-b-[3px]" style={{ borderColor: RULE_HEAVY }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <a
            href="/demo"
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: INK }}
          >
            ←/ demos
          </a>
          <div className="flex items-baseline gap-3">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: MINT, boxShadow: `0 0 8px ${MINT}` }}
            />
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: INK, letterSpacing: "-0.04em" }}
            >
              Cardinal
            </span>
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: MINT }}
            >
              / yield index
            </span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em]" style={{ color: INK_3 }}>
            v1.0
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-16">
        {/* Asymmetric hero */}
        <section
          className="grid grid-cols-12 gap-6 border-b-2 pb-16"
          style={{ borderColor: RULE_HEAVY }}
        >
          <div className="col-span-12 lg:col-span-7">
            <div
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: MINT }}
            >
              ● Issue Nº 01 / Personal Allocation
            </div>
            <h1
              className="mt-6 font-bold leading-[0.9] tracking-tight"
              style={{
                color: INK,
                fontSize: "clamp(64px, 9vw, 128px)",
                letterSpacing: "-0.04em",
              }}
            >
              Eighty-three
              <br />
              ways to earn
              <br />
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: MINT,
                }}
              >
                yield.
              </span>
            </h1>
            <p
              className="mt-8 max-w-xl text-base leading-relaxed"
              style={{ color: INK_2 }}
            >
              Six named-vector indexes over a curated 83-product catalog. The LLM only
              translates your input and narrates the result. Every selection is vector
              math, and the math is open.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-5">
            {/* Lens-index card (from DeFi-native) */}
            <div
              className="rounded-none p-5"
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER_BRIGHT}`,
                backgroundImage: `linear-gradient(180deg, ${SURFACE_2}, ${SURFACE})`,
              }}
            >
              <div
                className="mb-3 flex items-center justify-between border-b pb-2 text-xs uppercase tracking-wider"
                style={{ color: INK_3, borderColor: BORDER }}
              >
                <span>Lens index</span>
                <span style={{ color: MINT }}>● live</span>
              </div>
              <div className="space-y-1.5">
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
                    className="flex items-center justify-between border px-3 py-1.5 text-xs"
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
        </section>

        {/* Numbered sections (Swiss skeleton) */}
        <NumberedSection num="01" label="Capital">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-light" style={{ color: INK_3, fontFamily: MONO }}>$</span>
            <input
              value={capital.toLocaleString()}
              onChange={(e) => setCapital(Number(e.target.value.replace(/,/g, "")) || 0)}
              className="w-full bg-transparent text-6xl font-bold outline-none sm:text-7xl"
              style={{
                color: INK,
                letterSpacing: "-0.04em",
                fontFamily: MONO,
                caretColor: MINT,
              }}
            />
          </div>
          <p className="mt-3 max-w-md text-sm" style={{ color: INK_3 }}>
            Principal you want allocated. Round numbers are fine. Minimum $1,000.
          </p>
        </NumberedSection>

        <NumberedSection num="02" label="Time horizon">
          <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-3">
              <input
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value) || 0)}
                type="number"
                className="w-full bg-transparent text-6xl font-bold outline-none sm:text-7xl"
                style={{
                  color: INK,
                  letterSpacing: "-0.04em",
                  fontFamily: MONO,
                  caretColor: MINT,
                }}
              />
            </div>
            <div className="col-span-9">
              <div className="text-sm uppercase tracking-wider" style={{ color: INK_3 }}>
                months
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full"
                style={{ background: SURFACE_2 }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${(horizon / 60) * 100}%`,
                    background: `linear-gradient(90deg, ${MINT_DIM}, ${MINT})`,
                    boxShadow: `0 0 12px ${GLOW}`,
                  }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-1 w-full opacity-0"
                style={{ accentColor: MINT }}
              />
              <div className="-mt-1 flex justify-between text-xs" style={{ color: INK_3 }}>
                <span>1</span>
                <span>30</span>
                <span>60</span>
              </div>
            </div>
          </div>
        </NumberedSection>

        <NumberedSection num="03" label="Tax wrapper">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: BORDER_BRIGHT }}>
            {[
              ["taxable", "Taxable", "Brokerage / wallet"],
              ["traditional_ira", "Trad. IRA", "Pre-tax"],
              ["roth_ira", "Roth IRA", "Post-tax"],
              ["hsa", "HSA", "Health savings"],
            ].map(([val, label, hint]) => (
              <button
                key={val}
                type="button"
                onClick={() => setWrapper(val)}
                className="p-5 text-left transition"
                style={{
                  background: wrapper === val ? MINT : SURFACE,
                  color: wrapper === val ? BG : INK,
                }}
              >
                <div className="text-xl font-bold">{label}</div>
                <div
                  className="mt-1 text-xs uppercase tracking-wider"
                  style={{
                    color: wrapper === val ? "rgba(10,16,32,0.7)" : INK_3,
                  }}
                >
                  {hint}
                </div>
              </button>
            ))}
          </div>
        </NumberedSection>

        <NumberedSection num="04" label="Anything else?">
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={4}
            placeholder="I need the money in 10 months for a house down payment. Keep it boring."
            className="w-full resize-none border-b-2 bg-transparent py-3 text-xl outline-none transition"
            style={{
              color: INK,
              borderColor: BORDER_BRIGHT,
              fontFamily: SANS,
              caretColor: MINT,
            }}
          />
          <p className="mt-2 text-xs" style={{ color: INK_3 }}>
            Translated to a structured query. Mention life events, protocols you trust or
            avoid, anything context-specific.
          </p>
        </NumberedSection>

        {/* CTA */}
        <div className="mt-8 border-t-[3px] pt-8" style={{ borderColor: RULE_HEAVY }}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-md">
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: MINT }}>
                Step 05
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>
                Run the index.
              </div>
              <div
                className="mt-1 text-sm"
                style={{ color: INK_3, fontFamily: MONO }}
              >
                p50: 2.1s · vector ops: 6 · payload filter: 4
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert("Preview only - return to / for the working form.")}
              className="px-10 py-5 text-base font-bold uppercase tracking-[0.15em] transition hover:brightness-110"
              style={{
                background: MINT,
                color: BG,
                fontFamily: SANS,
                boxShadow: `0 0 24px ${GLOW}, 0 0 4px ${MINT}`,
              }}
            >
              Generate →
            </button>
          </div>
        </div>

        <footer
          className="mt-16 flex items-center justify-between border-t pt-4 text-xs uppercase tracking-[0.2em]"
          style={{ color: INK_3, borderColor: BORDER }}
        >
          <span>Cardinal / 2026</span>
          <span style={{ color: MINT }}>Hybrid preview</span>
          <span>Qdrant Hackathon</span>
        </footer>
      </main>
    </div>
  );
}

function NumberedSection({
  num,
  label,
  children,
}: {
  num: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="grid grid-cols-12 gap-6 border-b py-12"
      style={{ borderColor: BORDER }}
    >
      <div className="col-span-12 lg:col-span-3">
        <div
          className="text-[80px] font-bold leading-none"
          style={{
            color: MINT,
            letterSpacing: "-0.05em",
            fontFamily: DISPLAY,
          }}
        >
          {num}
        </div>
        <div className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: INK_3 }}>
          {label}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-9">{children}</div>
    </section>
  );
}
