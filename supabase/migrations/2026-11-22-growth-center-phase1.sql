-- ============================================================================
-- Creator Growth Center — Phase 1 schema
-- ============================================================================
-- Four changes, all in service of the Creator Growth Center hub:
--
--   1. public.revenue_entries gains a `kind` column so every recorded
--      earning is classified: campaign fee, affiliate commission,
--      brand payment, platform payout, or other. Existing rows are
--      preserved untouched and read as 'other' until the creator
--      reclassifies them.
--   2. public.revenue_estimates — a SEPARATE table for estimated
--      platform earnings. Estimates never live in revenue_entries.
--   3. public.creator_posts + public.growth_prefs — the Posting
--      Tracker: one row per post the creator logs, plus the
--      creator's weekly posting goal.
--   4. public.social_connections — one row per creator per platform,
--      designed for the Phase 2 OAuth sync (token columns exist now
--      and stay NULL in Phase 1) so no redesign is needed later.
--   5. public.creator_profiles gains a `username` column — the
--      creator's unique @handle on UltraVestra itself, the identity
--      layer under the Growth Center account card. Nullable (nobody
--      is assigned one automatically — a username is only ever what
--      the creator chose), UNIQUE across creators, and format-checked
--      in the database as well as in the API.
--
-- HONESTY RULES (binding, owner acceptance standard 2026-11-22):
--   - Recorded earnings and estimated earnings are NEVER combined.
--     They live in different tables, are summed by different code
--     (lib/revenue/summary.ts), and are displayed in separate blocks.
--     An estimate is not money received and is never presented as
--     such. `basis` records where an estimate came from:
--     'creator_entered' (the creator typed it) or 'platform_reported'
--     (reserved for a future platform integration — the Phase 1 API
--     only ever writes 'creator_entered').
--   - A post's `source` is a stored fact: 'manual' (the creator
--     logged it) or 'verified' (a platform connection confirmed it).
--     Phase 1 writes ONLY 'manual' — the API forces it server-side —
--     and the UI labels manual rows "Logged by you". 'verified' rows
--     become possible only when a real connection syncs them.
--   - A connection's `status` is its real state. Phase 1 can only
--     produce 'not_connected' and 'link_only' (the creator saved a
--     profile link — that is NOT a data connection and the UI says
--     so). 'pending_approval' and 'connected' are system-set in a
--     later phase; the Phase 1 API refuses to write them.
--
-- MONEY IS INTEGER CENTS (amount_cents) everywhere, exactly as in
-- revenue_entries — totals are exact integer sums, re-derivable
-- from the rows by hand.
--
-- All four tables carry FULL RLS: owners see and touch only their
-- own rows, enforced again in the API routes by scoping every query
-- to the caller's user_id.
--
-- FILE ONLY — prepared for review. Do not run as part of the local
-- build; apply through the normal database change process.
-- ============================================================================

-- --- 1. revenue_entries: classify every recorded earning --------------------

alter table public.revenue_entries
  add column kind text not null default 'other'
  check (kind in (
    'campaign_fee',
    'affiliate_commission',
    'brand_payment',
    'platform_payout',
    'other'
  ));

-- --- 2. Estimated platform earnings (NEVER summed with recorded) ------------

create table public.revenue_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  amount_cents int not null check (amount_cents > 0),
  -- The month the estimate is about, stored as the first of that
  -- month ('2026-11-01'). One estimate per platform per month is
  -- the intended shape; the API does not force uniqueness in v1.
  period_month date not null,
  note text not null default '',
  basis text not null default 'creator_entered'
    check (basis in ('creator_entered', 'platform_reported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.revenue_estimates enable row level security;

create policy "revenue_estimates_select_own" on public.revenue_estimates
  for select using (auth.uid() = user_id);

create policy "revenue_estimates_insert_own" on public.revenue_estimates
  for insert with check (auth.uid() = user_id);

create policy "revenue_estimates_update_own" on public.revenue_estimates
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "revenue_estimates_delete_own" on public.revenue_estimates
  for delete using (auth.uid() = user_id);

-- --- 3. Posting Tracker ------------------------------------------------------

create table public.creator_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in (
    'tiktok',
    'instagram',
    'facebook',
    'trybe',
    'other'
  )),
  posted_date date not null,
  -- 'manual' = logged by the creator; 'verified' = confirmed by a
  -- platform sync (Phase 2+). The distinction is stored per row and
  -- rendered per row — never merged into an unlabeled count.
  source text not null default 'manual'
    check (source in ('manual', 'verified')),
  external_url text,
  title text,
  note text,
  -- The platform's own id for the post, set by a future sync so a
  -- verified row can be matched and de-duplicated against the
  -- platform. NULL for every Phase 1 (manual) row.
  platform_post_id text,
  created_at timestamptz not null default now()
);

alter table public.creator_posts enable row level security;

create policy "creator_posts_select_own" on public.creator_posts
  for select using (auth.uid() = user_id);

create policy "creator_posts_insert_own" on public.creator_posts
  for insert with check (auth.uid() = user_id);

create policy "creator_posts_update_own" on public.creator_posts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "creator_posts_delete_own" on public.creator_posts
  for delete using (auth.uid() = user_id);

-- One prefs row per creator: their weekly posting goal. A missing
-- row means the default goal (5) — the API reads it that way and
-- creates the row only when the creator changes the goal.
create table public.growth_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekly_post_goal int not null default 5
    check (weekly_post_goal >= 1 and weekly_post_goal <= 50),
  updated_at timestamptz not null default now()
);

alter table public.growth_prefs enable row level security;

create policy "growth_prefs_select_own" on public.growth_prefs
  for select using (auth.uid() = user_id);

create policy "growth_prefs_insert_own" on public.growth_prefs
  for insert with check (auth.uid() = user_id);

create policy "growth_prefs_update_own" on public.growth_prefs
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "growth_prefs_delete_own" on public.growth_prefs
  for delete using (auth.uid() = user_id);

-- --- 4. Social connections (Phase 1: links only; designed for sync) ---------

create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in (
    'tiktok',
    'instagram',
    'facebook',
    'trybe'
  )),
  handle text,
  profile_url text,
  -- The real state of the connection:
  --   'not_connected'    — nothing saved, nothing connected
  --   'link_only'        — the creator saved a profile link; this is
  --                        NOT a data connection and syncs nothing
  --   'pending_approval' — (later phase, system-set) the platform's
  --                        developer approval is outstanding
  --   'connected'        — (later phase, system-set) OAuth completed
  --                        and syncing
  status text not null default 'not_connected'
    check (status in (
      'not_connected',
      'link_only',
      'pending_approval',
      'connected'
    )),
  -- Phase 2 OAuth fields. They exist now so the sync build needs no
  -- schema redesign; every one of them stays NULL throughout Phase 1.
  platform_account_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  scopes text,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.social_connections enable row level security;

create policy "social_connections_select_own" on public.social_connections
  for select using (auth.uid() = user_id);

create policy "social_connections_insert_own" on public.social_connections
  for insert with check (auth.uid() = user_id);

create policy "social_connections_update_own" on public.social_connections
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "social_connections_delete_own" on public.social_connections
  for delete using (auth.uid() = user_id);

-- --- 5. The creator's own UltraVestra username -------------------------------
--
-- creator_profiles rows are NOT auto-created at signup (the
-- handle_new_user trigger creates only the public.profiles row), so
-- the first time a creator saves a username the API upserts their
-- own creator_profiles row. The UNIQUE constraint is what makes a
-- username one creator's identity and no one else's; the API turns
-- a uniqueness violation into an honest "that username is taken"
-- message — it never silently assigns a different one.

alter table public.creator_profiles
  add column username text unique
  check (username is null or username ~ '^[a-z0-9_]{3,24}$');
