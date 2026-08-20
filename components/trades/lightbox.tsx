"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Screenshot, Trade } from "@/lib/types";
import { TradeChart } from "./trade-chart";

interface LightboxState {
  trade: Trade;
  shots: Screenshot[];
  index: number;
}

const LightboxContext = React.createContext<{
  open: (trade: Trade, shots: Screenshot[], index?: number) => void;
} | null>(null);

export function useLightbox() {
  const ctx = React.useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<LightboxState | null>(null);

  const open = React.useCallback(
    (trade: Trade, shots: Screenshot[], index = 0) => {
      setState({
        trade,
        shots,
        index: Math.max(0, Math.min(index, shots.length - 1)),
      });
    },
    []
  );

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      <Lightbox
        state={state}
        onState={setState}
        onClose={() => setState(null)}
      />
    </LightboxContext.Provider>
  );
}

function Lightbox({
  state,
  onState,
  onClose,
}: {
  state: LightboxState | null;
  onState: React.Dispatch<React.SetStateAction<LightboxState | null>>;
  onClose: () => void;
}) {
  if (!state) return null;
  return (
    <LightboxView
      key={state.trade.id}
      state={state}
      onState={onState}
      onClose={onClose}
    />
  );
}

function LightboxView({
  state,
  onState,
  onClose,
}: {
  state: LightboxState;
  onState: React.Dispatch<React.SetStateAction<LightboxState | null>>;
  onClose: () => void;
}) {
  const [scale, setScale] = React.useState(1);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef({
    startX: 0,
    startY: 0,
    ox: 0,
    oy: 0,
    active: false,
  });

  const { trade, shots, index } = state;
  const shot = shots[index];
  const isLast = index === shots.length - 1;
  const isFirst = index === 0;

  const resetZoom = React.useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const go = React.useCallback(
    (dir: 1 | -1) => {
      resetZoom();
      onState({
        ...state,
        index: Math.max(0, Math.min(shots.length - 1, index + dir)),
      });
    },
    [state, shots.length, index, onState, resetZoom]
  );

  const setIndex = React.useCallback(
    (i: number) => {
      resetZoom();
      onState({ ...state, index: i });
    },
    [state, onState, resetZoom]
  );

  const applyZoom = React.useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(5, next));
      setScale(clamped);
      if (clamped === 1) setPos({ x: 0, y: 0 });
    },
    []
  );

  const zoomBy = React.useCallback(
    (factor: number) => applyZoom(scale * factor),
    [scale, applyZoom]
  );

  const onWheel = React.useCallback(
    (e: React.WheelEvent) => applyZoom(scale - e.deltaY * 0.002),
    [scale, applyZoom]
  );

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        ox: pos.x,
        oy: pos.y,
        active: true,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scale, pos]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.active) return;
      setPos({
        x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
        y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
      });
    },
    []
  );

  const onPointerUp = React.useCallback(() => {
    dragRef.current.active = false;
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(1.25);
      else if (e.key === "-") zoomBy(0.8);
      else if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex flex-col bg-black/90 backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-white">
              {trade.symbol}
            </span>
            <span className="text-[12px] uppercase tracking-wide text-white/60">
              {trade.direction} · {shot.timeframe ?? "chart"}
            </span>
            <span className="text-[12px] text-white/40">
              {shot.label ? `· ${shot.label}` : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden px-12 py-4"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ cursor: scale > 1 ? "grab" : "default" }}
        >
          <motion.div
            className="relative flex h-full w-full items-center justify-center"
            animate={{ scale, x: pos.x, y: pos.y }}
            transition={{ type: "spring", stiffness: 200, damping: 28, mass: 0.6 }}
          >
            {shot.kind === "image" && shot.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot.url}
                alt={`${trade.symbol} screenshot`}
                draggable={false}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <div className="aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
                <TradeChart
                  seed={shot.seed ?? 1}
                  symbol={trade.symbol}
                  timeframe={shot.timeframe}
                  showLabel
                />
              </div>
            )}
          </motion.div>

          {/* Arrows */}
          <button
            onClick={() => go(-1)}
            disabled={isFirst}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-all hover:bg-white/20 disabled:opacity-30 cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={isLast}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-all hover:bg-white/20 disabled:opacity-30 cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 pb-3">
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            <button
              onClick={() => zoomBy(0.8)}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Zoom out"
            >
              <Minimize className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-[12px] font-medium tabular-nums text-white">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoomBy(1.25)}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyZoom(scale > 1 ? 1 : 2)}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Toggle fit"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
          <span className="ml-2 text-[12px] tabular-nums text-white/50">
            {index + 1} / {shots.length}
          </span>
        </div>

        {/* Thumbnails */}
        {shots.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto px-6 pb-4 no-scrollbar">
            {shots.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-all cursor-pointer",
                  i === index
                    ? "ring-primary"
                    : "ring-transparent opacity-50 hover:opacity-90"
                )}
              >
                <ShotVisual shot={s} symbol={trade.symbol} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function ShotVisual({
  shot,
  symbol,
  className,
}: {
  shot: Screenshot;
  symbol: string;
  className?: string;
}) {
  if (shot.kind === "image" && shot.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={shot.url}
        alt={`${symbol} screenshot`}
        className={cn("h-full w-full object-cover", className)}
        draggable={false}
      />
    );
  }
  return (
    <TradeChart
      seed={shot.seed ?? 1}
      symbol={symbol}
      timeframe={shot.timeframe}
      className={className}
    />
  );
}
