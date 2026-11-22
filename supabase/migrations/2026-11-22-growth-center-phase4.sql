-- ============================================================================
-- Creator Growth Center — Phase 4 schema
-- ============================================================================
-- One change, in service of the Growth Center's Brand Deal &
-- Partnership Manager (the Business Health page is read-only math
-- over existing tables and needs no schema):
--
--   public.creator_deals — one row per brand deal the creator is
--   tracking through their own pipeline: lead → applied →
--   negotiating → active → delivered → invoiced → paid → closed.
--   A deal may optionally link to one of the creator's own
--   Proposals (proposal_id) — the Proposal Builder stays the
--   system of record for the proposal itself; this table only
--   references it. Campaign Match briefs (partnership_briefs)
--   are immutable records and are not referenced or altered.
--
-- HONESTY RULES (binding, owner standard):
--   - A deal's `stage` is the CREATOR'S OWN workflow label. It is
--     tracked by the creator and labeled as such in the UI. A deal
--     the creator moves to 'paid' is NOT a verified payment —
--     UltraVestra did not receive or confirm the money. Money
--     truth lives only in public.revenue_entries (the Revenue
--     Tracker), and Business Health reads recorded revenue only;
--     public.revenue_estimates is never read by Phase 4 code.
--   - `compensation_cents` is the amount the creator recorded for
--     the deal (integer cents, nullable — a lead may have no
--     figure yet). Pipeline totals are exact integer sums over
--     the creator's own rows, labeled "tracked by you".
--   - `deadline` is a plain date the creator entered; "overdue"
--     is computed in code (deadline before today and the deal not
--     in a finished stage), never stored.
--
-- The table carries FULL RLS: owners see and touch only their
-- own rows, enforced again in the API route by scoping every
-- query to the caller's user_id.
--
-- FILE ONLY — prepared for review. Do not run as part of the local
-- build; apply through the normal database change process.
-- ============================================================================

-- --- Brand Deal & Partnership Manager ---------------------------------------

create table public.creator_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_name text not null,
  -- The platform the deal runs on, when the creator names one.
  -- Same platform vocabulary as creator_posts.
  platform text check (platform is null or platform in (
    'tiktok',
    'instagram',
    'facebook',
    'trybe',
    'other'
  )),
  -- The creator's own pipeline stage. Workflow state, NOT a
  -- verified fact about the brand or the money — see header.
  stage text not null default 'lead'
    check (stage in (
      'lead',
      'applied',
      'negotiating',
      'active',
      'delivered',
      'invoiced',
      'paid',
      'closed'
    )),
  -- The compensation the creator recorded for this deal, in
  -- integer cents. NULL = no figure recorded yet.
  compensation_cents int check (compensation_cents is null or compensation_cents >= 0),
  deliverables text not null default '',
  deadline date,
  -- Optional link to one of the creator's own proposals. The
  -- proposal itself stays in public.proposals; if it is deleted,
  -- the deal keeps its history and the link clears.
  proposal_id uuid references public.proposals(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_deals enable row level security;

create policy "creator_deals_select_own" on public.creator_deals
  for select using (auth.uid() = user_id);

create policy "creator_deals_insert_own" on public.creator_deals
  for insert with check (auth.uid() = user_id);

create policy "creator_deals_update_own" on public.creator_deals
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_deals_delete_own" on public.creator_deals
  for delete using (auth.uid() = user_id);
