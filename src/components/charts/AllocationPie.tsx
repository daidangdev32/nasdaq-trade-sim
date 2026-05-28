"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getStockInfo } from "@/constants/stocks";

interface Slice { symbol: string; value: number }

export function AllocationPie({ data, height = 260 }: { data: Slice[]; height?: number }) {
  if (data.length === 0) {
    return (
      <div className="h-60 grid place-items-center text-text-muted text-sm">
        No holdings yet — make your first trade!
      </div>
    );
  }
  const colored = data.map((d) => ({
    ...d,
    color: getStockInfo(d.symbol)?.color ?? "#5b8def",
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={colored} dataKey="value" nameKey="symbol" innerRadius={55} outerRadius={90} paddingAngle={1}>
          {colored.map((entry) => (
            <Cell key={entry.symbol} fill={entry.color} stroke="#0b0f17" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#151c2e", border: "1px solid #1f2a44", borderRadius: 8, color: "#e6edf7" }}
          formatter={(v: number, n: string) => [`$${v.toFixed(2)}`, n]}
        />
        <Legend wrapperStyle={{ color: "#8a96b0", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
