/**
 * Integration test for `lib/db.ts` against the local PostgREST mock
 * (`scripts/mock-supabase.ts`). Run:
 *
 *   node scripts/mock-supabase.ts &
 *   MOCK_SUPABASE_URL=http://localhost:54321 npx tsx scripts/db-flow-test.ts
 *
 * (tsx resolves the @/ paths + the client shim through scripts/tsconfig.json.)
 */
process.env.MOCK_SUPABASE_URL ??= "http://localhost:54321";

// Minimal window/localStorage polyfill so the legacy-migration code path in
// lib/db.ts can run under Node.
const backing = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => void backing.set(k, v),
    removeItem: (k: string) => void backing.delete(k),
  },
};

import {
  DEFAULT_SETTINGS,
  clearJournalData,
  deleteStrategy,
  deleteTrade,
  loadJournal,
  saveSettings,
  saveStrategy,
  saveTrade,
  saveTourCompletion,
} from "@/lib/db";
import { STARTER_STRATEGIES } from "@/lib/strategies";
import type { Strategy, Trade } from "@/lib/types";

const USER = "11111111-1111-1111-1111-111111111111";
const LEGACY_USER = "22222222-2222-2222-2222-222222222222";
const legacyKey = (id: string) => `fundedbook:v1:${id}`;

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "tr_1",
    symbol: "AAPL",
    direction: "long",
    status: "closed",
    strategyId: "orb",
    entryPrice: 150.25,
    exitPrice: 155.75,
    quantity: 100,
    stopLoss: 148,
    takeProfit: 158,
    fees: 1.95,
    openedAt: "2026-09-01T14:30:00.000Z",
    closedAt: "2026-09-01T15:45:00.000Z",
    rating: 4,
    tags: ["breakout", "earnings"],
    notes: "Clean reclaim of the range high",
    lessons: "Could have sized up — A+ setup",
    screenshots: [
      { id: "shot_1", kind: "chart", seed: 12345, symbol: "AAPL", timeframe: "5m", createdAt: "2026-09-01T16:00:00.000Z" },
      { id: "shot_2", kind: "image", url: "data:image/jpeg;base64,TESTDATA", label: "Screenshot", createdAt: "2026-09-01T16:01:00.000Z" },
    ],
    grade: "A",
    mistakes: [],
    ...overrides,
  };
}

/** Order-insensitive deep equal (dates compared as instants). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
  if (a instanceof Date || b instanceof Date) {
    return new Date(a as string).getTime() === new Date(b as string).getTime();
  }
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) =>
      Object.hasOwn(b as object, k) &&
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  );
}

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : "");
  }
}

async function main() {
  console.log("\n[1] fresh account gets defaults");
  let snap = await loadJournal(USER);
  check("starter strategies seeded", deepEqual(snap.strategies, STARTER_STRATEGIES));
  check("default settings", deepEqual(snap.settings, DEFAULT_SETTINGS));
  check("tour not completed", snap.tourCompleted === false);
  check("no trades", snap.trades.length === 0);

  console.log("\n[2] trade round-trips through the database");
  const trade = makeTrade();
  check("saveTrade succeeds", (await saveTrade(USER, trade)) === null);
  snap = await loadJournal(USER);
  check("trade loaded back identical", deepEqual(snap.trades, [trade]), snap.trades[0]);

  const openTrade = makeTrade({ id: "tr_open", status: "open", exitPrice: null, closedAt: null, rating: 0, grade: "", openedAt: "2026-09-02T09:00:00.000Z" });
  await saveTrade(USER, openTrade);
  const oldTrade = makeTrade({ id: "tr_old", openedAt: "2020-01-01T00:00:00.000Z", closedAt: "2020-01-01T01:00:00.000Z" });
  await saveTrade(USER, oldTrade);
  snap = await loadJournal(USER);
  const order = snap.trades.map((t) => t.id);
  check("orders newest-first", deepEqual(order, ["tr_open", "tr_1", "tr_old"]), order);
  check("open trade nulls preserved", snap.trades.find((t) => t.id === "tr_open")?.exitPrice === null);

  console.log("\n[3] update + delete");
  const edited = { ...trade, exitPrice: 157.5, notes: "updated note" };
  await saveTrade(USER, edited);
  snap = await loadJournal(USER);
  check("update persists", snap.trades.find((t) => t.id === "tr_1")?.exitPrice === 157.5);
  check("deleteTrade succeeds", (await deleteTrade(USER, "tr_old")) === null);
  snap = await loadJournal(USER);
  check("row removed", snap.trades.length === 2 && !snap.trades.some((t) => t.id === "tr_old"));

  console.log("\n[4] settings + strategies + tour state");
  check(
    "saveSettings succeeds",
    (await saveSettings(USER, { ...DEFAULT_SETTINGS, accountSize: 12345, riskPerTrade: 2.5 })) === null
  );
  snap = await loadJournal(USER);
  check("settings round-trip", snap.settings.accountSize === 12345 && snap.settings.riskPerTrade === 2.5);
  const custom: Strategy = {
    id: "custom",
    name: "Custom Setup",
    shortName: "CST",
    description: "d",
    setup: "s",
    confluences: ["a", "b"],
    market: "Futures",
    timeframe: "1h",
    color: "#d7ff3e",
  };
  check("saveStrategy succeeds", (await saveStrategy(USER, custom)) === null);
  check("deleteStrategy succeeds", (await deleteStrategy(USER, "orb")) === null);
  snap = await loadJournal(USER);
  check(
    "strategy add/del round-trip",
    snap.strategies.some((s) => s.id === "custom") && !snap.strategies.some((s) => s.id === "orb")
  );
  check("saveTourCompletion succeeds", (await saveTourCompletion(USER, true)) === null);
  snap = await loadJournal(USER);
  check("tour completed persists", snap.tourCompleted === true);

  console.log("\n[5] legacy localStorage import — skipped when DB already has data");
  backing.set(
    legacyKey(USER),
    JSON.stringify({
      trades: [makeTrade({ id: "tr_junk", symbol: "JUNK" })],
      settings: { ...DEFAULT_SETTINGS, accountSize: 999 },
      strategies: [{ ...STARTER_STRATEGIES[0], name: "JUNK STRATEGY" }],
    })
  );
  snap = await loadJournal(USER);
  check("existing DB trades win", !snap.trades.some((t) => t.id === "tr_junk"));
  check("existing DB settings win", snap.settings.accountSize === 12345);
  check("browser copy removed after successful load", backing.get(legacyKey(USER)) === undefined);

  console.log("\n[6] legacy localStorage import — fresh browser, empty DB");
  // Emulate per-user isolation (production: RLS) by resetting the mock.
  await fetch(`${process.env.MOCK_SUPABASE_URL}/__reset`, { method: "POST" });
  const legacyTrade = makeTrade({ id: "tr_legacy", symbol: "TSLA" });
  backing.set(
    legacyKey(LEGACY_USER),
    JSON.stringify({
      trades: [legacyTrade],
      settings: { ...DEFAULT_SETTINGS, accountSize: 777 },
      strategies: [custom],
    })
  );
  snap = await loadJournal(LEGACY_USER);
  check("legacy trades imported", deepEqual(snap.trades, [legacyTrade]), snap.trades[0]);
  check("legacy settings imported", snap.settings.accountSize === 777);
  check("legacy strategies imported", snap.strategies.some((s) => s.id === "custom"));
  check("browser copy removed", backing.get(legacyKey(LEGACY_USER)) === undefined);

  console.log("\n[7] clear journal restores a clean slate");
  // Back to USER's own isolated database view (production: RLS scoping).
  await fetch(`${process.env.MOCK_SUPABASE_URL}/__reset`, { method: "POST" });
  // Seed a dirty journal first so the reset is meaningful.
  await saveTrade(USER, makeTrade({ id: "tr_x", symbol: "MSFT" }));
  await saveSettings(USER, { ...DEFAULT_SETTINGS, accountSize: 4242 });
  await saveStrategy(USER, custom);
  check("clearJournalData succeeds", (await clearJournalData(USER)) === null);
  snap = await loadJournal(USER);
  check("trades wiped", snap.trades.length === 0);
  check("starter strategies restored", deepEqual(snap.strategies, STARTER_STRATEGIES));
  check("settings reset", deepEqual(snap.settings, DEFAULT_SETTINGS));

  console.log("\n[8] failure paths");
  const realUrl = process.env.MOCK_SUPABASE_URL;
  process.env.MOCK_SUPABASE_URL = "http://localhost:59999"; // nothing listening
  const saveErr = await saveTrade(USER, makeTrade({ id: "tr_dead" }));
  check("saveTrade returns error (not throw)", saveErr !== null, saveErr);
  let loadThrew = false;
  let loadMsg = "";
  try {
    await loadJournal(USER);
  } catch (e) {
    loadThrew = true;
    loadMsg = (e as Error).message;
  }
  check("loadJournal throws on unreachable DB", loadThrew, loadMsg);
  process.env.MOCK_SUPABASE_URL = realUrl;
  snap = await loadJournal(USER);
  check("recovers once DB is reachable", snap.trades.length === 0);

  console.log(
    failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main();
