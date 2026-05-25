import { useEffect, useState } from "react";

import FormView from "./views/FormView";
import ResultsView from "./views/ResultsView";
import DemoIndex from "./views/demo/DemoIndex";
import FormFTEditorial from "./views/demo/FormFTEditorial";
import FormTerminal from "./views/demo/FormTerminal";
import FormMercury from "./views/demo/FormMercury";
import FormDeFiNative from "./views/demo/FormDeFiNative";
import FormSwiss from "./views/demo/FormSwiss";
import FormMagazine from "./views/demo/FormMagazine";
import FormSwissDark from "./views/demo/FormSwissDark";
import FormDeFiLight from "./views/demo/FormDeFiLight";
import FormHybrid from "./views/demo/FormHybrid";
import type { Allocation } from "./types";

// Minimal path-based routing. Avoids react-router for a 5-route SPA.
// Vercel rewrites every path to /index.html, so the browser's pathname is the source of truth.
function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export default function App() {
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const path = usePath();

  // Demo routes render bare (no Cardinal chrome) so each variant defines its own.
  if (path === "/demo") return <DemoIndex />;
  if (path === "/demo/ft") return <FormFTEditorial />;
  if (path === "/demo/terminal") return <FormTerminal />;
  if (path === "/demo/mercury") return <FormMercury />;
  if (path === "/demo/defi") return <FormDeFiNative />;
  if (path === "/demo/swiss") return <FormSwiss />;
  if (path === "/demo/magazine") return <FormMagazine />;
  if (path === "/demo/swiss-dark") return <FormSwissDark />;
  if (path === "/demo/defi-light") return <FormDeFiLight />;
  if (path === "/demo/hybrid") return <FormHybrid />;

  // Default app shell - existing production form.
  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Cardinal</h1>
        <p className="text-sm text-zinc-400">Vector-native yield discovery</p>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {allocation ? (
          <ResultsView allocation={allocation} onBack={() => setAllocation(null)} />
        ) : (
          <FormView onAllocation={setAllocation} />
        )}
      </main>
    </div>
  );
}
