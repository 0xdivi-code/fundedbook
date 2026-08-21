"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  Command,
  LayoutDashboard,
  Lock,
  PenLine,
  Plus,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/components/layout/ui-provider";
import { useAuth } from "@/components/auth/auth-provider";

interface Step {
  icon: typeof Plus;
  title: string;
  text: string;
  cta: string;
  href?: string;
}

const STEPS: Step[] = [
  {
    icon: Plus,
    title: "Log your first trade",
    text: "Symbol, direction, entry/exit, stop and size. The drawer computes P&L, risk and R-multiple live as you type.",
    cta: "Add your first trade",
  },
  {
    icon: PenLine,
    title: "Write the story, not just the numbers",
    text: "Open the trade afterwards to add screenshots, a grade, what you did well and the lesson. This is where the edge is found.",
    cta: "Open the journal",
    href: "/trades",
  },
  {
    icon: Target,
    title: "Make the playbook yours",
    text: "We added four editable starter strategies so you can see the format. Replace them with the setups you actually trade.",
    cta: "Open the playbook",
    href: "/playbook",
  },
  {
    icon: BarChart3,
    title: "Review weekly, improve monthly",
    text: "After ~20 logged trades, Analytics shows which strategies, symbols and times of day actually pay you.",
    cta: "Peek at analytics",
    href: "/analytics",
  },
];

const TOUR: { icon: typeof Plus; title: string; text: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    text: "Net P&L, win rate, profit factor, expectancy, equity curve and drawdown — your performance at a glance.",
  },
  {
    icon: BookOpen,
    title: "Journal",
    text: "Every trade in a searchable feed. Grid or table view, filter by symbol, strategy, result or tag.",
  },
  {
    icon: Camera,
    title: "Trade review",
    text: "Click any trade for full-size screenshots, entry/exit stats, notes, lessons, a setup grade and a quick verdict.",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    text: "Daily and monthly P&L heatmap. Spot the days — and days of week — that hurt you.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Deep breakdowns: strategy vs symbol, long vs short, hour of day, rating distribution and drawdown.",
  },
  {
    icon: Target,
    title: "Playbook & Settings",
    text: "Define setups with rules and confluences, tune risk per trade, and export a JSON backup anytime.",
  },
];

export function GettingStarted() {
  const { openAdd } = useUI();
  const { user } = useAuth();
  const email = user?.email ?? "";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <section className="gradient-border relative overflow-hidden rounded-2xl border border-transparent bg-[linear-gradient(155deg,rgba(215,255,62,0.08)_0%,rgba(0,245,160,0.06)_35%,rgba(8,13,11,0.96)_100%)] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-[100px]"
        />
        <div className="relative">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Welcome to FundedBook
          </p>
          <h1 className="mt-3 text-[21px] font-bold leading-[1.25] sm:text-[25px]">
            Your journal is empty —{" "}
            <span className="text-gradient">and that&apos;s a good thing.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            No sample data, no fake P&amp;L{email ? (
              <>
                {" "}— this journal belongs to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </>
            ) : null}
            . Every stat you see from now on will be 100% yours. Here&apos;s how
            to get value from it in four steps.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="card-hover flex flex-col rounded-2xl border border-border bg-[linear-gradient(158deg,rgba(0,245,160,0.045)_0%,rgba(10,16,13,0.92)_38%,rgba(6,11,9,0.96)_100%)] p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(215,255,62,0.18),rgba(0,245,160,0.16))] text-primary">
                <step.icon className="h-[18px] w-[18px]" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-lemon/70">
                  STEP {i + 1}
                </span>
              </div>
            </div>
            <h2 className="mt-3 text-[15px] font-semibold tracking-tight">
              {step.title}
            </h2>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
              {step.text}
            </p>
            {step.href ? (
              <Button variant="outline" size="sm" className="mt-4 w-fit" asChild>
                <Link href={step.href}>
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-fit"
                onClick={() => openAdd()}
              >
                <Plus className="h-3.5 w-3.5" />
                {step.cta}
              </Button>
            )}
          </div>
        ))}
      </section>

      {/* Platform tour */}
      <section className="rounded-2xl border border-border bg-[linear-gradient(158deg,rgba(0,245,160,0.04)_0%,rgba(10,16,13,0.92)_38%,rgba(6,11,9,0.96)_100%)] p-6 sm:p-8">
        <h2 className="text-[16px] font-semibold tracking-tight">
          How the platform works
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Six sections, one loop: log → review → refine.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOUR.map((t) => (
            <div
              key={t.title}
              className="card-hover rounded-xl border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card text-primary">
                  <t.icon className="h-4 w-4" />
                </span>
                <h3 className="text-[13.5px] font-semibold">{t.title}</h3>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {t.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5" />
            Pro tip: press{" "}
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              ⌘K
            </kbd>{" "}
            anywhere to search trades, symbols and pages.
          </span>
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Your data is private — stored per account, in your browser.
          </span>
        </div>
      </section>
    </div>
  );
}
