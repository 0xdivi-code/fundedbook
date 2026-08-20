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
import type { BucketPnl } from "@/lib/analytics";

export function PnlBarChart({
  data,
  compact = false,
}: {
  data: BucketPnl[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "h-[200px] w-full" : "h-[260px] w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={axisLine}
            minTickGap={16}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisStyle}
            tickLine={tickLine}
            axisLine={false}
            width={compact ? 44 : 56}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={
              <ChartTooltip
                formatter={(v) => formatCurrency(v)}
                title={undefined}
              />
            }
          />
          <Bar dataKey="pnl" radius={[4, 4, 2, 2]} maxBarSize={26} animationDuration={600}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.pnl >= 0 ? "#34d399" : "#fb7185"}
                fillOpacity={entry.pnl >= 0 ? 0.85 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
