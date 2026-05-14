import { useState } from "react";

import FormView from "./views/FormView";
import ResultsView from "./views/ResultsView";
import type { Allocation } from "./types";

export default function App() {
  const [allocation, setAllocation] = useState<Allocation | null>(null);

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
