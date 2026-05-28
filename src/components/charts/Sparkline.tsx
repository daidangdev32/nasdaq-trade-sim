"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({ points, positive, height = 40 }: { points: number[]; positive: boolean; height?: number }) {
  const data = points.map((v, i) => ({ i, v }));
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
