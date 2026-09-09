import { createClient } from "@/lib/supabase/client";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Settings, Strategy, Trade } from "./types";
import { STARTER_STRATEGIES } from "./strategies";

/**
 * Database persistence for the journal (Supabase Postgres, free tier).
 *
 * Trades, strategies, settings and onboarding state all live server-side,
 * scoped to the signed-in user via Row Level Security (see
 * `supabase/schema.sql`). Nothing journal-related is written to the browser
 * anymore — a legacy localStorage copy is imported into the database once,
 * then removed.
 */

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

/** Map raw Postgres/PostgREST errors to something a trader can act on. */
export function friendlyDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("row-level security") || m.includes("violates row-level"))
    return "Your account isn't allowed to touch that data. Try signing out and back in.";
  if (m.includes("jwt") || m.includes("token") || m.includes("session"))
    return "Your session expired. Sign in again to keep your journal in sync.";
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("timeout"))
    return "Could not reach the database. Check your internet connection and try again.";
  if (m.includes("relation") && m.includes("does not exist"))
    return "The database tables are missing — run supabase/schema.sql in the Supabase SQL editor (see SUPABASE_SETUP.md).";
  return message;
}

/* ── Row shapes ──────────────────────────────────────────────────────────── */

interface TradeRow {
  id: string;
  user_id: string;
  symbol: string;
  direction: Trade["direction"];
  status: Trade["status"];
  strategy_id: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
  fees: number;
  opened_at: string;
  closed_at: string | null;
  rating: number;
  tags: string[] | null;
  notes: string;
  lessons: string;
  screenshots: Trade["screenshots"] | null;
  grade: string;
  mistakes: string[] | null;
}

interface StrategyRow {
  id: string;
  user_id: string;
  name: string;
  short_name: string;
  description: string;
  setup: string;
  confluences: string[] | null;
  market: string;
  timeframe: string;
  color: string;
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */

function tradeToRow(userId: string, t: Trade): TradeRow {
  return {
    id: t.id,
    user_id: userId,
    symbol: t.symbol,
    direction: t.direction,
    status: t.status,
    strategy_id: t.strategyId,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    quantity: t.quantity,
    stop_loss: t.stopLoss,
    take_profit: t.takeProfit,
    fees: t.fees,
    opened_at: t.openedAt,
    closed_at: t.closedAt,
    rating: t.rating,
    tags: t.tags,
    notes: t.notes,
    lessons: t.lessons,
    screenshots: t.screenshots,
    grade: t.grade,
    mistakes: t.mistakes,
  };
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    symbol: r.symbol,
    direction: r.direction,
    status: r.status,
    strategyId: r.strategy_id,
    entryPrice: r.entry_price,
    exitPrice: r.exit_price,
    quantity: r.quantity,
    stopLoss: r.stop_loss,
    takeProfit: r.take_profit,
    fees: r.fees,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    rating: r.rating,
    tags: r.tags ?? [],
    notes: r.notes,
    lessons: r.lessons,
    screenshots: r.screenshots ?? [],
    grade: r.grade,
    mistakes: r.mistakes ?? [],
  };
}

function strategyToRow(userId: string, s: Strategy): StrategyRow {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    short_name: s.shortName,
    description: s.description,
    setup: s.setup,
    confluences: s.confluences,
    market: s.market,
    timeframe: s.timeframe,
    color: s.color,
  };
}

function rowToStrategy(r: StrategyRow): Strategy {
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    description: r.description,
    setup: r.setup,
    confluences: r.confluences ?? [],
    market: r.market,
    timeframe: r.timeframe,
    color: r.color,
  };
}

/* ── Legacy localStorage migration ───────────────────────────────────────── */

/**
 * Before the cloud-database migration, journal data lived in localStorage
 * under `fundedbook:v1:<userId>`. On first load after the migration we import
 * that copy into the database (only the pieces the database doesn't have yet)
 * and then remove the browser copy for good.
 */
const LEGACY_KEY = (userId: string) => `fundedbook:v1:${userId}`;

interface LegacyShape {
  trades?: unknown;
  settings?: Partial<Settings> | null;
  strategies?: unknown;
}

function readLegacyLocal(
  userId: string
): { trades: Trade[]; settings: Settings; strategies: Strategy[] } | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(LEGACY_KEY(userId));
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LegacyShape;
    return {
      trades: Array.isArray(parsed.trades) ? (parsed.trades as Trade[]) : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      strategies: Array.isArray(parsed.strategies)
        ? (parsed.strategies as Strategy[])
        : STARTER_STRATEGIES,
    };
  } catch {
    return null;
  }
}

function removeLegacyLocal(userId: string) {
  try {
    window.localStorage.removeItem(LEGACY_KEY(userId));
  } catch {
    /* nothing else to do — it will be retried on next load */
  }
}

/* ── Reads ───────────────────────────────────────────────────────────────── */

export interface JournalSnapshot {
  trades: Trade[];
  strategies: Strategy[];
  settings: Settings;
  tourCompleted: boolean;
}

/**
 * Loads the user's whole journal from the database, imports any legacy
 * localStorage data on first run, and makes sure a brand-new account starts
 * from the documented defaults (starter strategies + default settings +
 * onboarding row).
 */
export async function loadJournal(userId: string): Promise<JournalSnapshot> {
  const supabase = createClient();

  const [tradesRes, strategiesRes, settingsRes, onboardingRes] =
    await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .order("opened_at", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("strategies").select("*").order("created_at"),
      supabase.from("user_settings").select("settings").eq("user_id", userId).maybeSingle(),
      supabase.from("user_onboarding").select("tour_completed").eq("user_id", userId).maybeSingle(),
    ]);

  // Surface load failures — the store decides how to present them.
  const loadError =
    tradesRes.error ?? strategiesRes.error ?? settingsRes.error ?? onboardingRes.error;
  if (loadError) throw new Error(friendlyDbError(loadError.message));

  let trades = (tradesRes.data ?? []).map(rowToTrade);
  let strategies = (strategiesRes.data ?? []).map(rowToStrategy);
  let settings = settingsRes.data?.settings ?? null;
  const tourCompleted = onboardingRes.data?.tour_completed ?? false;

  // ── One-time import of the pre-migration browser copy ──
  const legacy = readLegacyLocal(userId);
  if (legacy) {
    let migrated = true;

    if (trades.length === 0 && legacy.trades.length > 0) {
      for (const t of legacy.trades) {
        if (await saveTrade(userId, t)) {
          migrated = false; // keep the local copy; retry on next load
          break;
        }
      }
      if (migrated) {
        trades = [...legacy.trades].sort(
          (a, b) => +new Date(b.openedAt) - +new Date(a.openedAt)
        );
      }
    }
    if (!settings) {
      if (await saveSettings(userId, legacy.settings)) migrated = false;
      else settings = legacy.settings;
    }
    if (strategies.length === 0) {
      if (await saveStrategies(userId, legacy.strategies)) migrated = false;
      else strategies = legacy.strategies;
    }

    // Only drop the browser copy once everything is safely in the database.
    if (migrated) removeLegacyLocal(userId);
  }

  // ── Defaults for a brand-new account ──
  if (strategies.length === 0) {
    await saveStrategies(userId, STARTER_STRATEGIES);
    strategies = [...STARTER_STRATEGIES];
  }
  if (!settings) {
    await saveSettings(userId, DEFAULT_SETTINGS);
    settings = DEFAULT_SETTINGS;
  }
  if (onboardingRes.data == null) {
    await saveTourCompletion(userId, false);
  }

  return { trades, strategies, settings, tourCompleted };
}

/* ── Writes (each returns null on success, or the PostgREST error) ───────── */

export async function saveTrade(
  userId: string,
  trade: Trade
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trades")
    .upsert(tradeToRow(userId, trade), { onConflict: "id" });
  return error;
}

export async function deleteTrade(
  userId: string,
  id: string
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  return error;
}

export async function saveSettings(
  userId: string,
  settings: Settings
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}

export async function saveStrategy(
  userId: string,
  strategy: Strategy
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase.from("strategies").upsert(
    strategyToRow(userId, strategy),
    { onConflict: "user_id,id" }
  );
  return error;
}

/**
 * Insert several strategies one statement at a time so `created_at` (the sort
 * key) stays strictly increasing — batched inserts share one timestamp.
 */
export async function saveStrategies(
  userId: string,
  list: Strategy[]
): Promise<PostgrestError | null> {
  for (const s of list) {
    const error = await saveStrategy(userId, s);
    if (error) return error;
  }
  return null;
}

export async function deleteStrategy(
  userId: string,
  id: string
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase.from("strategies").delete().eq("id", id);
  return error;
}

export async function saveTourCompletion(
  userId: string,
  completed: boolean
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const { error } = await supabase.from("user_onboarding").upsert(
    {
      user_id: userId,
      tour_completed: completed,
      tour_completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return error;
}

/** Reset the journal: delete every trade + strategy, restore the defaults. */
export async function clearJournalData(
  userId: string
): Promise<PostgrestError | null> {
  const supabase = createClient();
  const tradesError = await deleteAllTrades(userId, supabase);
  if (tradesError) return tradesError;
  const strategiesError = await deleteAllStrategies(userId, supabase);
  if (strategiesError) return strategiesError;
  const settingsError = await saveSettings(userId, DEFAULT_SETTINGS);
  if (settingsError) return settingsError;
  return saveStrategies(userId, STARTER_STRATEGIES);
}

async function deleteAllTrades(
  userId: string,
  supabase: SupabaseClient
): Promise<PostgrestError | null> {
  const { error } = await supabase.from("trades").delete().eq("user_id", userId);
  return error;
}

async function deleteAllStrategies(
  userId: string,
  supabase: SupabaseClient
): Promise<PostgrestError | null> {
  const { error } = await supabase.from("strategies").delete().eq("user_id", userId);
  return error;
}
