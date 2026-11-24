-- ============================================================================
-- NOTIFICATION PREFS + DISMISSALS (2026-11-23) — trust queue #6
-- (owner order 2026-11-23): "Never miss a deadline, negotiation or
-- payment." Alerts themselves are DERIVED from the creator's own
-- deal rows by lib/galaxy/core.ts buildAlerts — nothing about an
-- alert is stored. What IS stored is only the creator's choices:
--
--   notification_prefs       — one row per creator: which alert
--                              types are on. No row = all on (the
--                              defaults live in core.ts
--                              DEFAULT_NOTIFICATION_PREFS and this
--                              table's column defaults agree).
--   notification_dismissals  — the stable alert keys the creator
--                              has dismissed ("overdue:<deal>:<due
--                              date>" etc.). A dismissal sticks to
--                              exactly that alert; when the date
--                              changes it is a different alert.
--
-- Alerts are IN-APP ONLY. There is no verified sending domain
-- yet, so no email alert exists and no copy anywhere promises
-- one; these tables deliberately hold no email state.
--
-- RLS: the creator manages ONLY their own rows — select, insert,
-- update and delete are all own-row on both tables. Nobody else's
-- preferences or dismissals are readable or writable.
-- ============================================================================

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  overdue boolean not null default true,
  due_soon boolean not null default true,
  quiet_deals boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_key text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, alert_key)
);

alter table public.notification_prefs enable row level security;
alter table public.notification_dismissals enable row level security;

create policy "notification_prefs_select_own" on public.notification_prefs
  for select using (auth.uid() = user_id);
create policy "notification_prefs_insert_own" on public.notification_prefs
  for insert with check (auth.uid() = user_id);
create policy "notification_prefs_update_own" on public.notification_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notification_prefs_delete_own" on public.notification_prefs
  for delete using (auth.uid() = user_id);

create policy "notification_dismissals_select_own" on public.notification_dismissals
  for select using (auth.uid() = user_id);
create policy "notification_dismissals_insert_own" on public.notification_dismissals
  for insert with check (auth.uid() = user_id);
create policy "notification_dismissals_update_own" on public.notification_dismissals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notification_dismissals_delete_own" on public.notification_dismissals
  for delete using (auth.uid() = user_id);
