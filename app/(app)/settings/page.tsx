"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CircleUserRound,
  Database,
  LogOut,
  Palette,
  Percent,
  RotateCcw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useJournal } from "@/lib/store";
import { computeTrade, summarize } from "@/lib/analytics";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

const ACCENTS = [
  "#7c6aff",
  "#34d399",
  "#38bdf8",
  "#f59e0b",
  "#fb7185",
  "#a78bfa",
];

function exportData(trades: unknown, strategies: unknown, settings: unknown) {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), trades, strategies, settings }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fundedbook-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { trades, strategies, settings, updateSettings, clearAllData } = useJournal();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [accountSize, setAccountSize] = React.useState(String(settings.accountSize));
  const [riskPerTrade, setRiskPerTrade] = React.useState(String(settings.riskPerTrade));
  const [defaultQuantity, setDefaultQuantity] = React.useState(String(settings.defaultQuantity));
  const [showUnrealized, setShowUnrealized] = React.useState(settings.showUnrealized);
  const [compactNumbers, setCompactNumbers] = React.useState(settings.compactNumbers);
  const [accent, setAccent] = React.useState(settings.accent);
  const [touched, setTouched] = React.useState(false);

  const computed = React.useMemo(() => trades.map(computeTrade), [trades]);
  const summary = React.useMemo(() => summarize(computed), [computed]);

  const errors = React.useMemo(() => {
    const e: Record<string, string> = {};
    const size = parseFloat(accountSize);
    const risk = parseFloat(riskPerTrade);
    const qty = parseFloat(defaultQuantity);
    if (isNaN(size) || size <= 0) e.accountSize = "Enter a positive account size";
    if (isNaN(risk) || risk <= 0 || risk > 20) e.riskPerTrade = "Risk must be 0–20%";
    if (isNaN(qty) || qty <= 0) e.defaultQuantity = "Enter a positive quantity";
    return e;
  }, [accountSize, riskPerTrade, defaultQuantity]);

  const valid = Object.keys(errors).length === 0;

  const handleSave = () => {
    if (!valid) {
      setTouched(true);
      toast({ variant: "error", title: "Check your settings", description: "Some values are invalid." });
      return;
    }
    updateSettings({
      accountSize: parseFloat(accountSize),
      riskPerTrade: parseFloat(riskPerTrade),
      defaultQuantity: parseFloat(defaultQuantity),
      showUnrealized,
      compactNumbers,
      accent,
    });
    toast({ variant: "success", title: "Settings saved", description: "Your preferences were updated." });
  };

  const handleReset = () => {
    clearAllData();
    setAccountSize("50000");
    setRiskPerTrade("1");
    setDefaultQuantity("100");
    setShowUnrealized(true);
    setCompactNumbers(false);
    setAccent("#7c6aff");
    toast({ variant: "info", title: "Journal cleared", description: "All trades, strategies and settings were reset to a clean slate." });
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const err = (k: string) => (touched && errors[k] ? errors[k] : undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Account summary */}
      <Card className="overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
              Account size
            </p>
            <p className="font-mono text-[24px] font-bold tabular-nums">
              {formatCurrency(settings.accountSize)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[12px] uppercase tracking-wide text-muted-foreground">
              Net return
            </p>
            <p
              className={cn(
                "font-mono text-[24px] font-bold tabular-nums",
                summary.netPnl >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {formatCurrency(summary.netPnl, { sign: true })}
            </p>
          </div>
        </div>
        <Separator className="my-5" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Win rate", formatPercent(summary.winRate, 1)],
            ["Profit factor", summary.profitFactor > 99 ? "∞" : summary.profitFactor.toFixed(2)],
            ["Trades", String(summary.totalTrades)],
            ["Max drawdown", `−${formatPercent(summary.maxDrawdown, 1)}`],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</p>
              <p className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Trading settings */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-semibold tracking-tight">Trading defaults</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="acct">Account size ($)</Label>
            <Input
              id="acct"
              type="number"
              min="0"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              className={cn("font-mono", err("accountSize") && "border-loss/60")}
            />
            {err("accountSize") && <p className="text-[11px] text-loss">{err("accountSize")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="risk">Risk per trade (%)</Label>
            <div className="relative">
              <Input
                id="risk"
                type="number"
                min="0"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                className={cn("font-mono", err("riskPerTrade") && "border-loss/60")}
              />
              <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {err("riskPerTrade") && <p className="text-[11px] text-loss">{err("riskPerTrade")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">Default position size</Label>
            <Input
              id="qty"
              type="number"
              min="0"
              value={defaultQuantity}
              onChange={(e) => setDefaultQuantity(e.target.value)}
              className={cn("font-mono", err("defaultQuantity") && "border-loss/60")}
            />
            {err("defaultQuantity") && <p className="text-[11px] text-loss">{err("defaultQuantity")}</p>}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-semibold tracking-tight">Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-medium">Show unrealized P&L</p>
              <p className="text-[12px] text-muted-foreground">
                Display mark-to-market on open positions
              </p>
            </div>
            <Switch checked={showUnrealized} onCheckedChange={setShowUnrealized} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-medium">Compact numbers</p>
              <p className="text-[12px] text-muted-foreground">
                Abbreviate large figures (e.g. $1.2K instead of $1,240)
              </p>
            </div>
            <Switch checked={compactNumbers} onCheckedChange={setCompactNumbers} />
          </div>
          <div className="pt-1">
            <p className="mb-2.5 text-[13.5px] font-medium">Accent color</p>
            <div className="flex gap-2.5">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className={cn(
                    "h-8 w-8 rounded-lg ring-2 ring-offset-2 ring-offset-card transition-transform cursor-pointer hover:scale-110",
                    accent === c ? "ring-foreground" : "ring-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6">
        <div className="mb-2 flex items-center gap-2.5">
          <CircleUserRound className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-semibold tracking-tight">Account</h3>
        </div>
        <p className="mb-5 text-[13px] text-muted-foreground">
          You sign in with your email and password. Your journal is private and
          scoped to this account.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#7c6aff] text-[11px] font-bold text-white">
              {(user?.email ?? "FB").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[13.5px] font-medium">{user?.email ?? "—"}</p>
              <p className="text-[11.5px] text-muted-foreground">
                Signed in with email · password
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </Card>

      {/* Data */}
      <Card className="border-destructive/25 p-6">
        <div className="mb-2 flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-loss" />
          <h3 className="text-[15px] font-semibold tracking-tight text-loss">Danger zone</h3>
        </div>
        <p className="mb-5 text-[13px] text-muted-foreground">
          Your journal is stored privately in this browser for this account.
          Clearing removes every logged trade and strategy — export a backup
          first if you might want it back.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Clear all data
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              exportData(trades, strategies, settings);
              toast({ variant: "success", title: "Backup exported", description: "Your journal was downloaded as JSON." });
            }}
          >
            <Database className="h-4 w-4" />
            Export backup
          </Button>
        </div>
      </Card>
    </div>
  );
}
