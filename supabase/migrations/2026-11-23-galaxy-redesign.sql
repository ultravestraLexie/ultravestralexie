-- ============================================================================
-- GALAXY REDESIGN (2026-11-23) — applied to production via the SQL
-- tunnel route on 2026-11-23 and verified by read-back:
--   * creator_deals_stage_check = pitched/negotiating/contracted/
--     delivering/invoiced/paid/lost; creator_deals still 0 rows.
--   * profiles.passport_slug / passport_public present.
--   * script_analyses exists with RLS on; 3 own-row policies +
--     4 public-passport read policies present.
--
-- Contents:
--   1. creator_deals stage vocabulary -> the Galaxy pipeline
--      (pitched/negotiating/contracted/delivering/invoiced/paid/lost).
--      The table held 0 rows at apply time — no data migration.
--   2. profiles.passport_slug + profiles.passport_public for the
--      public Passport share page (/p/[slug]).
--   3. public.script_analyses — Studio (Video Lab) check history.
--      Creator Lab never persisted runs; this is the storage the
--      redesign spec calls script_analyses.
--   4. Public-read policies for /p/[slug]: rows are readable by
--      anyone ONLY when they belong to a creator whose passport is
--      public (passport_public = true and a slug is set). Paid
--      deals only. Own-row policies are unchanged and unaffected.
-- ============================================================================

-- 1. Deal stage vocabulary
alter table public.creator_deals drop constraint creator_deals_stage_check;
alter table public.creator_deals alter column stage set default 'pitched';
alter table public.creator_deals add constraint creator_deals_stage_check
  check (stage in ('pitched','negotiating','contracted','delivering','invoiced','paid','lost'));

-- 2. Passport share link
alter table public.profiles add column if not exists passport_slug text;
alter table public.profiles add column if not exists passport_public boolean not null default false;
create unique index if not exists profiles_passport_slug_key
  on public.profiles (passport_slug) where passport_slug is not null;

-- 3. Studio script analyses
create table if not exists public.script_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  audience text not null default '',
  feel text not null default '',
  product text not null default '',
  price text not null default '',
  script text not null default '',
  passed int not null default 0,
  total int not null default 0,
  checks jsonb not null default '[]'::jsonb,
  buyers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.script_analyses enable row level security;
create policy "script_analyses_select_own" on public.script_analyses
  for select using (auth.uid() = user_id);
create policy "script_analyses_insert_own" on public.script_analyses
  for insert with check (auth.uid() = user_id);
create policy "script_analyses_delete_own" on public.script_analyses
  for delete using (auth.uid() = user_id);

-- 4. Public passport reads (flag-gated)
create policy "profiles_select_public_passport" on public.profiles
  for select using (passport_public is true and passport_slug is not null);
create policy "cbp_select_public_passport" on public.creator_business_profiles
  for select using (exists (
    select 1 from public.profiles pr
    where pr.id = creator_business_profiles.user_id
      and pr.passport_public is true and pr.passport_slug is not null));
create policy "deals_select_public_passport" on public.creator_deals
  for select using (stage = 'paid' and exists (
    select 1 from public.profiles pr
    where pr.id = creator_deals.user_id
      and pr.passport_public is true and pr.passport_slug is not null));
create policy "passport_entries_select_public" on public.passport_entries
  for select using (exists (
    select 1 from public.profiles pr
    where pr.id = passport_entries.user_id
      and pr.passport_public is true and pr.passport_slug is not null));
