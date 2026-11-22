-- ============================================================================
-- Creator Growth Center — Phase 2 schema
-- ============================================================================
-- Three changes, all in service of the Creator Growth Center's
-- Content Planner, Ideas, and Creator Goals:
--
--   1. public.creator_posts gains a `state` column — the creator's
--      workflow label for a row: 'published' (it actually went
--      out), 'planned' (scheduled, not yet posted), or 'draft'
--      (in progress). Existing rows default to 'published', which
--      is exactly what they are: every Phase 1 row was a post the
--      creator logged as published. History is preserved untouched.
--      The same ALTER adds a nullable `caption` column so the
--      Planner's caption-draft field on a planned/draft item has
--      somewhere honest to live (ideas carry their own
--      caption_draft column in their own table below).
--   2. public.creator_ideas — the creator's raw material: title,
--      concept, caption draft, optional platform. An idea is NOT
--      a post and never counts as one.
--   3. public.creator_goals — the creator's own targets. Progress
--      is computed in code (lib/goals/progress.ts) from the
--      creator's records (published posts, RECORDED earnings) or
--      from `manual_current`, a figure the creator entered for
--      goal types the platform cannot measure yet (followers,
--      views, custom). manual_current is stored as entered and
--      labeled creator-entered wherever it is shown.
--
-- HONESTY RULES (binding, owner standard):
--   - A planned or draft post is NOT a published post. All counts,
--     streaks, and goal progress run over state='published' rows
--     only (lib/posts/summary.ts enforces this; fixtures prove a
--     planned row cannot create or extend a streak).
--   - Estimated earnings NEVER feed goal progress. Estimates live
--     in public.revenue_estimates; the goals code never reads that
--     table. An earnings goal reads recorded cents only.
--   - A goal's completed_at is stamped by the server when computed
--     progress first reaches 100% — completion is established by
--     the records, never claimed by a button, and never un-stamped.
--
-- All new tables carry FULL RLS: owners see and touch only their
-- own rows, enforced again in the API routes by scoping every
-- query to the caller's user_id.
--
-- FILE ONLY — prepared for review. Do not run as part of the local
-- build; apply through the normal database change process.
-- ============================================================================

-- --- 1. creator_posts: workflow state + caption draft ------------------------

alter table public.creator_posts
  add column state text not null default 'published'
  check (state in ('published', 'planned', 'draft'));

alter table public.creator_posts
  add column caption text;

-- --- 2. Creator ideas ----------------------------------------------------------

create table public.creator_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  concept text not null default '',
  caption_draft text not null default '',
  platform text check (platform is null or platform in (
    'tiktok',
    'instagram',
    'facebook',
    'trybe',
    'other'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_ideas enable row level security;

create policy "creator_ideas_select_own" on public.creator_ideas
  for select using (auth.uid() = user_id);

create policy "creator_ideas_insert_own" on public.creator_ideas
  for insert with check (auth.uid() = user_id);

create policy "creator_ideas_update_own" on public.creator_ideas
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_ideas_delete_own" on public.creator_ideas
  for delete using (auth.uid() = user_id);

-- --- 3. Creator goals ------------------------------------------------------------

create table public.creator_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_type text not null check (goal_type in (
    'videos',
    'earnings',
    'followers',
    'views',
    'custom'
  )),
  target_value numeric not null check (target_value > 0),
  unit text not null default '',
  period text not null default 'monthly'
    check (period in ('monthly', 'total')),
  -- Creator-entered progress for goal types the platform cannot
  -- measure yet (followers/views until a real platform sync, and
  -- custom goals). NULL = nothing entered; it reads as 0 and is
  -- never filled in by a guess.
  manual_current numeric,
  -- Stamped by the server when computed progress first reaches
  -- the target. Never set by the client; never un-stamped.
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.creator_goals enable row level security;

create policy "creator_goals_select_own" on public.creator_goals
  for select using (auth.uid() = user_id);

create policy "creator_goals_insert_own" on public.creator_goals
  for insert with check (auth.uid() = user_id);

create policy "creator_goals_update_own" on public.creator_goals
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_goals_delete_own" on public.creator_goals
  for delete using (auth.uid() = user_id);
