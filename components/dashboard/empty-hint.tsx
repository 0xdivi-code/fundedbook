"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";

/**
 * Lightweight banner shown on data-driven pages (calendar, analytics, …)
 * while the journal has no trades. Points users back to the dashboard guide.
 */
export function EmptyDataHint({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(215,255,62,0.18),rgba(0,245,160,0.16))] text-primary">
        <Lightbulb className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[14px] font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {text}{" "}
          <Link
            href="/"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            See the getting-started guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/** Section-wide checklist used by EmptyDataHint consumers. */
export function hasNoTrades(tradeCount: number): boolean {
  return tradeCount === 0;
}
