-- ============================================================================
-- Phase 1 Build 4 — North Star event instrumentation (ADDITIVE ONLY).
--
-- The platform could not measure its own North Star (Weekly Active
-- Creators Completing Meaningful Business Actions): no event log
-- existed, deal stages were overwritten in place, and read/write
-- activity left no trace beyond row timestamps that mislabel what
-- happened. These two tables close that gap going forward. NOTHING
-- historical is backfilled — activity before this instrumentation
-- simply has no events, and any report must say so.
--
-- creator_events: one row per meaningful business action, written by
-- the API route that performed the action (never by the client).
-- Event types (v1): proposal_created, proposal_status_changed,
-- deal_created, deal_stage_changed, revenue_recorded,
-- brief_generated, post_logged, goal_created.
--
-- deal_stage_history: one row per deal stage transition, including
-- creation (from_stage NULL → the initial stage), written by the
-- deals API. Makes "deal advanced" provable for the first time.
--
-- Both tables are append-only for creators: SELECT + INSERT policies
-- for the owner only, no UPDATE/DELETE policies (denied by default).
-- ============================================================================

create table public.creator_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'proposal_created',
    'proposal_status_changed',
    'deal_created',
    'deal_stage_changed',
    'revenue_recorded',
    'brief_generated',
    'post_logged',
    'goal_created'
  )),
  entity_type text not null default '',
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index creator_events_user_created_idx
  on public.creator_events (user_id, created_at);
create index creator_events_type_created_idx
  on public.creator_events (event_type, created_at);

alter table public.creator_events enable row level security;

create policy "creator_events_select_own" on public.creator_events
  for select using (auth.uid() = user_id);
create policy "creator_events_insert_own" on public.creator_events
  for insert with check (auth.uid() = user_id);
-- No UPDATE or DELETE policies: the log is append-only.

create table public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.creator_deals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  created_at timestamptz not null default now()
);

create index deal_stage_history_deal_idx
  on public.deal_stage_history (deal_id, created_at);

alter table public.deal_stage_history enable row level security;

create policy "deal_stage_history_select_own" on public.deal_stage_history
  for select using (auth.uid() = user_id);
create policy "deal_stage_history_insert_own" on public.deal_stage_history
  for insert with check (auth.uid() = user_id);
-- No UPDATE or DELETE policies: stage history is append-only.
