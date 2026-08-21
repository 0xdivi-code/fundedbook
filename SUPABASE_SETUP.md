# Supabase Setup Guide (Email + Password Auth)

FundedBook uses [Supabase Auth](https://supabase.com/docs/guides/auth) for
sign-up / sign-in with **email and password only**. Every new account starts
with an **empty journal** — no demo data — and is greeted with a built-in
getting-started guide.

Follow the steps below once per project. It takes about 5 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **Sign in** → **New project**.
2. Pick an organization, name it (e.g. `fundedbook`), choose a region close to
   you, and set a database password (you won't need it for auth-only usage,
   but save it anyway).
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

## 3. Wire the keys into the app

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

## 4. Enable the email provider

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

## 5. Try it end to end

1. `npm run dev` → open http://localhost:3000 → you land on **/login**.
2. Click **Create an account**, enter email + password (8+ chars) + confirm
   password.
3. If email confirmation is ON → click the link in your inbox → you're signed
   in. If OFF → you're signed in immediately.
4. You land on the **dashboard with the getting-started guide** — the journal
   is empty (by design, no demo data). Log one trade and the real dashboard
   takes over.
5. **Sign out** from the avatar menu (top right) → you're back at `/login`.

## 6. How auth is wired in this codebase

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

Journal data (trades, strategies, settings) is persisted per user in
`localStorage` under `fundedbook:v1:<user-id>` — switching accounts can never
mix data. See "Going further" below for syncing to the Supabase database.

## 7. Deploying

1. Deploy the repo (e.g. [Vercel](https://vercel.com) — import the GitHub
   repo, framework auto-detects Next.js).
2. In the deployment platform's environment variables, add the same two
   variables from step 3 (production values are the same).
3. Add the production `/auth/confirm` URL to Supabase **URL Configuration**
   (step 4).
4. In Supabase **Auth Providers → Email**, keep "Confirm email" ON so random
   sign-ups must prove address ownership.

---

## Going further (optional): store trades in Supabase Postgres

Right now trades live in the browser per device. If you later want multi-device
sync, create a `trades` table and let Row Level Security scope every row to
its owner. Quick sketch:

```sql
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,          -- the full Trade object
  opened_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.trades enable row level security;

create policy "trades are private to their owner"
  on public.trades
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Then sync from the client with the same `createClient()` from
`lib/supabase/client.ts`:

```ts
await supabase.from("trades").insert({ user_id: user.id, payload: trade, opened_at: trade.openedAt });
```

The anon key is safe here **because** RLS restricts every query to
`auth.uid() = user_id` — users can only ever read and write their own rows.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Yellow "Supabase is not configured" banner | `.env.local` missing/typo'd, or dev server not restarted after adding it |
| "Email not confirmed" on sign-in | Confirmation is ON — click the emailed link first, or turn confirmation off in Auth providers while testing |
| Confirmation link says "link expired or already used" | Links are single-use and expire after 1h — sign up again for a fresh email |
| Redirect loop on deploy | Add your production URL to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs** |
| Signup says "User already registered" | That email exists — sign in instead, or use another email for testing |
