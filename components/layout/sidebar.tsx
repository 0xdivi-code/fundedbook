"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, NAV_SECTIONS } from "./nav";
import { useJournal } from "@/lib/store";
import { useAuth, initialsFromEmail } from "@/components/auth/auth-provider";
import { computeTrade, summarize } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/format";

export function SidebarContent() {
  const pathname = usePathname();
  const { trades } = useJournal();
  const { user } = useAuth();
  const computed = trades.map(computeTrade);
  const summary = summarize(computed);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="transition-opacity hover:opacity-85">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section} className="mb-4">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50">
              {section}
            </p>
            <div className="flex flex-col gap-0.5">
              {NAV_ITEMS.filter((i) => i.section === section).map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-primary/[0.12] ring-1 ring-inset ring-primary/25"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "relative h-[17px] w-[17px] transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground/70 group-hover:text-foreground"
                      )}
                      strokeWidth={2.2}
                    />
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.14] via-card to-card p-4">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              All-time P&L
            </span>
          </div>
          <p
            className={cn(
              "mt-2 text-[22px] font-bold leading-none tracking-tight tabular-nums",
              summary.netPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {trades.length === 0 ? "—" : formatCurrency(summary.netPnl)}
          </p>
          {trades.length === 0 ? (
            <p className="mt-3 text-[12px] leading-snug text-muted-foreground">
              Log your first trade to start tracking your edge.
            </p>
          ) : (
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">
                {formatPercent(summary.winRate, 0)} win rate
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 font-medium",
                  summary.netPnl >= 0 ? "text-profit" : "text-loss"
                )}
              >
                <ArrowUpRight className="h-3 w-3" />
                {summary.totalTrades} trades
              </span>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          className="mt-3 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#7c6aff] text-[11px] font-bold text-white">
            {initialsFromEmail(user?.email)}
          </div>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="max-w-[150px] truncate text-[13px] font-medium text-foreground">
              {user?.email ?? "Signed in"}
            </span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              Account & settings
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
