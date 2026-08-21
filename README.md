# FundedBook — Premium Trading Journal

A modern, dark-themed trading journal inspired by Trazella — rebuilt as a premium 2026 trading
dashboard with rich trade visualization, screenshot galleries, and deep analytics.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**-style component primitives (Radix UI)
- **Supabase Auth** — email + password sign-up / sign-in
- **Lucide** icons
- **Framer Motion** animations
- **Recharts** charts
- **Inter** + **JetBrains Mono** (self-hosted via Fontsource)

## Features

- **Authentication** — email + password sign-up (with password confirmation),
  sign-in, sign-out, and email verification, powered by Supabase. All app
  routes are protected; unauthenticated visitors land on `/login`.
- **Clean start** — new accounts get an **empty journal** (no demo data) and a
  built-in getting-started guide that walks through the platform.
- **Dashboard** — Net P&L, win rate, profit factor, avg win/loss, total trades, expectancy,
  equity curve, P&L distribution, strategy/symbol performance, drawdown, and recent trades.
- **Journal** — searchable, filterable, sortable trade feed in grid and table views.
- **Trade Details** — large screenshot gallery, trade statistics, entry/exit, notes, lessons,
  rating, setup grade, and a quick verdict.
- **Screenshot system** — deterministic candlestick chart renders, multi-image carousel,
  click-to-enlarge fullscreen viewer with zoom/pan, and drag-and-drop uploads.
- **Add Trade drawer** — live P&L, R-multiple, risk, and reward:risk calculation with validation.
- **Calendar** — monthly P&L heatmap with per-day trade drill-down.
- **Analytics** — equity, drawdown, win rate, profit factor, strategy/symbol performance,
  long vs short, day-of-week and hour-of-day breakdowns, rating distribution.
- **Playbook** — create, edit, and delete strategies with performance stats.
- **Settings** — account, risk per trade, preferences, JSON backup, and data reset.

Trades, strategies, and settings are stored **per user** in `localStorage`
(`fundedbook:v1:<user-id>`), so accounts never mix data.

## Getting started

```bash
npm install

# Configure Supabase auth (required) — copy the template and fill in your keys:
cp .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Full walkthrough: SUPABASE_SETUP.md

npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

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
