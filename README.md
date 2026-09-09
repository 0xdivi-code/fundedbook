# FundedBook — Premium Trading Journal

A modern, dark trading journal with a futuristic neon **lemon → emerald** theme — a premium 2026
trading dashboard with rich trade visualization, screenshot galleries, and deep analytics.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**-style component primitives (Radix UI)
- **Supabase** — email + password auth **and** journal storage in Postgres
  (free tier), protected per user with Row Level Security
- **Lucide** icons
- **Framer Motion** animations
- **Recharts** charts
- **Space Grotesk** (UI) + **Orbitron** (display) + **JetBrains Mono** (numerics), self-hosted via Fontsource

## Features

- **Authentication** — email + password sign-up (with password confirmation),
  sign-in, sign-out, and email verification, powered by Supabase. All app
  routes are protected; there is no marketing landing page — unauthenticated visitors go
  straight to `/login`.
- **Cloud database storage** — trades, strategies, settings, and onboarding
  state are stored **per user** in Supabase Postgres behind Row Level
  Security. Nothing is kept in the browser: a legacy localStorage copy is
  migrated into the database once and then removed. Writes are optimistic
  with rollback + a toast if the database is unreachable.
- **Guided onboarding tour** — a modal tour automatically pops up for
  first-time users and walks through every feature (Dashboard → Journal →
  Trade review → Calendar → Analytics → Playbook → Settings) with
  **Next / Skip** buttons, navigating to each feature page as it goes.
  It fires once per account (state lives in the database) and can be
  replayed anytime from Settings.
- **Clean start** — new accounts get an **empty journal** (no demo data) and a
  built-in getting-started guide that walks through the platform.
- **Dashboard** — Net P&L, win rate, profit factor, avg win/loss, total trades, expectancy,
  equity curve, P&L distribution, strategy/symbol performance, drawdown, and recent trades.
- **Journal** — searchable, filterable, sortable trade feed in grid and table views.
- **Trade Details** — large screenshot gallery, trade statistics, entry/exit, notes, lessons,
  rating, setup grade, and a quick verdict.
- **Screenshot system** — deterministic candlestick chart renders, multi-image carousel,
  click-to-enlarge fullscreen viewer with zoom/pan, and drag-and-drop uploads
  (uploads are downscaled + re-encoded client-side so database rows stay lean).
- **Add Trade drawer** — live P&L, R-multiple, risk, and reward:risk calculation with validation.
- **Calendar** — monthly P&L heatmap with per-day trade drill-down.
- **Analytics** — equity, drawdown, win rate, profit factor, strategy/symbol performance,
  long vs short, day-of-week and hour-of-day breakdowns, rating distribution.
- **Playbook** — create, edit, and delete strategies with performance stats.
- **Settings** — account, risk per trade, preferences, tour replay, JSON backup, and data reset.

## Getting started

> **Not a coder?** Skip all of this and follow
> [`NO-CODE-SETUP.md`](./NO-CODE-SETUP.md) — a click-by-click guide that gets
> you a live journal with a cloud database (Supabase + free Vercel deploy,
> no terminal).

```bash
npm install

# Configure Supabase (required) — copy the template and fill in your keys:
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Full walkthrough: SUPABASE_SETUP.md

# Create the database tables (trades, strategies, settings, onboarding):
#   paste supabase/schema.sql into the Supabase SQL editor and run it once.

npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

## Database

All journal data lives in Supabase Postgres (see [`supabase/schema.sql`](./supabase/schema.sql)):

| Table | Contents |
|---|---|
| `trades` | one row per trade (screenshots ride along as JSONB) |
| `strategies` | playbook entries, keyed per user |
| `user_settings` | account size, risk per trade, preferences |
| `user_onboarding` | guided-tour state, so the tour pops once per account |

Every table has Row Level Security enabled with `auth.uid() = user_id`
policies — the API only ever lets a signed-in user read and write their own
rows, so accounts can never mix data.

If you open the app before configuring Supabase, the login page shows a
friendly setup banner pointing you to [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

## Keyboard shortcuts

- `⌘K` / `Ctrl+K` — command palette (search trades, symbols, strategies, pages)
- In the screenshot viewer: `←`/`→` navigate, `+`/`-` zoom, `0` reset, `Esc` close

## Working with your local clone

```bash
# Pull the latest changes (including this auth feature) into your local clone
git checkout main
git pull origin main

# ...make your changes locally, then push them back up
git add .
git commit -m "Describe your update"
git push origin main
```
