"use client";

import { AreaChart as RAreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Point { date: string; value: number }

export function AreaChart({ data, color = "#5b8def", height = 240 }: { data: Point[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#5d6a85" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#5d6a85" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#151c2e", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf7" }}
          labelStyle={{ color: "#8a96b0" }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Value"]}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill="url(#areaFill)" strokeWidth={2} />
      </RAreaChart>
    </ResponsiveContainer>
  );
}
