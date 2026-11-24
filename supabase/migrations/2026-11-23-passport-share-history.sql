-- ============================================================================
-- PASSPORT TRACK-RECORD SHARING (2026-11-23) — owner order: "Passport —
-- give creators something worth sharing." A creator's public Passport
-- (/p/[slug]) already shows verified collaborations when the Passport
-- itself is public. This adds a SECOND, separate opt-in: sharing the
-- track record — paid-deal history (counts, brands, total collected)
-- and the audience-independence indicators.
--
--   profiles.passport_share_history  boolean NOT NULL DEFAULT false
--
-- Off by default, and it changes nothing on its own: the public page
-- renders the track-record section only when passport_public is ALSO
-- true, and the audience snapshot read policy below requires BOTH
-- flags. Turning either flag off removes the data from public view.
--
-- The audience_snapshots policy mirrors the flag-gated public-read
-- policies of 2026-11-23-galaxy-redesign.sql, tightened with the
-- share-history flag: anonymous reads return snapshot rows ONLY for
-- a creator who has opted into both levels of sharing. The own-row
-- policies from 2026-11-23-audience-snapshots.sql are untouched.
-- ============================================================================

alter table public.profiles
  add column if not exists passport_share_history boolean not null default false;

create policy "audience_snapshots_select_public_passport" on public.audience_snapshots
  for select using (exists (
    select 1 from public.profiles pr
    where pr.id = audience_snapshots.user_id
      and pr.passport_public is true and pr.passport_slug is not null
      and pr.passport_share_history is true));
