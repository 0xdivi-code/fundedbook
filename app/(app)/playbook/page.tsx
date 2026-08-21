"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Globe,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJournal } from "@/lib/store";
import { computeTrade, strategyPerformance } from "@/lib/analytics";
import { useToast } from "@/components/ui/toast";
import { cn, uid } from "@/lib/utils";
import { formatCurrency, formatPercent, formatR } from "@/lib/format";
import type { Strategy } from "@/lib/types";

const SWATCHES = [
  "#00f5a0",
  "#d7ff3e",
  "#00d9c0",
  "#8bff5a",
  "#a6ff00",
  "#3ee6b0",
  "#c6f24a",
  "#7ef7c2",
];

interface StrategyForm {
  name: string;
  shortName: string;
  market: string;
  timeframe: string;
  description: string;
  setup: string;
  confluences: string;
  color: string;
}

const emptyForm = (): StrategyForm => ({
  name: "",
  shortName: "",
  market: "US Equities",
  timeframe: "5m",
  description: "",
  setup: "",
  confluences: "",
  color: SWATCHES[0],
});

export default function PlaybookPage() {
  const { trades, strategies, addStrategy, updateStrategy, deleteStrategy } =
    useJournal();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Strategy | null>(null);
  const [form, setForm] = React.useState<StrategyForm>(emptyForm());
  const [touched, setTouched] = React.useState(false);

  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);
  const perf = React.useMemo(
    () => strategyPerformance(computed, strategies),
    [computed, strategies]
  );
  const perfMap = React.useMemo(
    () => new Map(perf.map((p) => [p.key, p])),
    [perf]
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setTouched(false);
    setOpen(true);
  };

  const openEdit = (s: Strategy) => {
    setEditing(s);
    setForm({
      name: s.name,
      shortName: s.shortName,
      market: s.market,
      timeframe: s.timeframe,
      description: s.description,
      setup: s.setup,
      confluences: s.confluences.join(", "),
      color: s.color,
    });
    setTouched(false);
    setOpen(true);
  };

  const errors = React.useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Strategy name is required";
    if (!form.shortName.trim()) e.shortName = "Short name is required";
    return e;
  }, [form]);

  const valid = Object.keys(errors).length === 0;

  const handleSave = () => {
    if (!valid) {
      setTouched(true);
      return;
    }
    const confluences = form.confluences
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (editing) {
      updateStrategy(editing.id, {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        market: form.market.trim(),
        timeframe: form.timeframe.trim(),
        description: form.description.trim(),
        setup: form.setup.trim(),
        confluences,
        color: form.color,
      });
      toast({ variant: "success", title: "Strategy updated", description: `${form.name} was saved.` });
    } else {
      addStrategy({
        id: uid("strat"),
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        market: form.market.trim() || "US Equities",
        timeframe: form.timeframe.trim() || "5m",
        description: form.description.trim(),
        setup: form.setup.trim(),
        confluences,
        color: form.color,
      });
      toast({ variant: "success", title: "Strategy created", description: `${form.name} added to your playbook.` });
    }
    setOpen(false);
  };

  const handleDelete = (s: Strategy) => {
    deleteStrategy(s.id);
    toast({ variant: "info", title: "Strategy removed", description: `${s.name} was removed from your playbook.` });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight">
            Your Playbook
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            {strategies.length} strategies · rules to protect your edge
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New strategy
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {strategies.map((s, i) => {
          const p = perfMap.get(s.id);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="card-hover flex h-full flex-col overflow-hidden">
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[15px]"
                        style={{ backgroundColor: `${s.color}1f` }}
                      >
                        <Target className="h-5 w-5" style={{ color: s.color }} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold leading-tight tracking-tight">
                          {s.name}
                        </h3>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {s.shortName}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                        aria-label="Edit strategy"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-loss/15 hover:text-loss cursor-pointer"
                        aria-label="Delete strategy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 rounded-md bg-primary/[0.07] px-2 py-0.5 text-[11px] text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {s.market}
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-primary/[0.07] px-2 py-0.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {s.timeframe}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      The setup
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/85">
                      {s.setup || "No setup defined yet."}
                    </p>
                  </div>

                  {s.confluences.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {s.confluences.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-profit" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3">
                    <MiniStat label="Trades" value={p ? String(p.trades) : "0"} />
                    <MiniStat label="Win rate" value={p ? formatPercent(p.winRate, 0) : "—"} />
                    <MiniStat label="Avg R" value={p ? formatR(p.avgR) : "—"} />
                    <MiniStat
                      label="Net P&L"
                      value={p ? formatCurrency(p.netPnl, { compact: true }) : "$0"}
                      tone={p && p.netPnl >= 0 ? "text-profit" : "text-loss"}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit strategy" : "New strategy"}</DialogTitle>
            <DialogDescription>
              Define the playbook rules you trade by.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Strategy name</Label>
                <Input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Opening Range Breakout"
                  className={cn(touched && errors.name && "border-loss/60")}
                />
                {touched && errors.name && (
                  <p className="text-[11px] text-loss">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-short">Short name</Label>
                <Input
                  id="s-short"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="ORB"
                  className={cn(touched && errors.shortName && "border-loss/60")}
                />
                {touched && errors.shortName && (
                  <p className="text-[11px] text-loss">{errors.shortName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-market">Market</Label>
                <Input
                  id="s-market"
                  value={form.market}
                  onChange={(e) => setForm({ ...form, market: e.target.value })}
                  placeholder="US Equities"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-tf">Timeframe</Label>
                <Input
                  id="s-tf"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  placeholder="5m / 15m"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea
                id="s-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What market condition does this strategy exploit?"
                className="min-h-[64px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-setup">Setup</Label>
              <Textarea
                id="s-setup"
                value={form.setup}
                onChange={(e) => setForm({ ...form, setup: e.target.value })}
                placeholder="Step-by-step entry criteria…"
                className="min-h-[64px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-conf">Confluences (comma separated)</Label>
              <Input
                id="s-conf"
                value={form.confluences}
                onChange={(e) => setForm({ ...form, confluences: e.target.value })}
                placeholder="Trend aligned, Volume confirmation"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "h-7 w-7 rounded-lg ring-2 ring-offset-2 ring-offset-card transition-transform cursor-pointer hover:scale-110",
                      form.color === c ? "ring-foreground" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editing ? "Save changes" : "Create strategy"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </span>
      <span className={cn("font-mono text-[13px] font-semibold tabular-nums", tone)}>
        {value}
      </span>
    </div>
  );
}
