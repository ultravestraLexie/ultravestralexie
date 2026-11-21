/** Rate limiting for the Buyer Brain APIs.
 *
 *  Two pieces:
 *
 *  1. `checkRateLimit` — the original in-memory sliding-window limiter
 *     (v1). State lives in module memory: it resets on cold starts and
 *     is per-instance, so limits are approximate across serverless
 *     instances. Kept for compatibility only — it is NOT part of the
 *     enforcement path anymore (owner's ruling: an approximate
 *     per-instance count must never be treated as enforcement).
 *
 *  2. `checkRateLimitShared` — the enforcing limiter. It calls the
 *     `check_rate_limit` Postgres function (see
 *     supabase/data/rate-limits-table.sql) through a service-role
 *     client, so every serverless instance counts against the same
 *     counter and the limit actually holds across instances. The
 *     database side is a fixed window anchored at the window's first
 *     hit. FAIL-CLOSED (owner's ruling): if the shared call fails for
 *     ANY reason — missing env, missing table/function, RPC error,
 *     network error — the request is REJECTED (returns false, which
 *     the routes turn into their HTTP 429 response). A limiter that
 *     cannot count must not wave requests through. */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const HOUR_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();

/** Record one hit for `key` and report whether it is allowed.
 *  Returns false when `limit` hits already fall inside the window.
 *  Compatibility export only — not used for enforcement. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = HOUR_MS
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Buyer Brain Simulator: 10 simulations per user per hour. */
export const BUYER_BRAIN_RATE_LIMIT = { limit: 10, windowMs: HOUR_MS } as const;

/** Shared-store rate limit check (see header). Records one hit for
 *  `key` in the public.rate_limits table via the check_rate_limit RPC
 *  and reports whether it is within `limit` hits per `windowMs`.
 *  Fail-closed: any failure of the shared call returns false. */
export async function checkRateLimitShared(
  key: string,
  limit: number,
  windowMs: number = HOUR_MS
): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return false;
    }
    const supabase = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (error || typeof data !== "boolean") {
      return false;
    }
    return data;
  } catch {
    return false;
  }
}
