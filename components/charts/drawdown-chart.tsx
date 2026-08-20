"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, axisLine, axisStyle, tickLine } from "./chart-tooltip";
import { formatCurrency } from "@/lib/format";
import type { DrawdownPoint } from "@/lib/analytics";

export function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
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
            width={56}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v) => formatCurrency(v)}
                title="Drawdown"
              />
            }
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#fb7185"
            strokeWidth={1.8}
            fill="url(#ddFill)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
