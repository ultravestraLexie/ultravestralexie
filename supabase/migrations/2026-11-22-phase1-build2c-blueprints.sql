-- ============================================================================
-- Phase 1 Build 2c — reproducible blueprints for the six tables that
-- existed live with no DDL in the repo:
--   public.revenue_entries, public.proposals, public.passport_entries,
--   public.growth_items, public.alert_prefs, public.partnership_briefs
--
-- RECONCILED AGAINST THE LIVE SCHEMA on 2026-11-22 (read-only
-- introspection: information_schema.columns, pg_indexes, pg_policies,
-- pg_class, pg_constraint — 57 columns, 7 indexes, 21 policies,
-- 25 constraints). Where a workspace source file and the live schema
-- disagreed, the LIVE schema wins and the difference is noted inline.
--
-- ONE DIVERGENCE FOUND: revenue_entries carries a `kind` column
-- (added after revenue-table.sql was written, for revenue-by-kind
-- reporting) that the workspace file does not have. It is included
-- below, marked. Everything else matched the workspace files exactly:
--   revenue-table.sql, proposals-table.sql, passport-table.sql,
--   growth-table.sql, alerts-table.sql, campaign-match-table.sql.
--
-- BLUEPRINT ONLY — these tables already exist live. This file is the
-- rebuild/audit record (fresh-database reproduction), NOT a migration
-- to run against the live database. No statement in it was executed
-- as part of Build 2c; the reconciliation was read-only.
-- ============================================================================

-- --- public.revenue_entries -------------------------------------------------
-- Source: ~/workspace/revenue-table.sql + the live `kind` column.

create table public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_name text not null,
  amount_cents int not null check (amount_cents > 0),
  status text not null check (status in ('pending', 'paid')),
  earned_date date not null,
  due_date date,
  note text not null default '',
  -- LIVE-ONLY (not in revenue-table.sql): revenue kind for
  -- by-kind reporting; default 'other'.
  kind text not null default 'other' check (kind in (
    'campaign_fee',
    'affiliate_commission',
    'brand_payment',
    'platform_payout',
    'other'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_entries enable row level security;

create policy "revenue_entries_select_own" on public.revenue_entries
  for select using (auth.uid() = user_id);
create policy "revenue_entries_insert_own" on public.revenue_entries
  for insert with check (auth.uid() = user_id);
create policy "revenue_entries_update_own" on public.revenue_entries
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "revenue_entries_delete_own" on public.revenue_entries
  for delete using (auth.uid() = user_id);

-- --- public.proposals -------------------------------------------------------
-- Source: ~/workspace/proposals-table.sql (matches live exactly;
-- note brand_id is a plain uuid with NO foreign key, by design).

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid,
  brand_name text not null,
  title text not null,
  deliverables jsonb not null default '[]',
  audience_summary text not null default '',
  campaign_ideas jsonb not null default '[]',
  proof_points jsonb not null default '[]',
  notes text not null default '',
  status text not null default 'draft' check (status in (
    'draft', 'sent', 'accepted', 'declined'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proposals enable row level security;

create policy "proposals_select_own" on public.proposals
  for select using (auth.uid() = user_id);
create policy "proposals_insert_own" on public.proposals
  for insert with check (auth.uid() = user_id);
create policy "proposals_update_own" on public.proposals
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "proposals_delete_own" on public.proposals
  for delete using (auth.uid() = user_id);

-- --- public.passport_entries ------------------------------------------------
-- Source: ~/workspace/passport-table.sql (matches live exactly;
-- create/delete only — no UPDATE policy, by design).

create table public.passport_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in (
    'collaborations',
    'portfolio',
    'performance',
    'testimonials',
    'credentials'
  )),
  payload jsonb not null,
  verification_status text not null default 'self_reported' check (
    verification_status in ('platform_verified', 'self_reported')
  ),
  created_at timestamptz not null default now()
);

alter table public.passport_entries enable row level security;

create policy "passport_entries_select_own" on public.passport_entries
  for select using (auth.uid() = user_id);
-- Inserts are own-rows AND self-reported only: the database itself
-- refuses any client-side upgrade to 'platform_verified'.
create policy "passport_entries_insert_own" on public.passport_entries
  for insert with check (
    auth.uid() = user_id and verification_status = 'self_reported'
  );
create policy "passport_entries_delete_own" on public.passport_entries
  for delete using (auth.uid() = user_id);

-- --- public.growth_items ----------------------------------------------------
-- Source: ~/workspace/growth-table.sql (matches live exactly).

create table public.growth_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('objective', 'experiment', 'gap')),
  payload jsonb not null,
  status text not null check (status in (
    'active', 'achieved', 'archived',
    'planned', 'running', 'done',
    'open', 'addressed'
  )),
  progress_percent int check (
    progress_percent is null
    or (progress_percent >= 0 and progress_percent <= 100)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_items enable row level security;

create policy "growth_items_select_own" on public.growth_items
  for select using (auth.uid() = user_id);
create policy "growth_items_insert_own" on public.growth_items
  for insert with check (auth.uid() = user_id);
create policy "growth_items_update_own" on public.growth_items
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "growth_items_delete_own" on public.growth_items
  for delete using (auth.uid() = user_id);

-- --- public.alert_prefs -----------------------------------------------------
-- Source: ~/workspace/alerts-table.sql (matches live exactly;
-- one prefs row per user — user_id is UNIQUE).

create table public.alert_prefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  niches text[] not null default '{}',
  types text[] not null default '{new_brand,new_program}',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alert_prefs enable row level security;

create policy "alert_prefs_select_own" on public.alert_prefs
  for select using (auth.uid() = user_id);
create policy "alert_prefs_insert_own" on public.alert_prefs
  for insert with check (auth.uid() = user_id);
create policy "alert_prefs_update_own" on public.alert_prefs
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "alert_prefs_delete_own" on public.alert_prefs
  for delete using (auth.uid() = user_id);

-- --- public.partnership_briefs ----------------------------------------------
-- Source: ~/workspace/campaign-match-table.sql (matches live exactly;
-- immutable records — INSERT and SELECT policies only, by design).

create table public.partnership_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  creator_inputs jsonb not null,
  evidence_snapshot jsonb,
  factor_breakdown jsonb,
  index int not null,
  verdict text not null check (verdict in ('Pursue', 'Negotiate First', 'Skip')),
  confidence text not null check (confidence in ('High', 'Medium', 'Low')),
  floor_pass boolean not null,
  spec_version text not null,
  created_at timestamptz not null default now()
);

alter table public.partnership_briefs enable row level security;

create policy "partnership_briefs_select_own" on public.partnership_briefs
  for select using (auth.uid() = user_id);
create policy "partnership_briefs_insert_own" on public.partnership_briefs
  for insert with check (auth.uid() = user_id);
-- No UPDATE or DELETE policies: briefs are immutable records, so
-- updates and deletes are denied by default.

-- Indexes (live, complete list): each table's primary key, plus the
-- alert_prefs.user_id unique index created by the UNIQUE constraint
-- above. No other indexes exist on these six tables live.
