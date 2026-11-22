// Creator Growth Center — the overview shaping, pure and isolated.
//
// HONESTY RULE (binding, owner acceptance standard 2026-11-22):
// every metric here traces to the signed-in creator's OWN stored
// rows — their recorded earnings (lib/revenue/summary.ts), their
// logged posts (lib/posts/summary.ts), their connection rows, their
// account and subscription. Social-platform metrics (followers,
// views, engagement) have NO source in Phase 1, so they are shaped
// as an explicit not-connected state — never as numbers, never as
// zeros dressed as data.
//
// ESTIMATES: the estimate summary is carried in its own field,
// computed by computeEstimateSummary from estimate rows only. It is
// never added to, averaged with, or presented as recorded earnings.
//
// This module does no I/O: the API route feeds it rows, and the
// same code is exercised by scripts/growth-center-fixtures.ts.

import {
  computeSummary,
  computeEstimateSummary,
  type RevenueEntryLike,
  type RevenueEstimateLike,
} from "../revenue/summary";
import {
  computePostingSummary,
  type PostLike,
  type PostingSummary,
} from "../posts/summary";

export type ConnectionLike = {
  platform: string;
  handle: string | null;
  status: string;
};

export type AccountLike = {
  /** From the caller's own public.profiles row. */
  name: string | null;
  email: string | null;
  /** The caller's chosen UltraVestra username, or null — a
   *  username is only ever what the creator picked; one is never
   *  invented or derived here. */
  username: string | null;
  /** The caller's own subscription status ('active', 'trialing',
   *  …) — read from their subscriptions row, the same source the
   *  gate reads. */
  memberStatus: string;
  /** The caller's plan name from public.plans via their
   *  subscription, or null when the subscription names no plan
   *  (e.g. the owner's comp). */
  planName: string | null;
};

export type ConnectionState = {
  platform: string;
  label: string;
  status: string;
  statusLabel: string;
  handle: string | null;
};

export type GrowthCenterSection = {
  id: string;
  number: string;
  title: string;
  /** live = real tools with real data today; partial = some real
   *  surface, some honestly not connected; later_phase = nothing
   *  real to show yet, and the section says so. */
  state: "live" | "partial" | "later_phase";
  stateNote: string;
  links: { label: string; href: string }[];
};

export type GrowthCenterOverview = {
  account: AccountLike;
  earnings: {
    lifetimeCents: number;
    thisMonthCents: number;
    lastMonthCents: number;
    /** Percentage change vs last month, one decimal; null when
     *  last month was zero (no honest baseline to divide by). */
    changePct: number | null;
    pendingCents: number;
    receivedCents: number;
  };
  /** Estimated platform earnings — a SEPARATE figure from a
   *  separate table. Never combine with `earnings`. */
  estimates: {
    totalEstimatedCents: number;
    creatorEnteredCents: number;
    platformReportedCents: number;
  };
  posting: PostingSummary;
  connections: ConnectionState[];
  socialMetrics: {
    state: "not_connected";
    note: string;
  };
  sections: GrowthCenterSection[];
};

export const CONNECTION_PLATFORMS: { platform: string; label: string }[] = [
  { platform: "tiktok", label: "TikTok" },
  { platform: "instagram", label: "Instagram" },
  { platform: "facebook", label: "Facebook / Meta" },
  { platform: "trybe", label: "Trybe" },
];

const STATUS_LABELS: Record<string, string> = {
  not_connected: "Not linked",
  link_only: "Link added — not a data connection",
  pending_approval: "Connection pending platform approval",
  connected: "Connected",
};

export type GrowthCenterInput = {
  account: AccountLike;
  revenueEntries: RevenueEntryLike[];
  estimates: RevenueEstimateLike[];
  posts: PostLike[];
  weeklyGoal: number;
  connections: ConnectionLike[];
};

/**
 * Shape the Growth Center overview. Deterministic: the same rows
 * always produce the same overview.
 */
export function buildOverview(
  input: GrowthCenterInput,
  now: Date = new Date()
): GrowthCenterOverview {
  const revenue = computeSummary(input.revenueEntries, now);
  const estimateSummary = computeEstimateSummary(input.estimates);
  const posting = computePostingSummary(input.posts, input.weeklyGoal, now);

  const changePct =
    revenue.previousMonthCents > 0
      ? Math.round(
          ((revenue.currentMonthCents - revenue.previousMonthCents) /
            revenue.previousMonthCents) *
            1000
        ) / 10
      : null;

  const connectionByPlatform = new Map(
    input.connections.map((c) => [c.platform, c])
  );
  const connections: ConnectionState[] = CONNECTION_PLATFORMS.map(
    ({ platform, label }) => {
      const row = connectionByPlatform.get(platform);
      const status = row?.status ?? "not_connected";
      return {
        platform,
        label,
        status,
        statusLabel: STATUS_LABELS[status] ?? status,
        handle: row?.handle ?? null,
      };
    }
  );
  const anyConnected = connections.some((c) => c.status === "connected");

  const sections: GrowthCenterSection[] = [
    {
      id: "overview",
      number: "01",
      title: "Overview",
      state: "live",
      stateNote:
        "Your account, recorded earnings, posting consistency, and connection states — every figure from your own records.",
      links: [{ label: "Command Center", href: "/command-center" }],
    },
    {
      id: "analytics",
      number: "02",
      title: "Analytics & Intelligence",
      state: "partial",
      stateNote:
        "Trend Radar reports directory activity today. Platform analytics (followers, views, engagement) arrive when your TikTok and Meta connections go live — nothing is estimated in their place.",
      links: [
        { label: "Trend Radar", href: "/trend-radar" },
        { label: "Connections", href: "/growth-center/connections" },
      ],
    },
    {
      id: "content-studio",
      number: "03",
      title: "Content Studio",
      state: "live",
      stateNote:
        "Plan what you will post in the Content Planner — your own schedule and ideas, kept separate from what you have actually published — and build a complete selling script from your own product facts in the Script Studio.",
      links: [
        { label: "Content Planner", href: "/growth-center/planner" },
        { label: "Script Studio", href: "/studio" },
      ],
    },
    {
      id: "earnings",
      number: "04",
      title: "Earnings & Business",
      state: "live",
      stateNote:
        "Your recorded earnings ledger, partnership briefs, and proposals. Recorded money and estimated platform earnings are kept separate — always.",
      links: [
        { label: "Revenue Tracker", href: "/revenue" },
        { label: "Campaign Match", href: "/campaign-match" },
        { label: "Proposals", href: "/proposals" },
      ],
    },
    {
      id: "goals",
      number: "05",
      title: "Goals & Growth",
      state: "live",
      stateNote:
        "Your Growth Map plan, the Posting Tracker — the posts you log, your streak, and your weekly goal — and your Creator Goals, measured from your own records or from figures you enter and labeled as such.",
      links: [
        { label: "Growth Map", href: "/growth-map" },
        { label: "Posting Tracker", href: "/growth-center/posting" },
        { label: "Creator Goals", href: "/growth-center/goals" },
      ],
    },
    {
      id: "rankings",
      number: "06",
      title: "Creator Rankings",
      state: "later_phase",
      stateNote:
        "Arrives in a later phase. Rankings need real creator data collected with creators' permission — UltraVestra will not publish rankings it cannot source.",
      links: [],
    },
    {
      id: "advisor",
      number: "07",
      title: "AI Creator Advisor",
      state: "later_phase",
      stateNote:
        "A personalized advisor arrives in a later phase, once your real performance data exists to advise from. Today, the Creator Lab tests a script against five simulated buyers.",
      links: [{ label: "Creator Lab", href: "/creator-lab" }],
    },
  ];

  return {
    account: input.account,
    earnings: {
      lifetimeCents: revenue.totalEarnedCents,
      thisMonthCents: revenue.currentMonthCents,
      lastMonthCents: revenue.previousMonthCents,
      changePct,
      pendingCents: revenue.pendingCents,
      receivedCents: revenue.receivedCents,
    },
    estimates: {
      totalEstimatedCents: estimateSummary.totalEstimatedCents,
      creatorEnteredCents: estimateSummary.creatorEnteredCents,
      platformReportedCents: estimateSummary.platformReportedCents,
    },
    posting,
    connections,
    socialMetrics: {
      state: "not_connected",
      note: anyConnected
        ? "Platform metrics appear here as your connections sync."
        : "Followers, views, and engagement appear here when a platform connection is live. No platform is connected yet, so there is nothing honest to show.",
    },
    sections,
  };
}
