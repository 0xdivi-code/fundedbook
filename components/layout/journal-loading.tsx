"use client";

import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown by pages while the journal is being fetched from the database
 * (instead of flashing an empty dashboard), and when the initial load fails.
 */
export function JournalLoading({
  loadFailed = false,
  onRetry,
  label = "Loading your journal…",
}: {
  loadFailed?: boolean;
  onRetry?: () => void;
  label?: string;
}) {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-border">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[320px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px] animate-aurora" />
      </div>

      {loadFailed ? (
        <>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-loss/30 bg-loss/10 text-loss">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div className="relative text-center">
            <p className="text-[15px] font-semibold tracking-tight">
              Couldn&apos;t load your journal
            </p>
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              The database didn&apos;t respond. Check your connection (and that
              <span className="mx-1 font-mono text-[12px]">supabase/schema.sql</span>
              has been run) and try again.
            </p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" className="relative" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </>
      ) : (
        <div className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {label}
        </div>
      )}
    </div>
  );
}
