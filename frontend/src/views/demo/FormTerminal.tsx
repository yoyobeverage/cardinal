// Terminal/Bloomberg variant. Pure black, amber monospace, ASCII borders.
// For users who already live in a CLI.

import { useState, useEffect } from "react";

const MONO = "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace";
const BG = "#000000";
const FG = "#ffb000"; // Bloomberg amber
const FG_DIM = "#cc8800";
const GREEN = "#00ff66";
const PANEL = "#0a0a0a";

export default function FormTerminal() {
  const [capital, setCapital] = useState("100000");
  const [horizon, setHorizon] = useState("12");
  const [wrapper, setWrapper] = useState("taxable");
  const [auditFloor, setAuditFloor] = useState("2");
  const [tvlFloor, setTvlFloor] = useState("5000000");
  const [freeform, setFreeform] = useState("");
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setClock(
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
          `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="min-h-screen px-4 py-4"
      style={{ background: BG, color: FG, fontFamily: MONO, fontSize: "13px" }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Top status bar */}
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: FG_DIM }}>
          <a href="/demo" className="hover:underline" style={{ color: GREEN }}>
            [F1] BACK
          </a>
          <span style={{ color: FG }}>CARDINAL TERMINAL v1.0</span>
          <span style={{ color: FG_DIM }}>{clock}</span>
        </div>

        {/* ASCII banner */}
        <pre className="my-4 select-none whitespace-pre overflow-x-auto leading-tight" style={{ color: FG }}>
{`
  ╔══════════════════════════════════════════════════════════════════════════╗
  ║   ▄████▄  ▄▄▄  ▄▄▄▄    ▓█████▄  ██▓ ███▄    █  ▄▄▄       ██▓                ║
  ║  ▒██▀ ▀█ ▒████▄▓█████▄ ▒██▀ ██▌▓██▒ ██ ▀█   █ ▒████▄    ▓██▒                ║
  ║  ▒▓█    ▄▒██  ▀█▓███  ▌░██   █▌▒██▒▓██  ▀█ ██▒▒██  ▀█▄  ▒██░                ║
  ║  ▒▓▓▄ ▄██░██▄▄▄▄░▓█▄   ░▓█▄   ▌░██░▓██▒  ▐▌██▒░██▄▄▄▄██ ▒██░                ║
  ║  ▒ ▓███▀ ░▓█   ▓▒▒████▓ ░▒████▓ ░██░▒██░   ▓██░ ▓█   ▓██▒░██████▒           ║
  ║                                                                              ║
  ║  YIELD DISCOVERY · VECTOR-NATIVE SEARCH · QDRANT HACKATHON 2026             ║
  ╚══════════════════════════════════════════════════════════════════════════╝
`}
        </pre>

        {/* Status panel */}
        <div className="grid grid-cols-4 gap-2 border-b py-2 text-xs" style={{ borderColor: FG_DIM }}>
          <StatusCell label="QDRANT" value="CONNECTED" color={GREEN} />
          <StatusCell label="CATALOG" value="83 PROTO" color={FG} />
          <StatusCell label="VECTORS" value="6 NAMED" color={FG} />
          <StatusCell label="LATENCY" value="32MS" color={GREEN} />
        </div>

        {/* Main query panel */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: input panel */}
          <div className="lg:col-span-2">
            <Panel title="QUERY INPUT">
              <Row label="CAPITAL_USD">
                <Input value={capital} onChange={setCapital} suffix="USD" />
              </Row>
              <Row label="HORIZON_MONTHS">
                <Input value={horizon} onChange={setHorizon} suffix="MOS" />
              </Row>
              <Row label="TAX_WRAPPER">
                <select
                  value={wrapper}
                  onChange={(e) => setWrapper(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  style={{ color: FG, fontFamily: MONO, borderBottom: `1px dashed ${FG_DIM}` }}
                >
                  <option value="taxable" style={{ background: BG }}>TAXABLE</option>
                  <option value="traditional_ira" style={{ background: BG }}>TRADITIONAL_IRA</option>
                  <option value="roth_ira" style={{ background: BG }}>ROTH_IRA</option>
                  <option value="hsa" style={{ background: BG }}>HSA</option>
                </select>
              </Row>
              <Row label="MIN_AUDITS">
                <Input value={auditFloor} onChange={setAuditFloor} suffix="N" />
              </Row>
              <Row label="MIN_TVL_USD">
                <Input value={tvlFloor} onChange={setTvlFloor} suffix="USD" />
              </Row>
              <Row label="EXCLUDED_CHAINS">
                <div className="flex flex-wrap gap-2 pt-1">
                  {["ETH", "BASE", "ARB", "OP", "POLY", "SOL", "BSC", "AVAX"].map((c) => (
                    <label
                      key={c}
                      className="inline-flex items-center gap-1 cursor-pointer"
                      style={{ color: FG_DIM }}
                    >
                      <input type="checkbox" className="accent-amber-500" />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </Row>
            </Panel>

            <Panel title="FREEFORM // NL_INPUT">
              <textarea
                value={freeform}
                onChange={(e) => setFreeform(e.target.value)}
                rows={4}
                placeholder="> need liquidity by month 10 // house down payment // keep boring"
                className="w-full bg-transparent p-2 outline-none placeholder:italic"
                style={{
                  color: FG,
                  fontFamily: MONO,
                  border: `1px dashed ${FG_DIM}`,
                  caretColor: GREEN,
                }}
              />
              <p className="mt-2 text-xs" style={{ color: FG_DIM }}>
                &gt; gemini-2.5-flash-lite parses to QuerySpec, validated against catalog
              </p>
            </Panel>
          </div>

          {/* Right: docs panel */}
          <div>
            <Panel title="LENS // 6 NAMED VECTORS">
              <Doc lens="NARRATIVE" dim="1024" metric="cosine" desc="BGE text" />
              <Doc lens="RISK" dim="32" metric="euclid" desc="hand-eng" />
              <Doc lens="YIELD_SRC" dim="16" metric="cosine" desc="one-hot" />
              <Doc lens="CORREL" dim="8" metric="cosine" desc="vs BTC/ETH/SPX" />
              <Doc lens="TAX" dim="12" metric="cosine" desc="one-hot" />
              <Doc lens="COMPOSE" dim="64" metric="dot" desc="node2vec" />
            </Panel>

            <Panel title="OPTIMIZER">
              <label className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="radio" name="opt" defaultChecked className="accent-amber-500" />
                <span style={{ color: FG }}>WEIGHTED_SUM</span>
                <span style={{ color: FG_DIM }} className="ml-auto text-xs">DEFAULT</span>
              </label>
              <label className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="radio" name="opt" className="accent-amber-500" />
                <span style={{ color: FG }}>MEAN_VARIANCE</span>
                <span style={{ color: FG_DIM }} className="ml-auto text-xs">MARKOWITZ</span>
              </label>
            </Panel>
          </div>
        </div>

        {/* Bottom command bar */}
        <div className="mt-6 border-t-2 pt-3" style={{ borderColor: FG }}>
          <button
            type="button"
            onClick={() => alert("PREVIEW ONLY // RETURN TO / FOR LIVE QUERY")}
            className="px-4 py-2 transition hover:brightness-125"
            style={{
              background: FG,
              color: BG,
              fontFamily: MONO,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            [ENTER] EXECUTE QUERY
          </button>
          <span className="ml-4 text-xs" style={{ color: FG_DIM }}>
            Ctrl-C to abort · F1 for help · F12 for raw QuerySpec JSON
          </span>
        </div>

        {/* Footer status line */}
        <div
          className="mt-4 flex items-center justify-between border-t py-2 text-xs"
          style={{ borderColor: FG_DIM, color: FG_DIM }}
        >
          <span>
            READY <span style={{ color: GREEN }}>●</span>
          </span>
          <span>BACKEND: nichzhu-cardinal.hf.space</span>
          <span>SESSION: PREVIEW</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="mb-4 p-3"
      style={{ background: PANEL, border: `1px solid ${FG_DIM}` }}
    >
      <div
        className="mb-3 border-b pb-1 text-xs uppercase tracking-widest"
        style={{ color: FG_DIM, borderColor: FG_DIM }}
      >
        ▶ {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 items-center">
      <span className="text-xs" style={{ color: FG_DIM }}>[{label}]</span>
      <div>{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none"
        style={{
          color: FG,
          fontFamily: MONO,
          borderBottom: `1px dashed ${FG_DIM}`,
          caretColor: GREEN,
        }}
      />
      {suffix && <span className="text-xs" style={{ color: FG_DIM }}>{suffix}</span>}
    </div>
  );
}

function StatusCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div style={{ color: FG_DIM }}>{label}</div>
      <div style={{ color }}>{value}</div>
    </div>
  );
}

function Doc({
  lens,
  dim,
  metric,
  desc,
}: {
  lens: string;
  dim: string;
  metric: string;
  desc: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_50px_70px] gap-2 py-0.5 text-xs">
      <span style={{ color: FG }}>{lens}</span>
      <span style={{ color: FG_DIM }}>{dim}d</span>
      <span style={{ color: FG_DIM }}>{metric}</span>
      <span className="col-span-3 -mt-0.5" style={{ color: FG_DIM }}>
        └─ {desc}
      </span>
    </div>
  );
}
