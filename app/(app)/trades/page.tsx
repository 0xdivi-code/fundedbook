"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Star,
  Table2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJournal } from "@/lib/store";
import { computeTrade } from "@/lib/analytics";
import { TradeCard } from "@/components/trades/trade-card";
import {
  DirectionBadge,
  GradeBadge,
  StrategyBadge,
} from "@/components/trades/trade-badges";
import { useUI } from "@/components/layout/ui-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPrice, formatR, formatShortDate } from "@/lib/format";
import type { ComputedTrade, Strategy } from "@/lib/types";

type View = "grid" | "table";
type DirectionFilter = "all" | "long" | "short";
type StatusFilter = "all" | "closed" | "open";
type SortKey = "newest" | "oldest" | "pnl-desc" | "pnl-asc" | "r-desc";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "pnl-desc", label: "Biggest profit" },
  { value: "pnl-asc", label: "Biggest loss" },
  { value: "r-desc", label: "Highest R multiple" },
];

export default function TradesPage() {
  const { trades, strategies, deleteTrade } = useJournal();
  const { openAdd } = useUI();
  const { toast } = useToast();

  const [view, setView] = React.useState<View>("grid");
  const [query, setQuery] = React.useState("");
  const [direction, setDirection] = React.useState<DirectionFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [strategyId, setStrategyId] = React.useState("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = React.useState(12);

  const resetPage = () => setVisibleCount(12);

  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = computed.filter((t) => {
      if (direction !== "all" && t.direction !== direction) return false;
      if (status !== "all" && t.status !== status) return false;
      if (strategyId !== "all" && t.strategyId !== strategyId) return false;
      if (q) {
        const strat = strategies.find((s) => s.id === t.strategyId)?.name ?? "";
        const hay = `${t.symbol} ${strat} ${t.tags.join(" ")} ${t.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return +new Date(a.openedAt) - +new Date(b.openedAt);
        case "pnl-desc":
          return b.pnl - a.pnl;
        case "pnl-asc":
          return a.pnl - b.pnl;
        case "r-desc":
          return (b.rMultiple ?? -999) - (a.rMultiple ?? -999);
        default:
          return +new Date(b.openedAt) - +new Date(a.openedAt);
      }
    });
    return list;
  }, [computed, query, direction, status, strategyId, sort, strategies]);

  const totalPnl = filtered.reduce((a, t) => a + t.pnl, 0);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const handleDelete = (t: ComputedTrade) => {
    deleteTrade(t.id);
    toast({
      variant: "info",
      title: "Trade deleted",
      description: `${t.symbol} ${t.direction.toUpperCase()} was removed from your journal.`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Search symbol, strategy, tag, notes…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
            {(
              [
                ["all", "All"],
                ["long", "Long"],
                ["short", "Short"],
              ] as [DirectionFilter, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setDirection(v);
                  resetPage();
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer",
                  direction === v
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              resetPage();
            }}
          >
            <SelectTrigger className="h-8 w-[110px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={strategyId}
            onValueChange={(v) => {
              setStrategyId(v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-8 w-[150px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All strategies</SelectItem>
              {strategies.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              resetPage();
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5 transition-all cursor-pointer",
                view === "grid"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "rounded-md p-1.5 transition-all cursor-pointer",
                view === "table"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between px-1 text-[13px] text-muted-foreground">
        <span>
          {filtered.length} trade{filtered.length === 1 ? "" : "s"}
        </span>
        <span className="font-mono tabular-nums">
          Net{" "}
          <span className={totalPnl >= 0 ? "text-profit" : "text-loss"}>
            {formatCurrency(totalPnl, { sign: true })}
          </span>
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={query} onClear={() => setQuery("")} onAdd={() => openAdd()} />
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((t, i) => (
                <TradeCard key={t.id} trade={t} index={i} />
              ))}
            </div>
          ) : (
            <Table
              trades={visible}
              strategies={strategies}
              onEdit={(t) => openAdd(t)}
              onDelete={handleDelete}
            />
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 12)}
              >
                Load more trades
                <span className="text-muted-foreground">
                  ({filtered.length - visibleCount} remaining)
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  query,
  onClear,
  onAdd,
}: {
  query: string;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">No trades found</h3>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
        {query
          ? `Nothing matches “${query}”. Try a different search or clear your filters.`
          : "Log your first trade to start building your journal."}
      </p>
      <div className="mt-5 flex gap-2">
        {query && (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        )}
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Log a trade
        </Button>
      </div>
    </div>
  );
}

function Table({
  trades,
  strategies,
  onEdit,
  onDelete,
}: {
  trades: ComputedTrade[];
  strategies: Strategy[];
  onEdit: (t: ComputedTrade) => void;
  onDelete: (t: ComputedTrade) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground/70">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Strategy</th>
              <th className="px-4 py-3 text-right font-medium">Entry</th>
              <th className="px-4 py-3 text-right font-medium">Exit</th>
              <th className="px-4 py-3 text-right font-medium">R</th>
              <th className="px-4 py-3 text-right font-medium">P&L</th>
              <th className="px-4 py-3 text-center font-medium">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const strat = strategies.find((s) => s.id === t.strategyId);
              return (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-primary/[0.04]"
                >
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {formatShortDate(t.openedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/trades/${t.id}`}
                      className="font-mono text-[14px] font-bold text-foreground hover:text-primary"
                    >
                      {t.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <DirectionBadge direction={t.direction} />
                  </td>
                  <td className="px-4 py-3">
                    <StrategyBadge strategy={strat} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-foreground">
                    {formatPrice(t.entryPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
                    {t.exitPrice != null ? formatPrice(t.exitPrice) : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono text-[13px] font-semibold tabular-nums",
                      t.rMultiple != null && t.rMultiple >= 0
                        ? "text-profit"
                        : "text-loss"
                    )}
                  >
                    {formatR(t.rMultiple)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono text-[13px] font-bold tabular-nums",
                      t.pnl >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {t.status === "open" ? "—" : formatCurrency(t.pnl, { sign: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <GradeBadge grade={t.grade || "–"} />
                      {t.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {t.rating}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(t)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/trades/${t.id}`}>
                            <ArrowUpRight className="h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(t)}
                          className="text-loss focus:text-loss"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
