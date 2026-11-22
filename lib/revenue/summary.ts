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

/** What kind of money a recorded earning is (Growth Center Phase 1).
 *  Every entry carries exactly one kind; rows recorded before the
 *  kind column existed read as 'other'. The classification is the
 *  creator's own, chosen when they record the earning. */
export type RevenueKind =
  | "campaign_fee"
  | "affiliate_commission"
  | "brand_payment"
  | "platform_payout"
  | "other";

export const REVENUE_KINDS: RevenueKind[] = [
  "campaign_fee",
  "affiliate_commission",
  "brand_payment",
  "platform_payout",
  "other",
];

export type RevenueEntryLike = {
  brand_name: string;
  amount_cents: number;
  status: RevenueStatus;
  /** 'YYYY-MM-DD' */
  earned_date: string;
  /** Optional so existing callers (Command Center) keep working
   *  unchanged; an absent kind is classified as 'other'. */
  kind?: RevenueKind;
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

export type KindTotal = {
  kind: RevenueKind;
  totalCents: number;
  pendingCents: number;
  paidCents: number;
  count: number;
};

export type YearTotal = {
  year: number;
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
  /** Every kind, in REVENUE_KINDS order, zeros included — the
   *  breakdown never hides a kind the creator hasn't used yet. */
  byKind: KindTotal[];
  /** One row per calendar year present in the entries, newest
   *  first. Derived from earned_date's year — no new data. */
  yearly: YearTotal[];
  /** Exact sums for the calendar month containing `now` and the
   *  month before it (all statuses). The Growth Center's
   *  month-over-month figure is derived from these two. */
  currentMonthCents: number;
  previousMonthCents: number;
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
 * - byKind / yearly / currentMonthCents / previousMonthCents
 *   (Growth Center Phase 1): the same exact sums, cut by the
 *   entry's kind, by calendar year, and by this-vs-last month.
 *   Nothing here changes the original totals — they are computed
 *   from the same loop over the same rows.
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
  const kindMap = new Map<RevenueKind, KindTotal>();
  const yearMap = new Map<number, YearTotal>();
  for (const kind of REVENUE_KINDS) {
    kindMap.set(kind, {
      kind,
      totalCents: 0,
      pendingCents: 0,
      paidCents: 0,
      count: 0,
    });
  }
  const currentMonthKey = monthKey(now, 0);
  const previousMonthKey = monthKey(now, 1);
  let currentMonthCents = 0;
  let previousMonthCents = 0;

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

    const kind = kindMap.get(entry.kind ?? "other") as KindTotal;
    kind.totalCents += entry.amount_cents;
    if (entry.status === "pending") kind.pendingCents += entry.amount_cents;
    else kind.paidCents += entry.amount_cents;
    kind.count += 1;

    const year = Number(entry.earned_date.slice(0, 4));
    const yearTotal = yearMap.get(year) ?? {
      year,
      totalCents: 0,
      paidCents: 0,
      pendingCents: 0,
    };
    yearTotal.totalCents += entry.amount_cents;
    if (entry.status === "pending") yearTotal.pendingCents += entry.amount_cents;
    else yearTotal.paidCents += entry.amount_cents;
    yearMap.set(year, yearTotal);

    const entryMonth = entry.earned_date.slice(0, 7);
    if (entryMonth === currentMonthKey) currentMonthCents += entry.amount_cents;
    else if (entryMonth === previousMonthKey) {
      previousMonthCents += entry.amount_cents;
    }
  }

  const byBrand = [...brandMap.values()].sort(
    (a, b) =>
      b.totalCents - a.totalCents || a.brandName.localeCompare(b.brandName)
  );
  const monthly = monthKeys.map((key) => monthMap.get(key) as MonthTotal);
  const byKind = REVENUE_KINDS.map((kind) => kindMap.get(kind) as KindTotal);
  const yearly = [...yearMap.values()].sort((a, b) => b.year - a.year);

  return {
    totalEarnedCents,
    pendingCents,
    receivedCents,
    byBrand,
    monthly,
    byKind,
    yearly,
    currentMonthCents,
    previousMonthCents,
  };
}

// ============================================================================
// ESTIMATED PLATFORM EARNINGS — a separate world from recorded earnings
// ============================================================================
//
// Estimates live in their own table (public.revenue_estimates) and
// are summed ONLY by computeEstimateSummary below. computeSummary
// above never sees an estimate row — its input type has no estimate
// shape — so no code path can add an estimate into a recorded
// total. This separation is the owner's binding doctrine: an
// estimate is not money received, and the two are never combined
// into one figure anywhere in the product.
//
// An estimate row says: "platform X's monetization for month Y is
// estimated at Z" — either typed by the creator ('creator_entered')
// or, in a future phase, reported by a platform integration
// ('platform_reported'). The basis travels with every total so the
// display can always say where the number came from.

export type EstimateBasis = "creator_entered" | "platform_reported";

export type RevenueEstimateLike = {
  platform: string;
  amount_cents: number;
  /** 'YYYY-MM-DD', always the first of the month the estimate
   *  is about. */
  period_month: string;
  basis: EstimateBasis;
};

export type EstimatePlatformTotal = {
  platform: string;
  totalCents: number;
  count: number;
};

export type EstimateMonthTotal = {
  /** 'YYYY-MM' */
  month: string;
  totalCents: number;
};

export type EstimateSummary = {
  /** The sum of ESTIMATES ONLY. Never add this to any
   *  RevenueSummary figure. */
  totalEstimatedCents: number;
  byPlatform: EstimatePlatformTotal[];
  byMonth: EstimateMonthTotal[];
  /** Totals split by basis, so the display can distinguish what
   *  the creator typed from what a platform reported. */
  creatorEnteredCents: number;
  platformReportedCents: number;
};

export function computeEstimateSummary(
  estimates: RevenueEstimateLike[]
): EstimateSummary {
  let totalEstimatedCents = 0;
  let creatorEnteredCents = 0;
  let platformReportedCents = 0;
  const platformMap = new Map<string, EstimatePlatformTotal>();
  const monthMap = new Map<string, number>();

  for (const estimate of estimates) {
    totalEstimatedCents += estimate.amount_cents;
    if (estimate.basis === "platform_reported") {
      platformReportedCents += estimate.amount_cents;
    } else {
      creatorEnteredCents += estimate.amount_cents;
    }

    const platform = platformMap.get(estimate.platform) ?? {
      platform: estimate.platform,
      totalCents: 0,
      count: 0,
    };
    platform.totalCents += estimate.amount_cents;
    platform.count += 1;
    platformMap.set(estimate.platform, platform);

    const month = estimate.period_month.slice(0, 7);
    monthMap.set(month, (monthMap.get(month) ?? 0) + estimate.amount_cents);
  }

  const byPlatform = [...platformMap.values()].sort(
    (a, b) =>
      b.totalCents - a.totalCents || a.platform.localeCompare(b.platform)
  );
  const byMonth = [...monthMap.entries()]
    .map(([month, totalCents]) => ({ month, totalCents }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalEstimatedCents,
    byPlatform,
    byMonth,
    creatorEnteredCents,
    platformReportedCents,
  };
}
