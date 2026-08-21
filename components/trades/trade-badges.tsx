"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Strategy } from "@/lib/types";
import { formatR } from "@/lib/format";

export function DirectionBadge({
  direction,
  className,
}: {
  direction: "long" | "short";
  className?: string;
}) {
  const long = direction === "long";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        long ? "bg-profit/12 text-profit" : "bg-loss/12 text-loss",
        className
      )}
    >
      {long ? (
        <ArrowUpRight className="h-3 w-3" strokeWidth={3} />
      ) : (
        <ArrowDownRight className="h-3 w-3" strokeWidth={3} />
      )}
      {long ? "Long" : "Short"}
    </span>
  );
}

export function StrategyDot({ strategy }: { strategy?: Strategy }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: strategy?.color ?? "#7b9188" }}
    />
  );
}

export function StrategyBadge({
  strategy,
  className,
}: {
  strategy?: Strategy;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-primary/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      <StrategyDot strategy={strategy} />
      {strategy?.shortName ?? "—"}
    </span>
  );
}

export function RBadge({ r }: { r: number | null }) {
  if (r == null || !isFinite(r)) {
    return <Badge variant="muted">open</Badge>;
  }
  const tone = r >= 0 ? "profit" : "loss";
  return (
    <Badge variant={tone} className="font-mono font-semibold">
      {formatR(r)}
    </Badge>
  );
}

export function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    A: "bg-profit/15 text-profit",
    B: "bg-sky-400/15 text-sky-400",
    C: "bg-amber-400/15 text-amber-400",
    D: "bg-loss/15 text-loss",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold",
        map[grade] ?? "bg-muted text-muted-foreground"
      )}
    >
      {grade}
    </span>
  );
}
