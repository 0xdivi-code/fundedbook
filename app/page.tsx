"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  ListChecks,
  Percent,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJournal } from "@/lib/store";
import {
  computeTrade,
  directionPerformance,
  drawdownSeries,
  equityCurve,
  pnlByDay,
  pnlByMonth,
  pnlByWeek,
  strategyPerformance,
  summarize,
  symbolPerformance,
} from "@/lib/analytics";
import {
  formatCurrency,
  formatPercent,
  formatR,
} from "@/lib/format";
import { EquityChart } from "@/components/charts/equity-chart";
import { PnlBarChart } from "@/components/charts/pnl-chart";
import { DrawdownChart } from "@/components/charts/drawdown-chart";
import { PerformanceBars } from "@/components/charts/performance-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { TradeCard } from "@/components/trades/trade-card";

type Period = "daily" | "weekly" | "monthly";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function DashboardPage() {
  const [period, setPeriod] = React.useState<Period>("daily");
  const { trades, strategies } = useJournal();
  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);
  const summary = React.useMemo(() => summarize(computed), [computed]);

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
  const longShort = React.useMemo(
    () => directionPerformance(computed),
    [computed]
  );

  const thisMonth = React.useMemo(() => {
    const key = new Date().toISOString().slice(0, 7);
    const m = byMonth.find((b) => b.key === key);
    return m?.pnl ?? 0;
  }, [byMonth]);

  const donutData = longShort.map((d) => ({
    name: d.label,
    value: d.trades,
    color: d.color,
  }));

  const recent = computed.slice(0, 6);
  const openPositions = computed.filter((t) => t.status === "open");

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          index={0}
          label="Net P&L"
          value={formatCurrency(summary.netPnl)}
          sub={`This month ${formatCurrency(thisMonth, { sign: true })}`}
          icon={Wallet}
          tone={summary.netPnl >= 0 ? "profit" : "loss"}
        />
        <StatCard
          index={1}
          label="Win Rate"
          value={formatPercent(summary.winRate, 1)}
          sub={`${summary.streak} win streak`}
          icon={Percent}
          tone="primary"
        />
        <StatCard
          index={2}
          label="Profit Factor"
          value={summary.profitFactor > 99 ? "∞" : summary.profitFactor.toFixed(2)}
          sub={`${formatCurrency(summary.grossProfit)} / −${formatCurrency(summary.grossLoss)}`}
          icon={Scale}
          tone={summary.profitFactor >= 1 ? "profit" : "loss"}
        />
        <StatCard
          index={3}
          label="Avg Win / Loss"
          value={formatCurrency(summary.avgWin)}
          sub={`Avg loss ${formatCurrency(-summary.avgLoss)}`}
          icon={TrendingUp}
          tone="default"
        />
        <StatCard
          index={4}
          label="Total Trades"
          value={String(summary.totalTrades)}
          sub={`${summary.openTrades} open position${summary.openTrades === 1 ? "" : "s"}`}
          icon={ListChecks}
          tone="default"
        />
        <StatCard
          index={5}
          label="Expectancy"
          value={formatCurrency(summary.expectancy)}
          sub={`${formatR(summary.expectancyR)} per trade`}
          icon={Gauge}
          tone={summary.expectancy >= 0 ? "profit" : "loss"}
        />
      </div>

      {/* Equity + snapshot */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Equity Curve"
          description="Cumulative realized P&L across all closed trades"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-profit" />
              Realized equity
            </div>
          }
        >
          <EquityChart data={equity} />
        </ChartCard>

        <ChartCard
          title="Long vs Short"
          description="Direction exposure & outcomes"
        >
          <DonutChart
            data={donutData}
            centerValue={`${summary.totalTrades}`}
            centerLabel="trades"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {longShort.map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-border bg-secondary/40 p-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {d.label}
                </p>
                <p
                  className={`mt-1 font-mono text-[15px] font-bold tabular-nums ${
                    d.netPnl >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(d.netPnl, { compact: true })}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {d.trades} trades · {formatPercent(d.winRate, 0)} WR
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* P&L + strategy */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="P&L Distribution"
          description="Net profit and loss over time"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer",
                    period === p.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
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

        <ChartCard
          title="Performance by Strategy"
          description="Net P&L per playbook strategy"
        >
          <PerformanceBars data={byStrategy} height={260} />
        </ChartCard>
      </div>

      {/* Symbol + drawdown */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Performance by Symbol"
          description="Where your edge is strongest"
          className="xl:col-span-2"
        >
          <PerformanceBars data={bySymbol.slice(0, 9)} height={240} />
        </ChartCard>
        <ChartCard
          title="Drawdown"
          description={`Max drawdown ${formatPercent(summary.maxDrawdown, 1)}`}
        >
          <DrawdownChart data={drawdown} />
        </ChartCard>
      </div>

      {/* Open positions */}
      {openPositions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Open Positions
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {openPositions.length} running
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {openPositions.map((t) => (
              <TradeCard key={t.id} trade={t} />
            ))}
          </div>
        </section>
      )}

      {/* Recent trades */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              Recent Trades
            </h2>
            <p className="text-[12.5px] text-muted-foreground">
              Your latest executions, ready to review
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trades">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recent.map((t, i) => (
            <TradeCard key={t.id} trade={t} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
