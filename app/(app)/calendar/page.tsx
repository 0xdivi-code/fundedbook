"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useJournal } from "@/lib/store";
import { computeTrade, pnlByDay } from "@/lib/analytics";
import { TradeCard } from "@/components/trades/trade-card";
import { DirectionBadge } from "@/components/trades/trade-badges";
import { EmptyDataHint } from "@/components/dashboard/empty-hint";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function CalendarPage() {
  const { trades } = useJournal();
  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);

  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = React.useState<Date>(new Date());

  const dayPnl = React.useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    for (const b of pnlByDay(computed)) {
      map.set(b.key, { pnl: b.pnl, count: b.trades });
    }
    return map;
  }, [computed]);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthKey = format(month, "yyyy-MM");
  const monthStats = React.useMemo(() => {
    const monthTrades = computed.filter(
      (t) => format(new Date(t.closedAt ?? t.openedAt), "yyyy-MM") === monthKey
    );
    const pnl = monthTrades.reduce((a, t) => a + t.pnl, 0);
    const wins = monthTrades.filter((t) => t.pnl > 0).length;
    const winRate = monthTrades.length ? (wins / monthTrades.length) * 100 : 0;
    return { pnl, count: monthTrades.length, winRate };
  }, [computed, monthKey]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedTrades = computed.filter(
    (t) => format(new Date(t.closedAt ?? t.openedAt), "yyyy-MM-dd") === selectedKey
  );

  return (
    <div className="space-y-5">
      {trades.length === 0 && (
        <EmptyDataHint
          title="Your calendar fills in as you trade"
          text="Each day you log will show up as a green or red P&L cell — quickly revealing your best and worst trading days."
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight">
              {format(month, "MMMM yyyy")}
            </h2>
            <p className="text-[12.5px] text-muted-foreground">
              {monthStats.count} trades · {formatPercent(monthStats.winRate, 0)} win rate ·{" "}
              <span className={monthStats.pnl >= 0 ? "text-profit" : "text-loss"}>
                {formatCurrency(monthStats.pnl, { sign: true })}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(new Date()); }}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Grid */}
        <Card className="p-5 xl:col-span-2">
          <div className="grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const data = dayPnl.get(key);
              const inMonth = isSameMonth(day, month);
              const isSel = isSameDay(day, selected);
              const today = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex aspect-[1/0.9] flex-col items-center justify-center rounded-xl border p-1 transition-all cursor-pointer",
                    inMonth
                      ? "border-border bg-secondary/30 hover:border-primary/40"
                      : "border-transparent bg-transparent opacity-35 hover:opacity-60",
                    isSel && "border-primary/60 bg-primary/10 ring-1 ring-primary/30",
                    today && !isSel && "border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "text-[12.5px] font-medium tabular-nums",
                      inMonth ? "text-foreground" : "text-muted-foreground",
                      today && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {data && (
                    <span
                      className={cn(
                        "mt-0.5 font-mono text-[11px] font-semibold tabular-nums",
                        data.pnl >= 0 ? "text-profit" : "text-loss"
                      )}
                    >
                      {formatCurrency(data.pnl, { compact: true })}
                    </span>
                  )}
                  {data && data.count > 0 && (
                    <span className="absolute bottom-1.5 flex gap-0.5">
                      {Array.from({ length: Math.min(3, data.count) }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            data.pnl >= 0 ? "bg-profit" : "bg-loss"
                          )}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-profit" /> Profitable day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-loss" /> Losing day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/60" /> Today
            </span>
          </div>
        </Card>

        {/* Day panel */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight">
                {format(selected, "EEEE, MMM d")}
              </h3>
              <p className="text-[12.5px] text-muted-foreground">
                {selectedTrades.length} trade{selectedTrades.length === 1 ? "" : "s"} closed
              </p>
            </div>
            {(() => {
              const p = selectedTrades.reduce((a, t) => a + t.pnl, 0);
              return (
                <span
                  className={cn(
                    "font-mono text-[17px] font-bold tabular-nums",
                    p >= 0 ? "text-profit" : "text-loss"
                  )}
                >
                  {formatCurrency(p, { sign: true })}
                </span>
              );
            })()}
          </div>

          <div className="space-y-2">
            {selectedTrades.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No trades on this day.
              </div>
            )}
            {selectedTrades.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/trades/${t.id}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[14px] font-bold text-foreground">
                      {t.symbol}
                    </span>
                    <DirectionBadge direction={t.direction} />
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[13.5px] font-semibold tabular-nums",
                      t.pnl >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatCurrency(t.pnl, { sign: true })}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Selected day trade cards */}
      {selectedTrades.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[15px] font-semibold tracking-tight">
            Trades on {format(selected, "MMMM d")}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedTrades.map((t, i) => (
              <TradeCard key={t.id} trade={t} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
