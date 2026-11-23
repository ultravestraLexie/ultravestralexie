-- ============================================================================
-- BRAND DEAL PROTECTION (2026-11-23) — System #2 of the creator-
-- systems program (owner order 2026-11-23). One protection record
-- per deal: the contract review checklist, the usage-rights and
-- exclusivity record, and the creator's evidence of what was
-- agreed. Storage for the Deals world's "Deal protection" section.
--
-- The row is a subordinate working record of exactly one deal —
-- it has no meaning on its own — so deal_id uses ON DELETE
-- CASCADE, the same rule as deal_deliverables (Build 14). It is
-- NOT a financial or audit record: money truth stays in
-- creator_deals / revenue_entries, and stage history stays in the
-- events tables; nothing here needs to outlive its deal.
--
-- RLS: full own-row policies, mirroring script_analyses (Galaxy
-- redesign migration, 2026-11-23), plus an update policy — the
-- checklist is edited in place via upsert. The API route scopes
-- every query to the caller's user_id in code as well.
-- ============================================================================

create table if not exists public.deal_protection (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references public.creator_deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  contract_reviewed boolean not null default false,
  deliverables_agreed boolean not null default false,
  payment_terms_agreed boolean not null default false,
  usage_rights_set boolean not null default false,
  exclusivity_checked boolean not null default false,
  usage_rights_note text not null default '',
  exclusivity_note text not null default '',
  terms_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_protection_user_id_idx
  on public.deal_protection (user_id);

alter table public.deal_protection enable row level security;

create policy "deal_protection_select_own" on public.deal_protection
  for select using (auth.uid() = user_id);
create policy "deal_protection_insert_own" on public.deal_protection
  for insert with check (auth.uid() = user_id);
create policy "deal_protection_update_own" on public.deal_protection
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deal_protection_delete_own" on public.deal_protection
  for delete using (auth.uid() = user_id);
