"use client";

import React from "react";
import {
  Award,
  Gauge,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Card } from "@/components/ui/card";
import { useJournal } from "@/lib/store";
import {
  computeTrade,
  dayOfWeekPerformance,
  directionPerformance,
  drawdownSeries,
  equityCurve,
  gradePerformance,
  hourPerformance,
  pnlByDay,
  pnlByMonth,
  pnlByWeek,
  ratingDistribution,
  strategyPerformance,
  summarize,
  symbolPerformance,
} from "@/lib/analytics";
import { EquityChart } from "@/components/charts/equity-chart";
import { PnlBarChart } from "@/components/charts/pnl-chart";
import { DrawdownChart } from "@/components/charts/drawdown-chart";
import { PerformanceBars } from "@/components/charts/performance-chart";
import { WinRateChart } from "@/components/charts/winrate-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercent,
  formatR,
} from "@/lib/format";
import type { DimensionStat } from "@/lib/analytics";

type Period = "daily" | "weekly" | "monthly";
const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function AnalyticsPage() {
  const { trades, strategies } = useJournal();
  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);
  const summary = React.useMemo(() => summarize(computed), [computed]);

  const [period, setPeriod] = React.useState<Period>("weekly");

  const equity = React.useMemo(() => equityCurve(computed), [computed]);
  const drawdown = React.useMemo(() => drawdownSeries(equity), [equity]);
  const byDay = React.useMemo(() => pnlByDay(computed), [computed]);
  const byWeek = React.useMemo(() => pnlByWeek(computed), [computed]);
  const byMonth = React.useMemo(() => pnlByMonth(computed), [computed]);
  const byStrategy = React.useMemo(
    () => strategyPerformance(computed, strategies),
    [computed, strategies]
  );
  const bySymbol = React.useMemo(() => symbolPerformance(computed), [computed]);
  const longShort = React.useMemo(() => directionPerformance(computed), [computed]);
  const byDayOfWeek = React.useMemo(() => dayOfWeekPerformance(computed), [computed]);
  const byHour = React.useMemo(() => hourPerformance(computed), [computed]);
  const rating = React.useMemo(() => ratingDistribution(computed), [computed]);
  const grade = React.useMemo(() => gradePerformance(computed), [computed]);

  const winRateSeries = React.useMemo(
    () => byWeek.map((b) => ({ label: b.label, winRate: Math.round(b.winRate * 10) / 10 })),
    [byWeek]
  );

  const donutData = longShort.map((d) => ({
    name: d.label,
    value: d.trades,
    color: d.color,
  }));

  return (
    <div className="space-y-5">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard index={0} label="Net P&L" value={formatCurrency(summary.netPnl)} sub={`${summary.totalFees ? `${formatCurrency(summary.totalFees)} fees` : ""}`} icon={Wallet} tone={summary.netPnl >= 0 ? "profit" : "loss"} />
        <StatCard index={1} label="Profit Factor" value={summary.profitFactor > 99 ? "∞" : summary.profitFactor.toFixed(2)} sub="Gross profit ÷ gross loss" icon={Scale} tone={summary.profitFactor >= 1 ? "profit" : "loss"} />
        <StatCard index={2} label="Max Drawdown" value={`−${formatPercent(summary.maxDrawdown, 1)}`} sub="From equity peak" icon={TrendingDown} tone="loss" />
        <StatCard index={3} label="Avg R Multiple" value={formatR(summary.avgR)} sub={`${formatCurrency(summary.avgRisk)} avg risk`} icon={Gauge} tone={summary.avgR >= 0 ? "profit" : "loss"} />
        <StatCard index={4} label="Best Trade" value={formatCurrency(summary.bestTrade)} sub="Single trade high" icon={Award} tone="profit" />
        <StatCard index={5} label="Worst Trade" value={formatCurrency(summary.worstTrade)} sub="Single trade low" icon={TrendingUp} tone="loss" />
      </div>

      {/* Equity + direction */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Equity Curve" description="Cumulative realized P&L" className="xl:col-span-2">
          <EquityChart data={equity} />
        </ChartCard>
        <ChartCard title="Long vs Short" description="Direction split & net P&L">
          <DonutChart data={donutData} centerValue={String(summary.totalTrades)} centerLabel="trades" />
          <div className="mt-2 space-y-2">
            {longShort.map((d) => (
              <div key={d.key} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.label}
                </span>
                <span className={cn("font-mono font-semibold tabular-nums", d.netPnl >= 0 ? "text-profit" : "text-loss")}>
                  {formatCurrency(d.netPnl, { compact: true })}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* P&L + win rate */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="P&L Over Time"
          description="Daily, weekly or monthly aggregation"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
              {PERIODS.map((p) => (
                <button key={p.value} onClick={() => setPeriod(p.value)} className={cn("rounded-md px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer", period === p.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {p.label}
                </button>
              ))}
            </div>
          }
        >
          {period === "daily" && <PnlBarChart data={byDay} />}
          {period === "weekly" && <PnlBarChart data={byWeek} />}
          {period === "monthly" && <PnlBarChart data={byMonth} />}
        </ChartCard>
        <ChartCard title="Win Rate by Week" description="Rolling weekly win percentage">
          <WinRateChart data={winRateSeries} />
        </ChartCard>
      </div>

      {/* Drawdown + day of week */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Drawdown" description="Equity decline from running peak" className="xl:col-span-2">
          <DrawdownChart data={drawdown} />
        </ChartCard>
        <ChartCard title="Day of Week" description="Net P&L by weekday">
          <PerformanceBars data={byDayOfWeek} height={220} />
        </ChartCard>
      </div>

      {/* Strategy + symbol */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Strategy Performance" description="Net P&L by strategy">
          <PerformanceBars data={byStrategy} height={250} />
        </ChartCard>
        <ChartCard title="Symbol Performance" description="Net P&L by ticker">
          <PerformanceBars data={bySymbol.slice(0, 9)} height={250} />
        </ChartCard>
      </div>

      {/* Hour of day + grade */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Hour of Day" description="When your edge appears">
          <PerformanceBars data={byHour} height={250} />
        </ChartCard>
        <ChartCard title="Setup Grade" description="Net P&L by execution grade">
          <PerformanceBars data={grade} height={250} />
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DimensionTable title="Strategy breakdown" data={byStrategy} />
        <DimensionTable title="Symbol breakdown" data={bySymbol.slice(0, 9)} />
      </div>

      {/* Rating */}
      <ChartCard title="Rating Distribution" description="Win rate & P&L by trade rating">
        <div className="space-y-2.5">
          {rating.map((r) => {
            const maxCount = Math.max(...rating.map((x) => x.count), 1);
            return (
              <div key={r.rating} className="flex items-center gap-3">
                <span className="w-20 text-[12.5px] text-muted-foreground">
                  {"★".repeat(r.rating)}
                  <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[#8f7bff]"
                    style={{ width: `${(r.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[12.5px] tabular-nums text-muted-foreground">
                  {r.count}
                </span>
                <span className={cn("w-20 text-right font-mono text-[12.5px] font-semibold tabular-nums", r.pnl >= 0 ? "text-profit" : "text-loss")}>
                  {formatCurrency(r.pnl, { compact: true })}
                </span>
                <span className="w-14 text-right text-[12.5px] tabular-nums text-muted-foreground">
                  {formatPercent(r.winRate, 0)}
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

function DimensionTable({ title, data }: { title: string; data: DimensionStat[] }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground/70">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 text-right font-medium">Trades</th>
              <th className="pb-2 text-right font-medium">Win rate</th>
              <th className="pb-2 text-right font-medium">Avg R</th>
              <th className="pb-2 text-right font-medium">Profit factor</th>
              <th className="pb-2 text-right font-medium">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-b border-border/50 last:border-0">
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium text-foreground">{d.label}</span>
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">{d.trades}</td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">{formatPercent(d.winRate, 0)}</td>
                <td className={cn("py-2.5 text-right font-mono tabular-nums", d.avgR >= 0 ? "text-profit" : "text-loss")}>{formatR(d.avgR)}</td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">{d.profitFactor > 99 ? "∞" : d.profitFactor.toFixed(2)}</td>
                <td className={cn("py-2.5 text-right font-mono font-semibold tabular-nums", d.netPnl >= 0 ? "text-profit" : "text-loss")}>{formatCurrency(d.netPnl, { sign: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
