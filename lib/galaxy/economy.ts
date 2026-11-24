/* ============================================================================
 * THE CREATOR ECONOMY — pure logic for the Me-section growth layer
 * (the owner's "Ultra Vestra Creator Economy" prototype, 2026-11-24).
 *
 * Six frames were ported into Me; two were skipped as duplicates
 * (Passport — the live Passport already exists; Creator DNA card —
 * shipped the same day in Studio). This module holds everything the
 * frames compute:
 *
 *  - VESTRA WHAT IF: the prototype's decision simulator, ported
 *    line-for-line (money/fmt/catchUp helpers, the four scenarios and
 *    their run() math). Expected values in the fixtures were derived
 *    by running the prototype's own code.
 *  - NEXT LEVEL + YEAR IN REVIEW: computed from the creator's REAL
 *    deals. Money comes only from core's own helpers (dealPaidCents);
 *    nothing here re-derives a cent. A creator with no paid deals
 *    gets honest zeros, never the prototype's sample numbers.
 *  - INVITE: the prototype's reward ladder. Statuses derive from a
 *    joined-count held in device-local state (the prototype models
 *    2 of 3 joined); no backend tracks referrals.
 *  - CHALLENGES + HALL OF FAME: the prototype presents OTHER PEOPLE
 *    (friends, rankings). The app has no such data, so the
 *    prototype's own sample presentation is kept as device-local
 *    demo state, exactly as modeled — it is not a real leaderboard.
 * ========================================================================== */

import { dealPaidCents, parseKey, plural, type GalaxyDeal } from "./core";

/* ============================ VESTRA WHAT IF ============================ */

export function wiMoney(n: number): string {
  const neg = n < 0;
  const a = Math.abs(n);
  let s: string;
  if (a >= 1e6) s = "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
  else s = "$" + Math.round(a).toLocaleString("en-US");
  return (neg ? "-" : "") + s;
}

export function wiMoneyShort(n: number): string {
  const neg = n < 0;
  const a = Math.abs(n);
  let s: string;
  if (a >= 1e6) s = "$" + (a / 1e6).toFixed(1) + "M";
  else if (a >= 1e4) s = "$" + Math.round(a / 1e3) + "K";
  else if (a >= 1e3) s = "$" + (a / 1e3).toFixed(1) + "K";
  else s = "$" + Math.round(a);
  return (neg ? "-" : "") + s;
}

export function wiYrs(n: number): string {
  return n + (n === 1 ? " year" : " years");
}

export function wiFmt(v: number, unit: string): string {
  switch (unit) {
    case "$":
      return wiMoney(v);
    case "$/yr":
      return wiMoney(v) + "/yr";
    case "$/mo":
      return wiMoney(v) + "/mo";
    case "yr":
      return wiYrs(v);
    case "mo":
      return v + (v === 1 ? " month" : " months");
    case "%":
      return v + "%";
    case "%/yr":
      return v + "% a year";
    case "%/mo":
      return v + "% a month";
    default:
      return String(v);
  }
}

/** Month when the "what if" path catches up after falling behind. */
export function wiCatchUp(stayM: number[], whatM: number[]): number {
  let behind = false;
  for (let i = 0; i < stayM.length; i++) {
    if (whatM[i] < stayM[i]) behind = true;
    else if (behind) return i + 1;
  }
  return behind ? -1 : 0;
}

export function wiCatchUpText(r: number, years: number): string {
  if (r > 0) return "You’d catch up in month " + r + " (year " + Math.ceil(r / 12) + ").";
  if (r === 0) return "This path is ahead from the start.";
  return "You wouldn’t catch up within " + wiYrs(years) + " at these numbers.";
}

export type WiInput = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
};

export type WiValues = Record<string, number>;

export type WiResult = {
  stay: number[];
  what: number[];
  summary: string;
  extra: string;
};

export type WiScenario = {
  tab: string;
  stay: string;
  what: string;
  kind: string;
  q: (v: WiValues) => string;
  inputs: WiInput[];
  variants: number[];
  variantLabel: (v: WiValues, k: number) => string;
  run: (v: WiValues, k: number) => WiResult;
  trade: string[];
};

export const WI_ORDER = ["save", "career", "move", "creator"] as const;
export type WiKey = (typeof WI_ORDER)[number];

export const WI_SCENARIOS: Record<WiKey, WiScenario> = {
  save: {
    tab: "Save every month",
    q: (v) => "What if I save " + wiMoney(v.monthly) + " every month?",
    stay: "Don’t save",
    what: "Save monthly",
    kind: "Balance after",
    inputs: [
      { id: "monthly", label: "Save each month", min: 25, max: 2000, step: 25, value: 300, unit: "$" },
      { id: "years", label: "For how long", min: 1, max: 40, step: 1, value: 10, unit: "yr" },
      { id: "rate", label: "Yearly growth (your assumption)", min: 0, max: 10, step: 0.5, value: 5, unit: "%/yr" },
      { id: "start", label: "Starting balance", min: 0, max: 50000, step: 500, value: 0, unit: "$" },
    ],
    variants: [-2, 0, 2],
    variantLabel: (v, k) => Math.max(0, v.rate + k) + "% a year",
    run: (v, k) => {
      const rate = Math.max(0, v.rate + k);
      const r = rate / 100 / 12;
      let bal = v.start;
      const stay = [v.start];
      const what = [v.start];
      for (let m = 1; m <= v.years * 12; m++) {
        bal = bal * (1 + r) + v.monthly;
        if (m % 12 === 0) {
          what.push(bal);
          stay.push(v.start);
        }
      }
      const put = v.monthly * v.years * 12;
      return {
        stay,
        what,
        summary:
          "You’d put in " +
          wiMoney(put) +
          ", and growth adds about " +
          wiMoney(bal - v.start - put) +
          " at " +
          rate +
          "% a year.",
        extra:
          "You’d have " +
          wiMoney(v.monthly) +
          " less to spend each month (" +
          wiMoney(v.monthly * 12) +
          " a year).",
      };
    },
    trade: [
      "Less spending money every month",
      "Builds a cushion for slow months between brand deals",
      "Growth isn’t guaranteed, which is why the outcomes show a range",
    ],
  },
  career: {
    tab: "Change careers",
    q: () => "What if I change careers?",
    stay: "Stay in my job",
    what: "Switch careers",
    kind: "Total earned in",
    inputs: [
      { id: "current", label: "Current pay", min: 15000, max: 250000, step: 1000, value: 50000, unit: "$/yr" },
      { id: "next", label: "Expected pay in the new career", min: 15000, max: 250000, step: 1000, value: 70000, unit: "$/yr" },
      { id: "transition", label: "Time to switch", min: 0, max: 24, step: 1, value: 6, unit: "mo" },
      { id: "during", label: "Pay while switching (% of current)", min: 0, max: 100, step: 5, value: 50, unit: "%" },
      { id: "training", label: "Training or course costs", min: 0, max: 30000, step: 500, value: 3000, unit: "$" },
      { id: "years", label: "Compare over", min: 1, max: 15, step: 1, value: 5, unit: "yr" },
    ],
    variants: [0.85, 1, 1.15],
    variantLabel: (v, k) => (k < 1 ? "Pays 15% less" : k > 1 ? "Pays 15% more" : "As expected"),
    run: (v, k) => {
      const sM = v.current / 12;
      const nM = (v.next * k) / 12;
      const pct = v.during / 100;
      let cs = 0;
      let cw = -v.training;
      const stay = [0];
      const what = [-v.training];
      const sMo: number[] = [];
      const wMo: number[] = [];
      for (let m = 1; m <= v.years * 12; m++) {
        cs += sM;
        cw += m <= v.transition ? sM * pct : nM;
        sMo.push(cs);
        wMo.push(cw);
        if (m % 12 === 0) {
          stay.push(cs);
          what.push(cw);
        }
      }
      const cost = v.training + v.transition * sM * (1 - pct);
      return {
        stay,
        what,
        summary:
          "Switching costs about " +
          wiMoney(cost) +
          " up front: training plus " +
          wiFmt(v.transition, "mo") +
          " at " +
          v.during +
          "% pay.",
        extra: wiCatchUpText(wiCatchUp(sMo, wMo), v.years),
      };
    },
    trade: [
      "A short-term income dip while you switch",
      "New skills to learn, and a reset on seniority",
      "A higher ceiling, if the new pay holds",
    ],
  },
  move: {
    tab: "Move countries",
    q: () => "What if I move to another country?",
    stay: "Stay where I am",
    what: "Move",
    kind: "Kept after costs in",
    inputs: [
      { id: "incNow", label: "Monthly income here", min: 500, max: 20000, step: 100, value: 4000, unit: "$/mo" },
      { id: "incThere", label: "Monthly income there", min: 500, max: 20000, step: 100, value: 3500, unit: "$/mo" },
      { id: "costNow", label: "Monthly living costs here", min: 300, max: 15000, step: 100, value: 3000, unit: "$/mo" },
      { id: "costThere", label: "Monthly living costs there", min: 300, max: 15000, step: 100, value: 2000, unit: "$/mo" },
      { id: "moving", label: "One-time moving cost", min: 0, max: 50000, step: 500, value: 6000, unit: "$" },
      { id: "years", label: "Compare over", min: 1, max: 15, step: 1, value: 5, unit: "yr" },
    ],
    variants: [1.1, 1, 0.9],
    variantLabel: (v, k) => (k > 1 ? "Costs 10% higher" : k < 1 ? "Costs 10% lower" : "As expected"),
    run: (v, k) => {
      const nowNet = v.incNow - v.costNow;
      const thereNet = v.incThere - v.costThere * k;
      let cs = 0;
      let cw = -v.moving;
      const stay = [0];
      const what = [-v.moving];
      const sMo: number[] = [];
      const wMo: number[] = [];
      for (let m = 1; m <= v.years * 12; m++) {
        cs += nowNet;
        cw += thereNet;
        sMo.push(cs);
        wMo.push(cw);
        if (m % 12 === 0) {
          stay.push(cs);
          what.push(cw);
        }
      }
      const d = thereNet - nowNet;
      return {
        stay,
        what,
        summary:
          "Each month you’d keep " +
          wiMoney(Math.abs(d)) +
          (d >= 0 ? " more" : " less") +
          " after living costs, after paying " +
          wiMoney(v.moving) +
          " to move.",
        extra: wiCatchUpText(wiCatchUp(sMo, wMo), v.years),
      };
    },
    trade: [
      "A big one-time cost up front",
      "Visas, language and distance from family and friends",
      "Lower living costs can free up money to save or invest in your content",
    ],
  },
  creator: {
    tab: "Go full-time creator",
    q: () => "What if I go full-time as a creator?",
    stay: "Keep my job",
    what: "Go full-time",
    kind: "Total earned in",
    inputs: [
      { id: "job", label: "Job pay", min: 15000, max: 250000, step: 1000, value: 55000, unit: "$/yr" },
      { id: "side", label: "Creator income now", min: 0, max: 20000, step: 50, value: 800, unit: "$/mo" },
      { id: "growth", label: "Monthly growth if full-time (your assumption)", min: 0, max: 15, step: 0.5, value: 4, unit: "%/mo" },
      { id: "years", label: "Compare over", min: 1, max: 10, step: 1, value: 5, unit: "yr" },
    ],
    variants: [0.5, 1, 1.5],
    variantLabel: (v, k) => (k < 1 ? "Half the growth" : k > 1 ? "1.5× growth" : "As expected"),
    run: (v, k) => {
      const g = (v.growth * k) / 100;
      const sM = v.job / 12 + v.side;
      let c = v.side;
      let peak = c;
      let cs = 0;
      let cw = 0;
      const stay = [0];
      const what = [0];
      const sMo: number[] = [];
      const wMo: number[] = [];
      for (let m = 1; m <= v.years * 12; m++) {
        if (m > 1 && m <= 24) c = c * (1 + g);
        if (m <= 24) peak = c;
        cs += sM;
        cw += c;
        sMo.push(cs);
        wMo.push(cw);
        if (m % 12 === 0) {
          stay.push(cs);
          what.push(cw);
        }
      }
      return {
        stay,
        what,
        summary:
          "Keeping your job counts your current creator income as a side income. Full-time, it would reach about " +
          wiMoney(peak) +
          "/mo by month 24 at " +
          v.growth * k +
          "% monthly growth, then hold steady.",
        extra: wiCatchUpText(wiCatchUp(sMo, wMo), v.years),
      };
    },
    trade: [
      "No steady paycheck while you grow",
      "All your time goes into content, pitching and brand deals",
      "Income has no ceiling, but it also has no floor",
    ],
  },
};

export function wiDefaults(key: WiKey): WiValues {
  const out: WiValues = {};
  for (const f of WI_SCENARIOS[key].inputs) out[f.id] = f.value;
  return out;
}

export const WI_DISCLAIMER =
  "Estimates from the numbers you enter, not predictions or financial advice. Growth rates are your own assumptions.";

export const WI_STORE_KEY = "uv-whatif.v1";

/* ==================== REAL FACTS (levels + year) ==================== */

export type LevelFacts = {
  /** Completed campaigns = deals that reached the paid stage. */
  campaigns: number;
  /** Collected money, in cents — core's dealPaidCents over paid deals. */
  collectedCents: number;
  /** Distinct brands among paid deals. */
  brands: number;
};

export function levelFacts(deals: GalaxyDeal[]): LevelFacts {
  const paid = deals.filter((d) => d.stage === "paid");
  return {
    campaigns: paid.length,
    collectedCents: paid.reduce((s, d) => s + dealPaidCents(d), 0),
    brands: new Set(paid.map((d) => d.brandName)).size,
  };
}

export type LevelTier = {
  id: string;
  name: string;
  campaigns: number;
  collectedCents: number;
};

export const LEVEL_TIERS: LevelTier[] = [
  { id: "bronze", name: "Bronze", campaigns: 0, collectedCents: 0 },
  { id: "silver", name: "Silver", campaigns: 1, collectedCents: 50000 },
  { id: "gold", name: "Gold", campaigns: 5, collectedCents: 250000 },
  { id: "diamond", name: "Diamond", campaigns: 10, collectedCents: 500000 },
];

export type LevelState = {
  tierIndex: number;
  tier: LevelTier;
  next: LevelTier | null;
  /** 0..1 progress from zero toward the NEXT tier's two requirements
   *  (average of the campaign ratio and the collected ratio, each
   *  capped at 1). 1 when the top tier is reached. */
  progress: number;
  percent: number;
};

export function computeLevel(facts: LevelFacts): LevelState {
  let tierIndex = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    const t = LEVEL_TIERS[i];
    if (facts.campaigns >= t.campaigns && facts.collectedCents >= t.collectedCents) {
      tierIndex = i;
    }
  }
  const tier = LEVEL_TIERS[tierIndex];
  const next = LEVEL_TIERS[tierIndex + 1] ?? null;
  if (!next) return { tierIndex, tier, next, progress: 1, percent: 100 };
  const campRatio = Math.min(1, facts.campaigns / next.campaigns);
  const collRatio = Math.min(1, facts.collectedCents / next.collectedCents);
  const progress = (campRatio + collRatio) / 2;
  return { tierIndex, tier, next, progress, percent: Math.round(progress * 100) };
}

/** "Finish 10 campaigns and collect $5,000 to reach Diamond." — built
 *  from the next tier's two requirements; null at the top tier. */
export function levelNextText(state: LevelState): string | null {
  if (!state.next) return null;
  return (
    "Finish " +
    plural(state.next.campaigns, "campaign") +
    " and collect " +
    wiMoney(state.next.collectedCents / 100) +
    " to reach " +
    state.next.name +
    "."
  );
}

export type Milestone = {
  id: string;
  title: string;
  icon: "check" | "tag" | "users" | "trophy";
  status: "done" | "progress" | "todo";
  sub: string;
  current?: number;
  target?: number;
  format?: "count" | "money";
};

const monthName = (key: string): string =>
  parseKey(key).toLocaleDateString("en-US", { month: "long" });

/** The five milestone rows of the Next Level frame. Every row is a
 *  real app fact: paid deals, collected money, distinct brands. (The
 *  prototype's "100 business contacts" and "consistency streak" rows
 *  have no real source in the app and were replaced by two revenue /
 *  brand milestones that do — see the build report's deviations.) */
export function levelMilestones(deals: GalaxyDeal[]): Milestone[] {
  const facts = levelFacts(deals);
  const paid = deals
    .filter((d) => d.stage === "paid" && d.paidOn)
    .sort((a, b) => (a.paidOn ?? "").localeCompare(b.paidOn ?? ""));
  const first = paid[0];
  const rows: Milestone[] = [];

  rows.push({
    id: "first-collab",
    title: "First brand collaboration",
    icon: "check",
    status: first ? "done" : "todo",
    sub: first ? "Done · " + monthName(first.paidOn as string) : "Land your first paid deal",
  });

  rows.push({
    id: "first-500",
    title: "First $500 in creator revenue",
    icon: "check",
    status: facts.collectedCents >= 50000 ? "done" : "todo",
    sub: facts.collectedCents >= 50000 ? "Done · Verified" : "Collect $500 from paid deals",
  });

  rows.push({
    id: "campaigns-10",
    title: "First 10 campaigns",
    icon: "tag",
    status: facts.campaigns >= 10 ? "done" : "progress",
    sub: "",
    current: Math.min(facts.campaigns, 10),
    target: 10,
    format: "count",
  });

  rows.push({
    id: "brands-5",
    title: "First 5 brand partners",
    icon: "users",
    status: facts.brands >= 5 ? "done" : "progress",
    sub: "",
    current: Math.min(facts.brands, 5),
    target: 5,
    format: "count",
  });

  rows.push({
    id: "revenue-5000",
    title: "First $5,000 in creator revenue",
    icon: "trophy",
    status: facts.collectedCents >= 500000 ? "done" : "progress",
    sub: "",
    current: Math.min(facts.collectedCents, 500000),
    target: 500000,
    format: "money",
  });

  return rows;
}

/* ------------------------- Year in Review ------------------------- */

export type YearReview = {
  year: number;
  dealsCompleted: number;
  brandsWorkedWith: number;
  earnedCents: number;
  biggestDeal: { brandName: string; cents: number; paidOn: string } | null;
  /** Growth-milestone months, all inside the reviewed year. */
  firstDealMonth: string | null;
  first500Month: string | null;
  fiveBrandsMonth: string | null;
};

export function yearInReview(deals: GalaxyDeal[], year: number): YearReview {
  const paid = deals
    .filter((d) => d.stage === "paid" && d.paidOn && parseKey(d.paidOn).getFullYear() === year)
    .sort((a, b) => (a.paidOn ?? "").localeCompare(b.paidOn ?? ""));

  let earnedCents = 0;
  let biggest: YearReview["biggestDeal"] = null;
  let first500Month: string | null = null;
  let fiveBrandsMonth: string | null = null;
  const brandsSeen = new Set<string>();

  for (const d of paid) {
    const cents = dealPaidCents(d);
    earnedCents += cents;
    if (!biggest || cents > biggest.cents) {
      biggest = { brandName: d.brandName, cents, paidOn: d.paidOn as string };
    }
    if (first500Month === null && earnedCents >= 50000) {
      first500Month = monthName(d.paidOn as string);
    }
    brandsSeen.add(d.brandName);
    if (fiveBrandsMonth === null && brandsSeen.size >= 5) {
      fiveBrandsMonth = monthName(d.paidOn as string);
    }
  }

  return {
    year,
    dealsCompleted: paid.length,
    brandsWorkedWith: brandsSeen.size,
    earnedCents,
    biggestDeal: biggest,
    firstDealMonth: paid.length ? monthName(paid[0].paidOn as string) : null,
    first500Month,
    fiveBrandsMonth,
  };
}

/* ============================== INVITE ============================== */

/** The prototype models the creator at 2 of 3 friends joined. That
 *  state is device-local demo state — no backend counts referrals —
 *  and the reward statuses below derive from it exactly as the
 *  prototype presents them. */
export const INVITE_MODEL_JOINED = 2;
export const INVITE_GOAL = 3;
export const INVITE_STORE_KEY = "uv-invite.v1";

export type InviteReward = {
  id: string;
  title: string;
  need: number;
  needLabel: string;
  icon: "star" | "gift" | "diamond" | "trophy";
  tint: "purple" | "blue" | "cyan" | "gold";
};

export const INVITE_REWARDS: InviteReward[] = [
  { id: "glow-frame", title: "Glow profile frame", need: 1, needLabel: "1 friend", icon: "star", tint: "purple" },
  { id: "premium-month", title: "1 month of Premium", need: 3, needLabel: "3 friends", icon: "gift", tint: "blue" },
  { id: "diamond-preview", title: "Diamond card preview", need: 5, needLabel: "5 friends", icon: "diamond", tint: "cyan" },
  { id: "connector-badge", title: "“Connector” Hall of Fame badge", need: 10, needLabel: "10 friends", icon: "trophy", tint: "gold" },
];

export type InviteRewardStatus = { state: "unlocked" | "todo" | "locked"; label: string };

export function inviteRewardStatus(joined: number, need: number): InviteRewardStatus {
  if (joined >= need) return { state: "unlocked", label: "Unlocked" };
  if (need - joined === 1) return { state: "todo", label: "1 to go" };
  return { state: "locked", label: "Locked" };
}

export function inviteProgress(joined: number): {
  headline: string;
  right: string;
  pct: number;
} {
  return {
    headline: joined + " of " + INVITE_GOAL + " friends joined",
    right:
      joined >= INVITE_GOAL
        ? "Premium unlocked"
        : INVITE_GOAL - joined + " more to Premium",
    pct: Math.min(100, Math.round((joined / INVITE_GOAL) * 100)),
  };
}

/* ============================ CHALLENGES ============================ */
/* The prototype's social layer, kept as its own device-local demo
 * state exactly as modeled — the app has no friends data. Join
 * toggles persist on the device ('uv-challenges.v1'). */

export const CHALLENGES_STORE_KEY = "uv-challenges.v1";

export const CHALLENGE_WEEK = {
  title: "7 days of consistent posting",
  sub: "Post once a day. Any platform counts.",
  daysDone: 4,
  todayIndex: 4, // the 5th circle is "today"
  meta: "Day 4 of 7 · 38 creators in · 3 friends",
};

export type ChallengeFriend = {
  initials: string;
  name: string;
  you?: boolean;
  done: number;
  total: number;
  barColor: string;
  avatarBg: string;
  avatarColor: string;
};

export const CHALLENGE_FRIENDS: ChallengeFriend[] = [
  { initials: "JC", name: "@jay.creates", done: 5, total: 7, barColor: "#B69CFF", avatarBg: "#2A2160", avatarColor: "#B69CFF" },
  { initials: "YOU", name: "You", you: true, done: 4, total: 7, barColor: "#4C7DFF", avatarBg: "#1C3170", avatarColor: "#9DB8FF" },
  { initials: "LU", name: "@lena.ugc", done: 3, total: 7, barColor: "#F59E42", avatarBg: "#3A2A1C", avatarColor: "#F59E42" },
];

export const MORE_CHALLENGES = [
  { id: "first-deal", title: "Get your first brand deal", sub: "This month · pitch 5 brands" },
  { id: "hooks", title: "Improve your content hooks", sub: "3 hook drills · 15 min each" },
  { id: "media-kit", title: "Build your media kit in 24 hours", sub: "Starts Monday" },
];

/** Time until the weekly challenge resets (next Monday 00:00 local). */
export function weekEndsIn(now: Date): string {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const add = (8 - now.getDay()) % 7 || 7; // days until next Monday
  end.setDate(end.getDate() + add);
  const ms = end.getTime() - now.getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return "Ends in " + days + "d " + hours + "h";
}

/* =========================== HALL OF FAME =========================== */
/* The prototype's sample rankings, verbatim — demo state, not a real
 * leaderboard (the app has no cross-creator data). */

export type HofSet = { label: string; you: string; rows: [string, string][] };

export const HOF_ORDER = ["consistency", "campaigns", "improved", "community"] as const;
export type HofKey = (typeof HOF_ORDER)[number];

export const HOF: Record<HofKey, HofSet> = {
  consistency: {
    label: "Best consistency",
    you: "#23 · 12-day streak · Top 15%",
    rows: [
      ["@maya.makes", "61-day streak"],
      ["@jay.creates", "54-day streak"],
      ["@coco.films", "47-day streak"],
      ["@nia.reviews", "39-day streak"],
      ["@dre.unboxes", "33-day streak"],
      ["@lena.ugc", "30-day streak"],
      ["@sam.cooks", "28-day streak"],
    ],
  },
  campaigns: {
    label: "Campaign performance",
    you: "#31 · 4.7 brand rating · 3 campaigns",
    rows: [
      ["@nia.reviews", "5.0 rating · 9 campaigns"],
      ["@coco.films", "4.9 rating · 12 campaigns"],
      ["@maya.makes", "4.9 rating · 7 campaigns"],
      ["@sam.cooks", "4.8 rating"],
      ["@jay.creates", "4.8 rating"],
      ["@dre.unboxes", "4.7 rating"],
      ["@lena.ugc", "4.7 rating"],
    ],
  },
  improved: {
    label: "Biggest improvement",
    you: "#12 · +21% saves this month",
    rows: [
      ["@lena.ugc", "+62% saves"],
      ["@dre.unboxes", "+48% saves"],
      ["@sam.cooks", "+41% saves"],
      ["@jay.creates", "+35% saves"],
      ["@coco.films", "+30% saves"],
      ["@maya.makes", "+27% saves"],
      ["@nia.reviews", "+24% saves"],
    ],
  },
  community: {
    label: "Community favorite",
    you: "#40 · 36 community votes",
    rows: [
      ["@coco.films", "418 votes"],
      ["@maya.makes", "377 votes"],
      ["@lena.ugc", "342 votes"],
      ["@jay.creates", "290 votes"],
      ["@nia.reviews", "251 votes"],
      ["@sam.cooks", "230 votes"],
      ["@dre.unboxes", "204 votes"],
    ],
  },
};

export const HOF_PLACE: Record<number, { ring: string; glow: string; size: number; base: number }> = {
  1: { ring: "#F5C451", glow: "rgba(245,196,81,.45)", size: 60, base: 84 },
  2: { ring: "#C5CCE0", glow: "rgba(197,204,224,.3)", size: 50, base: 62 },
  3: { ring: "#D69A6B", glow: "rgba(214,154,107,.3)", size: 50, base: 48 },
};

export function hofInitials(handle: string): string {
  const parts = handle.replace("@", "").split(/[._]/);
  return ((parts[0] || "").charAt(0) + (parts[1] || "").charAt(0)).toUpperCase();
}
