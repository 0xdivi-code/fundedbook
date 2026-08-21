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
import { STARTER_STRATEGIES } from "./strategies";

/**
 * Journal data is scoped per authenticated user:
 *   fundedbook:v1:<userId>
 * Every new account starts completely empty — no demo trades, ever.
 */
const storageKey = (userId: string) => `fundedbook:v1:${userId}`;

export const DEFAULT_SETTINGS: Settings = {
  accountSize: 50000,
  currency: "USD",
  riskPerTrade: 1,
  defaultQuantity: 100,
  showUnrealized: true,
  compactNumbers: false,
  theme: "dark",
  accent: "#00f5a0",
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
  clearAllData: () => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

function load(userId: string): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.trades)) return null;
    return {
      trades: parsed.trades,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      strategies: Array.isArray(parsed.strategies)
        ? parsed.strategies
        : STARTER_STRATEGIES,
    };
  } catch {
    return null;
  }
}

function save(
  userId: string,
  trades: Trade[],
  settings: Settings,
  strategies: Strategy[]
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(userId),
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
        storageKey(userId),
        JSON.stringify({ trades: slim, settings, strategies } satisfies PersistShape)
      );
    } catch {
      /* give up silently */
    }
  }
}

export function JournalProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  // New accounts always start empty. The dashboard shows a getting-started
  // guide until the first trade is logged.
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>(STARTER_STRATEGIES);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const firstLoad = useRef(true);

  // Hydrate from this user's localStorage on the client only.
  useEffect(() => {
    const persisted = load(userId);
    if (persisted) {
      // Synchronizing external (localStorage) state into React on mount —
      // this is the canonical hydration pattern, hence the rule relaxation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrades(persisted.trades);
      setSettings(persisted.settings);
      setStrategies(persisted.strategies);
    }
    setHydrated(true);
  }, [userId]);

  // Persist on change (skip the first render so we don't clobber storage).
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (hydrated) save(userId, trades, settings, strategies);
  }, [userId, trades, settings, strategies, hydrated]);

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

  const clearAllData = useCallback(() => {
    setTrades([]);
    setSettings(DEFAULT_SETTINGS);
    setStrategies(STARTER_STRATEGIES);
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
      clearAllData,
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
      clearAllData,
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
