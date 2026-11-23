-- Phase 1 Build 15 — Expense tracking: "how much you actually
-- kept." Owner's framework (2026-11-22 ~23:58 CT): "Track
-- revenue — Track profit and expenses"; his objective: "when a
-- creator opens ULTRA VESTRA, they should understand not just
-- how much money they made, but how much they actually kept."
-- His seven developments: deal-level profitability, expense
-- intelligence, platform profitability comparisons, cash-flow
-- visibility, revenue concentration risk — four ride on this
-- table.
--
-- public.creator_expenses — one row per business cost the
-- creator records: what it was, how much, which category, when,
-- optionally the platform it served and the deal it belonged
-- to. Expenses live in their OWN table and are never mixed
-- into revenue_entries: an expense is not negative revenue.
-- Business Health computes Kept = recorded received revenue
-- minus recorded expenses; money with no platform or deal link
-- is reported as untied, never allocated by assumption.
--
-- HONESTY RULES (binding, owner standard):
--   - Every figure is an exact integer-cent sum over the
--     creator's own recorded rows. Nothing is estimated.
--   - Deleting a deal does NOT delete its expenses (the cost
--     was real); the link clears (ON DELETE SET NULL), the
--     same treatment revenue entries get.
--
-- FULL RLS, same pattern as creator_deals: owners touch only
-- their own rows, enforced again in the API by scoping every
-- query to the caller's user_id.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.

create table public.creator_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount_cents int not null check (amount_cents > 0),
  category text not null default 'other'
    check (category in (
      'equipment', 'software', 'props_products', 'travel',
      'education', 'advertising', 'team_help', 'other'
    )),
  spent_date date not null,
  -- Same platform vocabulary as revenue_entries.platform
  -- (Build 12), so platform profit compares like with like.
  platform text check (platform is null or platform in (
    'tiktok', 'instagram', 'youtube', 'amazon', 'other'
  )),
  deal_id uuid references public.creator_deals(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index creator_expenses_deal_idx
  on public.creator_expenses (deal_id);

alter table public.creator_expenses enable row level security;

create policy "creator_expenses_select_own" on public.creator_expenses
  for select using (auth.uid() = user_id);

create policy "creator_expenses_insert_own" on public.creator_expenses
  for insert with check (auth.uid() = user_id);

create policy "creator_expenses_update_own" on public.creator_expenses
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_expenses_delete_own" on public.creator_expenses
  for delete using (auth.uid() = user_id);
