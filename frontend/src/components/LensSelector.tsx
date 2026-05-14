interface Props {
  lenses: string[];
  current: string;
  onChange: (lens: string) => void;
}

const LABELS: Record<string, string> = {
  narrative:     "Narrative",
  risk:          "Risk",
  yield_source:  "Yield Source",
  correlation:   "Correlation",
  composability: "Composability",
};

export default function LensSelector({ lenses, current, onChange }: Props) {
  return (
    <div className="inline-flex rounded border border-zinc-800 bg-zinc-900 p-1">
      {lenses.map((lens) => {
        const active = lens === current;
        return (
          <button
            key={lens}
            type="button"
            onClick={() => onChange(lens)}
            className={
              "rounded px-3 py-1 text-sm transition " +
              (active
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-zinc-200")
            }
          >
            {LABELS[lens] ?? lens}
          </button>
        );
      })}
    </div>
  );
}
