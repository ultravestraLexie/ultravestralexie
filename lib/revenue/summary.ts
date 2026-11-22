// Creator Revenue Tracker — the summary math, pure and isolated.
//
// HONESTY RULE (binding): every figure here is an exact integer sum
// over the creator's own entered rows. Money is integer cents end to
// end — no floats, no rounding, no estimates, no projections. Given
// the same rows, this function always returns the same numbers, and
// anyone can re-derive them from the entries by hand.
//
// This module has no imports and no I/O on purpose: the API route
// feeds it the caller's rows, and the math can be exercised in
// isolation (see the hand-check in the build report).

export type RevenueStatus = "pending" | "paid";

export type RevenueEntryLike = {
  brand_name: string;
  amount_cents: number;
  status: RevenueStatus;
  /** 'YYYY-MM-DD' */
  earned_date: string;
};

export type BrandTotal = {
  brandName: string;
  totalCents: number;
  pendingCents: number;
  paidCents: number;
  count: number;
};

export type MonthTotal = {
  /** 'YYYY-MM' */
  month: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
};

export type RevenueSummary = {
  totalEarnedCents: number;
  pendingCents: number;
  receivedCents: number;
  byBrand: BrandTotal[];
  monthly: MonthTotal[];
};

/** 'YYYY-MM' for the month `offset` months before the month
 *  containing `now` (offset 0 = now's own month). Pure calendar
 *  arithmetic on the UTC fields so results never depend on the
 *  server's local timezone. */
function monthKey(now: Date, offset: number): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() - offset;
  const d = new Date(Date.UTC(year, month, 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Summarize a creator's revenue entries.
 *
 * - totalEarnedCents: every entry, paid or pending.
 * - pendingCents: status 'pending' — earned, still owed to them.
 * - receivedCents: status 'paid'.
 * - byBrand: grouped by the exact brand_name string, sorted by
 *   total descending (ties broken by brand name, so the order is
 *   deterministic).
 * - monthly: the last 6 calendar months including the current one,
 *   bucketed by earned_date's 'YYYY-MM' prefix, oldest → newest.
 *   Months with no entries appear as zeros — the trend never hides
 *   a quiet month. Entries older than the window still count in the
 *   totals and byBrand; they simply fall outside the trend.
 */
export function computeSummary(
  entries: RevenueEntryLike[],
  now: Date = new Date()
): RevenueSummary {
  let totalEarnedCents = 0;
  let pendingCents = 0;
  let receivedCents = 0;

  const brandMap = new Map<string, BrandTotal>();
  const monthMap = new Map<string, MonthTotal>();

  // Pre-seed the 6-month window so empty months render as zeros.
  const monthKeys: string[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const key = monthKey(now, offset);
    monthKeys.push(key);
    monthMap.set(key, {
      month: key,
      totalCents: 0,
      paidCents: 0,
      pendingCents: 0,
    });
  }

  for (const entry of entries) {
    totalEarnedCents += entry.amount_cents;
    if (entry.status === "pending") pendingCents += entry.amount_cents;
    else receivedCents += entry.amount_cents;

    const brand = brandMap.get(entry.brand_name) ?? {
      brandName: entry.brand_name,
      totalCents: 0,
      pendingCents: 0,
      paidCents: 0,
      count: 0,
    };
    brand.totalCents += entry.amount_cents;
    if (entry.status === "pending") brand.pendingCents += entry.amount_cents;
    else brand.paidCents += entry.amount_cents;
    brand.count += 1;
    brandMap.set(entry.brand_name, brand);

    const bucket = monthMap.get(entry.earned_date.slice(0, 7));
    if (bucket) {
      bucket.totalCents += entry.amount_cents;
      if (entry.status === "pending") bucket.pendingCents += entry.amount_cents;
      else bucket.paidCents += entry.amount_cents;
    }
  }

  const byBrand = [...brandMap.values()].sort(
    (a, b) =>
      b.totalCents - a.totalCents || a.brandName.localeCompare(b.brandName)
  );
  const monthly = monthKeys.map((key) => monthMap.get(key) as MonthTotal);

  return { totalEarnedCents, pendingCents, receivedCents, byBrand, monthly };
}
