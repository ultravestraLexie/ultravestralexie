-- ============================================================================
-- SUPPORT TICKETS (2026-11-23) — trust queue #1 (owner order
-- 2026-11-23): "Users need somewhere to go when something breaks."
-- A signed-in creator files a request from the Support page
-- (category, subject, message, contact email); the row lands here
-- and a person answers by email. The owner reads tickets from the
-- database — there is deliberately no admin UI in this build.
--
-- The category list is closed and shared with the app: the form,
-- the API validation (lib/galaxy/core.ts SUPPORT_CATEGORIES) and
-- this check constraint name exactly the same six values; the
-- regression fixtures pin that they cannot drift apart.
--
-- RLS: the creator can INSERT a request and SELECT their own
-- requests back (the Support page lists them with their status).
-- There is NO update or delete policy for users — a filed request
-- is a record, not a draft; corrections happen by filing another
-- request or by email. Status starts 'open' and is only ever
-- changed from the database side by the person handling it.
-- ============================================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (
    category in (
      'billing', 'account-access', 'deals-money',
      'passport', 'bug', 'other'
    )
  ),
  subject text not null,
  message text not null,
  contact_email text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx
  on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

create policy "support_tickets_select_own" on public.support_tickets
  for select using (auth.uid() = user_id);
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);
