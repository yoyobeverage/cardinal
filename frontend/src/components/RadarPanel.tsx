// Lazy-loaded chart component: pulls recharts into its own Vite chunk so the
// drilldown radar only loads when the user opens the drawer for the first time.
// Saves ~250 KB off the initial bundle.

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

interface Props {
  data: { lens: string; score: number; fullMark: number }[];
}

export default function RadarPanel({ data }: Props) {
  return (
    <RadarChart width={420} height={280} data={data}>
      <PolarGrid stroke="#3f3f46" />
      <PolarAngleAxis dataKey="lens" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
      <PolarRadiusAxis
        angle={90}
        domain={[0, 100]}
        tick={{ fill: "#52525b", fontSize: 10 }}
        tickCount={5}
      />
      <Radar
        name="similarity"
        dataKey="score"
        stroke="#10b981"
        fill="#10b981"
        fillOpacity={0.4}
        isAnimationActive={false}
      />
    </RadarChart>
  );
}
