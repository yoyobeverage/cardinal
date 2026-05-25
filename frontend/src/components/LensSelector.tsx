import { BORDER, INK_2, MINT, SURFACE, SURFACE_2 } from "../theme";

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
  tax_treatment: "Tax",
  composability: "Composability",
};

export default function LensSelector({ lenses, current, onChange }: Props) {
  return (
    <div
      className="inline-flex flex-wrap rounded border p-1"
      style={{ borderColor: BORDER, background: SURFACE_2 }}
    >
      {lenses.map((lens) => {
        const active = lens === current;
        return (
          <button
            key={lens}
            type="button"
            onClick={() => onChange(lens)}
            className="rounded px-3 py-1 text-sm transition"
            style={{
              background: active ? MINT : "transparent",
              color: active ? SURFACE : INK_2,
              fontWeight: active ? 600 : 400,
            }}
          >
            {LABELS[lens] ?? lens}
          </button>
        );
      })}
    </div>
  );
}
