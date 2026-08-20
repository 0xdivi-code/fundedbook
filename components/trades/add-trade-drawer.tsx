"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  ImagePlus,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUI } from "@/components/layout/ui-provider";
import { useJournal } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { SAMPLE_SYMBOLS } from "@/lib/seed";
import type { Direction, Screenshot, Trade, TradeDraft } from "@/lib/types";
import { uid, cn } from "@/lib/utils";
import { formatCurrency, formatR } from "@/lib/format";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string {
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

const GRADE_OPTIONS = ["A", "B", "C", "D"];

function initialDraft(
  editing: Trade | null,
  defaultStrategyId: string,
  defaultQuantity: number
): TradeDraft {
  const now = new Date().toISOString();
  if (editing) {
    return {
      symbol: editing.symbol,
      direction: editing.direction,
      status: editing.status,
      strategyId: editing.strategyId,
      entryPrice: String(editing.entryPrice),
      exitPrice: editing.exitPrice != null ? String(editing.exitPrice) : "",
      quantity: String(editing.quantity),
      stopLoss: editing.stopLoss != null ? String(editing.stopLoss) : "",
      takeProfit: editing.takeProfit != null ? String(editing.takeProfit) : "",
      fees: String(editing.fees),
      openedAt: toLocalInput(editing.openedAt),
      closedAt: editing.closedAt ? toLocalInput(editing.closedAt) : toLocalInput(now),
      rating: editing.rating || 3,
      grade: editing.grade || "B",
      tags: editing.tags,
      notes: editing.notes,
      lessons: editing.lessons,
      screenshots: editing.screenshots,
    };
  }
  return {
    symbol: "",
    direction: "long",
    status: "closed",
    strategyId: defaultStrategyId,
    entryPrice: "",
    exitPrice: "",
    quantity: String(defaultQuantity),
    stopLoss: "",
    takeProfit: "",
    fees: "",
    openedAt: toLocalInput(now),
    closedAt: toLocalInput(now),
    rating: 3,
    grade: "B",
    tags: [],
    notes: "",
    lessons: "",
    screenshots: [],
  };
}

export function AddTradeDrawer() {
  const { addOpen, editing, closeAdd } = useUI();
  const { strategies, settings } = useJournal();

  return (
    <Sheet open={addOpen} onOpenChange={(o) => !o && closeAdd()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <TradeForm
          key={editing?.id ?? "new"}
          editing={editing}
          defaultStrategyId={strategies[0]?.id ?? ""}
          defaultQuantity={settings.defaultQuantity}
          onClose={closeAdd}
        />
      </SheetContent>
    </Sheet>
  );
}

function TradeForm({
  editing,
  defaultStrategyId,
  defaultQuantity,
  onClose,
}: {
  editing: Trade | null;
  defaultStrategyId: string;
  defaultQuantity: number;
  onClose: () => void;
}) {
  const { addTrade, updateTrade, strategies } = useJournal();
  const { toast } = useToast();

  const [draft, setDraft] = React.useState<TradeDraft>(() =>
    initialDraft(editing, defaultStrategyId, defaultQuantity)
  );
  const [tagInput, setTagInput] = React.useState("");
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const set = (patch: Partial<TradeDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const num = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const entry = num(draft.entryPrice);
  const exit = num(draft.exitPrice);
  const qty = num(draft.quantity);
  const sl = num(draft.stopLoss);
  const tp = num(draft.takeProfit);
  const fees = num(draft.fees) ?? 0;
  const long = draft.direction === "long";

  const calc = React.useMemo(() => {
    const hasExit = draft.status === "closed" && entry != null && exit != null;
    const pnl =
      hasExit && qty != null
        ? (long ? exit! - entry! : entry! - exit!) * qty - fees
        : null;
    const risk =
      entry != null && sl != null && qty != null
        ? Math.abs(entry - sl) * qty
        : null;
    const rMultiple =
      pnl != null && risk != null && risk > 0 ? pnl / risk : null;
    const rr =
      entry != null && sl != null && tp != null
        ? Math.abs(tp - entry) / Math.abs(entry - sl)
        : null;
    return { pnl, risk, rMultiple, rr };
  }, [draft.status, entry, exit, qty, sl, tp, fees, long]);

  const errors = React.useMemo(() => {
    const e: Record<string, string> = {};
    if (!draft.symbol.trim()) e.symbol = "Symbol is required";
    if (entry == null || entry <= 0) e.entryPrice = "Enter a valid entry price";
    if (draft.status === "closed" && (exit == null || exit <= 0))
      e.exitPrice = "Exit price required for closed trades";
    if (qty == null || qty <= 0) e.quantity = "Enter a valid position size";
    if (!draft.strategyId) e.strategyId = "Select a strategy";
    if (sl != null && sl <= 0) e.stopLoss = "Invalid stop";
    if (tp != null && tp <= 0) e.takeProfit = "Invalid target";
    if (sl != null && entry != null) {
      if (long && sl >= entry) e.stopLoss = "Stop must be below entry for longs";
      if (!long && sl <= entry)
        e.stopLoss = "Stop must be above entry for shorts";
    }
    return e;
  }, [draft, entry, exit, qty, sl, tp, long]);

  const valid = Object.keys(errors).length === 0;

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast({
        variant: "error",
        title: "Unsupported file",
        description: "Please upload image files only.",
      });
      return;
    }
    const remaining = 6 - draft.screenshots.length;
    const accepted = list.slice(0, Math.max(0, remaining));
    if (list.length > remaining) {
      toast({
        variant: "info",
        title: "Screenshot limit reached",
        description: "A trade can hold up to 6 screenshots.",
      });
    }
    accepted.forEach((file) => {
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
        setDraft((d) => ({
          ...d,
          screenshots: [...d.screenshots, shot],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!valid) {
      setTouched({
        symbol: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        strategyId: true,
      });
      toast({
        variant: "error",
        title: "Check the form",
        description: "Some required fields are missing or invalid.",
      });
      return;
    }

    const payload: Trade = {
      id: editing?.id ?? uid("tr"),
      symbol: draft.symbol.trim().toUpperCase(),
      direction: draft.direction,
      status: draft.status,
      strategyId: draft.strategyId,
      entryPrice: entry!,
      exitPrice: draft.status === "closed" ? exit! : null,
      quantity: qty!,
      stopLoss: sl,
      takeProfit: tp,
      fees,
      openedAt: fromLocalInput(draft.openedAt) || new Date().toISOString(),
      closedAt:
        draft.status === "closed"
          ? fromLocalInput(draft.closedAt) || new Date().toISOString()
          : null,
      rating: draft.status === "closed" ? draft.rating : 0,
      tags: draft.tags,
      notes: draft.notes.trim(),
      lessons: draft.lessons.trim(),
      screenshots: draft.screenshots,
      grade: draft.status === "closed" ? draft.grade : "",
      mistakes: [],
    };

    if (editing) {
      updateTrade(editing.id, payload);
      toast({
        variant: "success",
        title: "Trade updated",
        description: `${payload.symbol} was saved to your journal.`,
      });
    } else {
      addTrade(payload);
      toast({
        variant: "success",
        title: "Trade logged",
        description: `${payload.symbol} added to your journal.`,
      });
    }
    onClose();
  };

  const removeShot = (id: string) =>
    setDraft((d) => ({
      ...d,
      screenshots: d.screenshots.filter((s) => s.id !== id),
    }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (t && !draft.tags.includes(t)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, t].slice(0, 6) }));
    }
    setTagInput("");
  };

  const fieldError = (key: string) =>
    touched[key] && errors[key] ? errors[key] : undefined;

  return (
    <>
      <SheetHeader className="border-b border-border px-6 py-4">
        <SheetTitle className="text-[17px]">
          {editing ? "Edit Trade" : "Log a Trade"}
        </SheetTitle>
        <SheetDescription>
          {editing
            ? `Editing ${editing.symbol} — ${editing.direction.toUpperCase()}`
            : "Record your execution, then review it later."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-6">
          {/* Symbol + direction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                list="symbols"
                value={draft.symbol}
                onChange={(e) => set({ symbol: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, symbol: true }))}
                placeholder="e.g. NVDA"
                className={cn(
                  "font-mono uppercase",
                  fieldError("symbol") && "border-loss/60"
                )}
              />
              <datalist id="symbols">
                {SAMPLE_SYMBOLS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {fieldError("symbol") && (
                <p className="text-[11px] text-loss">{errors.symbol}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-input bg-input/60 p-1">
                {(["long", "short"] as Direction[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => set({ direction: d })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-semibold transition-all cursor-pointer",
                      draft.direction === d
                        ? d === "long"
                          ? "bg-profit/20 text-profit shadow-sm"
                          : "bg-loss/20 text-loss shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d === "long" ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status + strategy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-input bg-input/60 p-1">
                {(["closed", "open"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => set({ status: s })}
                    className={cn(
                      "rounded-md py-1.5 text-[13px] font-medium capitalize transition-all cursor-pointer",
                      draft.status === s
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="strategy">Strategy</Label>
              <Select
                value={draft.strategyId}
                onValueChange={(v) => set({ strategyId: v })}
              >
                <SelectTrigger
                  id="strategy"
                  className={cn(fieldError("strategyId") && "border-loss/60")}
                >
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("strategyId") && (
                <p className="text-[11px] text-loss">{errors.strategyId}</p>
              )}
            </div>
          </div>

          {/* Prices */}
          <div>
            <Label className="mb-1.5 block">Prices</Label>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <Field
                label="Entry"
                value={draft.entryPrice}
                onChange={(v) => set({ entryPrice: v })}
                onBlur={() => setTouched((t) => ({ ...t, entryPrice: true }))}
                error={fieldError("entryPrice")}
                prefix="$"
              />
              <Field
                label="Exit"
                value={draft.exitPrice}
                onChange={(v) => set({ exitPrice: v })}
                onBlur={() => setTouched((t) => ({ ...t, exitPrice: true }))}
                error={fieldError("exitPrice")}
                prefix="$"
                disabled={draft.status === "open"}
              />
              <Field
                label="Stop loss"
                value={draft.stopLoss}
                onChange={(v) => set({ stopLoss: v })}
                onBlur={() => setTouched((t) => ({ ...t, stopLoss: true }))}
                error={fieldError("stopLoss")}
                prefix="$"
              />
              <Field
                label="Take profit"
                value={draft.takeProfit}
                onChange={(v) => set({ takeProfit: v })}
                onBlur={() => setTouched((t) => ({ ...t, takeProfit: true }))}
                error={fieldError("takeProfit")}
                prefix="$"
              />
            </div>
          </div>

          {/* Size + fees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Position size</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                value={draft.quantity}
                onChange={(e) => set({ quantity: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, quantity: true }))}
                placeholder="e.g. 100"
                className={cn(
                  "font-mono",
                  fieldError("quantity") && "border-loss/60"
                )}
              />
              {fieldError("quantity") && (
                <p className="text-[11px] text-loss">{errors.quantity}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fees">Fees / commissions</Label>
              <Input
                id="fees"
                type="number"
                min="0"
                value={draft.fees}
                onChange={(e) => set({ fees: e.target.value })}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="opened">Opened at</Label>
              <Input
                id="opened"
                type="datetime-local"
                value={draft.openedAt}
                onChange={(e) => set({ openedAt: e.target.value })}
                className="font-mono text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closed">Closed at</Label>
              <Input
                id="closed"
                type="datetime-local"
                value={draft.closedAt}
                onChange={(e) => set({ closedAt: e.target.value })}
                disabled={draft.status === "open"}
                className="font-mono text-[13px] disabled:opacity-40"
              />
            </div>
          </div>

          {/* Live calculation */}
          <LiveCalc calc={calc} />

          {/* Rating + grade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trade rating</Label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => set({ rating: r })}
                    className="cursor-pointer"
                    aria-label={`${r} star`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        r <= draft.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Setup grade</Label>
              <div className="grid grid-cols-4 gap-1">
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => set({ grade: g })}
                    className={cn(
                      "rounded-lg border py-1.5 text-[13px] font-semibold transition-all cursor-pointer",
                      draft.grade === g
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-input bg-input/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-input/60 p-2">
              {draft.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[12px] font-medium text-primary"
                >
                  #{t}
                  <button
                    onClick={() =>
                      set({ tags: draft.tags.filter((x) => x !== t) })
                    }
                    className="cursor-pointer opacity-60 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder={
                  draft.tags.length ? "Add tag…" : "e.g. breakout, earnings"
                }
                className="min-w-[120px] flex-1 bg-transparent py-0.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Trade notes</Label>
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="What was the setup? Why did you enter?"
              className="min-h-[80px]"
            />
          </div>

          {/* Lessons */}
          <div className="space-y-1.5">
            <Label htmlFor="lessons">Lessons learned</Label>
            <Textarea
              id="lessons"
              value={draft.lessons}
              onChange={(e) => set({ lessons: e.target.value })}
              placeholder="What would you do differently?"
              className="min-h-[72px]"
            />
          </div>

          {/* Screenshot upload */}
          <div className="space-y-2">
            <Label>Screenshots</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-all",
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-secondary/40"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-[13px] font-medium text-foreground">
                Drop screenshots here or{" "}
                <span className="text-primary">browse</span>
              </p>
              <p className="text-[12px] text-muted-foreground">
                PNG / JPG · up to 6 images · max 3 MB each
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <AnimatePresence>
              {draft.screenshots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {draft.screenshots.map((shot, i) => (
                    <div
                      key={shot.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-secondary"
                    >
                      {shot.kind === "image" && shot.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={shot.url}
                          alt={`Screenshot ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeShot(shot.id);
                        }}
                        className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!valid}>
          {editing ? "Save changes" : "Log trade"}
        </Button>
      </SheetFooter>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  prefix,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  prefix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/60">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step="any"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            "font-mono",
            prefix && "pl-6",
            error && "border-loss/60",
            disabled && "opacity-40"
          )}
        />
      </div>
      {error && <p className="text-[11px] text-loss">{error}</p>}
    </div>
  );
}

function LiveCalc({
  calc,
}: {
  calc: {
    pnl: number | null;
    risk: number | null;
    rMultiple: number | null;
    rr: number | null;
  };
}) {
  const rows = [
    {
      label: "P&L",
      value: calc.pnl != null ? formatCurrency(calc.pnl, { sign: true }) : "—",
      tone:
        calc.pnl != null
          ? calc.pnl >= 0
            ? "text-profit"
            : "text-loss"
          : "text-muted-foreground",
    },
    {
      label: "Risk",
      value: calc.risk != null ? formatCurrency(calc.risk) : "—",
      tone: "text-foreground",
    },
    {
      label: "R multiple",
      value: formatR(calc.rMultiple),
      tone:
        calc.rMultiple != null
          ? calc.rMultiple >= 0
            ? "text-profit"
            : "text-loss"
          : "text-muted-foreground",
    },
    {
      label: "Reward : Risk",
      value: calc.rr != null ? `1 : ${calc.rr.toFixed(2)}` : "—",
      tone: "text-foreground",
    },
  ];

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent p-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
        Live calculation
      </p>
      <div className="grid grid-cols-4 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{r.label}</span>
            <span
              className={cn(
                "font-mono text-[14px] font-semibold tabular-nums",
                r.tone
              )}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      {calc.rMultiple != null && (
        <p className="mt-2.5 text-[12px] text-muted-foreground">
          This trade is{" "}
          <span
            className={cn(
              "font-semibold",
              calc.rMultiple >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {Math.abs(calc.rMultiple).toFixed(2)}R
          </span>{" "}
          {calc.rMultiple >= 0 ? "in your favor" : "against you"}.
        </p>
      )}
    </div>
  );
}
