/** Minimal in-memory sliding-window rate limiter (v1).
 *
 *  State lives in module memory: it resets on cold starts and is
 *  per-instance, so limits are approximate across serverless
 *  instances. That is acceptable for v1 — the goal is to blunt
 *  abuse and cap unexpected AI spend, not to meter exactly. Swap
 *  the Map for a shared store if exact limits are ever needed.
 *  No external services, no new dependencies. */

const HOUR_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();

/** Record one hit for `key` and report whether it is allowed.
 *  Returns false when `limit` hits already fall inside the window. */
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
