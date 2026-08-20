"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  formatter,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue?: string;
  formatter?: (v: number) => string;
}) {
  return (
    <div className="relative h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            animationDuration={600}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-bold tabular-nums text-foreground">
            {centerValue}
          </span>
          {centerLabel && (
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
