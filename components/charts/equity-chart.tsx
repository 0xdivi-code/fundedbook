"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, axisLine, axisStyle, tickLine } from "./chart-tooltip";
import { formatCurrency } from "@/lib/format";
import type { EquityPoint } from "@/lib/analytics";

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const first = data[0]?.equity ?? 0;
  const last = data[data.length - 1]?.equity ?? 0;
  const up = last >= first;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "#34d399" : "#fb7185"} stopOpacity={0.28} />
              <stop offset="100%" stopColor={up ? "#34d399" : "#fb7185"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={axisLine}
            minTickGap={32}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
            domain={["dataMin - 200", "dataMax + 200"]}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => formatCurrency(v)} />}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "3 3" }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={up ? "#34d399" : "#fb7185"}
            strokeWidth={2}
            fill="url(#equityFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#fff" }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
