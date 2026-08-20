import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";

export const formatCurrency = (
  value: number,
  opts: { compact?: boolean; decimals?: number; sign?: boolean } = {}
): string => {
  const { compact = false, decimals, sign = false } = opts;
  const abs = Math.abs(value);

  if (compact && abs >= 1000) {
    const nf = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    const s = nf.format(value);
    return sign && value > 0 ? `+${s}` : s;
  }

  const nf = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals ?? (abs < 1000 ? 2 : 0),
    maximumFractionDigits: decimals ?? (abs < 1000 ? 2 : 0),
  });
  let s = nf.format(value);
  if (sign && value > 0) s = `+${s}`;
  return s;
};

export const formatNumber = (
  value: number,
  opts: { decimals?: number; compact?: boolean; sign?: boolean } = {}
): string => {
  const { decimals = 2, compact = false, sign = false } = opts;
  const nf = new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: compact ? 1 : decimals,
  });
  let s = nf.format(value);
  if (sign && value > 0) s = `+${s}`;
  return s;
};

export const formatPercent = (value: number, decimals = 1): string => {
  const nf = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${nf.format(value)}%`;
};

export const formatR = (value: number | null): string => {
  if (value === null || !isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}R`;
};

export const formatPrice = (value: number): string => {
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 1 : abs >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (iso: string): string =>
  format(new Date(iso), "MMM d, yyyy");

export const formatDateTime = (iso: string): string =>
  format(new Date(iso), "MMM d, yyyy · h:mm a");

export const formatShortDate = (iso: string): string =>
  format(new Date(iso), "MMM d");

export const formatTime = (iso: string): string =>
  format(new Date(iso), "h:mm a");

export const formatDay = (iso: string): string => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
};

export const relativeTime = (iso: string): string =>
  formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export const pnlTone = (value: number): "profit" | "loss" | "flat" =>
  value > 0 ? "profit" : value < 0 ? "loss" : "flat";

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
