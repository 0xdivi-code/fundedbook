/**
 * Minimal PostgREST-compatible mock server — used ONLY by
 * `scripts/db-flow-test.ts` to exercise `lib/db.ts` end-to-end without a real
 * Supabase project. Not part of the app; never started in production.
 *
 * Implements just enough of the PostgREST API for supabase-js:
 *   GET    /rest/v1/:table?select=*&<col>=eq.<v>&order=<col>.<dir>
 *   POST   /rest/v1/:table            (Prefer: resolution=merge-duplicates → upsert)
 *   DELETE /rest/v1/:table?id=eq.<v>
 * plus `.maybeSingle()` semantics (Accept: application/vnd.pgrst.object+json).
 */
import { createServer } from "node:http";

/** table → rows (in insertion order) */
const tables = new Map<string, Record<string, unknown>[]>();

function table(name: string): Record<string, unknown>[] {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name)!;
}

/** Parse `col=eq.value` filters (the only operator lib/db.ts emits). */
function parseFilters(searchParams: URLSearchParams) {
  const filters = new Map<string, string>();
  for (const [key, value] of searchParams.entries()) {
    const m = /^eq\.(.*)$/.exec(value);
    if (m) filters.set(key, m[1]);
  }
  return filters;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (process.env.MOCK_DEBUG) {
    console.log(`[mock-supabase] ${req.method} ${req.url}`);
  }
  const respond = (status: number, body: unknown) => {
    const payload = body === null ? "null" : JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json",
    });
    res.end(payload);
  };

  if (!url.pathname.startsWith("/rest/v1/")) {
    // Test-only endpoint: wipe all tables (emulates per-user isolation,
    // which in production is enforced by Row Level Security).
    if (url.pathname === "/__reset" && req.method === "POST") {
      tables.clear();
      return respond(200, { ok: true });
    }
    return respond(404, { message: "not found" });
  }
  const name = url.pathname.slice("/rest/v1/".length);
  const rows = table(name);
  const filters = parseFilters(url.searchParams);
  const wantsSingle = (req.headers.accept ?? "").includes("vnd.pgrst.object+json");

  if (req.method === "GET") {
    let out = rows.filter((r) =>
      [...filters.entries()].every(([k, v]) => String(r[k]) === v)
    );
    // PostgREST order syntax: order=col.desc,col2.asc — first column is
    // primary. Sequential stable sorts → apply primary LAST.
    const orders = url.searchParams
      .getAll("order")
      .flatMap((o) => o.split(","))
      .filter(Boolean)
      .reverse();
    for (const order of orders) {
      const [col, dir] = order.split(".");
      out = [...out].sort((a, b) => {
        const av = a[col] as string | number;
        const bv = b[col] as string | number;
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return dir === "desc" ? -cmp : cmp;
      });
    }
    if (wantsSingle) {
      if (out.length !== 1) {
        // PostgREST signals "no (or many) rows" with 406; supabase-js's
        // maybeSingle() turns that into `{ data: null }`.
        return respond(
          406,
          out.length === 0
            ? { message: "JSON object requested, multiple (or no) rows returned" }
            : { message: "multiple rows returned" }
        );
      }
      return respond(200, out[0]);
    }
    return respond(200, out);
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const incoming = JSON.parse(body || "[]") as Record<string, unknown>[];
      const list = Array.isArray(incoming) ? incoming : [incoming];
      const prefer = String(req.headers.prefer ?? "");
      const isUpsert = prefer.includes("resolution=merge-duplicates");
      // Primary keys used by lib/db.ts:
      const pk = name === "trades" ? ["id"] : name === "strategies" ? ["user_id", "id"] : ["user_id"];
      for (const row of list) {
        const idx = rows.findIndex((r) => pk.every((k) => r[k] === row[k]));
        if (isUpsert && idx >= 0) rows[idx] = { ...rows[idx], ...row };
        else rows.push(row);
      }
      respond(201, list.length === 1 ? list[0] : list);
    });
    return;
  }

  if (req.method === "DELETE") {
    for (let i = rows.length - 1; i >= 0; i--) {
      if ([...filters.entries()].every(([k, v]) => String(rows[i][k]) === v)) {
        rows.splice(i, 1);
      }
    }
    res.writeHead(204);
    res.end();
    return;
  }

  respond(405, { message: "method not allowed" });
});

const port = Number(process.env.MOCK_PORT ?? 54321);
server.listen(port, () => {
  console.log(`[mock-supabase] listening on http://localhost:${port}`);
});

export { server, tables };
