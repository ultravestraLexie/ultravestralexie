-- ============================================================================
-- TRYBE — UGC Brand Intelligence Platform
-- Complete production schema for Supabase (PostgreSQL)
--
-- Run top-to-bottom in the Supabase SQL Editor (or as a migration) on a
-- fresh project. Safe order: extensions -> helpers -> tables -> indexes ->
-- triggers -> RLS -> policies -> seed data.
--
-- Access model:
--   * Creators read/write ONLY their own rows.
--   * Published brands + their public child data are readable by any
--     authenticated user.
--   * Brand research writes are service-role / admin only (the service role
--     bypasses RLS in Supabase; admin users get explicit policies).
--   * Subscription rows are written only by the backend (Stripe webhooks,
--     service role). Creators can read their own subscription.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the current user is a TRYBE admin.
-- (plpgsql so table references resolve at call time, not creation time.)
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
end;
$$;

-- True when a brand is published (publicly visible inside the app).
create or replace function public.brand_is_published(p_brand_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.brands
    where id = p_brand_id and status = 'published'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Base tables created first: creator tables reference categories and brands.
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  description text,
  country text,
  logo_url text,
  -- researching -> in_review -> published / archived
  status text not null default 'researching'
    check (status in ('researching', 'in_review', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- A. Creator accounts
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  country text,
  location text,
  niches text[] not null default '{}',
  social_links jsonb not null default '{}',       -- {instagram, tiktok, youtube, ...}
  audience jsonb not null default '{}',           -- follower counts, demographics
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  interest_type text not null default 'category'
    check (interest_type in ('category', 'brand', 'product')),
  created_at timestamptz not null default now(),
  check (category_id is not null or brand_id is not null)
);

create table public.creator_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  media_url text not null,
  media_type text default 'link' check (media_type in ('link', 'image', 'video')),
  brand_id uuid references public.brands(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.creator_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_rates jsonb not null default '{}',          -- per content type
  collaboration_types text[] not null default '{}',     -- ugc_video, review, unboxing...
  accepts_gifting boolean not null default false,
  accepts_affiliate_only boolean not null default false,
  min_paid_rate numeric,
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- B. Brand intelligence
-- ============================================================================

-- (categories and brands tables are created above, before section A.)

create unique index brands_website_unique
  on public.brands (lower(website))
  where website is not null;

create table public.brand_categories (
  brand_id uuid not null references public.brands(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (brand_id, category_id)
);

create table public.brand_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  description text,
  product_url text,
  price numeric,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table public.brand_contacts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  contact_name text,
  job_title text,
  email text,
  contact_url text,                       -- creator application / partnerships page
  contact_type text default 'partnerships'
    check (contact_type in ('partnerships', 'creator_application', 'pr', 'marketing', 'general', 'other')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'needs_review', 'expired')),
  source_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_socials (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'facebook', 'pinterest', 'other')),
  handle text,
  url text not null,
  unique (brand_id, platform)
);

create table public.brand_evidence (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  source_url text not null,
  source_type text,                       -- official_site, social, affiliate_network, creator_report, listing, direct
  evidence_type text,                     -- ugc_collab, campaign, affiliate, contact, compensation, general
  evidence_summary text,
  observed_at timestamptz not null default now(),
  last_checked_at timestamptz,
  confidence text not null default 'unverified'
    check (confidence in ('verified', 'publicly_reported', 'needs_review', 'expired')),
  created_at timestamptz not null default now()
);

-- TRYBE Opportunity Score: 0-100, six weighted components.
create table public.brand_scores (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  niche_fit numeric not null default 0 check (niche_fit between 0 and 30),
  ugc_evidence numeric not null default 0 check (ugc_evidence between 0 and 20),
  compensation numeric not null default 0 check (compensation between 0 and 20),
  contact_access numeric not null default 0 check (contact_access between 0 and 15),
  opportunity_availability numeric not null default 0 check (opportunity_availability between 0 and 10),
  credibility numeric not null default 0 check (credibility between 0 and 5),
  total_score numeric generated always as
    (niche_fit + ugc_evidence + compensation + contact_access
     + opportunity_availability + credibility) stored,
  explanation jsonb not null default '{}',  -- per-component reasons shown to creators
  scored_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- C. Payment intelligence
-- ============================================================================

create table public.compensation_reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null,
  content_type text,                        -- ugc_video, review, unboxing, post, story...
  amount numeric,
  currency text not null default 'USD',
  payment_type text default 'paid'
    check (payment_type in ('paid', 'gifted', 'affiliate', 'paid_plus_product', 'other')),
  source_url text,
  source_date date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.compensation_sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.compensation_reports(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  source_url text not null,
  source_type text,                         -- creator_report, published_rate, campaign_listing, direct
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'needs_review', 'expired')),
  notes text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  check (report_id is not null or brand_id is not null)
);

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  network text,                             -- impact, shareasale, amazon, brand_direct...
  commission_rate numeric,                  -- percent, when known
  commission_notes text,
  application_url text,
  status text not null default 'unverified'
    check (status in ('unverified', 'verified', 'needs_review', 'expired', 'closed')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_terms (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  usage_rights text,                        -- e.g. "90 days paid social"
  exclusivity text,
  payment_timeline text,                    -- e.g. "Net 30"
  notes text,
  source_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- D. Opportunities
-- ============================================================================

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  title text not null,
  description text,
  requirements text,
  application_url text,
  compensation_min numeric,
  compensation_max numeric,
  currency text not null default 'USD',
  opportunity_type text default 'ugc'
    check (opportunity_type in ('ugc', 'influencer', 'affiliate', 'ambassador', 'review', 'other')),
  status text not null default 'unverified'
    check (status in ('unverified', 'open', 'closed', 'expired')),
  source_url text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  source_url text not null,
  source_type text,                         -- official_campaign_page, listing, social, direct
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.creator_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  match_score numeric check (match_score between 0 and 100),
  match_reasons jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, brand_id)
);

create table public.saved_brands (
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_review', 'accepted', 'rejected', 'withdrawn')),
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- E. Creator business tools
-- ============================================================================

create table public.pitch_templates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,  -- null = TRYBE system template
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  subject_template text,
  body_template text not null,              -- supports {{creator_name}}, {{brand_name}}, {{niche}}...
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  template_id uuid references public.pitch_templates(id) on delete set null,
  subject text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outreach_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  pitch_id uuid references public.creator_pitches(id) on delete set null,
  contact_id uuid references public.brand_contacts(id) on delete set null,
  status text not null default 'contacted'
    check (status in ('contacted', 'replied', 'follow_up', 'negotiating', 'booked', 'closed', 'no_response')),
  contacted_at timestamptz not null default now(),
  follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collaboration_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  content_type text,
  amount numeric,
  currency text not null default 'USD',
  completed_at date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'general'
    check (type in ('new_match', 'opportunity', 'follow_up', 'billing', 'general')),
  title text not null,
  body text,
  link_url text,
  brand_id uuid references public.brands(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- F. Subscriptions and administration
-- ============================================================================

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,                -- Starter / Pro / Elite
  slug text unique not null,
  price_monthly numeric not null default 0,
  price_yearly numeric,
  currency text not null default 'USD',
  features jsonb not null default '[]',
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'researcher' check (role in ('owner', 'admin', 'researcher')),
  created_at timestamptz not null default now()
);

create table public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  job_type text not null
    check (job_type in ('discover', 'verify_links', 'recheck_contacts', 'recheck_affiliate', 'refresh_opportunities', 'review_compensation', 'rescore', 'manual')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  payload jsonb not null default '{}',
  scheduled_for timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.research_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.research_jobs(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  message text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index brands_name_idx on public.brands (name);
create index brands_status_idx on public.brands (status);
create index brand_categories_category_idx on public.brand_categories (category_id);
create index brand_products_brand_idx on public.brand_products (brand_id);
create index brand_contacts_brand_idx on public.brand_contacts (brand_id);
create index brand_socials_brand_idx on public.brand_socials (brand_id);
create index brand_evidence_brand_idx on public.brand_evidence (brand_id);
create index brand_scores_brand_idx on public.brand_scores (brand_id, scored_at desc);
create index compensation_brand_idx on public.compensation_reports (brand_id);
create index affiliate_brand_idx on public.affiliate_programs (brand_id);
create index payment_terms_brand_idx on public.payment_terms (brand_id);
create index opportunities_brand_idx on public.opportunities (brand_id);
create index opportunities_status_idx on public.opportunities (status);
create index matches_user_idx on public.creator_matches (user_id, match_score desc);
create index saved_brands_brand_idx on public.saved_brands (brand_id);
create index applications_user_idx on public.applications (user_id);
create index creator_interests_user_idx on public.creator_interests (user_id);
create index creator_portfolios_user_idx on public.creator_portfolios (user_id);
create index pitches_user_idx on public.creator_pitches (user_id);
create index outreach_user_idx on public.outreach_tracking (user_id);
create index collab_user_idx on public.collaboration_history (user_id);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index subscriptions_user_idx on public.subscriptions (user_id);
create index payment_events_sub_idx on public.payment_events (subscription_id);
create index research_jobs_status_idx on public.research_jobs (status, scheduled_for);
create index research_logs_job_idx on public.research_logs (job_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger creator_profiles_set_updated_at before update on public.creator_profiles
  for each row execute function public.set_updated_at();
create trigger creator_preferences_set_updated_at before update on public.creator_preferences
  for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger brand_contacts_set_updated_at before update on public.brand_contacts
  for each row execute function public.set_updated_at();
create trigger affiliate_programs_set_updated_at before update on public.affiliate_programs
  for each row execute function public.set_updated_at();
create trigger payment_terms_set_updated_at before update on public.payment_terms
  for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();
create trigger creator_matches_set_updated_at before update on public.creator_matches
  for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();
create trigger pitch_templates_set_updated_at before update on public.pitch_templates
  for each row execute function public.set_updated_at();
create trigger creator_pitches_set_updated_at before update on public.creator_pitches
  for each row execute function public.set_updated_at();
create trigger outreach_tracking_set_updated_at before update on public.outreach_tracking
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.creator_interests enable row level security;
alter table public.creator_portfolios enable row level security;
alter table public.creator_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.brand_categories enable row level security;
alter table public.brand_products enable row level security;
alter table public.brand_contacts enable row level security;
alter table public.brand_socials enable row level security;
alter table public.brand_evidence enable row level security;
alter table public.brand_scores enable row level security;
alter table public.compensation_reports enable row level security;
alter table public.compensation_sources enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.payment_terms enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_sources enable row level security;
alter table public.creator_matches enable row level security;
alter table public.saved_brands enable row level security;
alter table public.applications enable row level security;
alter table public.pitch_templates enable row level security;
alter table public.creator_pitches enable row level security;
alter table public.outreach_tracking enable row level security;
alter table public.collaboration_history enable row level security;
alter table public.notifications enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.admin_users enable row level security;
alter table public.research_jobs enable row level security;
alter table public.research_logs enable row level security;

-- --- Own-row tables: creators manage only their own data --------------------

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "creator_profiles_all_own" on public.creator_profiles
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "creator_interests_all_own" on public.creator_interests
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "creator_portfolios_all_own" on public.creator_portfolios
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "creator_preferences_all_own" on public.creator_preferences
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "saved_brands_all_own" on public.saved_brands
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "creator_matches_select_own" on public.creator_matches
  for select using (auth.uid() = user_id or public.is_admin());
-- Matches are computed by the backend (service role). No creator writes.

create policy "applications_all_own" on public.applications
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "creator_pitches_all_own" on public.creator_pitches
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "outreach_tracking_all_own" on public.outreach_tracking
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "collaboration_history_all_own" on public.collaboration_history
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "notifications_all_own" on public.notifications
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- Subscriptions: read own; writes are backend/service-role only ---------

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());
create policy "subscriptions_admin_write" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());
-- Stripe webhooks use the service role, which bypasses RLS.

create policy "payment_events_admin_only" on public.payment_events
  for all using (public.is_admin()) with check (public.is_admin());

-- --- Reference data ---------------------------------------------------------

create policy "categories_read_authenticated" on public.categories
  for select to authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "plans_read_all" on public.plans
  for select using (true);
create policy "plans_admin_write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- --- Brand intelligence: published = readable; research writes admin only --

create policy "brands_read_published" on public.brands
  for select to authenticated
  using (status = 'published' or public.is_admin());
create policy "brands_admin_write" on public.brands
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_categories_read_published" on public.brand_categories
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_categories_admin_write" on public.brand_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_products_read_published" on public.brand_products
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_products_admin_write" on public.brand_products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_contacts_read_published" on public.brand_contacts
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_contacts_admin_write" on public.brand_contacts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_socials_read_published" on public.brand_socials
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_socials_admin_write" on public.brand_socials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_evidence_read_published" on public.brand_evidence
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_evidence_admin_write" on public.brand_evidence
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brand_scores_read_published" on public.brand_scores
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "brand_scores_admin_write" on public.brand_scores
  for all using (public.is_admin()) with check (public.is_admin());

create policy "affiliate_programs_read_published" on public.affiliate_programs
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "affiliate_programs_admin_write" on public.affiliate_programs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "payment_terms_read_published" on public.payment_terms
  for select to authenticated
  using (public.brand_is_published(brand_id) or public.is_admin());
create policy "payment_terms_admin_write" on public.payment_terms
  for all using (public.is_admin()) with check (public.is_admin());

-- Compensation reports: creators can read published-brand reports and submit
-- their own; verification/edits are admin only.
create policy "compensation_reports_read" on public.compensation_reports
  for select to authenticated
  using (brand_id is null or public.brand_is_published(brand_id) or public.is_admin());
create policy "compensation_reports_insert_own" on public.compensation_reports
  for insert to authenticated
  with check (submitted_by = auth.uid());
create policy "compensation_reports_admin_write" on public.compensation_reports
  for all using (public.is_admin()) with check (public.is_admin());

create policy "compensation_sources_read" on public.compensation_sources
  for select to authenticated
  using (brand_id is null or public.brand_is_published(brand_id) or public.is_admin());
create policy "compensation_sources_admin_write" on public.compensation_sources
  for all using (public.is_admin()) with check (public.is_admin());

-- Opportunities: readable when open/verified and the brand is published.
create policy "opportunities_read" on public.opportunities
  for select to authenticated
  using (brand_id is null or public.brand_is_published(brand_id) or public.is_admin());
create policy "opportunities_admin_write" on public.opportunities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "opportunity_sources_read" on public.opportunity_sources
  for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (o.brand_id is null or public.brand_is_published(o.brand_id))
    )
  );
create policy "opportunity_sources_admin_write" on public.opportunity_sources
  for all using (public.is_admin()) with check (public.is_admin());

-- Pitch templates: system templates readable by all creators; personal
-- templates only by their creator.
create policy "pitch_templates_read" on public.pitch_templates
  for select to authenticated
  using (is_system or created_by = auth.uid() or public.is_admin());
create policy "pitch_templates_write_own" on public.pitch_templates
  for all using (created_by = auth.uid() or public.is_admin())
  with check ((created_by = auth.uid() and not is_system) or public.is_admin());

-- --- Admin / research operations: admin only --------------------------------

create policy "admin_users_admin_only" on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

create policy "research_jobs_admin_only" on public.research_jobs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "research_logs_admin_only" on public.research_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Seed data
-- ============================================================================

insert into public.plans (name, slug, price_monthly, price_yearly, features) values
  ('Starter', 'starter', 19, 190,
   '["Brand directory access", "Opportunity scores", "Saved brands", "Basic pitch templates"]'::jsonb),
  ('Pro', 'pro', 39, 390,
   '["Everything in Starter", "Contact information", "Compensation intelligence", "Personalized matches", "Full pitch engine"]'::jsonb),
  ('Elite', 'elite', 79, 790,
   '["Everything in Pro", "Outreach tracking", "Priority new-brand alerts", "Advanced compensation data"]'::jsonb)
on conflict (slug) do nothing;

insert into public.categories (name, slug) values
  ('Beauty', 'beauty'),
  ('Skincare', 'skincare'),
  ('Fashion', 'fashion'),
  ('Food & Drink', 'food-drink'),
  ('Wellness', 'wellness'),
  ('Fitness', 'fitness'),
  ('Travel', 'travel'),
  ('Technology', 'technology'),
  ('Pets', 'pets'),
  ('Home', 'home'),
  ('Health', 'health'),
  ('Lifestyle', 'lifestyle')
on conflict (slug) do nothing;

-- ============================================================================
-- Auth: create the public profile row automatically on sign-up.
-- (Applied to the live project as migration 2026-11-20-phase2-auth.sql;
--  kept here so schema.sql remains the full source of truth.)
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
