// Lazy-loaded chart: pulls recharts into its own Vite chunk so the drawdown
// swipe-stack mini-charts only load when the user expands the panel.

import { Area, AreaChart, YAxis } from "recharts";

// Matches the h-16 w-32 (64x128px) container in DrawdownSwipe. Fixed dims
// avoid recharts' ResponsiveContainer race condition where parent dimensions
// aren't measured yet when multiple charts mount on panel expand (which
// floods the console with "width(-1) height(-1)" warnings).
const WIDTH = 128;
const HEIGHT = 64;

interface Props {
  data: { d: number; v: number }[];
}

export default function DrawdownChart({ data }: Props) {
  return (
    <AreaChart width={WIDTH} height={HEIGHT} data={data}>
      <YAxis hide domain={[0, 1.05]} />
      <Area
        type="monotone"
        dataKey="v"
        stroke="#f43f5e"
        fill="#f43f5e"
        fillOpacity={0.25}
        strokeWidth={1.5}
        isAnimationActive={false}
      />
    </AreaChart>
  );
}
