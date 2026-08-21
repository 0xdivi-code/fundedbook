"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "default" | "profit" | "loss" | "primary";
  delta?: number | null;
  index?: number;
}

const toneStyles: Record<string, { icon: string; value: string }> = {
  default: { icon: "bg-secondary text-muted-foreground", value: "text-foreground" },
  profit: { icon: "bg-profit/12 text-profit", value: "text-profit" },
  loss: { icon: "bg-loss/12 text-loss", value: "text-loss" },
  primary: {
    icon: "bg-[linear-gradient(135deg,rgba(215,255,62,0.18),rgba(0,245,160,0.18))] text-primary",
    value: "text-gradient",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  delta,
  index = 0,
}: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="card-hover group relative overflow-hidden p-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
          {delta != null && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                delta >= 0
                  ? "bg-profit/12 text-profit"
                  : "bg-loss/12 text-loss"
              )}
            >
              {delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3" strokeWidth={2.6} />
              ) : (
                <ArrowDownRight className="h-3 w-3" strokeWidth={2.6} />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>

        <p className="mt-4 font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1.5 font-display text-[24px] font-bold leading-none tracking-tight tabular-nums",
            styles.value
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-2 text-[12px] text-muted-foreground">{sub}</p>
        )}
      </Card>
    </motion.div>
  );
}
