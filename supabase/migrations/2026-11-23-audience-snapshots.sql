-- ============================================================================
-- AUDIENCE INDEPENDENCE CENTER (2026-11-23) — System #6 of the
-- creator-systems program (owner order 2026-11-23). Creator-entered
-- audience snapshots over time: followers per platform, the owned
-- email list, and an optional engagement percentage. There are NO
-- platform API connections — every number here was typed in by the
-- creator, and the UI says so plainly. Snapshots accumulate so the
-- growth story, the engagement trend and the platform-dependency
-- read can be computed from real entries (lib/galaxy/core.ts).
--
-- A snapshot is the creator's own working record: it is corrected
-- by deleting and re-entering, never treated as an audit record.
-- Money truth stays in creator_deals / revenue_entries; nothing
-- here is financial.
--
-- RLS: full own-row policies, mirroring deal_protection (System
-- #2). The API route scopes every query to the caller's user_id
-- in code as well.
-- ============================================================================

create table if not exists public.audience_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (
    platform in (
      'tiktok', 'instagram', 'youtube', 'x', 'facebook',
      'twitch', 'podcast', 'email', 'other'
    )
  ),
  followers integer not null check (followers >= 0),
  engagement_pct numeric check (
    engagement_pct is null or (engagement_pct >= 0 and engagement_pct <= 100)
  ),
  captured_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists audience_snapshots_user_idx
  on public.audience_snapshots (user_id, platform, captured_on desc, created_at desc);

alter table public.audience_snapshots enable row level security;

create policy "audience_snapshots_select_own" on public.audience_snapshots
  for select using (auth.uid() = user_id);
create policy "audience_snapshots_insert_own" on public.audience_snapshots
  for insert with check (auth.uid() = user_id);
create policy "audience_snapshots_update_own" on public.audience_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "audience_snapshots_delete_own" on public.audience_snapshots
  for delete using (auth.uid() = user_id);
