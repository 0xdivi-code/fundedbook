"use client";

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  formatter?: (value: number, key: string) => string;
  title?: string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  formatter,
  title,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-popover/95 px-3 py-2.5 shadow-2xl backdrop-blur">
      {label != null && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title ?? label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const raw = Number(entry.value);
          const val = formatter
            ? formatter(raw, String(entry.dataKey ?? entry.name ?? ""))
            : entry.value;
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-mono text-[12.5px] font-semibold tabular-nums text-foreground">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const axisStyle = {
  fontSize: 11,
  fill: "#8b8d99",
  fontFamily: "Inter Variable, sans-serif",
} as const;

export const tickLine = { stroke: "transparent" } as const;
export const axisLine = { stroke: "rgba(255,255,255,0.06)" } as const;
export const gridStroke = "rgba(255,255,255,0.05)";

export function pnlColor(value: number) {
  return value >= 0 ? "#34d399" : "#fb7185";
}

export const chartTooltipStyle = { outline: "none" } as const;
