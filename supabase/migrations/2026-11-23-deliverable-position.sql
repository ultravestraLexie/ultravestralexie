-- ============================================================================
-- DELIVERABLE POSITION (2026-11-23) — a stable display order for
-- the per-deal deliverables checklist in the deal sheet.
--
-- NOTE ON SCOPE: public.deal_deliverables already exists (Phase 1
-- Build 14, 2026-11-22) with its own richer shape (title, due_date,
-- status pending/delivered/approved, revisions, post link) and
-- full own-row RLS — the demo's checklist (label + done) maps onto
-- it (title = label; delivered/approved = done). No second table
-- is created. The only schema gap for the checklist UI was a
-- stable ordering column: items were ordered by created_at alone.
--
-- Additive only: one int column, backfilled per deal in creation
-- order, plus the (deal_id, position) index the checklist reads.
-- New items are assigned max(position) + 1 for their deal by the
-- API at insert time.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.
-- ============================================================================

alter table public.deal_deliverables
  add column if not exists position int not null default 0;

update public.deal_deliverables d
set position = sub.rn - 1
from (
  select id,
         row_number() over (
           partition by deal_id order by created_at asc, id asc
         ) as rn
  from public.deal_deliverables
) sub
where d.id = sub.id;

create index if not exists deal_deliverables_deal_position_idx
  on public.deal_deliverables (deal_id, position);
