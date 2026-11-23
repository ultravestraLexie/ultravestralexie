-- Phase 1 Build 6 — Creator Business Profile.
--
-- One row per creator holding the business facts they enter once
-- and the platform reads everywhere: platforms, content categories,
-- audience size, average views, engagement rate, audience
-- demographics, past partnerships, revenue streams, business
-- objectives.
--
-- HONESTY RULES (binding):
--   - Every value is CREATOR-ENTERED. Nothing here is synced,
--     scraped or inferred; the UI labels these as the creator's
--     own stated numbers, never platform-verified metrics.
--   - Own-row RLS only: a creator can read and write exactly
--     their own profile. No cross-creator reads.
--
-- Additive only. Run once in the SQL Editor; verify by read-back.

create table public.creator_business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  platforms text[] not null default '{}',
  content_categories text[] not null default '{}',
  audience_size int check (audience_size is null or audience_size >= 0),
  average_views int check (average_views is null or average_views >= 0),
  engagement_rate numeric(6,2) check (
    engagement_rate is null or (engagement_rate >= 0 and engagement_rate <= 100)
  ),
  audience_demographics text not null default '',
  past_partnerships text not null default '',
  revenue_streams text[] not null default '{}',
  business_objectives text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_business_profiles enable row level security;

create policy "creator_business_profiles_select_own"
  on public.creator_business_profiles
  for select to authenticated
  using (auth.uid() = user_id);

create policy "creator_business_profiles_insert_own"
  on public.creator_business_profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "creator_business_profiles_update_own"
  on public.creator_business_profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_business_profiles_delete_own"
  on public.creator_business_profiles
  for delete to authenticated
  using (auth.uid() = user_id);
