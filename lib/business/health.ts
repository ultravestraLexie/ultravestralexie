// Creator Business Health — the math, pure and isolated.
//
// HONESTY RULES (binding):
// - Every figure here is computed from the creator's own RECORDED
//   revenue entries (public.revenue_entries) and their own deal
//   pipeline rows (public.creator_deals). Estimated earnings
//   (public.revenue_estimates) are never an input — this module's
//   input types have no estimate shape, so no code path can add
//   an estimate into a health figure.
// - Recorded-money figures (totals, outstanding, received, monthly
//   trend, by-brand) are NOT re-derived here: they come from
//   lib/revenue/summary.ts's computeSummary, the same function the
//   Revenue Tracker and the Growth Center hub use, so Business
//   Health can never disagree with the ledger it reads.
// - Deal figures are the creator's own tracking: a deal in stage
//   'paid' is a stage the creator set, not a verified payment.
//   Pipeline money is labeled "tracked by you" wherever shown.
// - revenue_entries carries NO platform column (verified against
//   the table definition): recorded revenue cannot be cut by
//   platform today. byPlatform therefore groups only entries that
//   carry a platform value — with real rows that is none of them,
//   so it returns an empty list and topPlatformSharePct is 0, and
//   the page says platform is not recorded yet instead of
//   inventing a split.
//
// Money is integer cents end to end. Shares are percentages
// rounded to one decimal (Math.round(x * 10) / 10) — display
// precision, stated here so fixtures can assert exact values.

import {
  computeSummary,
  type MonthTotal,
  type RevenueEntryLike,
} from "../revenue/summary";

export const DEAL_STAGES = [
  "lead",
  "applied",
  "negotiating",
  "active",
  "delivered",
  "invoiced",
  "paid",
  "closed",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

/** Stages that still count as an open deal (everything before a
 *  finished outcome). */
export const OPEN_STAGES: DealStage[] = [
  "lead",
  "applied",
  "negotiating",
  "active",
  "delivered",
  "invoiced",
];

export type DealLike = {
  brand_name: string;
  platform: string | null;
  stage: DealStage;
  compensation_cents: number | null;
  deadline: string | null;
};

/** A recorded entry as Business Health sees it: the Revenue
 *  Tracker's shape, plus an optional platform that real rows do
 *  not carry yet (see header). */
export type HealthEntryLike = RevenueEntryLike & {
  platform?: string | null;
};

export type ShareTotal = {
  name: string;
  cents: number;
  sharePct: number;
};

export type StageTotal = {
  stage: DealStage;
  count: number;
  compensationCents: number;
};

export type DealPipeline = {
  /** One row per stage, in DEAL_STAGES order, zeros included. */
  byStage: StageTotal[];
  /** Deals in OPEN_STAGES. */
  openDeals: number;
  /** Sum of recorded compensation over open deals (NULL = 0). */
  openValueCents: number;
  paidDeals: number;
  closedDeals: number;
  /** paid / (paid + closed) as a percentage, or null when no deal
   *  has reached a finished outcome yet. */
  conversionPct: number | null;
};

export type BusinessHealth = {
  totalRecordedCents: number;
  /** Recorded entries still owed to the creator (status pending). */
  outstandingCents: number;
  /** Recorded entries the creator marked received (status paid). */
  receivedCents: number;
  /** Recorded revenue cut by platform — empty until revenue
   *  entries carry a platform (see header). Shares are of total
   *  recorded cents. */
  byPlatform: ShareTotal[];
  /** Recorded revenue cut by brand_name, largest first. Shares
   *  are of total recorded cents. */
  byBrand: ShareTotal[];
  /** Mean recorded amount over kind='campaign_fee' entries,
   *  rounded to integer cents; null when there are none. */
  avgPerCampaignCents: number | null;
  /** The Revenue Tracker's 6-month trend, reused as-is. */
  monthlyTrend: MonthTotal[];
  /** Largest single platform share of recorded revenue; 0 when
   *  no platform data exists. */
  topPlatformSharePct: number;
  /** Largest single brand share of recorded revenue; 0 when
   *  there is no recorded revenue. */
  topBrandSharePct: number;
  pipeline: DealPipeline;
};

function sharePct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/** Group the caller's deals by stage, with counts and recorded
 *  compensation totals. Pure; used by both the deals API (the
 *  pipeline board) and computeHealth (the pipeline block). */
export function summarizePipeline(deals: DealLike[]): DealPipeline {
  const byStage: StageTotal[] = DEAL_STAGES.map((stage) => ({
    stage,
    count: 0,
    compensationCents: 0,
  }));
  const stageMap = new Map(byStage.map((s) => [s.stage, s]));

  let openDeals = 0;
  let openValueCents = 0;
  let paidDeals = 0;
  let closedDeals = 0;

  for (const deal of deals) {
    const bucket = stageMap.get(deal.stage);
    if (bucket) {
      bucket.count += 1;
      bucket.compensationCents += deal.compensation_cents ?? 0;
    }
    if ((OPEN_STAGES as string[]).includes(deal.stage)) {
      openDeals += 1;
      openValueCents += deal.compensation_cents ?? 0;
    } else if (deal.stage === "paid") {
      paidDeals += 1;
    } else if (deal.stage === "closed") {
      closedDeals += 1;
    }
  }

  const finished = paidDeals + closedDeals;
  return {
    byStage,
    openDeals,
    openValueCents,
    paidDeals,
    closedDeals,
    conversionPct:
      finished === 0 ? null : Math.round((paidDeals / finished) * 1000) / 10,
  };
}

export function computeHealth(
  entries: HealthEntryLike[],
  deals: DealLike[],
  today: Date = new Date()
): BusinessHealth {
  // Recorded-money figures come from the Revenue Tracker's own
  // summary — the same rows, the same loop, the same numbers.
  const summary = computeSummary(entries, today);
  const total = summary.totalEarnedCents;

  // By platform: only entries that carry a platform value can be
  // grouped. Real revenue_entries rows have none (no such column),
  // so this is an honest empty list today — never an invented one.
  const platformMap = new Map<string, number>();
  for (const entry of entries) {
    if (entry.platform) {
      platformMap.set(
        entry.platform,
        (platformMap.get(entry.platform) ?? 0) + entry.amount_cents
      );
    }
  }
  const byPlatform: ShareTotal[] = [...platformMap.entries()]
    .map(([name, cents]) => ({ name, cents, sharePct: sharePct(cents, total) }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name));

  const byBrand: ShareTotal[] = summary.byBrand.map((b) => ({
    name: b.brandName,
    cents: b.totalCents,
    sharePct: sharePct(b.totalCents, total),
  }));

  const campaignFees = entries.filter((e) => (e.kind ?? "other") === "campaign_fee");
  const avgPerCampaignCents =
    campaignFees.length === 0
      ? null
      : Math.round(
          campaignFees.reduce((sum, e) => sum + e.amount_cents, 0) /
            campaignFees.length
        );

  return {
    totalRecordedCents: total,
    outstandingCents: summary.pendingCents,
    receivedCents: summary.receivedCents,
    byPlatform,
    byBrand,
    avgPerCampaignCents,
    monthlyTrend: summary.monthly,
    topPlatformSharePct: byPlatform.length ? byPlatform[0].sharePct : 0,
    topBrandSharePct: byBrand.length ? byBrand[0].sharePct : 0,
    pipeline: summarizePipeline(deals),
  };
}
