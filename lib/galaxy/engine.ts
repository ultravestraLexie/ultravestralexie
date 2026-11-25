import {
  ACTIVE_STAGES,
  daysAgo,
  dealPaidCents,
  fmtMoney,
  isOverdue,
  monthKeyOf,
  owedCents,
  overdueCents,
  paidInMonth,
  todayKey,
  type GalaxyDeal,
  type GalaxyIncome,
} from "./core";

/* THE ULTRA VESTRA GROWTH ENGINE (owner direction pasted
 * 2026-11-24 ~19:51 CT, order "Build everything" ~19:52 CT).
 *
 * The six stages of the Home loop — DISCOVERY → COLLABORATION →
 * MARKETING → CUSTOMERS → REVENUE → RETENTION — are ONE connected
 * engine, not six disconnected features: every stage below is
 * computed from the SAME records (the creator's deals, posts,
 * income and saved brands), so a paid deal moves Customers,
 * Revenue and Retention together, exactly the way the owner's
 * cleaning-business example flows through all six.
 *
 * The seventh layer, ULTRA VESTRA BRAIN, reads across all six
 * stages and returns the next best actions: money sitting overdue,
 * customers due a follow-up, partnerships gone quiet, saved brands
 * never pitched, a week with no content.
 *
 * Honesty rules (the platform standard): every number here comes
 * from the creator's own rows. A stage with nothing behind it says
 * so plainly — no invented counts, no sample data. Follow-ups are
 * COMPUTED from paid deals; nothing is sent automatically. */

export type EngineStageId =
  | "discovery"
  | "collaboration"
  | "marketing"
  | "customers"
  | "revenue"
  | "retention";

export type EngineStage = {
  id: EngineStageId;
  name: string;
  verb: string;
  metric: string;
  detail: string;
  href: string;
  state: "strong" | "going" | "start";
};

export type EngineCustomer = {
  brandName: string;
  deals: number;
  totalPaidCents: number;
  lastPaidOn: string | null;
  daysSincePaid: number | null;
  repeat: boolean;
  activeNow: boolean;
  followUpDue: boolean;
};

export type BrainRec = {
  stage: EngineStageId | "brain";
  title: string;
  why: string;
  href: string;
  cta: string;
};

export type GrowthEngine = {
  stages: EngineStage[];
  customers: EngineCustomer[];
  repeatRatePct: number | null;
  followUps: EngineCustomer[];
  brain: BrainRec[];
  collectedCents: number;
  owedCents: number;
  overdueCents: number;
  paidThisMonthCents: number;
  activeDeals: number;
};

export type GrowthEngineInput = {
  deals: GalaxyDeal[];
  income: GalaxyIncome[];
  publishedPosts: number;
  postsThisWeek: number;
  scriptCount: number;
  savedCount: number;
  directoryCount: number;
  neglectedCount: number;
  now?: Date;
};

/** Customers are derived, never stored: a brand becomes a customer
 *  when one of its deals is PAID. Repeat = more than one paid deal.
 *  A follow-up is due when the last payment is 30+ days old and no
 *  deal with that brand is active right now. */
export function engineCustomers(deals: GalaxyDeal[], now = new Date()): EngineCustomer[] {
  const byBrand = new Map<string, EngineCustomer>();
  for (const d of deals) {
    const key = d.brandName.trim().toLowerCase();
    if (!key) continue;
    let c = byBrand.get(key);
    if (!c) {
      c = {
        brandName: d.brandName,
        deals: 0,
        totalPaidCents: 0,
        lastPaidOn: null,
        daysSincePaid: null,
        repeat: false,
        activeNow: false,
        followUpDue: false,
      };
      byBrand.set(key, c);
    }
    if (ACTIVE_STAGES.includes(d.stage)) c.activeNow = true;
    if (d.stage === "paid") {
      c.deals += 1;
      c.totalPaidCents += dealPaidCents(d);
      if (d.paidOn && (!c.lastPaidOn || d.paidOn > c.lastPaidOn)) c.lastPaidOn = d.paidOn;
    }
  }
  const out = [...byBrand.values()].filter((c) => c.deals > 0);
  for (const c of out) {
    c.repeat = c.deals > 1;
    c.daysSincePaid = c.lastPaidOn ? daysAgo(c.lastPaidOn, now) : null;
    c.followUpDue = !c.activeNow && c.daysSincePaid !== null && c.daysSincePaid >= 30;
  }
  return out.sort((a, b) => b.totalPaidCents - a.totalPaidCents);
}

export function buildGrowthEngine(input: GrowthEngineInput): GrowthEngine {
  const now = input.now ?? new Date();
  const { deals } = input;
  const customers = engineCustomers(deals, now);
  const followUps = customers.filter((c) => c.followUpDue);
  const repeatRatePct =
    customers.length === 0
      ? null
      : Math.round((customers.filter((c) => c.repeat).length / customers.length) * 100);
  const collected = deals
    .filter((d) => d.stage === "paid")
    .reduce((t, d) => t + dealPaidCents(d), 0);
  const owed = owedCents(deals);
  const overdue = overdueCents(deals, now);
  const month = paidInMonth(deals, input.income, monthKeyOf(todayKey(now)));
  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.stage));
  const byStage = (s: string) => active.filter((d) => d.stage === s).length;
  const collabBits = [
    byStage("pitched") ? `${byStage("pitched")} pitched` : "",
    byStage("negotiating") ? `${byStage("negotiating")} negotiating` : "",
    byStage("contracted") ? `${byStage("contracted")} contracted` : "",
    byStage("delivering") ? `${byStage("delivering")} delivering` : "",
  ].filter(Boolean);

  const stages: EngineStage[] = [
    {
      id: "discovery",
      name: "Discovery",
      verb: "Get discovered",
      metric:
        input.savedCount > 0
          ? `${input.savedCount} brands saved`
          : `${input.directoryCount.toLocaleString()} brands listed`,
      detail:
        input.neglectedCount > 0
          ? `${input.neglectedCount} saved brands have no deal yet — pitch one.`
          : "Find qualified opportunities in the directory.",
      href: "/brands",
      state: input.savedCount > 0 ? "going" : "start",
    },
    {
      id: "collaboration",
      name: "Collaboration",
      verb: "Build partnerships",
      metric: active.length > 0 ? `${active.length} active partnerships` : "No active deals",
      detail: collabBits.length ? collabBits.join(" · ") : "Pitch a brand to start your first partnership.",
      href: "/deals",
      state: active.length > 0 ? "going" : "start",
    },
    {
      id: "marketing",
      name: "Marketing",
      verb: "Create demand",
      metric: `${input.postsThisWeek} posts this week`,
      detail: `${input.publishedPosts} published · ${input.scriptCount} scripts read in Studio.`,
      href: "/studio",
      state: input.postsThisWeek > 0 ? "going" : "start",
    },
    {
      id: "customers",
      name: "Customers",
      verb: "Convert interest into customers",
      metric:
        customers.length > 0
          ? `${customers.length} paying customer${customers.length === 1 ? "" : "s"}`
          : "No customers yet",
      detail:
        customers.length > 0
          ? "Brands that have paid you — your real customer list."
          : "Your first paid deal creates your first customer.",
      href: "/customers",
      state: customers.length > 0 ? "strong" : "start",
    },
    {
      id: "revenue",
      name: "Revenue",
      verb: "Generate income",
      metric: fmtMoney(collected),
      detail: `${fmtMoney(month)} this month · ${fmtMoney(owed)} owed${overdue > 0 ? ` · ${fmtMoney(overdue)} overdue` : ""}.`,
      href: "/me",
      state: collected > 0 ? "strong" : "start",
    },
    {
      id: "retention",
      name: "Retention",
      verb: "Keep customers coming back",
      metric:
        followUps.length > 0
          ? `${followUps.length} follow-up${followUps.length === 1 ? "" : "s"} due`
          : repeatRatePct !== null
            ? `${repeatRatePct}% repeat customers`
            : "No customers yet",
      detail:
        followUps.length > 0
          ? "Past customers with no active deal — pitch the next one."
          : "Repeat customers and referrals grow from here.",
      href: "/retention",
      state: followUps.length > 0 ? "going" : customers.length > 0 ? "strong" : "start",
    },
  ];

  /* ---------------- ULTRA VESTRA BRAIN ----------------
   * Reads across the stages, money first (the owner's rule:
   * secure profit always). Capped at four — the next best
   * actions, not a feed. */
  const brain: BrainRec[] = [];
  const overdueDeals = deals.filter((d) => isOverdue(d, now));
  if (overdue > 0) {
    brain.push({
      stage: "revenue",
      title: `Collect ${fmtMoney(overdue)} overdue`,
      why: `${overdueDeals.length} invoice${overdueDeals.length === 1 ? "" : "s"} past due — money you earned that is not in hand yet.`,
      href: "/deals",
      cta: "Open Deals",
    });
  }
  if (followUps.length > 0) {
    const f = followUps[0];
    brain.push({
      stage: "retention",
      title: `Win back ${f.brandName}`,
      why: `Last paid ${f.daysSincePaid} days ago, with no active deal. A follow-up pitch costs nothing and past customers convert best.`,
      href: "/retention",
      cta: "See follow-ups",
    });
  }
  const idle = active
    .filter((d) => daysAgo(d.lastContact, now) >= 7)
    .sort((a, b) => daysAgo(b.lastContact, now) - daysAgo(a.lastContact, now))[0];
  if (idle) {
    brain.push({
      stage: "collaboration",
      title: `${idle.brandName} has gone quiet`,
      why: `No contact for ${daysAgo(idle.lastContact, now)} days while the deal sits at ${idle.stage}. A short check-in keeps it alive.`,
      href: "/deals",
      cta: "Open Deals",
    });
  }
  if (input.neglectedCount > 0) {
    brain.push({
      stage: "discovery",
      title: `${input.neglectedCount} saved brands never pitched`,
      why: "You saved them for a reason. One pitch turns a saved brand into an active partnership.",
      href: "/brands",
      cta: "Open Brands",
    });
  }
  if (brain.length < 4 && input.postsThisWeek === 0 && customers.length + active.length > 0) {
    brain.push({
      stage: "marketing",
      title: "Nothing posted this week",
      why: "Attention feeds every stage below it. One post restarts the engine.",
      href: "/studio",
      cta: "Open Studio",
    });
  }
  if (brain.length === 0) {
    brain.push({
      stage: "brain",
      title: "Your engine is clear",
      why: "No overdue money, no quiet deals, no follow-ups due. Find the next opportunity.",
      href: "/brands",
      cta: "Find opportunities",
    });
  }

  return {
    stages,
    customers,
    repeatRatePct,
    followUps,
    brain: brain.slice(0, 4),
    collectedCents: collected,
    owedCents: owed,
    overdueCents: overdue,
    paidThisMonthCents: month,
    activeDeals: active.length,
  };
}
