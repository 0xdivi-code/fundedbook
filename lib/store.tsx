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
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_SETTINGS,
  clearJournalData,
  deleteStrategy as dbDeleteStrategy,
  deleteTrade as dbDeleteTrade,
  friendlyDbError,
  loadJournal,
  saveSettings as dbSaveSettings,
  saveStrategy as dbSaveStrategy,
  saveTrade as dbSaveTrade,
  saveTourCompletion as dbSaveTour,
} from "./db";

export { DEFAULT_SETTINGS };

/**
 * Journal state, backed by Supabase Postgres (see `lib/db.ts` and
 * `supabase/schema.sql`). Data is loaded from the database after sign-in and
 * every mutation is applied optimistically, then persisted; if a write fails
 * the previous state is restored so the UI always mirrors the database.
 *
 * Onboarding (guided tour) state is also persisted per account — the tour
 * pops exactly once for each new user, on any device.
 */

interface JournalContextValue {
  trades: Trade[];
  strategies: Strategy[];
  settings: Settings;
  /** True once the journal has been loaded from the database. */
  hydrated: boolean;
  /** True when the initial database load failed (offline, misconfigured…). */
  loadFailed: boolean;
  /** Onboarding tour state, persisted per account in the database. */
  tourCompleted: boolean;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (id: string, patch: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  clearAllData: () => void;
  /** Mark the guided tour as completed (called on finish or skip). */
  completeTour: () => void;
  /** Show the guided tour again (Settings → replay tour). */
  restartTour: () => void;
  /** Re-attempt the initial database load after a failure. */
  retryLoad: () => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

interface JournalState {
  trades: Trade[];
  strategies: Strategy[];
  settings: Settings;
}

export function JournalProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  // New accounts always start empty — no demo trades, ever. Values are
  // replaced by the database load below before anything is rendered
  // (pages gate on `hydrated`).
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Mirrors of the latest state, so mutations can build the next value (and
  // roll back) without waiting for a re-render.
  const stateRef = useRef<JournalState>({
    trades: [],
    strategies: [],
    settings: DEFAULT_SETTINGS,
  });
  const { toast } = useToast();

  // Hydrate from the database on the client only (includes a one-time import
  // of any legacy localStorage data, which is then removed from the browser).
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await loadJournal(userId);
        if (cancelled) return;
        stateRef.current = {
          trades: snapshot.trades,
          strategies: snapshot.strategies,
          settings: snapshot.settings,
        };
        setTrades(snapshot.trades);
        setStrategies(snapshot.strategies);
        setSettings(snapshot.settings);
        setTourCompleted(snapshot.tourCompleted);
        setHydrated(true);
        setLoadFailed(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[fundedbook] journal load failed:", err);
        setLoadFailed(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, loadAttempt]);

  /**
   * Apply the next state optimistically and persist it. If the database
   * write fails, restore the snapshot and tell the user — the UI never
   * drifts from what's actually stored.
   */
  const commit = useCallback(
    (
      next: Partial<JournalState>,
      persist: () => Promise<{ message: string } | null>,
      failureTitle: string
    ) => {
      const snapshot = { ...stateRef.current };
      const merged: JournalState = { ...snapshot, ...next };
      stateRef.current = merged;
      if (next.trades) setTrades(next.trades);
      if (next.strategies) setStrategies(next.strategies);
      if (next.settings) setSettings(next.settings);

      void persist().then((error) => {
        if (!error) return;
        stateRef.current = snapshot;
        setTrades(snapshot.trades);
        setStrategies(snapshot.strategies);
        setSettings(snapshot.settings);
        toast({
          variant: "error",
          title: failureTitle,
          description: friendlyDbError(error.message),
        });
      });
    },
    [toast]
  );

  const addTrade = useCallback(
    (trade: Trade) => {
      commit(
        { trades: [trade, ...stateRef.current.trades] },
        () => dbSaveTrade(userId, trade),
        "Couldn't save trade"
      );
    },
    [userId, commit]
  );

  const updateTrade = useCallback(
    (id: string, patch: Partial<Trade>) => {
      const existing = stateRef.current.trades.find((t) => t.id === id);
      if (!existing) return;
      const updated: Trade = { ...existing, ...patch };
      commit(
        {
          trades: stateRef.current.trades.map((t) => (t.id === id ? updated : t)),
        },
        () => dbSaveTrade(userId, updated),
        "Couldn't update trade"
      );
    },
    [userId, commit]
  );

  const deleteTrade = useCallback(
    (id: string) => {
      commit(
        { trades: stateRef.current.trades.filter((t) => t.id !== id) },
        () => dbDeleteTrade(userId, id),
        "Couldn't delete trade"
      );
    },
    [userId, commit]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const updated: Settings = { ...stateRef.current.settings, ...patch };
      commit(
        { settings: updated },
        () => dbSaveSettings(userId, updated),
        "Couldn't save settings"
      );
    },
    [userId, commit]
  );

  const addStrategy = useCallback(
    (strategy: Strategy) => {
      commit(
        { strategies: [...stateRef.current.strategies, strategy] },
        () => dbSaveStrategy(userId, strategy),
        "Couldn't save strategy"
      );
    },
    [userId, commit]
  );

  const updateStrategy = useCallback(
    (id: string, patch: Partial<Strategy>) => {
      const existing = stateRef.current.strategies.find((s) => s.id === id);
      if (!existing) return;
      const updated: Strategy = { ...existing, ...patch };
      commit(
        {
          strategies: stateRef.current.strategies.map((s) =>
            s.id === id ? updated : s
          ),
        },
        () => dbSaveStrategy(userId, updated),
        "Couldn't update strategy"
      );
    },
    [userId, commit]
  );

  const deleteStrategy = useCallback(
    (id: string) => {
      commit(
        { strategies: stateRef.current.strategies.filter((s) => s.id !== id) },
        () => dbDeleteStrategy(userId, id),
        "Couldn't delete strategy"
      );
    },
    [userId, commit]
  );

  const clearAllData = useCallback(() => {
    commit(
      {
        trades: [],
        strategies: STARTER_STRATEGIES,
        settings: DEFAULT_SETTINGS,
      },
      () => clearJournalData(userId),
      "Couldn't clear journal"
    );
  }, [userId, commit]);

  const completeTour = useCallback(() => {
    setTourCompleted(true);
    void dbSaveTour(userId, true).then((error) => {
      if (error) {
        console.error("[fundedbook] couldn't save tour state:", error.message);
      }
    });
  }, [userId]);

  const restartTour = useCallback(() => {
    setTourCompleted(false);
  }, []);

  const retryLoad = useCallback(() => {
    setLoadAttempt((n) => n + 1);
  }, []);

  const value = useMemo<JournalContextValue>(
    () => ({
      trades,
      strategies,
      settings,
      hydrated,
      loadFailed,
      tourCompleted,
      addTrade,
      updateTrade,
      deleteTrade,
      updateSettings,
      addStrategy,
      updateStrategy,
      deleteStrategy,
      clearAllData,
      completeTour,
      restartTour,
      retryLoad,
    }),
    [
      trades,
      strategies,
      settings,
      hydrated,
      loadFailed,
      tourCompleted,
      addTrade,
      updateTrade,
      deleteTrade,
      updateSettings,
      addStrategy,
      updateStrategy,
      deleteStrategy,
      clearAllData,
      completeTour,
      restartTour,
      retryLoad,
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
