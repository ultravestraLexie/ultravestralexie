-- ============================================================================
-- CUSTOMER FEEDBACK (2026-11-23) — trust queue #7 (owner order
-- 2026-11-23): "Identify why users stay or leave." A signed-in
-- creator leaves feedback from the Support page: one of four
-- kinds, a message, and an opt-in to being emailed about it.
--
-- Feedback is NOT a support ticket: there is no status, no
-- reference number, and no reply is promised — contact_ok only
-- records that the creator said we MAY email them about it. The
-- owner reads feedback from the database; there is deliberately
-- no admin UI in this build.
--
-- The kind list is closed and shared with the app: the form, the
-- API validation (lib/galaxy/core.ts FEEDBACK_KINDS) and this
-- check constraint name exactly the same four values; the
-- regression fixtures pin that they cannot drift apart.
--
-- RLS: the creator can INSERT feedback and SELECT their own back.
-- There is NO update or delete policy for users — feedback is a
-- record of what was said, not a draft.
-- ============================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (
    kind in ('working', 'missing', 'hard', 'leaving')
  ),
  message text not null,
  contact_ok boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_idx
  on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

create policy "feedback_select_own" on public.feedback
  for select using (auth.uid() = user_id);
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);
