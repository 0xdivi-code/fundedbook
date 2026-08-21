"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUI } from "./ui-provider";
import { useJournal } from "@/lib/store";
import { useAuth, initialsFromEmail } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { computeTrade } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function titleFor(pathname: string): { title: string; sub: string } {
  if (pathname === "/")
    return { title: "Dashboard", sub: "Your trading performance at a glance" };
  if (pathname.startsWith("/trades/"))
    return { title: "Trade Review", sub: "Post-trade analysis & screenshots" };
  if (pathname.startsWith("/trades"))
    return { title: "Journal", sub: "Every trade, logged and reviewed" };
  if (pathname.startsWith("/calendar"))
    return { title: "Calendar", sub: "Performance mapped over time" };
  if (pathname.startsWith("/analytics"))
    return { title: "Analytics", sub: "Deep-dive into your edge" };
  if (pathname.startsWith("/playbook"))
    return { title: "Playbook", sub: "Your strategies & rules" };
  if (pathname.startsWith("/settings"))
    return { title: "Settings", sub: "Preferences & account" };
  return { title: "FundedBook", sub: "Trading journal" };
}

interface Notification {
  title: string;
  detail: string;
  time: string;
  dot: "profit" | "loss" | "primary";
}

/** Insights computed from the signed-in user's own trades — no fake data. */
function useNotifications(): Notification[] {
  const { trades } = useJournal();

  return useMemo(() => {
    const computed = trades.map(computeTrade);
    const closed = computed.filter((t) => t.status === "closed");

    if (closed.length === 0) {
      const open = computed.filter((t) => t.status === "open");
      if (open.length > 0) {
        return [
          {
            title: `${open.length} open position${open.length === 1 ? "" : "s"}`,
            detail: "Close them in the journal to update your stats.",
            time: "now",
            dot: "primary",
          },
        ];
      }
      return [
        {
          title: "Welcome to FundedBook",
          detail: "Log your first trade to start tracking your edge.",
          time: "now",
          dot: "primary",
        },
      ];
    }

    const out: Notification[] = [];

    // Last 7 days P&L.
    const since = subDays(new Date(), 7).getTime();
    const weekly = closed.filter(
      (t) => new Date(t.closedAt ?? t.openedAt).getTime() >= since
    );
    if (weekly.length > 0) {
      const pnl = weekly.reduce((a, t) => a + t.pnl, 0);
      out.push({
        title: `${weekly.length} trade${weekly.length === 1 ? "" : "s"} in the last 7 days`,
        detail: `Net ${formatCurrency(pnl, { sign: true })} this week`,
        time: "live",
        dot: pnl >= 0 ? "profit" : "loss",
      });
    }

    // Current win streak.
    const byClose = [...closed].sort(
      (a, b) =>
        new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime()
    );
    let streak = 0;
    for (const t of byClose) {
      if (t.isWin) streak++;
      else break;
    }
    if (streak >= 3) {
      out.push({
        title: `${streak} wins in a row`,
        detail: "Momentum — stay disciplined and stick to the plan.",
        time: "live",
        dot: "profit",
      });
    }

    const open = computed.filter((t) => t.status === "open");
    if (open.length > 0) {
      out.push({
        title: `${open.length} open position${open.length === 1 ? "" : "s"}`,
        detail: "Close them in the journal to update your stats.",
        time: "live",
        dot: "primary",
      });
    }

    const last = byClose[0];
    if (last) {
      out.push({
        title: `Latest: ${last.symbol} ${formatCurrency(last.pnl, { sign: true })}`,
        detail: `${last.direction === "long" ? "Long" : "Short"} · ${last.duration} · ${
          last.lessons ? "lesson logged" : "tip: add a lesson to this trade"
        }`,
        time: last.closedAt ? format(new Date(last.closedAt), "MMM d") : "—",
        dot: last.pnl >= 0 ? "profit" : "loss",
      });
    }

    return out.slice(0, 4);
  }, [trades]);
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, sub } = titleFor(pathname);
  const { openAdd, openCommand } = useUI();
  const { trades, clearAllData } = useJournal();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const notifications = useNotifications();

  const email = user?.email ?? "";
  const initials = initialsFromEmail(email);
  const hasTrades = trades.length > 0;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="hidden truncate text-[12px] text-muted-foreground sm:block">
          {sub} · {format(new Date(), "EEEE, MMM d")}
        </p>
      </div>

      <button
        onClick={openCommand}
        className="group hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-[13px] text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground md:flex cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search trades…</span>
        <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={openCommand}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" />
            {hasTrades && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-profit ring-2 ring-background animate-pulse-dot" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px]">
          <DropdownMenuLabel className="text-[13px] text-foreground">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.map((n) => (
            <DropdownMenuItem key={n.title} className="items-start py-2.5">
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  n.dot === "profit"
                    ? "bg-profit"
                    : n.dot === "loss"
                      ? "bg-loss"
                      : "bg-primary"
                )}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium leading-tight">
                  {n.title}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {n.detail}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  {n.time}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={() => openAdd()} className="shadow-glow">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Trade</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2 transition-colors hover:border-white/15 cursor-pointer">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#7c6aff] text-[11px] font-bold text-white">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <span className="flex flex-col">
              <span className="max-w-[180px] truncate text-[13px] font-medium text-foreground">
                {email || "Signed in"}
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Your private journal
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            New trade
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <SettingsIcon className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!hasTrades}
            onClick={() => {
              clearAllData();
              toast({
                variant: "info",
                title: "Journal cleared",
                description:
                  "All trades, strategies and settings were reset to a clean slate.",
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear all data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
