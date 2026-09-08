/**
 * Test shim for `@/lib/supabase/client` — replaces the browser (cookie-based)
 * Supabase client with a plain one pointed at the local mock server, so
 * `lib/db.ts` can be exercised in Node. Wired up via `scripts/tsconfig.json`.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  return createSupabaseClient(
    process.env.MOCK_SUPABASE_URL ?? "http://localhost:54321",
    process.env.MOCK_SUPABASE_ANON_KEY ?? "test-anon-key",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
