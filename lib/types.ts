export type Direction = "long" | "short";
export type TradeStatus = "open" | "closed";
export type ScreenshotKind = "chart" | "image";

export interface Screenshot {
  id: string;
  kind: ScreenshotKind;
  /** data URL for uploaded images */
  url?: string;
  /** deterministic seed used to render a candlestick chart */
  seed?: number;
  symbol?: string;
  timeframe?: string;
  label?: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  symbol: string;
  direction: Direction;
  status: TradeStatus;
  strategyId: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  openedAt: string;
  closedAt: string | null;
  /** 1–5 */
  rating: number;
  tags: string[];
  notes: string;
  lessons: string;
  screenshots: Screenshot[];
  /** A–D setup quality grade */
  grade: string;
  mistakes: string[];
}

export interface Strategy {
  id: string;
  name: string;
  shortName: string;
  description: string;
  setup: string;
  confluences: string[];
  market: string;
  timeframe: string;
  color: string;
}

export interface PlaybookRule {
  id: string;
  strategyId: string;
  title: string;
  detail: string;
}

export interface Settings {
  accountSize: number;
  currency: string;
  riskPerTrade: number;
  defaultQuantity: number;
  showUnrealized: boolean;
  compactNumbers: boolean;
  theme: "dark";
  accent: string;
}

export interface TradeDraft {
  symbol: string;
  direction: Direction;
  status: TradeStatus;
  strategyId: string;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  stopLoss: string;
  takeProfit: string;
  fees: string;
  openedAt: string;
  closedAt: string;
  rating: number;
  grade: string;
  tags: string[];
  notes: string;
  lessons: string;
  screenshots: Screenshot[];
}

export interface ComputedTrade extends Trade {
  pnl: number;
  pnlPercent: number;
  risk: number;
  rMultiple: number | null;
  rrRatio: number | null;
  duration: string;
  isWin: boolean;
}
