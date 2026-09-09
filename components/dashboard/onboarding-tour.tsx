"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Rocket,
  Settings as SettingsIcon,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJournal } from "@/lib/store";
import { useUI } from "@/components/layout/ui-provider";
import { cn } from "@/lib/utils";

/**
 * Guided onboarding tour.
 *
 * Pops automatically for brand-new users (once per account — the state lives
 * in the database, not the browser). The modal walks through every feature of
 * the platform with a Next / Skip button, navigating to each feature's page
 * as the tour progresses. Users can replay it anytime from Settings.
 */

interface TourStep {
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  text: string;
  /** Optional tip shown under the description. */
  tip?: string;
  /** Feature page the tour navigates to when this step becomes active. */
  href?: string;
}

const FEATURE_COUNT = 7;

const STEPS: TourStep[] = [
  {
    icon: Sparkles,
    kicker: "Welcome",
    title: "Welcome to FundedBook",
    text: "You're starting with a clean journal — no demo data, no fake P&L. Everything you log is saved to your private cloud database, so your history follows you across devices. Here's how to get value from the platform.",
    tip: "The tour takes about a minute — skip anytime, you can replay it later in Settings.",
  },
  {
    icon: LayoutDashboard,
    kicker: `Feature 1 of ${FEATURE_COUNT}`,
    title: "Dashboard",
    text: "Net P&L, win rate, profit factor, expectancy, equity curve and drawdown — your whole performance computed live from your logged trades. It stays empty until you log something real.",
    tip: "Press ⌘K (or Ctrl+K) anywhere to search trades, symbols and pages.",
    href: "/",
  },
  {
    icon: BookOpen,
    kicker: `Feature 2 of ${FEATURE_COUNT}`,
    title: "Journal",
    text: "Every trade in a searchable, filterable feed — grid or table view, filtered by symbol, strategy, result or tag. Hit “Log a Trade” and the drawer computes P&L, risk and R-multiple live as you type.",
    tip: "Trades can be edited or closed at any time — nothing is set in stone.",
    href: "/trades",
  },
  {
    icon: Camera,
    kicker: `Feature 3 of ${FEATURE_COUNT}`,
    title: "Trade review",
    text: "Open any trade to add screenshots, grade the setup A–D, and write what you did well plus the lesson. Drag-and-drop chart images straight in — this is where the edge is found.",
    tip: "After ~20 reviewed trades, patterns in your execution start to surface.",
  },
  {
    icon: CalendarDays,
    kicker: `Feature 4 of ${FEATURE_COUNT}`,
    title: "Calendar",
    text: "A monthly P&L heatmap with per-day drill-down. Spot the days — and the days of week — that consistently pay you or hurt you.",
    href: "/calendar",
  },
  {
    icon: BarChart3,
    kicker: `Feature 5 of ${FEATURE_COUNT}`,
    title: "Analytics",
    text: "Deep breakdowns once you have data: strategy vs symbol performance, long vs short, hour of day, rating distribution and drawdown. Review weekly, improve monthly.",
    href: "/analytics",
  },
  {
    icon: Target,
    kicker: `Feature 6 of ${FEATURE_COUNT}`,
    title: "Playbook",
    text: "Codify the setups you actually trade: rules, confluences, market and timeframe — with live performance stats per strategy. Four editable starter strategies show you the format.",
    href: "/playbook",
  },
  {
    icon: SettingsIcon,
    kicker: `Feature 7 of ${FEATURE_COUNT}`,
    title: "Settings & backup",
    text: "Tune account size, risk per trade and preferences. Export your whole journal as a JSON backup anytime — or clear the slate and start over.",
    tip: "Your data is private, stored per account in your own cloud database.",
    href: "/settings",
  },
  {
    icon: Rocket,
    kicker: "You're all set",
    title: "Log → review → refine",
    text: "That's the whole loop. Your journal is empty and waiting — every stat you see from now on will be 100% yours. Log your first trade and the dashboard comes alive.",
  },
];

export function OnboardingTour() {
  const { hydrated, tourCompleted, completeTour } = useJournal();
  const { openAdd } = useUI();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // Pop the tour automatically for first-time users (per account, persisted
  // in the database). Also re-opens when the tour is replayed from Settings.
  React.useEffect(() => {
    if (hydrated && !tourCompleted) {
      // Opening the tour in response to journal state arriving from the
      // database (or a replay request from Settings) — deliberate side
      // effect; the component stays mounted, so also reset to step 0.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      setStep(0);
    }
  }, [hydrated, tourCompleted]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  /** Enter a step — navigating to its feature page so the modal pops there. */
  const goToStep = (index: number) => {
    const next = STEPS[index];
    if (next.href) router.push(next.href);
    setStep(index);
  };

  const finish = () => {
    setOpen(false);
    if (!tourCompleted) completeTour();
    router.push("/");
  };

  const skip = () => {
    setOpen(false);
    if (!tourCompleted) completeTour();
    // If the tour had already navigated the user around, bring them home.
    if (step > 0) router.push("/");
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    goToStep(step + 1);
  };

  const startFirstTrade = () => {
    finish();
    openAdd();
  };

  const Icon = current.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) skip();
      }}
    >
      <DialogContent className="max-w-[460px] gap-0 overflow-hidden p-0">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-[90px]"
        />

        <div className="relative px-6 pb-5 pt-7 sm:px-7">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(215,255,62,0.2),rgba(0,245,160,0.16))] text-primary">
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-lemon/70">
                    {current.kicker}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                  </p>
                </div>
              </div>

              <DialogTitle className="mt-4 text-[19px] font-bold leading-tight tracking-tight">
                {current.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {current.text}
              </DialogDescription>

              {current.tip && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {current.tip}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-t border-border bg-secondary/30 px-6 py-4 sm:px-7">
          {isLast ? (
            <>
              <Button variant="outline" size="sm" onClick={startFirstTrade}>
                <Plus className="h-3.5 w-3.5" />
                Add my first trade
              </Button>
              <Button size="sm" onClick={finish}>
                <Check className="h-3.5 w-3.5" />
                Start journaling
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip tour
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" aria-hidden>
                  {STEPS.map((s, i) => (
                    <span
                      key={s.title}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        i === step ? "w-5 bg-primary" : "w-1.5 bg-border"
                      )}
                    />
                  ))}
                </div>
                <Button size="sm" onClick={next}>
                  {step === 0 ? "Start tour" : "Next"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
