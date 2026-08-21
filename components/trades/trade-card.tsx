"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Images, Maximize2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { computeTrade } from "@/lib/analytics";
import { useJournal } from "@/lib/store";
import { useLightbox, ShotVisual } from "./lightbox";
import { DirectionBadge, GradeBadge, RBadge, StrategyBadge } from "./trade-badges";
import { formatCurrency, formatPrice, formatShortDate } from "@/lib/format";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TradeCard({ trade, index = 0 }: { trade: Trade; index?: number }) {
  const router = useRouter();
  const { strategies } = useJournal();
  const { open } = useLightbox();
  const t = computeTrade(trade);
  const strategy = strategies.find((s) => s.id === t.strategyId);
  const hero = t.screenshots[0];

  const openDetails = () => router.push(`/trades/${t.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="card-hover group overflow-hidden">
        {/* Header */}
        <button
          onClick={openDetails}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[15px] font-bold tracking-tight text-foreground">
              {t.symbol}
            </span>
            <DirectionBadge direction={t.direction} />
            <StrategyBadge strategy={strategy} className="hidden sm:inline-flex" />
          </div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={t.grade || "–"} />
            <span className="text-[12px] text-muted-foreground">
              {formatShortDate(t.openedAt)}
            </span>
          </div>
        </button>

        {/* Screenshot */}
        {hero && (
          <div className="relative mx-4 overflow-hidden rounded-xl border border-border">
            <button
              onClick={() => open(t, t.screenshots, 0)}
              className="block aspect-[16/10] w-full cursor-zoom-in"
              aria-label="View screenshot"
            >
              <ShotVisual shot={hero} symbol={t.symbol} />
            </button>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

            {/* P&L overlay */}
            <div className="pointer-events-none absolute bottom-2.5 left-3 flex flex-col">
              {t.status === "open" ? (
                <span className="text-[13px] font-medium text-white/80">
                  Position open
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "font-mono text-[22px] font-bold leading-none tabular-nums",
                      t.pnl >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {formatCurrency(t.pnl, { sign: true })}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <RBadge r={t.rMultiple} />
                  </span>
                </>
              )}
            </div>

            {/* Image count */}
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
              {t.screenshots.length > 1 && (
                <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                  <Images className="h-3 w-3" />
                  {t.screenshots.length}
                </span>
              )}
              <span className="rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Entry" value={formatPrice(t.entryPrice)} />
            <Stat label="Exit" value={t.exitPrice != null ? formatPrice(t.exitPrice) : "—"} />
            <Stat label="Risk" value={formatCurrency(t.risk, { compact: true })} />
            <Stat label="R:R" value={t.rrRatio != null ? `1:${t.rrRatio.toFixed(1)}` : "—"} />
          </div>

          {t.notes && (
            <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.notes}
            </p>
          )}

          <div className="mt-3 flex items-center gap-1.5">
            {t.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {t.tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground/60">
                +{t.tags.length - 3}
              </span>
            )}
            <span className="ml-auto flex items-center gap-0.5 text-muted-foreground">
              {t.rating > 0 ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[12px] font-medium">{t.rating}.0</span>
                </>
              ) : null}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </span>
      <span className="font-mono text-[12.5px] font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
