-- Phase 1 Build 16 — completing the attribution chain: a
-- deliverable can name the post that fulfilled it.
--
-- Owner's priority (2026-11-23 ~00:40 CT): "Our priority
-- remains completing the attribution chain. That's where we
-- can establish a real competitive advantage."
--
-- The chain today: revenue links to a post (Build 13) and to a
-- deal (Build 3); deliverables belong to a deal (Build 14).
-- The missing edge was post <-> deal. This column is that
-- edge, placed on the deliverable — the promised piece of
-- content — because that is what a post fulfills:
--
--   post --fulfills--> deliverable --belongs to--> deal
--   deal --collected--> revenue (deal payment records)
--   post --earned--> revenue (Build 13 links)
--
-- With it, every surface can show the evidence in one line:
-- this post fulfilled this deliverable for this brand; the
-- deal collected $X; the post has V views and $Y of recorded
-- revenue linked to it directly.
--
-- HONESTY RULES (binding):
--   - The link is the creator's own claim — reported, never
--     verified. Every surface labels it "linked by you".
--   - Deleting a post clears the link (ON DELETE SET NULL);
--     the deliverable and its deal history survive.
--   - NULL means "not linked" — surfaces say so plainly and
--     never guess which post fulfilled a deliverable.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.

alter table public.deal_deliverables
  add column post_id uuid references public.creator_posts(id)
    on delete set null;
