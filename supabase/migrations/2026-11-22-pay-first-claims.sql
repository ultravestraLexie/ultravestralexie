-- Pay-first signup: a visitor pays for a plan BEFORE any account
-- exists, so the Stripe subscription cannot yet be attached to a
-- user. The webhook parks it here as a "claim" keyed by the email
-- used at checkout; when that email first signs in, the auth callback
-- stamps the Stripe subscription with the new user id, and the
-- webhook then writes the real public.subscriptions row through its
-- existing path. This table is written ONLY by the webhook and the
-- auth callback (both via the service-role admin client) — RLS is
-- enabled with no client policies, so no browser client can read or
-- write it.
create table public.subscription_claims (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text not null unique,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  claimed_user_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscription_claims enable row level security;
-- No policies on purpose: service-role access only.
