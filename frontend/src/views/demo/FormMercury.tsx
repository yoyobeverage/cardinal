// Mercury / Linear-style variant. Off-white, large rounded cards, generous
// whitespace, muted teal accent. The "really good startup app" aesthetic.

import { useState } from "react";

const SANS = "Inter, system-ui, sans-serif";
const BG = "#fafaf7";
const SURFACE = "#ffffff";
const INK = "#0a0a0a";
const INK_2 = "#2a2a2a";
const INK_3 = "#737373";
const ACCENT = "#0d7378"; // muted teal
const ACCENT_BG = "#e7f0ef";
const BORDER = "#e6e4df";

export default function FormMercury() {
  const [step] = useState(1);
  const [capital, setCapital] = useState(100_000);
  const [horizon, setHorizon] = useState(12);
  const [wrapper, setWrapper] = useState("taxable");
  const [freeform, setFreeform] = useState("");

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK, fontFamily: SANS }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ borderColor: BORDER, background: "rgba(250,250,247,0.85)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/demo"
              className="text-sm transition hover:opacity-100"
              style={{ color: INK_3 }}
            >
              ← back
            </a>
            <div className="h-4 w-px" style={{ background: BORDER }} />
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: ACCENT, color: SURFACE, fontWeight: 700, fontSize: 12 }}
              >
                C
              </div>
              <span className="text-sm font-medium" style={{ color: INK }}>
                Cardinal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: INK_3 }}>
            <Dot active={step >= 1} />
            <span>Profile</span>
            <span style={{ color: BORDER }}>·</span>
            <Dot active={step >= 2} />
            <span>Allocate</span>
            <span style={{ color: BORDER }}>·</span>
            <Dot active={step >= 3} />
            <span>Review</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Hero */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: ACCENT_BG, color: ACCENT }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
            Built on Qdrant · 6 lenses · 83 protocols
          </div>
          <h1
            className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight"
            style={{ color: INK, letterSpacing: "-0.025em" }}
          >
            Build a yield portfolio
            <br />
            <span style={{ color: INK_3 }}>that fits your situation.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: INK_2 }}>
            Tell us a few things about how you'd use the money. We search 83 DeFi and tokenized-Treasury
            yield products and return a diversified allocation, with per-protocol reasoning.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ["House-buyer", "$100k · 12mo · conservative"],
              ["Retiree", "$500k IRA · max safety"],
              ["Degen", "$10k · 6mo · points"],
            ].map(([name, desc]) => (
              <button
                key={name}
                type="button"
                className="rounded-full border px-4 py-1.5 text-sm transition hover:bg-white"
                style={{ borderColor: BORDER, color: INK_2 }}
              >
                <span className="font-medium" style={{ color: INK }}>{name}</span>
                <span style={{ color: INK_3 }}> · {desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card: investment */}
        <Card>
          <CardHeader
            title="Your investment"
            subtitle="How much, and for how long."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FloatingLabel label="Capital">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl" style={{ color: INK_3 }}>$</span>
                  <input
                    value={capital.toLocaleString()}
                    onChange={(e) => setCapital(Number(e.target.value.replace(/,/g, "")) || 0)}
                    className="w-full bg-transparent text-3xl font-medium outline-none"
                    style={{ color: INK, letterSpacing: "-0.02em" }}
                  />
                </div>
              </FloatingLabel>
            </div>
            <div>
              <FloatingLabel label="Horizon">
                <div className="flex items-baseline gap-2">
                  <input
                    value={horizon}
                    onChange={(e) => setHorizon(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-3xl font-medium outline-none"
                    style={{ color: INK, letterSpacing: "-0.02em" }}
                  />
                  <span className="text-base" style={{ color: INK_3 }}>months</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className="mt-2 w-full"
                  style={{ accentColor: ACCENT }}
                />
              </FloatingLabel>
            </div>
          </div>
        </Card>

        {/* Card: account */}
        <Card>
          <CardHeader
            title="Account type"
            subtitle="Affects which yields are tax-optimal for you."
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                className="rounded-xl border p-4 text-left transition"
                style={{
                  borderColor: wrapper === val ? ACCENT : BORDER,
                  background: wrapper === val ? ACCENT_BG : SURFACE,
                  borderWidth: wrapper === val ? 2 : 1,
                }}
              >
                <div className="text-base font-medium" style={{ color: INK }}>
                  {label}
                </div>
                <div className="mt-1 text-xs" style={{ color: INK_3 }}>
                  {hint}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Card: filters */}
        <Card>
          <CardHeader
            title="Safety filters"
            subtitle="Hard floors on audits and protocol size. Sensible defaults set."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Min. audits" value="2" hint="independent reviews" />
            <Stat label="Min. TVL" value="$5M" hint="total locked" />
            <Stat label="Max lockup" value="any" hint="days inaccessible" />
          </div>
        </Card>

        {/* Card: freeform */}
        <Card>
          <CardHeader
            title="In your own words"
            subtitle="Optional. We translate the sentence into search criteria."
          />
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={3}
            placeholder="e.g. 'I need the money in 10 months for a house down payment. Keep it boring.'"
            className="w-full rounded-xl border p-4 text-base outline-none transition focus:border-current"
            style={{
              background: SURFACE,
              borderColor: BORDER,
              color: INK,
              fontFamily: SANS,
            }}
          />
        </Card>

        {/* CTA */}
        <div className="mt-10 flex items-center justify-between">
          <div>
            <div className="text-sm" style={{ color: INK_3 }}>Ready when you are.</div>
            <div className="text-xs" style={{ color: INK_3 }}>Allocation generates in ~3 seconds.</div>
          </div>
          <button
            type="button"
            onClick={() => alert("Preview only — return to / for the working form.")}
            className="rounded-full px-6 py-3 text-base font-semibold transition hover:opacity-90"
            style={{
              background: ACCENT,
              color: SURFACE,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(13,115,120,0.4)",
            }}
          >
            Generate my allocation →
          </button>
        </div>

        <footer className="mt-16 text-center text-xs" style={{ color: INK_3 }}>
          Cardinal · Qdrant Hackathon 2026 · Mercury preview
        </footer>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="mb-5 rounded-2xl p-6"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {children}
    </section>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4">
      <h3 className="text-lg font-medium" style={{ color: INK }}>
        {title}
      </h3>
      <p className="mt-0.5 text-sm" style={{ color: INK_3 }}>
        {subtitle}
      </p>
    </header>
  );
}

function FloatingLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: BG, border: `1px solid ${BORDER}` }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: INK_3 }}
      >
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: BG, border: `1px solid ${BORDER}` }}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color: INK_3 }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-medium" style={{ color: INK }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: INK_3 }}>
        {hint}
      </div>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: active ? ACCENT : BORDER }}
    />
  );
}
