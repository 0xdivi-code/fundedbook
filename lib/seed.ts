import type { Direction, Strategy, Trade, Screenshot } from "./types";

/* ------------------------------------------------------------------ */
/* Deterministic PRNG so server and client render identical seed data */
/* ------------------------------------------------------------------ */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANCHOR = new Date("2026-08-20T14:00:00Z");

function at(nDaysAgo: number, hour: number, minute: number): string {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() - nDaysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* Strategies                                                          */
/* ------------------------------------------------------------------ */
export const STRATEGIES: Strategy[] = [
  {
    id: "orb",
    name: "Opening Range Breakout",
    shortName: "ORB",
    description:
      "Trade the first decisive move out of the 15-minute opening range, in the direction of the pre-market bias.",
    setup:
      "Mark the 15m high/low. Wait for a clean retest of the range edge with rising volume, enter on the reclaim, stop beyond the range.",
    confluences: [
      "Pre-market volume above 500k",
      "Clear catalyst (news / earnings)",
      "Relative strength vs SPY",
      "Range height under 1.5 ATR",
    ],
    market: "US Equities",
    timeframe: "5m / 15m",
    color: "#7c6aff",
  },
  {
    id: "vwap",
    name: "VWAP Reversion",
    shortName: "VWAP",
    description:
      "Mean-reversion around VWAP when price stretches too far from the average on low conviction moves.",
    setup:
      "Wait for a 2+ standard-deviation extension from VWAP with fading volume, then enter the reversion with a stop beyond the extreme.",
    confluences: [
      "Extension beyond 2σ band",
      "Volume divergence on the extreme",
      "Round-number support nearby",
    ],
    market: "US Equities",
    timeframe: "5m",
    color: "#34d399",
  },
  {
    id: "gap-and-go",
    name: "Gap & Go",
    shortName: "Gap&Go",
    description:
      "Momentum continuation after a strong overnight gap that holds above the opening print.",
    setup:
      "Identify a gap of 3%+. After the first 5m candle holds the gap, enter in the gap direction on a high-volume breakout of the 5m high.",
    confluences: [
      "Gap ≥ 3% on earnings/news",
      "Float under 20M shares",
      "Opening range holds the gap",
    ],
    market: "US Equities",
    timeframe: "1m / 5m",
    color: "#f59e0b",
  },
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    shortName: "Pullback",
    description:
      "Buy/sell the first shallow pullback within an established trend, aligned with higher-timeframe structure.",
    setup:
      "Confirm trend on the 1h. Wait for a pullback to the 20 EMA with shrinking volume, enter on the reclaim of the prior candle high.",
    confluences: [
      "1h trend aligned",
      "Pullback under 38.2% Fib",
      "Higher lows intact",
    ],
    market: "Stocks / Futures",
    timeframe: "15m / 1h",
    color: "#38bdf8",
  },
  {
    id: "momentum-squeeze",
    name: "Momentum Squeeze",
    shortName: "Squeeze",
    description:
      "Volatility contraction followed by an explosive expansion — enter the first expansion candle.",
    setup:
      "Look for tightening Bollinger Bands inside Keltner Channels. Enter the first candle that closes outside the squeeze with 2x relative volume.",
    confluences: [
      "Squeeze of 20+ bars",
      "Relative volume ≥ 2x",
      "Sector catalyst confirmed",
    ],
    market: "US Equities",
    timeframe: "5m",
    color: "#fb7185",
  },
  {
    id: "range-fade",
    name: "Range Fade",
    shortName: "Range",
    description:
      "Fade the extremes of a well-defined range with tight stops and a target at the opposite edge.",
    setup:
      "Identify a range of at least 3 touches. Fade the third+ touch of an edge with a stop beyond it, target the mid or far edge.",
    confluences: [
      "At least 3 edge touches",
      "No scheduled catalyst",
      "Range persists on 15m",
    ],
    market: "US Equities",
    timeframe: "15m",
    color: "#a78bfa",
  },
];

/* ------------------------------------------------------------------ */
/* Symbols                                                             */
/* ------------------------------------------------------------------ */
interface SymbolDef {
  ticker: string;
  base: number;
  vol: number; // typical stop distance in dollars
  kind: "stock" | "etf" | "crypto";
}

const SYMBOLS: SymbolDef[] = [
  { ticker: "NVDA", base: 168, vol: 3.4, kind: "stock" },
  { ticker: "TSLA", base: 292, vol: 6.5, kind: "stock" },
  { ticker: "AAPL", base: 221, vol: 2.8, kind: "stock" },
  { ticker: "SPY", base: 612, vol: 3.6, kind: "etf" },
  { ticker: "QQQ", base: 551, vol: 4.2, kind: "etf" },
  { ticker: "AMD", base: 174, vol: 3.6, kind: "stock" },
  { ticker: "META", base: 668, vol: 8.4, kind: "stock" },
  { ticker: "COIN", base: 288, vol: 9.2, kind: "stock" },
  { ticker: "PLTR", base: 106, vol: 3.1, kind: "stock" },
  { ticker: "AMZN", base: 236, vol: 3.9, kind: "stock" },
  { ticker: "MSFT", base: 478, vol: 4.6, kind: "stock" },
  { ticker: "SMCI", base: 52, vol: 1.9, kind: "stock" },
  { ticker: "SOFI", base: 18.4, vol: 0.42, kind: "stock" },
  { ticker: "MARA", base: 24.6, vol: 0.9, kind: "stock" },
];

const TAG_POOL = [
  "breakout",
  "retest",
  "gap",
  "earnings",
  "news",
  "trend-day",
  "range",
  "scalp",
  "swing",
  "reversal",
  "momentum",
  "high-volume",
  "pre-market",
  "overnight",
  "oversold",
  "A+ setup",
];

const NOTE_TEMPLATES: ((s: string, d: Direction) => string)[] = [
  (s, d) =>
    `Clean ${d} on ${s} — waited for the retest of the pre-market high before committing.`,
  (s, d) =>
    `Took the ${d} after ${s} reclaimed VWAP on strong volume. Textbook execution.`,
  (s, d) =>
    `Second ${d} entry of the morning on ${s}. First attempt stopped out, sized down for this one.`,
  (s, d) =>
    `${s} gapped up into the open. Waited for the 5m consolidation, then entered the ${d} breakout.`,
  (s, d) =>
    `Range-bound session on ${s}. Faded the upper extreme with a tight stop on the ${d} side.`,
  (s, d) =>
    `Trend day — held the ${d} through the lunch lull and added on the pullback.`,
  (s, d) =>
    `Choppy tape on ${s}, took a smaller position than usual for a quick ${d} scalp.`,
  (s, d) =>
    `${s} broke structure on the 15m. Entered the ${d} on the retest, target at prior day high.`,
  (s, d) =>
    `News catalyst drove ${s} — momentum ${d} entry, risk managed tightly.`,
  (s, d) =>
    `Swing ${d} on ${s}, held overnight. Daily flag + sector strength behind it.`,
  (s, d) =>
    `${s} spiked on relative volume. Took the ${d} continuation with a stop under the 5m trigger.`,
  (s, d) =>
    `Reversal ${d} on ${s} after a lower-high failed to follow through.`,
];

const LESSON_POOL = [
  "Patience paid off — the A+ setup showed up an hour after the first signal.",
  "Cut the loser quickly instead of hoping. Discipline beats ego.",
  "Waiting for confirmation would have halved the drawdown here.",
  "The plan worked exactly as written. Logging for review.",
  "Overtraded after a small win — stepping away once the daily goal is hit.",
  "Letting the position work instead of micro-managing added R.",
  "Chasing the move cost ~0.4R. Wait for the retest next time.",
  "Strong follow-through — this pattern repeats on this symbol monthly.",
  "Sticking to the stop despite the wick saved a much larger loss.",
  "Trimmed into strength and protected the trade — will repeat.",
];

const MISTAKE_POOL = [
  "Moved stop loss",
  "Chased entry",
  "Oversized position",
  "Exited too early",
  "Ignored the plan",
  "Held through target",
  "Traded without a setup",
];

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"];

/* ------------------------------------------------------------------ */
/* Trade generation                                                    */
/* ------------------------------------------------------------------ */
function pickWeighted<T>(rand: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const GRADE_POOL = ["A", "B", "C", "D"];
const GRADE_WEIGHTS = [0.28, 0.38, 0.24, 0.1];
const QTY_POOL = [50, 100, 150, 200, 250, 300, 400, 500];

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function generateSeedTrades(): Trade[] {
  const rand = mulberry32(20260820);
  const trades: Trade[] = [];
  const count = 58;

  for (let i = 0; i < count; i++) {
    const sym = SYMBOLS[Math.floor(rand() * SYMBOLS.length)];
    const strat = STRATEGIES[Math.floor(rand() * STRATEGIES.length)];
    const direction: Direction = rand() < 0.62 ? "long" : "short";

    const isOpen = i >= count - 3; // last three trades remain open
    const isWin = rand() < 0.56;

    const quantity = QTY_POOL[Math.floor(rand() * QTY_POOL.length)];
    const risk = round2(200 + rand() * 220); // $200–$420
    const distance = round2(risk / quantity); // consistent stop distance

    const base = sym.base * (0.94 + rand() * 0.12);
    const entry = round2(base);
    const stop =
      direction === "long"
        ? round2(entry - distance)
        : round2(entry + distance);

    // R multiple outcome
    let rMultiple: number;
    if (isWin) {
      rMultiple = pickWeighted(rand, [1.3, 1.8, 2.3, 3.2, 4.2], [2, 4, 2.4, 1.2, 0.5]);
    } else {
      rMultiple = pickWeighted(rand, [-1, -0.85, -1.1, -0.6], [5, 1.6, 1.2, 1]);
    }

    const exit = isOpen
      ? null
      : round2(direction === "long" ? entry + rMultiple * distance : entry - rMultiple * distance);

    // planned reward distance (independent of realized outcome)
    const plannedRR = round2(1.5 + rand() * 1.8);
    const takeProfit = round2(
      direction === "long" ? entry + plannedRR * distance : entry - plannedRR * distance
    );

    const fees = round2(0.6 + rand() * 3.4);

    // timing — trades spread over ~95 days, clustered into sessions
    const daysAgo = Math.floor(rand() * 95);
    const hour = pickWeighted(
      rand,
      [9, 10, 11, 12, 13, 14, 15],
      [3, 2.5, 2, 1.2, 1.6, 2, 2]
    );
    const minute = Math.floor(rand() * 60);
    const openedAt = at(daysAgo, hour, minute);

    let closedAt: string | null = null;
    if (!isOpen) {
      const heldMinutes =
        rand() < 0.55
          ? Math.floor(15 + rand() * 300) // intraday
          : Math.floor(400 + rand() * 4000); // multi-hour / swing
      const c = new Date(openedAt);
      c.setUTCMinutes(c.getUTCMinutes() + heldMinutes);
      closedAt = c.toISOString();
    }

    const tags = new Set<string>();
    tags.add(direction === "long" ? "long" : "short");
    const tagCount = 1 + Math.floor(rand() * 3);
    for (let t = 0; t < tagCount; t++) {
      tags.add(TAG_POOL[Math.floor(rand() * TAG_POOL.length)]);
    }

    const mistakes: string[] = [];
    if (isOpen) {
      mistakes.push("In progress");
    } else if (!isWin && rand() < 0.5) {
      const m = MISTAKE_POOL[Math.floor(rand() * MISTAKE_POOL.length)];
      if (!mistakes.includes(m)) mistakes.push(m);
    }

    // screenshots
    const screenshotCount = pickWeighted(rand, [1, 2, 3], [0.22, 0.38, 0.4]);
    const labels = ["Entry", "Exit", "Management"];
    const screenshots: Screenshot[] = [];
    for (let s = 0; s < screenshotCount; s++) {
      screenshots.push({
        id: `ss_${i}_${s}`,
        kind: "chart",
        seed: Math.floor(rand() * 100000),
        symbol: sym.ticker,
        timeframe: TIMEFRAMES[Math.floor(rand() * TIMEFRAMES.length)],
        label: labels[s % labels.length],
        createdAt: openedAt,
      });
    }

    trades.push({
      id: `tr_${i + 1}`,
      symbol: sym.ticker,
      direction,
      status: isOpen ? "open" : "closed",
      strategyId: strat.id,
      entryPrice: entry,
      exitPrice: exit,
      quantity,
      stopLoss: stop,
      takeProfit,
      fees,
      openedAt,
      closedAt,
      rating: isOpen ? 0 : Math.min(5, Math.max(1, Math.round(2 + rand() * 4))),
      tags: Array.from(tags).slice(0, 4),
      notes: NOTE_TEMPLATES[Math.floor(rand() * NOTE_TEMPLATES.length)](
        sym.ticker,
        direction
      ),
      lessons: isOpen
        ? ""
        : LESSON_POOL[Math.floor(rand() * LESSON_POOL.length)],
      screenshots,
      grade: isOpen ? "" : pickWeighted(rand, GRADE_POOL, GRADE_WEIGHTS),
      mistakes,
    });
  }

  trades.sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );

  // Attach a few realistic raster screenshots to the most recent trades so the
  // image carousel showcases both uploaded-style photos and rendered charts.
  const imageShots: { url: string; label: string }[] = [
    { url: "/screenshots/execution-1.jpg", label: "Execution" },
    { url: "/screenshots/execution-2.jpg", label: "Setup" },
    { url: "/screenshots/execution-3.jpg", label: "Management" },
  ];
  imageShots.forEach((shot, i) => {
    const trade = trades[i];
    if (!trade) return;
    const img: Screenshot = {
      id: `img_${i}`,
      kind: "image",
      url: shot.url,
      label: shot.label,
      createdAt: trade.openedAt,
    };
    trade.screenshots = [img, ...trade.screenshots];
  });

  return trades;
}

export const ALL_TAGS = TAG_POOL;

export const SAMPLE_SYMBOLS = SYMBOLS.map((s) => s.ticker);
