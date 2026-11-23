-- Phase 1 Build 13 — Content-to-Revenue Attribution (owner-approved
-- 2026-11-22 ~23:35 CT, from the attribution audit). Two additive
-- links, both creator-reported and labeled that way everywhere:
-- revenue_entries.post_id — "which post earned this?" (the direct
-- link; ON DELETE SET NULL so deleting a post never deletes money
-- history), and creator_posts.views_count — an optional manual
-- performance figure the creator types in. Nothing here verifies
-- a conversion; verified attribution waits for platform sync.

alter table public.revenue_entries
  add column if not exists post_id uuid
    references public.creator_posts(id) on delete set null;

alter table public.creator_posts
  add column if not exists views_count int
    check (views_count is null or views_count >= 0);
