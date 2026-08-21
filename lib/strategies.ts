import type { Strategy } from "./types";

/**
 * Starter playbook templates that ship with every new account.
 *
 * These are *not* demo data — no fake trades, no fake P&L. They're editable
 * strategy cards meant to show new users what a well-documented setup looks
 * like. Users can edit or delete them freely from the Playbook page.
 */
export const STARTER_STRATEGIES: Strategy[] = [
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
    color: "#00f5a0",
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
    color: "#d7ff3e",
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
    color: "#00d9c0",
  },
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    shortName: "Pullback",
    description:
      "Buy/sell the first shallow pullback within an established trend, aligned with higher-timeframe structure.",
    setup:
      "Confirm trend on the 1h. Wait for a pullback to the 20 EMA with shrinking volume, enter on the reclaim of the prior candle high.",
    confluences: ["1h trend aligned", "Pullback under 38.2% Fib", "Higher lows intact"],
    market: "Stocks / Futures",
    timeframe: "15m / 1h",
    color: "#8bff5a",
  },
];
