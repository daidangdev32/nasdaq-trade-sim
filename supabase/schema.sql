-- =============================================================================
-- NASDAQ Trader Simulator — Supabase schema
-- =============================================================================
-- Run this entire file in Supabase SQL Editor (or via `psql`) once.
-- It is idempotent — safe to re-run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- helpers ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- users ------------------------------------------------------------
-- A profile row mirroring auth.users. Created automatically when a new auth
-- user signs up (see trigger at the bottom).
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- portfolios -------------------------------------------------------
-- One portfolio per user. Cash balance starts at $100,000.
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  cash_balance numeric(18, 4) not null default 100000.00,
  starting_balance numeric(18, 4) not null default 100000.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_non_negative check (cash_balance >= 0)
);

-- ---------- holdings ---------------------------------------------------------
-- Aggregated position per (portfolio, symbol). avg_cost is the volume-weighted
-- average buy price after each transaction.
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  quantity numeric(18, 6) not null default 0,
  avg_cost numeric(18, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, symbol),
  constraint qty_non_negative check (quantity >= 0)
);
create index if not exists holdings_portfolio_idx on public.holdings(portfolio_id);

-- ---------- transactions -----------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(18, 6) not null check (quantity > 0),
  price numeric(18, 4) not null check (price > 0),
  total numeric(18, 4) not null check (total > 0),
  realized_pnl numeric(18, 4),
  executed_at timestamptz not null default now()
);
create index if not exists tx_portfolio_idx on public.transactions(portfolio_id, executed_at desc);
create index if not exists tx_symbol_idx on public.transactions(symbol);

-- ---------- stock_prices -----------------------------------------------------
-- One row per symbol — refreshed by the cron job. Latest snapshot only.
create table if not exists public.stock_prices (
  symbol text primary key,
  name text not null,
  price numeric(18, 4) not null,
  change numeric(18, 4) not null,
  change_pct numeric(10, 4) not null,
  prev_close numeric(18, 4) not null,
  day_high numeric(18, 4),
  day_low numeric(18, 4),
  market_cap numeric(24, 2),
  volume bigint,
  updated_at timestamptz not null default now()
);

-- Daily history — one row per symbol per trading day. Used for charts and
-- "what-if" analysis. The cron job appends a row every market-open run.
create table if not exists public.stock_history (
  symbol text not null,
  trade_date date not null,
  open numeric(18, 4),
  high numeric(18, 4),
  low numeric(18, 4),
  close numeric(18, 4) not null,
  volume bigint,
  primary key (symbol, trade_date)
);
create index if not exists history_symbol_date_idx on public.stock_history(symbol, trade_date desc);

-- ---------- watchlists -------------------------------------------------------
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
create index if not exists watchlists_user_idx on public.watchlists(user_id);

-- ---------- achievements -----------------------------------------------------
-- Master list of achievements (seeded below).
create table if not exists public.achievements (
  code text primary key,
  title text not null,
  description text not null,
  icon text not null,
  threshold numeric(18, 4),
  category text not null
);

-- Per-user unlocks.
create table if not exists public.user_achievements (
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_code text not null references public.achievements(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

-- ---------- portfolio_snapshots ---------------------------------------------
-- Daily portfolio value, written by the cron job after the price refresh.
-- Used for performance-over-time charts and the leaderboard.
create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  snapshot_date date not null,
  cash_balance numeric(18, 4) not null,
  holdings_value numeric(18, 4) not null,
  total_value numeric(18, 4) not null,
  created_at timestamptz not null default now(),
  unique (portfolio_id, snapshot_date)
);
create index if not exists snapshots_portfolio_idx on public.portfolio_snapshots(portfolio_id, snapshot_date desc);

-- ---------- triggers ---------------------------------------------------------
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

drop trigger if exists holdings_set_updated_at on public.holdings;
create trigger holdings_set_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

-- ---------- auth → public.users sync ----------------------------------------
-- Every time a row is added to auth.users, mirror it into public.users and
-- create the user's portfolio with the starting balance.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.portfolios (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users enable row level security;
alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlists enable row level security;
alter table public.user_achievements enable row level security;
alter table public.portfolio_snapshots enable row level security;
-- Price tables are world-readable, no RLS needed for SELECT. Writes go through
-- the service-role key only (used by the cron job).
alter table public.stock_prices enable row level security;
alter table public.stock_history enable row level security;
alter table public.achievements enable row level security;

-- ---- users ----
drop policy if exists "users read own row" on public.users;
create policy "users read own row" on public.users for select
  using (auth.uid() = id);

drop policy if exists "users update own row" on public.users;
create policy "users update own row" on public.users for update
  using (auth.uid() = id);

-- ---- portfolios ----
drop policy if exists "portfolios owner select" on public.portfolios;
create policy "portfolios owner select" on public.portfolios for select
  using (auth.uid() = user_id);

drop policy if exists "portfolios owner update" on public.portfolios;
create policy "portfolios owner update" on public.portfolios for update
  using (auth.uid() = user_id);

-- ---- holdings ----
drop policy if exists "holdings owner all" on public.holdings;
create policy "holdings owner all" on public.holdings for all
  using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  )
  with check (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- ---- transactions ----
drop policy if exists "tx owner select" on public.transactions;
create policy "tx owner select" on public.transactions for select
  using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

drop policy if exists "tx owner insert" on public.transactions;
create policy "tx owner insert" on public.transactions for insert
  with check (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- ---- watchlists ----
drop policy if exists "watchlist owner all" on public.watchlists;
create policy "watchlist owner all" on public.watchlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- user_achievements ----
drop policy if exists "achievements owner select" on public.user_achievements;
create policy "achievements owner select" on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "achievements owner insert" on public.user_achievements;
create policy "achievements owner insert" on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ---- portfolio_snapshots ----
drop policy if exists "snapshots owner select" on public.portfolio_snapshots;
create policy "snapshots owner select" on public.portfolio_snapshots for select
  using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- ---- public reference data (world-readable) ----
drop policy if exists "stock_prices public read" on public.stock_prices;
create policy "stock_prices public read" on public.stock_prices for select using (true);

drop policy if exists "stock_history public read" on public.stock_history;
create policy "stock_history public read" on public.stock_history for select using (true);

drop policy if exists "achievements public read" on public.achievements;
create policy "achievements public read" on public.achievements for select using (true);

-- =============================================================================
-- Seed achievements
-- =============================================================================
insert into public.achievements (code, title, description, icon, threshold, category) values
  ('first_trade',      'First Trade',         'Execute your very first buy order.',                'rocket',     1,        'trades'),
  ('ten_trades',       'Active Trader',       'Execute 10 trades.',                                'activity',   10,       'trades'),
  ('hundred_trades',   'Power Trader',        'Execute 100 trades.',                               'flame',      100,      'trades'),
  ('first_profit',     'In the Green',        'Realize your first profitable sell.',               'trending-up', null,    'pnl'),
  ('big_win_1k',       'Big Win',             'Earn $1,000+ on a single sell.',                    'award',      1000,     'pnl'),
  ('big_win_10k',      'Whale Mode',          'Earn $10,000+ on a single sell.',                   'crown',      10000,    'pnl'),
  ('portfolio_110k',   '+10% Return',         'Grow your portfolio to $110,000.',                  'chart-line', 110000,   'portfolio'),
  ('portfolio_150k',   '+50% Return',         'Grow your portfolio to $150,000.',                  'gem',        150000,   'portfolio'),
  ('portfolio_200k',   'Double Up',           'Grow your portfolio to $200,000.',                  'star',       200000,   'portfolio'),
  ('diversified',      'Diversified',         'Hold positions in 5+ different stocks at once.',    'layers',     5,        'portfolio'),
  ('all_in',           'All In',              'Hold 90%+ of your portfolio in one stock.',         'target',     0.9,      'portfolio'),
  ('watchlist_5',      'On the Lookout',      'Add 5 stocks to your watchlist.',                   'eye',        5,        'misc')
on conflict (code) do nothing;
