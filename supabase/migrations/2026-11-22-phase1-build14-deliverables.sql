-- Phase 1 Build 14 — Deliverables tracking for brand deals.
-- Owner approved 2026-11-22 (~23:53 CT) after the competitor
-- comparison: "Deliverables: Keeps track of content deadlines
-- and revisions." The improvement deepens the EXISTING Deals
-- page — no new page, no duplicate surface.
--
-- public.deal_deliverables — one row per promised piece of
-- content on a deal: what it is, when it is due, where it stands
-- (pending / delivered / approved), and how many revision rounds
-- it has been through. The deal's free-text `deliverables` field
-- stays as the overall summary; these rows are the trackable
-- items under it.
--
-- HONESTY RULES (binding, owner standard):
--   - Status is the creator's own tracking, like deal stages.
--     "Delivered" means the creator marked it delivered —
--     UltraVestra did not send or verify the content.
--   - "Overdue" is computed in code (due date before today and
--     the item not yet approved), never stored.
--   - Deleting a deal deletes its deliverables (cascade) — the
--     deal is the record; the items belong to it.
--
-- FULL RLS, same pattern as creator_deals: owners touch only
-- their own rows, enforced again in the API by scoping every
-- query to the caller's user_id.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.

create table public.deal_deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.creator_deals(id) on delete cascade,
  title text not null,
  due_date date,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'approved')),
  revisions int not null default 0 check (revisions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deal_deliverables_deal_idx
  on public.deal_deliverables (deal_id);

alter table public.deal_deliverables enable row level security;

create policy "deal_deliverables_select_own" on public.deal_deliverables
  for select using (auth.uid() = user_id);

create policy "deal_deliverables_insert_own" on public.deal_deliverables
  for insert with check (auth.uid() = user_id);

create policy "deal_deliverables_update_own" on public.deal_deliverables
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "deal_deliverables_delete_own" on public.deal_deliverables
  for delete using (auth.uid() = user_id);
