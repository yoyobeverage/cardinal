// Lazy-loaded chart: pulls recharts into its own Vite chunk so the drilldown
// radar only loads when the drawer opens the first time. Saves ~250 KB off
// the initial bundle.

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import { INK_2, INK_3, MINT } from "../theme";

interface Props {
  data: { lens: string; score: number; fullMark: number }[];
}

export default function RadarPanel({ data }: Props) {
  return (
    <RadarChart width={420} height={280} data={data}>
      <PolarGrid stroke="#d4cdb8" />
      <PolarAngleAxis dataKey="lens" tick={{ fill: INK_2, fontSize: 12 }} />
      <PolarRadiusAxis
        angle={90}
        domain={[0, 100]}
        tick={{ fill: INK_3, fontSize: 10 }}
        tickCount={5}
      />
      <Radar
        name="similarity"
        dataKey="score"
        stroke={MINT}
        fill={MINT}
        fillOpacity={0.35}
        isAnimationActive={false}
      />
    </RadarChart>
  );
}
