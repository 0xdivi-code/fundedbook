"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  Camera,
  Clock,
  Maximize2,
  Pencil,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useJournal } from "@/lib/store";
import { computeTrade } from "@/lib/analytics";
import { useLightbox, ShotVisual } from "@/components/trades/lightbox";
import {
  DirectionBadge,
  GradeBadge,
  StrategyBadge,
} from "@/components/trades/trade-badges";
import { useUI } from "@/components/layout/ui-provider";
import { useToast } from "@/components/ui/toast";
import { cn, uid } from "@/lib/utils";
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatPrice,
  formatR,
} from "@/lib/format";
import type { ComputedTrade, Screenshot } from "@/lib/types";

export default function TradeDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trades, strategies, deleteTrade } = useJournal();
  const { openAdd } = useUI();
  const { toast } = useToast();

  const trade = trades.find((t) => t.id === params.id);

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold">Trade not found</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          This trade may have been deleted.
        </p>
        <Button asChild className="mt-5">
          <Link href="/trades">
            <ArrowLeft className="h-4 w-4" />
            Back to journal
          </Link>
        </Button>
      </div>
    );
  }

  const t = computeTrade(trade);
  const strategy = strategies.find((s) => s.id === t.strategyId);

  const handleDelete = () => {
    deleteTrade(t.id);
    toast({
      variant: "info",
      title: "Trade deleted",
      description: `${t.symbol} was removed.`,
    });
    router.push("/trades");
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        href="/trades"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to journal
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary font-mono text-[17px] font-bold text-foreground">
            {t.symbol.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-mono text-[22px] font-bold tracking-tight">
                {t.symbol}
              </h2>
              <DirectionBadge direction={t.direction} />
              {t.status === "open" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-400/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse-dot" />
                  Open
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <StrategyBadge strategy={strategy} />
              <span>{formatDateTime(t.openedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t.status === "open" ? "Status" : "Realized P&L"}
            </p>
            {t.status === "open" ? (
              <p className="font-mono text-[20px] font-bold text-sky-400">
                Running
              </p>
            ) : (
              <p
                className={cn(
                  "font-mono text-[24px] font-bold tabular-nums leading-none",
                  t.pnl >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {formatCurrency(t.pnl, { sign: true })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => openAdd(t)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="loss" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Gallery + notes */}
        <div className="space-y-5 xl:col-span-2">
          <GalleryCard key={trade.id} trade={t} />

          {/* Notes */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-semibold">Trade Notes</h3>
              </div>
              <p className="text-[13.5px] leading-relaxed text-foreground/90">
                {t.notes || "No notes recorded for this trade."}
              </p>
            </Card>
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <h3 className="text-[14px] font-semibold">Lessons Learned</h3>
              </div>
              <p className="text-[13.5px] leading-relaxed text-foreground/90">
                {t.lessons || "No lessons recorded for this trade."}
              </p>
            </Card>
          </div>

          {/* Mistakes */}
          {t.mistakes.length > 0 && (
            <Card className="border-loss/25 p-5">
              <div className="mb-2 flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-loss" />
                <h3 className="text-[14px] font-semibold text-loss">
                  Mistakes flagged
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.mistakes.map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-loss/12 px-2 py-1 text-[12.5px] font-medium text-loss"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: stats */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-4 text-[15px] font-semibold tracking-tight">
              Trade Statistics
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Stat label="Entry" value={formatPrice(t.entryPrice)} />
              <Stat
                label="Exit"
                value={t.exitPrice != null ? formatPrice(t.exitPrice) : "—"}
              />
              <Stat
                label="Stop loss"
                value={t.stopLoss != null ? formatPrice(t.stopLoss) : "—"}
              />
              <Stat
                label="Take profit"
                value={t.takeProfit != null ? formatPrice(t.takeProfit) : "—"}
              />
              <Stat label="Position size" value={String(t.quantity)} />
              <Stat label="Fees" value={formatCurrency(t.fees)} />
              <Stat label="Risked" value={formatCurrency(t.risk)} />
              <Stat
                label="Reward : Risk"
                value={t.rrRatio != null ? `1 : ${t.rrRatio.toFixed(2)}` : "—"}
              />
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  R multiple
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[20px] font-bold tabular-nums",
                    t.rMultiple != null && t.rMultiple >= 0
                      ? "text-profit"
                      : "text-loss"
                  )}
                >
                  {formatR(t.rMultiple)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Price move
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[20px] font-bold tabular-nums",
                    t.pnlPercent >= 0 ? "text-profit" : "text-loss"
                  )}
                >
                  {formatPercent(t.pnlPercent, 2)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Held for {t.duration}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold tracking-tight">
              Review
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">Rating</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Star
                    key={r}
                    className={cn(
                      "h-4 w-4",
                      r <= (t.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/25"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                Setup grade
              </span>
              <GradeBadge grade={t.grade || "–"} />
            </div>
            <Separator className="my-4" />
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {t.tags.length > 0 ? (
                t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/[0.05] px-2 py-1 text-[12px] font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-[12.5px] text-muted-foreground">
                  No tags
                </span>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 text-[15px] font-semibold tracking-tight">
              Quick verdict
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {t.status === "open"
                ? "This position is still running. Revisit it once closed to grade execution and extract lessons."
                : t.pnl >= 0
                  ? `A ${formatR(t.rMultiple)} winner on ${t.symbol}. ${
                      t.mistakes.length
                        ? "Solid result, but review the flagged mistakes to protect the edge."
                        : "Clean execution — this is the kind of trade to repeat."
                    }`
                  : `A ${formatR(t.rMultiple)} loss on ${t.symbol}. ${
                      t.mistakes.length
                        ? "The flagged mistake likely cost R — fix it before the next session."
                        : "Risk was contained. Losses like this are part of the process."
                    }`}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ trade: t }: { trade: ComputedTrade }) {
  const [activeShot, setActiveShot] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { updateTrade } = useJournal();
  const { open } = useLightbox();
  const { toast } = useToast();

  const uploadShot = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    list.slice(0, Math.max(0, 6 - t.screenshots.length)).forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        toast({
          variant: "error",
          title: "Image too large",
          description: "Keep screenshots under 3 MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const shot: Screenshot = {
          id: uid("shot"),
          kind: "image",
          url: reader.result as string,
          label: "Screenshot",
          createdAt: new Date().toISOString(),
        };
        updateTrade(t.id, { screenshots: [...t.screenshots, shot] });
        setActiveShot(t.screenshots.length);
        toast({ variant: "success", title: "Screenshot added" });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight">Screenshots</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera className="h-3.5 w-3.5" />
            Add
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              uploadShot(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {t.screenshots.length > 0 ? (
        <>
          <button
            onClick={() => open(t, t.screenshots, activeShot)}
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border"
          >
            <div className="aspect-[16/10] w-full">
              <ShotVisual shot={t.screenshots[activeShot]} symbol={t.symbol} />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur">
                <Maximize2 className="h-4 w-4" />
                Click to enlarge
              </span>
            </div>
            {t.screenshots[activeShot].label && (
              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                {t.screenshots[activeShot].label}
              </span>
            )}
          </button>

          {t.screenshots.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {t.screenshots.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveShot(i)}
                  className={cn(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition-all cursor-pointer",
                    i === activeShot
                      ? "ring-primary"
                      : "ring-transparent opacity-50 hover:opacity-90"
                  )}
                >
                  <ShotVisual shot={s} symbol={t.symbol} />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground cursor-pointer"
        >
          <Camera className="h-6 w-6" />
          <span className="text-[13px] font-medium">
            No screenshots yet — upload one
          </span>
        </button>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </span>
      <span className="font-mono text-[14px] font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
