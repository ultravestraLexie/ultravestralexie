-- Phase 1 Build 16b — invoice integrity + attribution audit
-- trail. Owner's requirement (2026-11-23 ~00:47 CT): "Protect
-- the financial audit trail… An issued invoice must not
-- silently change when a creator edits, unlinks, or deletes a
-- post."
--
-- Two tables:
--
-- 1) public.invoice_snapshots — the issued copy of record.
--    When a creator issues an invoice, the server freezes the
--    document exactly as issued: figures, dates, deliverables,
--    and each deliverable's fulfilling post (title, URL,
--    platform, posted date) as they were AT ISSUANCE. Later
--    edits, unlinks, or post deletions never reach a snapshot.
--    A correction is a NEW row with the next version number —
--    the original is never rewritten. IMMUTABLE through the
--    API: RLS grants select + insert only; there are no update
--    or delete policies.
--
-- 2) public.attribution_events — who changed the
--    post-to-deliverable relationship, and when. One row per
--    link change, written by the deliverables API, carrying
--    the deliverable title and the post titles as they were at
--    the moment of the change — so the history stays readable
--    even after the post itself is deleted. Append-only: RLS
--    grants select + insert only.
--
-- FILE ONLY — prepared for review. Do not run as part of the
-- local build; apply through the normal database change process.

create table public.invoice_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.creator_deals(id) on delete cascade,
  version int not null check (version >= 1),
  invoice_number text not null,
  snapshot jsonb not null,
  issued_at timestamptz not null default now(),
  unique (deal_id, version)
);

create table public.attribution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.creator_deals(id) on delete cascade,
  -- The deliverable may later be removed; the history survives
  -- (SET NULL) with its title snapshot below.
  deliverable_id uuid references public.deal_deliverables(id) on delete set null,
  deliverable_title text not null,
  action text not null check (action in ('linked', 'unlinked')),
  from_post_title text,
  to_post_title text,
  created_at timestamptz not null default now()
);

create index attribution_events_deal_idx
  on public.attribution_events (deal_id, created_at desc);

alter table public.invoice_snapshots enable row level security;
alter table public.attribution_events enable row level security;

create policy "invoice_snapshots_select_own" on public.invoice_snapshots
  for select using (auth.uid() = user_id);

create policy "invoice_snapshots_insert_own" on public.invoice_snapshots
  for insert with check (auth.uid() = user_id);

create policy "attribution_events_select_own" on public.attribution_events
  for select using (auth.uid() = user_id);

create policy "attribution_events_insert_own" on public.attribution_events
  for insert with check (auth.uid() = user_id);
