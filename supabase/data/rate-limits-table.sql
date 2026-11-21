-- Shared rate-limit store for the Buyer Brain APIs (2026-11-21).
--
-- Replaces per-instance in-memory counting with one counter per key in
-- Postgres, so every serverless instance shares the same limit.
-- Run once in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- Window semantics: FIXED window. The window is anchored at
-- window_start (when the current window opened) and resets
-- p_window_seconds after it opened — the first request after expiry
-- starts a brand-new window at count 1. It is NOT a sliding window.
-- Rejected requests do NOT increment the counter: the admission
-- condition lives in the upsert's WHERE clause, so the stored count
-- can never exceed the limit.
--
-- Access: row level security is enabled with NO policies, so the
-- anon/authenticated roles can neither read nor write this table.
-- Only the service role (which bypasses RLS) can use it, via the
-- check_rate_limit() function below.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- Atomically record one hit for p_key and report whether it is within
-- p_limit hits per p_window_seconds. Implemented as a single upsert:
-- the INSERT ... ON CONFLICT takes the row lock for the key, so
-- concurrent requests serialize on that row and cannot slip past the
-- limit. The admission condition sits in the update's WHERE clause:
-- a hit is recorded only when the stored window has expired (a fresh
-- window opens at count 1) or the stored count is still below
-- p_limit. A rejected hit returns no row and is NOT recorded, so the
-- stored count can never exceed p_limit.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rate_limits.window_start
               <= now() - (p_window_seconds * interval '1 second')
            then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start
               <= now() - (p_window_seconds * interval '1 second')
            then now()
          else rate_limits.window_start
        end
    where rate_limits.window_start
               <= now() - (p_window_seconds * interval '1 second')
       or rate_limits.count < p_limit
  returning count into v_count;

  -- No row returned: the key is at the limit inside a live window,
  -- and the hit was not recorded.
  if not found then
    return false;
  end if;

  return true;
end;
$$;
