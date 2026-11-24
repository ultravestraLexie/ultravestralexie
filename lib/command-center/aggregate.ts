// UltraVestra Command Center — the card shaping, pure and isolated.
//
// HONESTY RULE (binding): every number on these cards comes from the
// signed-in creator's OWN stored rows (their revenue entries, their
// alert watermark, their growth items, their proposals, their
// Passport entries, their partnership briefs) or from the public
// directory's published-brand count. Nothing is estimated,
// projected, or invented. A feature that stores nothing for the
// caller shows a true zero or an honest "nothing yet" line — the
// Creator Lab card carries no number at all, because the Lab keeps
// no history to count.
//
// MONEY: the revenue figures come from lib/revenue/summary.ts's
// computeSummary over the caller's exact rows — the same math the
// Revenue Tracker itself shows — and are formatted from integer
// cents by the shared formatMoney. This module never re-derives a
// total of its own.
//
// This module does no I/O on purpose: the API route feeds it the
// rows it fetched, and the exact same code is exercised by the
// fixture run (scripts/command-center-fixtures.ts), so the API and
// the test share one brain.

import {
  computeSummary,
  type RevenueEntryLike,
} from "../revenue/summary";
import { formatMoney } from "../proposals/compose";

export type CommandCenterCard = {
  key: string;
  title: string;
  href: string;
  primary: string;
  secondary: string;
};

export type GrowthItemLike = {
  /** 'objective' | 'experiment' | 'gap' (see app/api/growth-map). */
  kind: string;
  /** Per-kind status: objective active|achieved|archived,
   *  experiment planned|running|done, gap open|addressed. */
  status: string;
};

export type ProposalLike = {
  /** 'draft' | 'sent' | 'accepted' | 'declined'. */
  status: string;
};

export type CommandCenterInput = {
  /** The caller's revenue rows, shaped as lib/revenue/summary
   *  expects ({brand_name, amount_cents, status, earned_date}). */
  revenueEntries: RevenueEntryLike[];
  /** computeFeed's totalMatched for the caller's prefs + watermark;
   *  0 when the caller has no alert prefs row. */
  alertTotalMatched: number;
  /** The caller's alert watermark (alert_prefs.last_seen_at), or
   *  null when they have no prefs row — alerts not set up yet. */
  alertWatermark: string | null;
  growthItems: GrowthItemLike[];
  proposals: ProposalLike[];
  passportCount: number;
  briefsCount: number;
  /** Published brands in the directory (directory-wide, not the
   *  caller's — the directory is shared platform data). */
  directoryBrandCount: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** ISO timestamp → 'November 20, 2026', from the UTC fields so the
 *  string never depends on the reader's timezone. An unparseable
 *  value is returned as-is rather than disguised. */
function formatWatermarkDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Shape the Command Center cards. FIXED order: revenue, alerts,
 * growth, proposals, passport, matches, lab, directory. Every
 * primary/secondary string is built only from the inputs — the same
 * inputs always produce the same cards.
 */
export function buildCards(input: CommandCenterInput): CommandCenterCard[] {
  // Revenue — totals from the Revenue Tracker's own summary math.
  const revenue = computeSummary(input.revenueEntries);

  // Growth — the Growth Map's real kinds and statuses: objectives
  // are 'active' until achieved/archived; experiments are 'running'
  // and then 'done' (completed).
  const activeObjectives = input.growthItems.filter(
    (item) => item.kind === "objective" && item.status === "active"
  ).length;
  const experimentsRunning = input.growthItems.filter(
    (item) => item.kind === "experiment" && item.status === "running"
  ).length;
  const experimentsCompleted = input.growthItems.filter(
    (item) => item.kind === "experiment" && item.status === "done"
  ).length;

  // Proposals — the creator-controlled statuses.
  const proposalsSent = input.proposals.filter(
    (p) => p.status === "sent"
  ).length;
  const proposalsDraft = input.proposals.filter(
    (p) => p.status === "draft"
  ).length;
  const proposalsAccepted = input.proposals.filter(
    (p) => p.status === "accepted"
  ).length;
  const proposalsDeclined = input.proposals.filter(
    (p) => p.status === "declined"
  ).length;

  return [
    {
      key: "revenue",
      title: "Revenue Tracker",
      href: "/revenue",
      primary: formatMoney(revenue.pendingCents),
      secondary: `received ${formatMoney(revenue.receivedCents)}`,
    },
    {
      key: "alerts",
      title: "Opportunity Alerts",
      href: "/alerts",
      primary: `${input.alertTotalMatched} new`,
      secondary:
        input.alertWatermark === null
          ? "not set up yet"
          : `since ${formatWatermarkDate(input.alertWatermark)}`,
    },
    {
      key: "growth",
      title: "Creator Growth Map",
      href: "/growth-map",
      primary: `${activeObjectives} active objectives`,
      secondary: `${experimentsRunning} experiments running · ${experimentsCompleted} completed`,
    },
    {
      key: "proposals",
      title: "Proposal Builder",
      href: "/proposals",
      primary: `${proposalsSent} sent`,
      secondary: `${proposalsDraft} draft · ${proposalsAccepted} accepted · ${proposalsDeclined} declined`,
    },
    {
      key: "passport",
      title: "Reputation Passport",
      href: "/me#passport",
      primary: `${input.passportCount} entries`,
      secondary: "your proof library",
    },
    {
      key: "matches",
      title: "Campaign Match",
      href: "/campaign-match",
      primary: `${input.briefsCount} briefs`,
      secondary: "partnership briefs generated",
    },
    {
      key: "lab",
      title: "Creator Lab",
      href: "/creator-lab",
      // No number: the Lab stores nothing, so there is nothing true
      // to count. The card is an invitation, not a statistic.
      primary: "Diagnose a video",
      secondary: "the Lab keeps no history — every run is fresh",
    },
    {
      key: "directory",
      title: "Brand Directory",
      href: "/brands",
      primary: `${input.directoryBrandCount} brands`,
      secondary: "in the directory",
    },
  ];
}
