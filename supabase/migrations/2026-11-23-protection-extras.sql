-- ============================================================================
-- DEAL PROTECTION EXTRAS (2026-11-23) — the owner's demo checklist
-- carries two protection items the live checklist lacked: a kill
-- fee ("Get paid if the brand cancels after you've started.") and
-- a revision cap ("Limit revision rounds so the scope can't
-- creep."). Owner approved copying both from the demo on
-- 2026-11-23. This adds the two columns to deal_protection so the
-- checklist becomes seven items end to end (record, API, sheet,
-- and the Creator Loop's PROTECT stage).
--
-- Additive only: two boolean columns, default false — an existing
-- record simply has not confirmed either item yet, which is the
-- truth. No existing column, row, or policy changes.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.
-- ============================================================================

alter table public.deal_protection
  add column if not exists kill_fee boolean not null default false;

alter table public.deal_protection
  add column if not exists revision_cap boolean not null default false;
