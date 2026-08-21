"use client";

import React from "react";
import { mulberry32 } from "@/lib/random";
import { cn } from "@/lib/utils";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateCandles(seed: number, count: number): Candle[] {
  const rand = mulberry32(seed);
  const candles: Candle[] = [];
  let price = 60 + rand() * 90;
  let trend = (rand() - 0.5) * 0.004;

  for (let i = 0; i < count; i++) {
    // slowly mean-revert the trend so charts look varied but bounded
    trend = trend * 0.97 + (rand() - 0.5) * 0.0012;
    const open = price;
    const drift = trend + (rand() - 0.5) * 0.014;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + rand() * 0.005);
    const low = Math.min(open, close) * (1 - rand() * 0.005);
    const volume = 0.25 + rand() * 0.75;
    candles.push({ open, high, low, close, volume });
    price = close;
  }
  return candles;
}

function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[i] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

interface TradeChartProps {
  seed: number;
  symbol?: string;
  timeframe?: string;
  className?: string;
  showLabel?: boolean;
}

export function TradeChart({
  seed,
  symbol,
  timeframe,
  className,
  showLabel = false,
}: TradeChartProps) {
  const { candles, ma, min, max } = React.useMemo(() => {
    const c = generateCandles(seed, 52);
    const closes = c.map((x) => x.close);
    const ma = ema(closes, 9);
    const min = Math.min(...c.map((x) => x.low));
    const max = Math.max(...c.map((x) => x.high));
    const pad = (max - min) * 0.08;
    return { candles: c, ma, min: min - pad, max: max + pad };
  }, [seed]);

  const W = 640;
  const H = 400;
  const padL = 8;
  const padR = 58;
  const padT = 16;
  const padB = 28;
  const priceH = H - padT - padB;
  const volH = priceH * 0.16;
  const chartH = priceH - volH - 6;

  const plotW = W - padL - padR;
  const step = plotW / candles.length;
  const bodyW = Math.max(3, Math.min(9, step * 0.62));

  const y = (v: number) =>
    padT + ((max - v) / (max - min)) * chartH;

  const priceTicks = 5;
  const maxVol = Math.max(...candles.map((c) => c.volume));

  const emaPath = React.useMemo(() => {
    return ma
      .map((v, i) => {
        const x = padL + step * i + step / 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y(v).toFixed(2)}`;
      })
      .join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ma, min, max]);

  const timeLabel = (i: number) => {
    const mins = 9 * 60 + 30 + i * 5;
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
      role="img"
      aria-label={`${symbol ?? "Trading"} chart`}
    >
      <defs>
        <linearGradient id={`up-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00f5a0" />
          <stop offset="100%" stopColor="#037a53" />
        </linearGradient>
        <linearGradient id={`down-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="100%" stopColor="#8f1c33" />
        </linearGradient>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1714" stopOpacity="1" />
          <stop offset="100%" stopColor="#070d0b" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill={`url(#bg-${seed})`} rx="0" />

      {/* grid lines */}
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const gy = padT + (chartH / priceTicks) * i;
        const val = max - ((max - min) / priceTicks) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={gy}
              x2={W - padR}
              y2={gy}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
            <text
              x={W - padR + 8}
              y={gy + 3}
              fontSize="9.5"
              fill="rgba(139,141,153,0.85)"
              fontFamily="JetBrains Mono Variable, monospace"
            >
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* time labels */}
      {candles.map((_, i) => {
        if (i % 8 !== 0) return null;
        const x = padL + step * i + step / 2;
        return (
          <text
            key={i}
            x={x}
            y={H - 8}
            fontSize="9"
            fill="rgba(139,141,153,0.7)"
            fontFamily="JetBrains Mono Variable, monospace"
            textAnchor="middle"
          >
            {timeLabel(i)}
          </text>
        );
      })}

      {/* volume bars */}
      <g>
        {candles.map((c, i) => {
          const x = padL + step * i + step / 2;
          const vh = (c.volume / maxVol) * volH;
          const up = c.close >= c.open;
          return (
            <rect
              key={i}
              x={x - bodyW / 2}
              y={padT + chartH + 6 + (volH - vh)}
              width={bodyW}
              height={Math.max(1, vh)}
              rx="1"
              fill={up ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)"}
            />
          );
        })}
      </g>

      {/* EMA line */}
      <path
        d={emaPath}
        fill="none"
        stroke="rgba(124,106,255,0.75)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* candles */}
      <g>
        {candles.map((c, i) => {
          const x = padL + step * i + step / 2;
          const up = c.close >= c.open;
          const color = up ? "#00f5a0" : "#ff4d6d";
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyBottom = y(Math.min(c.open, c.close));
          const bodyHeight = Math.max(1.2, bodyBottom - bodyTop);
          return (
            <g key={i}>
              <line
                x1={x}
                y1={y(c.high)}
                x2={x}
                y2={y(c.low)}
                stroke={color}
                strokeWidth="1"
              />
              <rect
                x={x - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyHeight}
                rx="0.8"
                fill={up ? `url(#up-${seed})` : `url(#down-${seed})`}
              />
            </g>
          );
        })}
      </g>

      {/* last price line */}
      {(() => {
        const last = candles[candles.length - 1];
        const ly = y(last.close);
        const up = last.close >= last.open;
        return (
          <g>
            <line
              x1={padL}
              y1={ly}
              x2={W - padR}
              y2={ly}
              stroke={up ? "#00f5a0" : "#ff4d6d"}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.7"
            />
            <rect
              x={W - padR}
              y={ly - 8}
              width={padR}
              height={16}
              rx="2"
              fill={up ? "#00f5a0" : "#ff4d6d"}
            />
            <text
              x={W - padR + 4}
              y={ly + 3.5}
              fontSize="9.5"
              fill="#060c0a"
              fontFamily="JetBrains Mono Variable, monospace"
              fontWeight="600"
            >
              {last.close.toFixed(1)}
            </text>
          </g>
        );
      })()}

      {showLabel && (
        <text
          x={padL + 2}
          y={padT + 10}
          fontSize="10"
          fill="rgba(139,141,153,0.9)"
          fontFamily="JetBrains Mono Variable, monospace"
          fontWeight="600"
        >
          {symbol ? `${symbol} · ` : ""}
          {timeframe ?? ""}
        </text>
      )}
    </svg>
  );
}
