# Supabase Setup Guide (Auth + Cloud Database)

FundedBook uses [Supabase](https://supabase.com) (free tier) for two things:

1. **Auth** — sign-up / sign-in with **email and password only**.
2. **Journal storage** — trades, strategies, settings, and onboarding state
   are stored **per user** in Supabase Postgres, protected by Row Level
   Security. Nothing is kept in the browser.

Every new account starts with an **empty journal** — no demo data — and is
greeted by a guided onboarding tour that pops up once per account.

Follow the steps below once per project. It takes about 5 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **Sign in** → **New project**.
2. Pick an organization, name it (e.g. `fundedbook`), choose a region close to
   you, and set a database password (save it — you may want it for the SQL
   editor).
3. Wait ~1–2 minutes for provisioning.

## 2. Grab your API keys

In the Supabase dashboard:

**Project Settings (⚙) → Data API** (or **API** on older dashboards)

You need two values:

| Value | Where |
|---|---|
| **Project URL** | `https://<project-ref>.supabase.co` |
| **anon public** key | Listed under "Project API keys" |

> The `anon` key is safe to expose in the browser — access to your project is
> protected by Row Level Security rules, and auth endpoints only allow what
> you enable in Auth settings.

## 3. Create the database tables

The journal no longer uses `localStorage` — all user data lives in Postgres.
Create the tables once:

1. In the Supabase dashboard open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
   from this repo and click **Run**.

This creates four tables — `trades`, `strategies`, `user_settings`,
`user_onboarding` — each with Row Level Security policies
(`auth.uid() = user_id`) so a signed-in user can only ever read and write
their own rows. Without this step the app still authenticates, but the
journal can't load or save (you'll see "Couldn't load your journal" with a
retry button, and save toasts will report the missing tables).

## 4. Wire the keys into the app

Create a file called `.env.local` in the repo root (same folder as
`package.json`):

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon public key>
```

> `.env.local` is git-ignored, so your keys never get committed. Use
> `.env.example` as a template.

Then restart the dev server (env vars are only read at startup):

```bash
npm run dev
```

Open http://localhost:3000 — you should be redirected to `/login`.
If the keys are missing you'll see a yellow "Supabase is not configured"
notice instead of the form.

## 5. Enable the email provider

In the dashboard: **Authentication → Sign In / Up → Auth Providers → Email**

- **Enable Email Provider**: ON (this is the default)
- Keep **Confirm email** ON for production-quality flows (users get a
  confirmation email with a link that lands on `/auth/confirm`, which
  exchanges the token and signs them in).
  - For quick local testing you can turn it OFF — accounts become active
    immediately after sign-up and users go straight into the app.

### Allowed redirect URLs

**Authentication → URL Configuration**

Add every origin you'll run the app on, e.g.:

- `http://localhost:3000/auth/confirm`
- your deployed URL, e.g. `https://your-app.vercel.app/auth/confirm`

Without these, email confirmation links will be rejected.

> Local dev tip: Supabase sends ~2 auth emails/hour to the same address by
> default (rate limit). Use different emails (`a@x.com`, `b@x.com`) when
> testing sign-up repeatedly, or disable confirmation while developing.

## 6. Try it end to end

1. `npm run dev` → open http://localhost:3000 → you land on **/login**.
2. Click **Create an account**, enter email + password (8+ chars) + confirm
   password.
3. If email confirmation is ON → click the link in your inbox → you're signed
   in. If OFF → you're signed in immediately.
4. You land on the **dashboard** — the guided tour modal pops up and walks
   you through every feature (Next / Skip; it can be replayed later in
   Settings). The journal is empty (by design, no demo data) — log one trade
   and the real dashboard takes over.
5. **Sign out** from the avatar menu (top right) → you're back at `/login`.
6. Sign in again (even from another browser/device) — your journal loads from
   the database exactly as you left it.

## 7. How auth + data are wired in this codebase

| File | Role |
|---|---|
| `lib/supabase/env.ts` | Reads the two env vars; `isSupabaseConfigured` flag |
| `lib/supabase/client.ts` | Browser Supabase client (cookie-based sessions) |
| `lib/supabase/server.ts` | Server-side client (RSC / route handlers) |
| `proxy.ts` | Next.js 16 proxy (ex-middleware): refreshes the session cookie, redirects signed-out users to `/login`, signed-in users away from `/login` & `/signup` |
| `components/auth/auth-provider.tsx` | React context: session state + `signIn` / `signUp` / `signOut` |
| `app/(auth)/login/page.tsx` | Sign-in form (email + password) |
| `app/(auth)/signup/page.tsx` | Sign-up form (email + password + confirm password) |
| `app/auth/confirm/page.tsx` | Email-confirmation callback (token exchange) |
| `app/(app)/layout.tsx` | Auth gate + per-user `JournalProvider` |
| `lib/db.ts` | Database access layer: row mappers, load/save/delete, legacy localStorage migration |
| `lib/store.tsx` | `JournalProvider` — loads the journal from Postgres, optimistic writes with rollback |
| `components/dashboard/onboarding-tour.tsx` | Guided tour modal (pops once per new account, Next / Skip) |
| `supabase/schema.sql` | Tables + Row Level Security policies (run once in the SQL editor) |
| `scripts/db-flow-test.ts` + `scripts/mock-supabase.ts` | Integration test for the DB layer against a local PostgREST mock: `npx tsx scripts/mock-supabase.ts &` then `cd scripts && npx tsx db-flow-test.ts` |

Journal data (trades, strategies, settings, onboarding state) is persisted per
user in Supabase Postgres — switching accounts can never mix data because
every table is protected by `auth.uid() = user_id` RLS policies. A pre-cloud
`localStorage` copy (`fundedbook:v1:<user-id>`), if one exists, is imported
into the database on first sign-in and then removed from the browser.

## 8. Deploying

1. Deploy the repo (e.g. [Vercel](https://vercel.com) — import the GitHub
   repo, framework auto-detects Next.js).
2. In the deployment platform's environment variables, add the same two
   variables from step 4 (production values are the same).
3. Add the production `/auth/confirm` URL to Supabase **URL Configuration**
   (step 5).
4. In Supabase **Auth Providers → Email**, keep "Confirm email" ON so random
   sign-ups must prove address ownership.

---

## How trades are stored in Supabase Postgres

All four tables live in the free-tier Postgres that ships with every Supabase
project. Each row carries a `user_id`, and Row Level Security restricts every
query to `auth.uid() = user_id` — users can only ever read and write their own
rows, which is why the `anon` key is safe to expose in the browser. The app
talks to Postgres with the signed-in user's JWT via the same
`createClient()` from `lib/supabase/client.ts` used for auth:

```ts
await supabase.from("trades").upsert(tradeToRow(user.id, trade));
```

Writes are optimistic: the UI updates immediately, the row is persisted in the
background, and if the write fails the previous state is restored with an
error toast. Uploaded screenshots are downscaled and re-encoded client-side
(`lib/image.ts`) so rows stay small.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Yellow "Supabase is not configured" banner | `.env.local` missing/typo'd, or dev server not restarted after adding it |
| "Couldn't load your journal" on every page | The database tables don't exist yet — run `supabase/schema.sql` in the Supabase SQL editor (step 3) |
| Error toast "Couldn't save trade/strategy/settings" | The database was unreachable (offline?) or RLS blocked the write — the change was rolled back; retry once you're back online |
| Guided tour keeps popping up | Tour completion is saved to the database; if the save fails (offline), it will ask again next visit |
| "Email not confirmed" on sign-in | Confirmation is ON — click the emailed link first, or turn confirmation off in Auth providers while testing |
| Confirmation link says "link expired or already used" | Links are single-use and expire after 1h — sign up again for a fresh email |
| Redirect loop on deploy | Add your production URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs** |
| Signup says "User already registered" | That email exists — sign in instead, or use another email for testing |
