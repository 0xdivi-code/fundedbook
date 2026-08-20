# FundedBook — Premium Trading Journal

A modern, dark-themed trading journal inspired by Trazella — rebuilt as a premium 2026 trading
dashboard with rich trade visualization, screenshot galleries, and deep analytics.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**-style component primitives (Radix UI)
- **Lucide** icons
- **Framer Motion** animations
- **Recharts** charts
- **Inter** + **JetBrains Mono** (self-hosted via Fontsource)

## Features

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
- **Settings** — account size, risk per trade, preferences, JSON backup, and data reset.

All data persists to `localStorage` and ships with a realistic deterministic sample dataset.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

## Keyboard shortcuts

- `⌘K` / `Ctrl+K` — command palette (search trades, symbols, strategies, pages)
- In the screenshot viewer: `←`/`→` navigate, `+`/`-` zoom, `0` reset, `Esc` close
