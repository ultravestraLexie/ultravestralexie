-- ============================================================================
-- BUSINESS ACCOUNTS (2026-11-24) — the owner's order: "business
-- registration system with two account types: Brand account, Agency
-- account." Brands and agencies register FREE (no Stripe, no
-- subscription) and land on a business home — never inside the
-- creator app, whose subscription gate stays exactly as it is.
--
-- Two changes:
--   1. public.profiles gains account_type ('creator' | 'brand' |
--      'agency'), NOT NULL DEFAULT 'creator' — every existing row
--      becomes 'creator' by the default, so creator access, the
--      gate, and every existing read are unchanged. This column is
--      the authority the middleware, the root layout and the
--      business home read to route each account to its own side.
--   2. public.business_profiles — one row per business account with
--      the facts given at registration. Keyed to profiles(id) so a
--      deleted account takes its business row with it.
--
-- RLS: a business can SELECT / INSERT / UPDATE its own row only
-- (auth.uid() = user_id), mirroring the profiles/support_tickets
-- own-row pattern. There is NO delete policy for users and no
-- public read — a business profile is not a public listing in v1,
-- and nothing here is exposed to creators or other businesses.
--
-- Registration writes run through the admin API route
-- (app/api/business-registration) after it creates the auth user,
-- so the profiles row exists (handle_new_user trigger) before the
-- account_type update and the business_profiles insert land. The
-- business-home edit form writes through the same API route as the
-- signed-in user (PATCH), checked against these policies.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process
-- (parent applies + reads back before the code ships).
-- ============================================================================

alter table public.profiles
  add column if not exists account_type text not null default 'creator';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_account_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('creator', 'brand', 'agency'));
  end if;
end $$;

create table if not exists public.business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_type text not null check (account_type in ('brand', 'agency')),
  company_name text not null,
  website text not null,
  contact_name text not null,
  contact_email text not null,
  category text not null,
  city text not null,
  country text not null,
  company_size text not null,
  looking_for text[] not null default '{}',
  description text check (
    description is null or char_length(description) <= 280
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

drop policy if exists "business_profiles_select_own" on public.business_profiles;
create policy "business_profiles_select_own" on public.business_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "business_profiles_insert_own" on public.business_profiles;
create policy "business_profiles_insert_own" on public.business_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "business_profiles_update_own" on public.business_profiles;
create policy "business_profiles_update_own" on public.business_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
