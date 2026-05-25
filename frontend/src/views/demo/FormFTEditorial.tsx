// Editorial/FT-style variant. Cream paper, serif headlines, wine-red accent.
// Reads like a long-form article in a respected financial paper.

import { useState } from "react";

const SERIF = "'IBM Plex Serif', Georgia, 'Times New Roman', serif";
const DISPLAY = "'Instrument Serif', 'IBM Plex Serif', Georgia, serif";
const SANS = "Inter, system-ui, sans-serif";

const BG = "#fff1e5"; // FT salmon
const INK = "#1a1a1a";
const MUTED = "#5f5f5f";
const RULE = "#d6c8b8";
const ACCENT = "#990033"; // wine
const ACCENT_DARK = "#660022";

export default function FormFTEditorial() {
  const [capital, setCapital] = useState("100,000");
  const [horizon, setHorizon] = useState("12");
  const [wrapper, setWrapper] = useState("taxable");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [freeform, setFreeform] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, fontFamily: SERIF }}>
      {/* Masthead */}
      <header
        className="border-b-4 px-6 py-5"
        style={{ borderColor: INK, borderBottomStyle: "double" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <a
            href="/demo"
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: ACCENT, fontFamily: SANS }}
          >
            ← back to demos
          </a>
          <div className="text-center">
            <div
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: MUTED, fontFamily: SANS }}
            >
              Vol. 1 · No. 1
            </div>
            <h1
              className="text-4xl font-bold leading-none"
              style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}
            >
              Cardinal
            </h1>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
              style={{ color: MUTED, fontFamily: SANS }}
            >
              {today} · $ U.S. Edition
            </div>
          </div>
          <div className="w-32 text-right text-xs" style={{ color: MUTED, fontFamily: SANS }}>
            yield discovery
          </div>
        </div>
      </header>

      {/* Article body */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Lede */}
        <div className="text-center">
          <div
            className="text-xs uppercase tracking-[0.25em]"
            style={{ color: ACCENT, fontFamily: SANS }}
          >
            Portfolio Construction · Special Report
          </div>
          <h2
            className="mt-3 text-5xl font-bold leading-[1.05]"
            style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}
          >
            A folio for the new <em>market</em>.
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: MUTED, fontFamily: SERIF }}
          >
            Tell us about your situation. We will run it through a curated catalogue of 83
            yield-bearing instruments — DeFi lending, liquid-staking, tokenised Treasury bills
            and the like — and return a diversified allocation that fits.
          </p>
          <div
            className="mx-auto mt-6 h-px w-24"
            style={{ background: INK }}
          />
        </div>

        {/* Steps as numbered article footnotes */}
        <ol className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["I.", "You describe yourself", "Capital, horizon, risk appetite."],
            ["II.", "Our system translates", "Plain language becomes a precise query."],
            ["III.", "You receive an allocation", "Eight protocols, weighted, explained."],
          ].map(([num, title, desc]) => (
            <li key={num} className="text-center">
              <div
                className="text-3xl"
                style={{ color: ACCENT, fontFamily: DISPLAY }}
              >
                {num}
              </div>
              <div className="mt-1 text-sm font-medium">{title}</div>
              <div className="mt-1 text-xs leading-snug" style={{ color: MUTED }}>
                {desc}
              </div>
            </li>
          ))}
        </ol>

        <hr className="my-12" style={{ borderColor: RULE }} />

        {/* Form sections */}
        <Section number="§ 1" title="The investment">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Capital" suffix="USD">
              <input
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="w-full bg-transparent text-2xl outline-none"
                style={{ fontFamily: DISPLAY, color: INK, borderBottom: `1px solid ${INK}` }}
              />
              <Helper>Round figures welcome. The minimum useful size is roughly $1,000.</Helper>
            </Field>
            <Field label="Horizon" suffix="months">
              <input
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="w-full bg-transparent text-2xl outline-none"
                style={{ fontFamily: DISPLAY, color: INK, borderBottom: `1px solid ${INK}` }}
              />
              <Helper>How long you plan to hold these positions before needing the money back.</Helper>
            </Field>
          </div>
        </Section>

        <Section number="§ 2" title="The account">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                className="border px-3 py-3 text-left transition"
                style={{
                  borderColor: wrapper === val ? INK : RULE,
                  background: wrapper === val ? INK : "transparent",
                  color: wrapper === val ? BG : INK,
                  fontFamily: SERIF,
                }}
              >
                <div className="text-sm font-semibold">{label}</div>
                <div
                  className="mt-0.5 text-[10px] uppercase tracking-wider"
                  style={{
                    color: wrapper === val ? "rgba(255,241,229,0.7)" : MUTED,
                    fontFamily: SANS,
                  }}
                >
                  {hint}
                </div>
              </button>
            ))}
          </div>
          <Helper>
            The account type determines which yields are tax-optimal for you. We will tilt the
            allocation accordingly.
          </Helper>
        </Section>

        <Section number="§ 3" title="Safety filters">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex w-full items-center justify-between border-b py-2 text-left"
            style={{ borderColor: RULE, fontFamily: SANS }}
          >
            <span className="text-sm" style={{ color: MUTED }}>
              {advancedOpen ? "Collapse" : "Expand"} — audits, protocol size, lockup, chains
            </span>
            <span style={{ color: ACCENT }}>{advancedOpen ? "−" : "+"}</span>
          </button>
          {advancedOpen && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Min. audits">
                <input
                  defaultValue="2"
                  className="w-full bg-transparent text-lg outline-none"
                  style={{ fontFamily: DISPLAY, borderBottom: `1px solid ${INK}` }}
                />
                <Helper>0 = no minimum. 3+ for conservative.</Helper>
              </Field>
              <Field label="Min. TVL">
                <input
                  defaultValue="5,000,000"
                  className="w-full bg-transparent text-lg outline-none"
                  style={{ fontFamily: DISPLAY, borderBottom: `1px solid ${INK}` }}
                />
                <Helper>Total assets locked in the protocol, in USD.</Helper>
              </Field>
              <Field label="Max lockup (days)">
                <input
                  placeholder="any"
                  className="w-full bg-transparent text-lg outline-none"
                  style={{ fontFamily: DISPLAY, borderBottom: `1px solid ${INK}` }}
                />
                <Helper>Blank for no maximum.</Helper>
              </Field>
            </div>
          )}
        </Section>

        <Section number="§ 4" title="In your own words">
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={4}
            placeholder="I need the money in 10 months for a house down payment. Keep it boring."
            className="w-full border bg-transparent p-3 text-base outline-none"
            style={{ borderColor: RULE, color: INK, fontFamily: SERIF }}
          />
          <Helper>
            Mention life events, protocols you trust or distrust, or anything else context-specific.
            Our translator turns the sentence into a query.
          </Helper>
        </Section>

        {/* Pull quote / CTA */}
        <div className="mt-12 border-y-2 py-8 text-center" style={{ borderColor: INK }}>
          <button
            type="button"
            onClick={() =>
              alert("Preview only - return to / for the working form.")
            }
            className="px-8 py-3 text-base font-semibold uppercase tracking-[0.15em] transition hover:brightness-110"
            style={{ background: INK, color: BG, fontFamily: SANS }}
          >
            Generate allocation
          </button>
          <div
            className="mt-3 text-xs italic"
            style={{ color: MUTED, fontFamily: SERIF }}
          >
            "Vectors do not hallucinate." — Cardinal editorial
          </div>
        </div>

        <footer
          className="mt-12 text-center text-[10px] uppercase tracking-[0.25em]"
          style={{ color: MUTED, fontFamily: SANS }}
        >
          Cardinal · Qdrant Hackathon 2026 · Editorial preview
        </footer>
      </main>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: ACCENT_DARK, fontFamily: SANS }}>
          {number}
        </span>
        <h3 className="text-2xl font-semibold" style={{ fontFamily: DISPLAY }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED, fontFamily: SANS }}>
          {label}
        </span>
        {suffix && (
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED, fontFamily: SANS }}>
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-2 text-xs italic leading-relaxed"
      style={{ color: MUTED, fontFamily: SERIF }}
    >
      {children}
    </p>
  );
}
