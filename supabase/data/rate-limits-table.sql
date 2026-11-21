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
-- limit. Returns true when the new count is <= p_limit.
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
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
