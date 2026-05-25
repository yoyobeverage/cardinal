// Root component. Two responsibilities:
//   1. Minimal path-based SPA router (no react-router for ~12 routes).
//      Vercel rewrites every path to /index.html, so window.location.pathname
//      is the source of truth.
//   2. Production layout: FormView and ResultsView stay co-mounted so the
//      react-hook-form state inside FormView survives the submit -> back round-trip.

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

// Minimal path-based routing. Avoids react-router for a small SPA.
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

  // Demo routes render bare - each variant defines its own chrome.
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

  // Production routes - both views stay mounted so FormView's react-hook-form
  // state (and the optional persona/swipes/ranking state) survives across
  // submit → results → back navigation. ResultsView only mounts when there's
  // an allocation to display.
  return (
    <>
      <div style={{ display: allocation ? "none" : "block" }}>
        <FormView onAllocation={setAllocation} />
      </div>
      {allocation && (
        <ResultsView allocation={allocation} onBack={() => setAllocation(null)} />
      )}
    </>
  );
}
