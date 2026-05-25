// Magazine-cover variant. Bold color blocks, oversized condensed display
// type, layered editorial layout. Inspired by Bloomberg Businessweek covers,
// New York Magazine, WIRED. Hard to ignore.

import { useState } from "react";

const SANS = "Inter, 'Helvetica Neue', sans-serif";
const DISPLAY = "'Instrument Serif', 'Times New Roman', serif";

const CREAM = "#f5f0e6";
const NAVY = "#0a1f4a";
const NAVY_2 = "#162d5d";
const MUSTARD = "#f5b833";
const RED = "#dc2626";
const INK = "#0a0a0a";
const INK_2 = "#3a3a3a";
const PAPER = "#fff8eb";

export default function FormMagazine() {
  const [capital, setCapital] = useState(100_000);
  const [horizon, setHorizon] = useState(12);
  const [wrapper, setWrapper] = useState("taxable");
  const [freeform, setFreeform] = useState("");

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: INK, fontFamily: SANS }}>
      {/* Magazine cover hero */}
      <header
        className="relative overflow-hidden"
        style={{ background: NAVY, color: PAPER, minHeight: "55vh" }}
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between border-b px-6 py-3" style={{ borderColor: NAVY_2 }}>
          <a
            href="/demo"
            className="text-xs font-bold uppercase tracking-[0.2em] transition hover:opacity-100"
            style={{ color: MUSTARD }}
          >
            ← demos
          </a>
          <div className="flex items-baseline gap-3">
            <span
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: PAPER, opacity: 0.6 }}
            >
              Issue 01 / May 2026 / $0
            </span>
          </div>
          <span
            className="rounded-full px-3 py-0.5 text-xs font-bold"
            style={{ background: RED, color: PAPER }}
          >
            SPECIAL ISSUE
          </span>
        </div>

        {/* Big yellow circle - magazine cover energy */}
        <div
          className="absolute -right-32 -top-32 z-0 h-[500px] w-[500px] rounded-full"
          style={{ background: MUSTARD, opacity: 0.95 }}
        />
        <div
          className="absolute right-20 top-20 z-0 h-32 w-32 rounded-full"
          style={{ background: RED }}
        />

        {/* Cover content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 sm:py-20">
          <div
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: MUSTARD }}
          >
            CARDINAL
          </div>
          <h1
            className="mt-3 font-bold leading-[0.85] tracking-tight"
            style={{
              color: PAPER,
              fontSize: "clamp(56px, 11vw, 160px)",
              fontFamily: DISPLAY,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            How to build
            <br />
            a portfolio
            <br />
            <em style={{ color: MUSTARD }}>without</em>
            <br />
            asking a
            <br />
            <span
              className="inline-block px-3"
              style={{ background: RED, color: PAPER, fontFamily: DISPLAY, fontStyle: "italic" }}
            >
              chatbot.
            </span>
          </h1>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: PAPER }}>
            <CoverBlurb num="01" text="Vectors over LLMs" />
            <CoverBlurb num="02" text="83 yield products, 6 lenses" />
            <CoverBlurb num="03" text="The math is on page 4" />
          </div>
        </div>
      </header>

      {/* Body - flat magazine spread */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Section header in magazine style */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: RED }}
            >
              The Brief
            </div>
            <h2
              className="mt-1 font-bold leading-tight"
              style={{
                color: NAVY,
                fontSize: "clamp(40px, 6vw, 80px)",
                fontFamily: DISPLAY,
                fontWeight: 400,
                letterSpacing: "-0.025em",
              }}
            >
              Tell us about <em>you.</em>
            </h2>
          </div>
          <div className="hidden text-right text-xs lg:block" style={{ color: INK_2 }}>
            <div className="uppercase tracking-[0.2em]">By Cardinal Staff</div>
            <div className="mt-1" style={{ color: MUSTARD }}>page 02 of 04</div>
          </div>
        </div>

        {/* Magazine columns */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Capital */}
          <Article num="A" title="The capital" color={NAVY}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light" style={{ color: NAVY, opacity: 0.5 }}>
                $
              </span>
              <input
                value={capital.toLocaleString()}
                onChange={(e) =>
                  setCapital(Number(e.target.value.replace(/,/g, "")) || 0)
                }
                className="w-full bg-transparent text-5xl font-bold outline-none"
                style={{
                  color: NAVY,
                  fontFamily: DISPLAY,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: INK_2 }}>
              The figure you intend to commit. Round numbers welcome. Below $1,000 the
              allocation thins out; above $500,000 a private banker is, frankly, a better
              call than a vector index.
            </p>
          </Article>

          {/* Horizon */}
          <Article num="B" title="The horizon" color={RED}>
            <div className="flex items-baseline gap-3">
              <input
                type="number"
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value) || 0)}
                className="w-24 bg-transparent text-5xl font-bold outline-none"
                style={{
                  color: NAVY,
                  fontFamily: DISPLAY,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              />
              <span className="text-base uppercase tracking-wider" style={{ color: INK_2 }}>
                months
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="mt-3 w-full"
              style={{ accentColor: RED }}
            />
            <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_2 }}>
              Twelve months says "let's not lock anything up for a year." Sixty says "I
              can afford illiquidity." Set it honestly.
            </p>
          </Article>
        </div>

        {/* Tax wrapper as featured spread */}
        <section
          className="mt-12 p-6 sm:p-10"
          style={{ background: PAPER, border: `2px solid ${NAVY}` }}
        >
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <div
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: RED }}
              >
                Feature C
              </div>
              <h3
                className="mt-1 text-3xl font-bold"
                style={{
                  color: NAVY,
                  fontFamily: DISPLAY,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              >
                Where will it live?
              </h3>
            </div>
            <div className="hidden text-xs sm:block" style={{ color: INK_2 }}>
              Account type
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["taxable", "Taxable", "Brokerage"],
              ["traditional_ira", "Trad. IRA", "Pre-tax"],
              ["roth_ira", "Roth IRA", "Post-tax"],
              ["hsa", "HSA", "Health"],
            ].map(([val, label, hint]) => (
              <button
                key={val}
                type="button"
                onClick={() => setWrapper(val)}
                className="p-4 text-left transition"
                style={{
                  background: wrapper === val ? NAVY : CREAM,
                  color: wrapper === val ? PAPER : INK,
                  border: `2px solid ${wrapper === val ? NAVY : NAVY_2}`,
                }}
              >
                <div
                  className="text-xl font-bold"
                  style={{ fontFamily: DISPLAY, fontWeight: 400, letterSpacing: "-0.02em" }}
                >
                  {label}
                </div>
                <div
                  className="mt-0.5 text-xs uppercase tracking-wider"
                  style={{
                    color: wrapper === val ? MUSTARD : INK_2,
                  }}
                >
                  {hint}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: INK_2 }}>
            We tilt the allocation toward tax-optimal yields for your wrapper: ordinary-income
            products like lending and T-bills into IRAs and HSAs; qualified-dividend and
            capital-gain treatments into taxable.
          </p>
        </section>

        {/* Pull quote */}
        <blockquote
          className="mx-auto my-16 max-w-2xl text-center"
          style={{ color: NAVY }}
        >
          <span
            className="block text-7xl leading-none"
            style={{ color: MUSTARD, fontFamily: DISPLAY }}
          >
            "
          </span>
          <p
            className="mt-2 text-3xl leading-tight"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            The point isn't that vectors are smart. The point is that they don't
            <em style={{ color: RED }}> lie</em>.
          </p>
          <footer className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: INK_2 }}>
            From the editor
          </footer>
        </blockquote>

        {/* Freeform */}
        <Article num="D" title="In your own words" color={NAVY}>
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={3}
            placeholder="I need the money in 10 months for a house down payment. Keep it boring."
            className="w-full resize-none bg-transparent text-lg outline-none placeholder:italic"
            style={{
              color: INK,
              borderBottom: `2px solid ${NAVY}`,
              fontFamily: DISPLAY,
              fontWeight: 400,
            }}
          />
          <p className="mt-3 text-sm" style={{ color: INK_2 }}>
            Optional. We translate the sentence into a structured query.
          </p>
        </Article>

        {/* CTA - subscribe-style */}
        <div
          className="mt-16 flex flex-col items-center justify-between gap-6 p-8 text-center sm:flex-row sm:text-left"
          style={{ background: NAVY, color: PAPER }}
        >
          <div>
            <div
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: MUSTARD }}
            >
              Ready?
            </div>
            <div
              className="mt-1 text-3xl font-bold leading-tight"
              style={{ fontFamily: DISPLAY, fontWeight: 400, letterSpacing: "-0.02em" }}
            >
              Send me my allocation.
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("Preview only - return to / for the working form.")}
            className="px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition hover:brightness-110"
            style={{ background: MUSTARD, color: NAVY }}
          >
            Generate →
          </button>
        </div>

        <footer
          className="mt-12 flex items-center justify-between text-xs uppercase tracking-[0.2em]"
          style={{ color: INK_2 }}
        >
          <span>Cardinal · Issue 01 · May 2026</span>
          <span style={{ color: RED }}>Magazine preview</span>
          <span>Qdrant Hackathon</span>
        </footer>
      </main>
    </div>
  );
}

function CoverBlurb({ num, text }: { num: string; text: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: MUSTARD }}
      >
        {num} ·
      </span>
      <span style={{ fontFamily: DISPLAY, fontSize: "18px", fontStyle: "italic" }}>{text}</span>
    </span>
  );
}

function Article({
  num,
  title,
  color,
  children,
}: {
  num: string;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <div className="mb-3 flex items-baseline gap-3 border-b-2 pb-2" style={{ borderColor: color }}>
        <span
          className="text-xs font-bold uppercase tracking-[0.25em]"
          style={{ color }}
        >
          {num}.
        </span>
        <h3
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {title}
        </h3>
      </div>
      {children}
    </article>
  );
}
