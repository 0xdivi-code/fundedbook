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
    <div className="min-w-[150px] rounded-xl border border-primary/20 bg-[linear-gradient(160deg,rgba(0,245,160,0.08)_0%,rgba(12,21,18,0.97)_45%,rgba(6,11,9,0.98)_100%)] px-3 py-2.5 shadow-[0_18px_46px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      {label != null && (
        <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
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
  fill: "#7b9188",
  fontFamily: "Inter Variable, sans-serif",
} as const;

export const tickLine = { stroke: "transparent" } as const;
export const axisLine = { stroke: "rgba(0,245,160,0.1)" } as const;
export const gridStroke = "rgba(0,245,160,0.07)";

export function pnlColor(value: number) {
  return value >= 0 ? "#00f5a0" : "#ff4d6d";
}

export const chartTooltipStyle = { outline: "none" } as const;
