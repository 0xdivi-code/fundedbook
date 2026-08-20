"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, axisLine, axisStyle, tickLine } from "./chart-tooltip";
import { formatCurrency } from "@/lib/format";
import type { DimensionStat } from "@/lib/analytics";

export function PerformanceBars({
  data,
  height = 240,
}: {
  data: DimensionStat[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={axisLine}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={86}
            tick={{ ...axisStyle, fontSize: 12 }}
            tickLine={tickLine}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={
              <ChartTooltip
                formatter={(v) => formatCurrency(v)}
                title="Net P&L"
              />
            }
          />
          <Bar dataKey="netPnl" radius={[0, 5, 5, 0]} maxBarSize={18} animationDuration={600}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
