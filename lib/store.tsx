"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Settings, Strategy, Trade } from "./types";
import { generateSeedTrades, STRATEGIES } from "./seed";

const STORAGE_KEY = "fundedbook:v1";

export const DEFAULT_SETTINGS: Settings = {
  accountSize: 50000,
  currency: "USD",
  riskPerTrade: 1,
  defaultQuantity: 100,
  showUnrealized: true,
  compactNumbers: false,
  theme: "dark",
  accent: "#7c6aff",
};

interface PersistShape {
  trades: Trade[];
  settings: Settings;
  strategies: Strategy[];
}

interface JournalContextValue {
  trades: Trade[];
  strategies: Strategy[];
  settings: Settings;
  hydrated: boolean;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (id: string, patch: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  resetData: () => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

function load(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.trades)) return null;
    return {
      trades: parsed.trades,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      strategies: Array.isArray(parsed.strategies)
        ? parsed.strategies
        : STRATEGIES,
    };
  } catch {
    return null;
  }
}

function save(trades: Trade[], settings: Settings, strategies: Strategy[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ trades, settings, strategies } satisfies PersistShape)
    );
  } catch {
    // Storage quota exceeded — drop the oldest large screenshots and retry once.
    try {
      const slim: Trade[] = trades.map((t) => ({
        ...t,
        screenshots: t.screenshots.slice(0, 2),
      }));
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ trades: slim, settings, strategies } satisfies PersistShape)
      );
    } catch {
      /* give up silently */
    }
  }
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(() => generateSeedTrades());
  const [strategies, setStrategies] = useState<Strategy[]>(STRATEGIES);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const firstLoad = useRef(true);

  // Hydrate from localStorage on the client only.
  useEffect(() => {
    const persisted = load();
    if (persisted) {
      // Synchronizing external (localStorage) state into React on mount —
      // this is the canonical hydration pattern, hence the rule relaxation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrades(persisted.trades);
      setSettings(persisted.settings);
      setStrategies(persisted.strategies);
    }
    setHydrated(true);
  }, []);

  // Persist on change (skip the first render so we don't clobber storage).
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (hydrated) save(trades, settings, strategies);
  }, [trades, settings, strategies, hydrated]);

  const addTrade = useCallback((trade: Trade) => {
    setTrades((prev) => [trade, ...prev]);
  }, []);

  const updateTrade = useCallback((id: string, patch: Partial<Trade>) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addStrategy = useCallback((strategy: Strategy) => {
    setStrategies((prev) => [...prev, strategy]);
  }, []);

  const updateStrategy = useCallback((id: string, patch: Partial<Strategy>) => {
    setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteStrategy = useCallback((id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resetData = useCallback(() => {
    setTrades(generateSeedTrades());
    setSettings(DEFAULT_SETTINGS);
    setStrategies(STRATEGIES);
  }, []);

  const value = useMemo<JournalContextValue>(
    () => ({
      trades,
      strategies,
      settings,
      hydrated,
      addTrade,
      updateTrade,
      deleteTrade,
      updateSettings,
      addStrategy,
      updateStrategy,
      deleteStrategy,
      resetData,
    }),
    [
      trades,
      strategies,
      settings,
      hydrated,
      addTrade,
      updateTrade,
      deleteTrade,
      updateSettings,
      addStrategy,
      updateStrategy,
      deleteStrategy,
      resetData,
    ]
  );

  return (
    <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
  );
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within JournalProvider");
  return ctx;
}
