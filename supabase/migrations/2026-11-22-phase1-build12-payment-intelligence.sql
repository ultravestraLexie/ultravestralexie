-- Phase 1 Build 12 — Deal payment intelligence + revenue by platform.
-- Owner's full requirements (2026-11-22 ~23:17 CT): Deals must
-- distinguish contracted / invoiced / overdue / collected revenue.
-- Every deal records: amount, invoice sent date, payment terms,
-- payment due date, payment received date, amount received,
-- remaining balance (computed). Partial payments supported. A deal
-- is never marked paid on a promise — amount received is recorded
-- only when the creator confirms receipt. Payment history is
-- preserved (additive columns only, nothing overwritten).
-- Plus revenue by platform for Business Health.
-- Additive only; existing rows read NULL = "not recorded yet".

alter table public.creator_deals
  add column if not exists invoice_sent_date date,
  add column if not exists payment_terms text
    check (payment_terms is null or payment_terms in (
      'due_on_receipt', 'net_7', 'net_14', 'net_30', 'net_45',
      'net_60', 'other'
    )),
  add column if not exists payment_due_date date,
  add column if not exists payment_received_date date,
  add column if not exists amount_received_cents int
    check (amount_received_cents is null or amount_received_cents >= 0);

alter table public.revenue_entries
  add column if not exists platform text
    check (platform is null or platform in (
      'tiktok', 'instagram', 'youtube', 'amazon', 'other'
    ));
