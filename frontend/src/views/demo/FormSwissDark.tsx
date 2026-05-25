// Swiss-dark variant. Same brutal asymmetric Swiss grid + oversized serif
// numerals, but inverted to a near-black background with mint accent.
// Cypherpunk-Swiss hybrid - design school meets the terminal.

import { useState } from "react";

const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const DISPLAY = "'Instrument Serif', Georgia, serif";

const BG = "#0a0a0a";
const INK = "#fafafa";
const INK_2 = "#bfbfbf";
const INK_3 = "#737373";
const RULE = "#fafafa";
const RULE_LIGHT = "#262626";
const ACCENT = "#5eead4"; // mint, ties to DeFi-native
const ACCENT_2 = "#9da3b0";

export default function FormSwissDark() {
  const [capital, setCapital] = useState(100_000);
  const [horizon, setHorizon] = useState(12);
  const [wrapper, setWrapper] = useState("taxable");
  const [freeform, setFreeform] = useState("");

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, fontFamily: SANS }}>
      {/* Heavy rule header */}
      <header className="border-b-[3px]" style={{ borderColor: RULE }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <a
            href="/demo"
            className="text-xs font-bold uppercase tracking-[0.2em] transition"
            style={{ color: INK }}
          >
            ←/ demos
          </a>
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: INK, letterSpacing: "-0.04em" }}
            >
              Cardinal
            </span>
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              / yield index
            </span>
          </div>
          <div
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: INK_3 }}
          >
            v1.0
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-16">
        {/* Asymmetric hero grid */}
        <section
          className="grid grid-cols-12 gap-6 border-b-2 pb-16"
          style={{ borderColor: RULE }}
        >
          <div className="col-span-12 lg:col-span-7">
            <div
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: ACCENT }}
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
                  color: ACCENT,
                }}
              >
                yield.
              </span>
            </h1>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="lg:pt-10">
              <p
                className="text-lg leading-snug"
                style={{ color: INK_2 }}
              >
                We rank them across six similarity lenses, then assemble the eight that
                fit your situation. The math is open. The catalog is curated. The LLM is
                kept on a short leash.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t-2 pt-4" style={{ borderColor: RULE }}>
                <BigStat n="83" label="Protocols" />
                <BigStat n="6" label="Vector lenses" />
                <BigStat n="2" label="Optimizers" />
              </div>
            </div>
          </div>
        </section>

        <NumberedSection num="01" label="Capital">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-light" style={{ color: INK_3 }}>$</span>
            <input
              value={capital.toLocaleString()}
              onChange={(e) => setCapital(Number(e.target.value.replace(/,/g, "")) || 0)}
              className="w-full bg-transparent text-6xl font-bold outline-none sm:text-7xl"
              style={{ color: INK, letterSpacing: "-0.04em", caretColor: ACCENT }}
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
                style={{ color: INK, letterSpacing: "-0.04em", caretColor: ACCENT }}
              />
            </div>
            <div className="col-span-9">
              <div className="text-sm uppercase tracking-wider" style={{ color: INK_3 }}>
                months
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="mt-3 w-full"
                style={{ accentColor: ACCENT }}
              />
              <div className="mt-1 flex justify-between text-xs" style={{ color: INK_3 }}>
                <span>1</span>
                <span>30</span>
                <span>60</span>
              </div>
            </div>
          </div>
        </NumberedSection>

        <NumberedSection num="03" label="Tax wrapper">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: RULE }}>
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
                  background: wrapper === val ? INK : BG,
                  color: wrapper === val ? BG : INK,
                }}
              >
                <div className="text-xl font-bold">{label}</div>
                <div
                  className="mt-1 text-xs uppercase tracking-wider"
                  style={{
                    color: wrapper === val ? "rgba(10,10,10,0.6)" : INK_3,
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
            style={{ color: INK, borderColor: RULE_LIGHT, fontFamily: SANS, caretColor: ACCENT }}
          />
          <p className="mt-2 text-xs" style={{ color: INK_3 }}>
            Translated to a structured query. Mention life events, protocols you trust or
            avoid, anything context-specific.
          </p>
        </NumberedSection>

        {/* CTA */}
        <div className="mt-8 border-t-[3px] pt-8" style={{ borderColor: RULE }}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-md">
              <div
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: ACCENT }}
              >
                Step 05
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>
                Run the index.
              </div>
              <div className="mt-1 text-sm" style={{ color: INK_3 }}>
                Six lens queries, RRF fusion, optimizer pass, narration. About three seconds.
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert("Preview only - return to / for the working form.")}
              className="px-10 py-5 text-base font-bold uppercase tracking-[0.15em] transition hover:brightness-110"
              style={{
                background: ACCENT,
                color: BG,
                fontFamily: SANS,
                boxShadow: `0 0 32px rgba(94,234,212,0.25)`,
              }}
            >
              Generate →
            </button>
          </div>
        </div>

        <footer
          className="mt-16 flex items-center justify-between border-t pt-4 text-xs uppercase tracking-[0.2em]"
          style={{ color: INK_3, borderColor: RULE_LIGHT }}
        >
          <span>Cardinal / 2026</span>
          <span style={{ color: ACCENT_2 }}>Swiss-dark preview</span>
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
      className="grid grid-cols-12 gap-6 border-b-[1px] py-12"
      style={{ borderColor: RULE_LIGHT }}
    >
      <div className="col-span-12 lg:col-span-3">
        <div
          className="text-[80px] font-bold leading-none"
          style={{
            color: ACCENT,
            letterSpacing: "-0.05em",
            fontFamily: DISPLAY,
          }}
        >
          {num}
        </div>
        <div
          className="mt-2 text-xs uppercase tracking-[0.2em]"
          style={{ color: INK_3 }}
        >
          {label}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-9">{children}</div>
    </section>
  );
}

function BigStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div
        className="text-3xl font-bold leading-none"
        style={{ color: INK, letterSpacing: "-0.02em" }}
      >
        {n}
      </div>
      <div
        className="mt-1 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: INK_3 }}
      >
        {label}
      </div>
    </div>
  );
}
