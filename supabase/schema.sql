-- ═════════════════════════════════════════════════════════════════════════════
-- FundedBook — Supabase database schema
--
-- Run this ONCE in the Supabase dashboard:
--   SQL Editor → New query → paste this file → Run.
-- (See SUPABASE_SETUP.md for the full walkthrough.)
--
-- All journal data — trades, strategies, settings and onboarding state — is
-- stored server-side in Postgres, scoped to the signed-in user via Row Level
-- Security. Nothing journal-related is kept in the browser; a legacy
-- localStorage copy is imported into these tables once, then removed.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Trades (ids are generated client-side, hence text)
create table if not exists public.trades (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  symbol       text not null,
  direction    text not null check (direction in ('long', 'short')),
  status       text not null check (status in ('open', 'closed')),
  strategy_id  text not null,
  entry_price  double precision not null,
  exit_price   double precision,
  stop_loss    double precision,
  take_profit  double precision,
  quantity     double precision not null,
  fees         double precision not null default 0,
  opened_at    timestamptz not null,
  closed_at    timestamptz,
  rating       int not null default 0,
  tags         text[] not null default '{}',
  notes        text not null default '',
  lessons      text not null default '',
  screenshots  jsonb not null default '[]',
  grade        text not null default '',
  mistakes     text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists trades_user_opened_idx
  on public.trades (user_id, opened_at desc);

-- Strategies (composite key: a user's strategy ids only need to be unique
-- within their own journal, e.g. the starter "orb" template)
create table if not exists public.strategies (
  id           text not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  short_name   text not null,
  description  text not null default '',
  setup        text not null default '',
  confluences  text[] not null default '{}',
  market       text not null default '',
  timeframe    text not null default '',
  color        text not null default '#00f5a0',
  created_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- Per-user settings (small, flat object — stored as JSONB)
create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Onboarding state (whether the guided tour has been completed/skipped),
-- persisted per account so the tour pops exactly once per new user.
create table if not exists public.user_onboarding (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  tour_completed    boolean not null default false,
  tour_completed_at timestamptz,
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trades_touch_updated_at on public.trades;
create trigger trades_touch_updated_at
  before update on public.trades
  for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists user_onboarding_touch_updated_at on public.user_onboarding;
create trigger user_onboarding_touch_updated_at
  before update on public.user_onboarding
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security — users can only ever read and write their own rows.
-- The app talks to Postgres with the authenticated user's JWT, so these
-- policies are what keeps one account's journal invisible to every other.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.trades        enable row level security;
alter table public.strategies    enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_onboarding enable row level security;

-- trades --------------------------------------------------------------------
drop policy if exists trades_select_own on public.trades;
create policy trades_select_own on public.trades
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists trades_insert_own on public.trades;
create policy trades_insert_own on public.trades
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists trades_update_own on public.trades;
create policy trades_update_own on public.trades
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trades_delete_own on public.trades;
create policy trades_delete_own on public.trades
  for delete to authenticated using (auth.uid() = user_id);

-- strategies ------------------------------------------------------------------
drop policy if exists strategies_select_own on public.strategies;
create policy strategies_select_own on public.strategies
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists strategies_insert_own on public.strategies;
create policy strategies_insert_own on public.strategies
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists strategies_update_own on public.strategies;
create policy strategies_update_own on public.strategies
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists strategies_delete_own on public.strategies;
create policy strategies_delete_own on public.strategies
  for delete to authenticated using (auth.uid() = user_id);

-- user_settings ----------------------------------------------------------------
drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_settings_delete_own on public.user_settings;
create policy user_settings_delete_own on public.user_settings
  for delete to authenticated using (auth.uid() = user_id);

-- user_onboarding ----------------------------------------------------------------
drop policy if exists user_onboarding_select_own on public.user_onboarding;
create policy user_onboarding_select_own on public.user_onboarding
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_onboarding_insert_own on public.user_onboarding;
create policy user_onboarding_insert_own on public.user_onboarding
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_onboarding_update_own on public.user_onboarding;
create policy user_onboarding_update_own on public.user_onboarding
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_onboarding_delete_own on public.user_onboarding;
create policy user_onboarding_delete_own on public.user_onboarding
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants — the journal API is authenticated-only (RLS would block anonymous
-- access anyway, but the grant is revoked to keep least privilege explicit).
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.trades, public.strategies, public.user_settings, public.user_onboarding from anon;
grant select, insert, update, delete
  on public.trades, public.strategies, public.user_settings, public.user_onboarding
  to authenticated;
