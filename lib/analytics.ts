import type { ComputedTrade, Trade } from "./types";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/* Per-trade computation                                               */
/* ------------------------------------------------------------------ */
export function computeTrade(t: Trade): ComputedTrade {
  const long = t.direction === "long";
  let pnl = 0;
  if (t.status === "closed" && t.exitPrice != null) {
    pnl =
      (long ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice) *
        t.quantity -
      t.fees;
  }

  const risk =
    t.stopLoss != null ? Math.abs(t.entryPrice - t.stopLoss) * t.quantity : 0;

  const rMultiple =
    t.status === "closed" && risk > 0 ? pnl / risk : null;

  const rrRatio =
    t.stopLoss != null && t.takeProfit != null
      ? Math.abs(t.takeProfit - t.entryPrice) /
        Math.abs(t.entryPrice - t.stopLoss)
      : null;

  const start = new Date(t.openedAt).getTime();
  const end =
    t.closedAt != null ? new Date(t.closedAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const duration =
    mins < 60
      ? `${mins}m`
      : mins < 60 * 24
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`;

  const pnlPercent =
    t.entryPrice > 0 && t.status === "closed" && t.exitPrice != null
      ? ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100 * (long ? 1 : -1)
      : 0;

  return { ...t, pnl, pnlPercent, risk, rMultiple, rrRatio, duration, isWin: pnl > 0 };
}

/* ------------------------------------------------------------------ */
/* Summary metrics                                                     */
/* ------------------------------------------------------------------ */
export interface Summary {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  openTrades: number;
  expectancy: number;
  expectancyR: number;
  avgR: number;
  grossProfit: number;
  grossLoss: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  totalFees: number;
  avgRisk: number;
  streak: number;
}

export function summarize(computed: ComputedTrade[]): Summary {
  const closed = computed.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);

  const grossProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const netPnl = grossProfit - grossLoss;

  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

  const rs = closed
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null && isFinite(r));
  const avgR = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;

  const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;
  const totalFees = closed.reduce((a, t) => a + t.fees, 0);

  const bestTrade = closed.length ? Math.max(...closed.map((t) => t.pnl)) : 0;
  const worstTrade = closed.length ? Math.min(...closed.map((t) => t.pnl)) : 0;
  const avgRisk = closed.length
    ? closed.reduce((a, t) => a + t.risk, 0) / closed.length
    : 0;

  // streak of the most recent closed trades
  const byClose = [...closed].sort(
    (a, b) =>
      new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime()
  );
  let streak = 0;
  for (const t of byClose) {
    if (t.isWin) streak++;
    else break;
  }

  const equity = equityCurve(computed);
  const maxDrawdown = drawdownSeries(equity).reduce(
    (m, d) => Math.max(m, Math.abs(d.drawdownPct)),
    0
  );

  return {
    netPnl,
    winRate,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
    avgWin,
    avgLoss,
    totalTrades: computed.length,
    openTrades: computed.filter((t) => t.status === "open").length,
    expectancy,
    expectancyR: avgR,
    avgR,
    grossProfit,
    grossLoss,
    maxDrawdown,
    bestTrade,
    worstTrade,
    totalFees,
    avgRisk,
    streak,
  };
}

/* ------------------------------------------------------------------ */
/* Equity & drawdown                                                   */
/* ------------------------------------------------------------------ */
export interface EquityPoint {
  date: string;
  label: string;
  equity: number;
  pnl: number;
}

export function equityCurve(computed: ComputedTrade[]): EquityPoint[] {
  const closed = computed
    .filter((t) => t.status === "closed")
    .sort(
      (a, b) =>
        new Date(a.closedAt ?? 0).getTime() -
        new Date(b.closedAt ?? 0).getTime()
    );

  let running = 0;
  return closed.map((t) => {
    running += t.pnl;
    return {
      date: t.closedAt ?? t.openedAt,
      label: format(new Date(t.closedAt ?? t.openedAt), "MMM d"),
      equity: Math.round(running * 100) / 100,
      pnl: Math.round(t.pnl * 100) / 100,
    };
  });
}

export interface DrawdownPoint {
  date: string;
  label: string;
  drawdown: number;
  drawdownPct: number;
}

export function drawdownSeries(equity: EquityPoint[]): DrawdownPoint[] {
  let peak = 0;
  return equity.map((p) => {
    peak = Math.max(peak, p.equity);
    const dd = p.equity - peak;
    return {
      date: p.date,
      label: p.label,
      drawdown: Math.round(dd * 100) / 100,
      drawdownPct: peak > 0 ? Math.round((dd / peak) * 1000) / 10 : 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Time-bucketed P&L                                                   */
/* ------------------------------------------------------------------ */
export interface BucketPnl {
  key: string;
  label: string;
  pnl: number;
  trades: number;
  winRate: number;
}

function bucket(
  computed: ComputedTrade[],
  keyFn: (t: ComputedTrade) => string,
  labelFn: (key: string) => string,
  sortFn?: (a: BucketPnl, b: BucketPnl) => number
): BucketPnl[] {
  const map = new Map<string, ComputedTrade[]>();
  for (const t of computed) {
    if (t.status !== "closed") continue;
    const k = keyFn(t);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  const out: BucketPnl[] = Array.from(map.entries()).map(([key, list]) => {
    const pnl = list.reduce((a, t) => a + t.pnl, 0);
    const wins = list.filter((t) => t.pnl > 0).length;
    return {
      key,
      label: labelFn(key),
      pnl: Math.round(pnl * 100) / 100,
      trades: list.length,
      winRate: list.length ? (wins / list.length) * 100 : 0,
    };
  });
  return out.sort(sortFn ?? ((a, b) => a.key.localeCompare(b.key)));
}

export const pnlByDay = (c: ComputedTrade[]) =>
  bucket(
    c,
    (t) => format(new Date(t.closedAt ?? t.openedAt), "yyyy-MM-dd"),
    (k) => format(new Date(k + "T12:00:00"), "MMM d"),
    (a, b) => a.key.localeCompare(b.key)
  );

export const pnlByWeek = (c: ComputedTrade[]) =>
  bucket(
    c,
    (t) => {
      const d = new Date(t.closedAt ?? t.openedAt);
      const start = new Date(d);
      const day = (d.getUTCDay() + 6) % 7; // Monday = 0
      start.setUTCDate(d.getUTCDate() - day);
      return format(start, "yyyy-MM-dd");
    },
    (k) => {
      const start = new Date(k + "T12:00:00");
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
    },
    (a, b) => a.key.localeCompare(b.key)
  );

export const pnlByMonth = (c: ComputedTrade[]) =>
  bucket(
    c,
    (t) => format(new Date(t.closedAt ?? t.openedAt), "yyyy-MM"),
    (k) => format(new Date(k + "-01T12:00:00"), "MMMM"),
    (a, b) => a.key.localeCompare(b.key)
  );

/* ------------------------------------------------------------------ */
/* Dimension performance                                               */
/* ------------------------------------------------------------------ */
export interface DimensionStat {
  key: string;
  label: string;
  color: string;
  netPnl: number;
  trades: number;
  winRate: number;
  avgR: number;
  profitFactor: number;
  totalR: number;
}

export function performanceBy(
  computed: ComputedTrade[],
  keyFn: (t: ComputedTrade) => string,
  labelFn: (key: string) => string,
  colorFn: (key: string) => string
): DimensionStat[] {
  const map = new Map<string, ComputedTrade[]>();
  for (const t of computed) {
    if (t.status !== "closed") continue;
    const k = keyFn(t);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const wins = list.filter((t) => t.pnl > 0);
      const losses = list.filter((t) => t.pnl < 0);
      const gp = wins.reduce((a, t) => a + t.pnl, 0);
      const gl = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
      const rs = list
        .map((t) => t.rMultiple)
        .filter((r): r is number => r != null && isFinite(r));
      return {
        key,
        label: labelFn(key),
        color: colorFn(key),
        netPnl: Math.round((gp - gl) * 100) / 100,
        trades: list.length,
        winRate: list.length ? (wins.length / list.length) * 100 : 0,
        avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0,
        profitFactor: gl > 0 ? gp / gl : gp > 0 ? 99 : 0,
        totalR: rs.length ? rs.reduce((a, b) => a + b, 0) : 0,
      };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
}

const PALETTE = [
  "#7c6aff",
  "#34d399",
  "#f59e0b",
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#2dd4bf",
  "#fbbf24",
  "#4ade80",
  "#818cf8",
];

const paletteColor = (i: number) => PALETTE[i % PALETTE.length];

export function strategyPerformance(
  computed: ComputedTrade[],
  strategies: { id: string; name: string; color: string }[]
): DimensionStat[] {
  const colorMap = new Map(strategies.map((s) => [s.id, s.color]));
  return performanceBy(
    computed,
    (t) => t.strategyId,
    (k) => strategies.find((s) => s.id === k)?.name ?? k,
    (k) => colorMap.get(k) ?? "#8b8d99"
  );
}

export function symbolPerformance(computed: ComputedTrade[]): DimensionStat[] {
  const order = new Map<string, number>();
  const seen = new Set<string>();
  for (const t of computed) {
    if (!seen.has(t.symbol)) {
      seen.add(t.symbol);
      order.set(t.symbol, order.size);
    }
  }
  return performanceBy(
    computed,
    (t) => t.symbol,
    (k) => k,
    (k) => paletteColor(order.get(k) ?? 0)
  );
}

export function directionPerformance(computed: ComputedTrade[]) {
  return performanceBy(
    computed,
    (t) => t.direction,
    (k) => (k === "long" ? "Long" : "Short"),
    (k) => (k === "long" ? "#34d399" : "#fb7185")
  );
}

export function dayOfWeekPerformance(computed: ComputedTrade[]) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return performanceBy(
    computed,
    (t) => String(new Date(t.closedAt ?? t.openedAt).getUTCDay()),
    (k) => names[Number(k)],
    (k) => paletteColor(Number(k))
  ).sort((a, b) => Number(a.key) - Number(b.key));
}

export function hourPerformance(computed: ComputedTrade[]) {
  return performanceBy(
    computed,
    (t) => String(new Date(t.closedAt ?? t.openedAt).getUTCHours()),
    (k) => {
      const h = Number(k);
      const ampm = h >= 12 ? "PM" : "AM";
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr} ${ampm}`;
    },
    (k) => paletteColor(Number(k) % PALETTE.length)
  ).sort((a, b) => Number(a.key) - Number(b.key));
}

/* ------------------------------------------------------------------ */
/* Rating distribution                                                 */
/* ------------------------------------------------------------------ */
export function ratingDistribution(computed: ComputedTrade[]) {
  const closed = computed.filter((t) => t.status === "closed");
  const buckets = [1, 2, 3, 4, 5].map((r) => {
    const list = closed.filter((t) => t.rating === r);
    const wins = list.filter((t) => t.pnl > 0).length;
    return {
      rating: r,
      count: list.length,
      winRate: list.length ? (wins / list.length) * 100 : 0,
      pnl: Math.round(list.reduce((a, t) => a + t.pnl, 0) * 100) / 100,
    };
  });
  return buckets;
}

export function gradePerformance(computed: ComputedTrade[]) {
  return performanceBy(
    computed,
    (t) => t.grade || "—",
    (k) => `Grade ${k}`,
    (k) =>
      k === "A" ? "#34d399" : k === "B" ? "#38bdf8" : k === "C" ? "#f59e0b" : "#fb7185"
  );
}
