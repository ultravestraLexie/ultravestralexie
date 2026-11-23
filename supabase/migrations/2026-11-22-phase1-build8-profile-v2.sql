-- Phase 1 Build 8 — Creator Business Profile v2 (owner's 10-point
-- profile spec, 2026-11-22: P1 creator identity + business goals).
--
-- Adds the identity layer the owner ordered — UltraVestra should
-- understand how a creator operates as a business, not only which
-- platforms they use:
--   creator_name               — creator or business name
--   business_description       — short business description
--   unique_selling_proposition — the creator's stated USP
--   differentiator             — what makes their content different
--   professional_experience    — their professional background
--   business_goals             — multi-select goals (owner's list:
--     Grow my audience / Increase revenue / Find brand
--     partnerships / Launch a product / Build a personal brand /
--     Improve content performance / Build a sustainable creator
--     business)
--
-- HONESTY RULES (binding, unchanged from Build 6): every value is
-- CREATOR-ENTERED; nothing is synced, scraped or inferred.
--
-- Additive only — new columns on the existing table; the Build 6
-- columns, RLS and policies are untouched. Run once in the SQL
-- Editor; verify by read-back (18 columns expected).

alter table public.creator_business_profiles
  add column if not exists creator_name text not null default '',
  add column if not exists business_description text not null default '',
  add column if not exists unique_selling_proposition text not null default '',
  add column if not exists differentiator text not null default '',
  add column if not exists professional_experience text not null default '',
  add column if not exists business_goals text[] not null default '{}';
