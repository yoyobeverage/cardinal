// Lazy-loaded chart component: pulls recharts into its own Vite chunk so the
// drawdown swipe-stack mini-charts only load when the user expands the panel.

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface Props {
  data: { d: number; v: number }[];
}

export default function DrawdownChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <YAxis hide domain={[0, 1.05]} />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#f43f5e"
          fill="#f43f5e"
          fillOpacity={0.25}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
