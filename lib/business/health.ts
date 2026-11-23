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
// - revenue_entries gained a platform column in Build 12 (the
//   owner's revenue-intelligence requirement): byPlatform groups
//   the entries that carry one. Entries recorded without a
//   platform stay out of the split — the page says so instead of
//   inventing one. bySource groups the same rows by kind, with
//   the owner's labels (brand_payment reads "Brand sponsorships").
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
  // Build 12 payment fields — optional so existing fixtures and
  // callers that predate them keep compiling; absent = not
  // recorded, exactly like a NULL column.
  invoice_sent_date?: string | null;
  payment_terms?: string | null;
  payment_due_date?: string | null;
  payment_received_date?: string | null;
  amount_received_cents?: number | null;
};

/* ------------------------------------------------------------------
 * Deal payment intelligence (Build 12, owner's full spec).
 *
 * One pure computation shared by the Deals API, the follow-up
 * queue, brand payment history, and Business Health — so every
 * surface agrees on who owes what.
 *
 * Rules (binding):
 * - A deal is INVOICED when an invoice-sent date is recorded or
 *   the creator moved it to the invoiced stage.
 * - RECEIVED money is only what the creator recorded: the
 *   amount-received field governs; a received DATE with no amount
 *   means the full deal amount arrived. A promise is never money.
 * - The effective DUE date is the recorded due date, or one
 *   calculated from the invoice date + payment terms — always
 *   flagged `dueDateCalculated` so the UI can say so.
 * - OUTSTANDING = invoiced, not fully paid, not closed.
 *   OVERDUE = outstanding and the effective due date has passed.
 * ------------------------------------------------------------------ */

export const PAYMENT_TERMS_DAYS: Record<string, number> = {
  due_on_receipt: 0,
  net_7: 7,
  net_14: 14,
  net_30: 30,
  net_45: 45,
  net_60: 60,
};

export function daysBetweenDates(fromDate: string, toDate: string): number {
  const ms =
    new Date(`${toDate}T00:00:00Z`).getTime() -
    new Date(`${fromDate}T00:00:00Z`).getTime();
  return Math.floor(ms / 86_400_000);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DealPayment = {
  invoiced: boolean;
  /** Creator-confirmed money actually received, in cents. */
  receivedCents: number;
  /** Deal amount minus received; null when no amount is recorded. */
  remainingCents: number | null;
  fullyPaid: boolean;
  outstanding: boolean;
  overdue: boolean;
  /** Effective due date (recorded, or calculated from terms). */
  dueDate: string | null;
  dueDateCalculated: boolean;
  /** Days from the invoice date to today, when outstanding. */
  daysOutstanding: number | null;
};

export function computeDealPayment(
  deal: DealLike,
  today: Date = new Date()
): DealPayment {
  const todayStr = today.toISOString().slice(0, 10);
  const amount = deal.compensation_cents ?? null;
  const invoiceDate = deal.invoice_sent_date ?? null;
  const receivedDate = deal.payment_received_date ?? null;

  const invoiced = invoiceDate !== null || deal.stage === "invoiced";

  let receivedCents = 0;
  if (deal.amount_received_cents != null) {
    receivedCents = deal.amount_received_cents;
  } else if (receivedDate !== null && amount !== null) {
    receivedCents = amount;
  }
  const remainingCents =
    amount === null ? null : Math.max(0, amount - receivedCents);
  const fullyPaid =
    amount !== null
      ? receivedCents >= amount
      : receivedDate !== null || deal.amount_received_cents != null;

  let dueDate = deal.payment_due_date ?? null;
  let dueDateCalculated = false;
  if (dueDate === null && invoiceDate !== null && deal.payment_terms) {
    const days = PAYMENT_TERMS_DAYS[deal.payment_terms];
    if (days !== undefined) {
      dueDate = addDays(invoiceDate, days);
      dueDateCalculated = true;
    }
  }

  const outstanding = invoiced && !fullyPaid && deal.stage !== "closed";
  const overdue = outstanding && dueDate !== null && dueDate < todayStr;
  const daysOutstanding =
    outstanding && invoiceDate !== null
      ? Math.max(0, daysBetweenDates(invoiceDate, todayStr))
      : null;

  return {
    invoiced,
    receivedCents,
    remainingCents,
    fullyPaid,
    outstanding,
    overdue,
    dueDate,
    dueDateCalculated,
    daysOutstanding,
  };
}

/** The five money states Business Health must distinguish
 *  (owner's spec): contracted / invoiced / outstanding / overdue /
 *  collected — all from the creator's own deal records. */
export type Receivables = {
  contractedCents: number;
  invoicedCents: number;
  outstandingCents: number;
  overdueCents: number;
  collectedCents: number;
};

const CONTRACTED_STAGES: DealStage[] = ["active", "delivered", "invoiced", "paid"];

export function computeReceivables(
  deals: DealLike[],
  today: Date = new Date()
): Receivables {
  let contracted = 0;
  let invoicedTotal = 0;
  let outstanding = 0;
  let overdue = 0;
  let collected = 0;
  for (const deal of deals) {
    const p = computeDealPayment(deal, today);
    if (CONTRACTED_STAGES.includes(deal.stage)) {
      contracted += deal.compensation_cents ?? 0;
    }
    if (p.invoiced || deal.stage === "paid") {
      invoicedTotal += deal.compensation_cents ?? 0;
    }
    if (p.outstanding) {
      outstanding += p.remainingCents ?? deal.compensation_cents ?? 0;
      if (p.overdue) {
        overdue += p.remainingCents ?? deal.compensation_cents ?? 0;
      }
    }
    collected += p.receivedCents;
  }
  return {
    contractedCents: contracted,
    invoicedCents: invoicedTotal,
    outstandingCents: outstanding,
    overdueCents: overdue,
    collectedCents: collected,
  };
}

/** Brand payment reliability (owner's spec): per brand — total
 *  deals, late payments, average payment delay, outstanding
 *  balance, and on-time reliability over the payments that can be
 *  measured (a due date and an outcome). */
export type BrandPaymentHistory = {
  brandName: string;
  totalDeals: number;
  latePayments: number;
  /** Mean days late over deals paid after their due date; null
   *  when no deal was ever paid late. */
  avgDelayDays: number | null;
  outstandingCents: number;
  /** On-time share of measurable payments, 0–100 one decimal;
   *  null when nothing can be measured yet. */
  reliabilityPct: number | null;
  measurablePayments: number;
};

export function summarizeBrandPayments(
  deals: DealLike[],
  today: Date = new Date()
): BrandPaymentHistory[] {
  type Acc = {
    total: number;
    late: number;
    delaySum: number;
    delayCount: number;
    outstanding: number;
    onTime: number;
    measurable: number;
  };
  const map = new Map<string, Acc>();
  for (const deal of deals) {
    const key = deal.brand_name;
    const acc =
      map.get(key) ??
      ({ total: 0, late: 0, delaySum: 0, delayCount: 0, outstanding: 0, onTime: 0, measurable: 0 } as Acc);
    acc.total += 1;
    const p = computeDealPayment(deal, today);
    if (p.outstanding) {
      acc.outstanding += p.remainingCents ?? deal.compensation_cents ?? 0;
      if (p.overdue) acc.late += 1;
    }
    const receivedDate = deal.payment_received_date ?? null;
    if (p.fullyPaid && p.dueDate !== null) {
      // Measurable: we know when it was due and that it completed.
      // Completion date: the received date when recorded, else the
      // deal counts as on-time only if it is not currently overdue
      // (it finished, so it finished by definition before today —
      // without a date we cannot prove lateness, so it is counted
      // measurable but never late).
      acc.measurable += 1;
      if (receivedDate !== null && receivedDate > p.dueDate) {
        acc.late += 1;
        acc.delaySum += daysBetweenDates(p.dueDate, receivedDate);
        acc.delayCount += 1;
      } else {
        acc.onTime += 1;
      }
    }
    map.set(key, acc);
  }
  return [...map.entries()]
    .map(([brandName, a]) => ({
      brandName,
      totalDeals: a.total,
      latePayments: a.late,
      avgDelayDays:
        a.delayCount === 0 ? null : Math.round((a.delaySum / a.delayCount) * 10) / 10,
      outstandingCents: a.outstanding,
      reliabilityPct:
        a.measurable === 0
          ? null
          : Math.round((a.onTime / a.measurable) * 1000) / 10,
      measurablePayments: a.measurable,
    }))
    .sort(
      (x, y) =>
        y.outstandingCents - x.outstandingCents ||
        y.latePayments - x.latePayments ||
        x.brandName.localeCompare(y.brandName)
    );
}

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
  /** Recorded revenue cut by platform — only entries recorded
   *  with a platform appear (see header). Shares are of total
   *  recorded cents. */
  byPlatform: ShareTotal[];
  /** Recorded revenue cut by income source (the entry kind, with
   *  display labels). Only sources with money appear. Shares are
   *  of total recorded cents. */
  bySource: ShareTotal[];
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
  /** The five deal-money states (Build 12): contracted, invoiced,
   *  outstanding, overdue, collected — from the deal pipeline,
   *  tracked by the creator, kept separate from recorded revenue. */
  receivables: Receivables;
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

  // By source: the same recorded rows grouped by kind, labeled the
  // way the owner named them in the revenue-intelligence
  // requirement. Zero-money sources are omitted.
  const SOURCE_LABELS: Record<string, string> = {
    campaign_fee: "Campaign fees",
    affiliate_commission: "Affiliate commissions",
    brand_payment: "Brand sponsorships",
    platform_payout: "Platform payouts",
    other: "Other income",
  };
  const sourceMap = new Map<string, number>();
  for (const entry of entries) {
    const kind = (entry.kind ?? "other") as string;
    sourceMap.set(kind, (sourceMap.get(kind) ?? 0) + entry.amount_cents);
  }
  const bySource: ShareTotal[] = [...sourceMap.entries()]
    .filter(([, cents]) => cents > 0)
    .map(([kind, cents]) => ({
      name: SOURCE_LABELS[kind] ?? "Other income",
      cents,
      sharePct: sharePct(cents, total),
    }))
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name));

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
    bySource,
    byBrand,
    avgPerCampaignCents,
    monthlyTrend: summary.monthly,
    topPlatformSharePct: byPlatform.length ? byPlatform[0].sharePct : 0,
    topBrandSharePct: byBrand.length ? byBrand[0].sharePct : 0,
    pipeline: summarizePipeline(deals),
    receivables: computeReceivables(deals, today),
  };
}
