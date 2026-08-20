"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  CornerDownLeft,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUI } from "./ui-provider";
import { useJournal } from "@/lib/store";
import { computeTrade } from "@/lib/analytics";
import { formatCurrency, relativeTime } from "@/lib/format";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  type: "nav" | "trade" | "action";
  label: string;
  hint: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

export function CommandPalette() {
  const { commandOpen, closeCommand, openAdd, openCommand } = useUI();
  const { trades, strategies } = useJournal();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const onOpen = () => openCommand();
    window.addEventListener("fundedbook:command", onOpen as EventListener);
    return () =>
      window.removeEventListener("fundedbook:command", onOpen as EventListener);
  }, [openCommand]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setQuery("");
      setActive(0);
    } else {
      closeCommand();
    }
  };

  const items = React.useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const computed = trades.map(computeTrade);

    const nav: Item[] = NAV_ITEMS.filter(
      (n) => !q || n.label.toLowerCase().includes(q)
    ).map((n) => ({
      id: `nav-${n.href}`,
      type: "nav",
      label: n.label,
      hint: n.section,
      icon: <n.icon className="h-4 w-4" />,
      onSelect: () => {
        router.push(n.href);
        closeCommand();
      },
    }));

    const matchingTrades = computed
      .filter((t) => {
        if (!q) return false;
        const strat = strategies.find((s) => s.id === t.strategyId)?.name ?? "";
        return (
          t.symbol.toLowerCase().includes(q) ||
          strat.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 7);

    const tradesList: Item[] = matchingTrades.map((t) => ({
      id: `trade-${t.id}`,
      type: "trade",
      label: `${t.symbol} · ${t.direction.toUpperCase()}`,
      hint: relativeTime(t.closedAt ?? t.openedAt),
      icon:
        t.direction === "long" ? (
          <ArrowUpRight className="h-4 w-4 text-profit" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-loss" />
        ),
      right: (
        <span
          className={cn(
            "tabular-nums text-[13px] font-medium",
            t.pnl >= 0 ? "text-profit" : "text-loss"
          )}
        >
          {formatCurrency(t.pnl)}
        </span>
      ),
      onSelect: () => {
        router.push(`/trades/${t.id}`);
        closeCommand();
      },
    }));

    const actions: Item[] = [
      {
        id: "action-add",
        type: "action",
        label: "Add a new trade",
        hint: "Action",
        icon: <Plus className="h-4 w-4" />,
        onSelect: () => {
          closeCommand();
          openAdd();
        },
      },
    ];

    return [...(q ? tradesList : []), ...nav, ...actions];
  }, [query, trades, strategies, router, closeCommand, openAdd]);

  const flat = items;
  const clamped = Math.min(active, Math.max(0, flat.length - 1));

  const run = (item: Item) => item.onSelect();

  return (
    <Dialog open={commandOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => (a + 1) % Math.max(1, flat.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => (a - 1 + flat.length) % Math.max(1, flat.length));
              } else if (e.key === "Enter" && flat[clamped]) {
                e.preventDefault();
                run(flat[clamped]);
              }
            }}
            placeholder="Search trades, symbols, strategies, pages…"
            className="h-14 w-full bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No results for “{query}”
            </p>
          )}
          {flat.map((item, i) => (
            <button
              key={item.id}
              onClick={() => run(item)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer",
                i === clamped && "bg-accent"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                {item.icon}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-[13.5px] font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {item.hint}
                </span>
              </span>
              {item.right}
              {i === clamped && (
                <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
