"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, axisLine, axisStyle, tickLine } from "./chart-tooltip";
import { formatPercent } from "@/lib/format";

export function WinRateChart({
  data,
  height = 220,
}: {
  data: { label: string; winRate: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={axisLine}
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => formatPercent(v, 0)} />}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "3 3" }}
          />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="#7c6aff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
