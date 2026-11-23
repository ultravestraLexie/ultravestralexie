/* Galaxy redesign — shared pure logic for the six views
 * (Today / Brands / Deals / Studio / Money / Passport).
 *
 * Everything here is framework-free and computes ONLY from the
 * creator's own records — the prototype's honesty rule: no figure,
 * action or flag exists unless a real row produced it.
 *
 * Deal field mapping onto public.creator_deals (the existing
 * pipeline table; Galaxy stage vocabulary since 2026-11-23):
 *   amount        = compensation_cents (integer cents end to end)
 *   pitchedOn     = created_at (date part)
 *   lastContact   = updated_at (date part)
 *   dueOn         = deadline (content due)
 *   invoiceDue    = payment_due_date
 *   paidOn        = payment_received_date
 *   receivedCents = amount_received_cents
 */

export type GalaxyStage =
  | "pitched"
  | "negotiating"
  | "contracted"
  | "delivering"
  | "invoiced"
  | "paid"
  | "lost";

export type StageMeta = {
  id: GalaxyStage;
  label: string;
  color: string;
  /** Advance-button label shown while a deal sits in this stage. */
  next: string | null;
};

export const STAGES: StageMeta[] = [
  { id: "pitched", label: "Pitched", color: "#5B82FF", next: "Mark negotiating" },
  { id: "negotiating", label: "Negotiating", color: "#0FA39A", next: "Mark contracted" },
  { id: "contracted", label: "Contracted", color: "#B166EE", next: "Start delivering" },
  { id: "delivering", label: "Delivering", color: "#BE8A22", next: "Log invoice" },
  { id: "invoiced", label: "Invoiced", color: "#E2638A", next: "Mark paid" },
  { id: "paid", label: "Paid", color: "#F1DFA8", next: null },
  { id: "lost", label: "Lost", color: "#8590C4", next: null },
];

export const ACTIVE_STAGES: GalaxyStage[] = [
  "pitched",
  "negotiating",
  "contracted",
  "delivering",
  "invoiced",
];

export const stageOf = (id: string): StageMeta =>
  STAGES.find((s) => s.id === id) ?? STAGES[0];

export const nextStage = (id: GalaxyStage): GalaxyStage | null => {
  const order: GalaxyStage[] = [...ACTIVE_STAGES, "paid"];
  const i = order.indexOf(id);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
};

/* ---------------- dates (local calendar, YYYY-MM-DD) ---------------- */

export const DAY = 86400000;

export function todayKey(now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return iso(d);
}

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function addDaysKey(n: number, now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function parseKey(s: string): Date {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from today until the given date key (negative = past). */
export function daysUntil(s: string, now = new Date()): number {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return Math.round((parseKey(s).getTime() - t.getTime()) / DAY);
}

export function daysAgo(s: string, now = new Date()): number {
  return -daysUntil(s, now);
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "Not recorded";
  return parseKey(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function monthKeyOf(s: string): string {
  return String(s).slice(0, 7);
}

export const plural = (n: number, w: string, p?: string) =>
  `${n} ${n === 1 ? w : p ?? w + "s"}`;

/* ---------------- money (integer cents in, dollars out) ---------------- */

export function fmtMoney(cents: number | null | undefined): string {
  const v = Math.round((cents ?? 0) / 100);
  return (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US");
}

export function shortMoney(cents: number): string {
  const d = cents / 100;
  return d >= 1000
    ? "$" + (d / 1000).toFixed(d % 1000 ? 1 : 0).replace(/\.0$/, "") + "k"
    : "$" + Math.round(d);
}

/* ---------------- records ---------------- */

export type GalaxyDeal = {
  id: string;
  brandName: string;
  brandId: string | null;
  platform: string | null;
  stage: GalaxyStage;
  amountCents: number | null;
  receivedCents: number | null;
  deliverables: string;
  notes: string;
  pitchedOn: string;
  lastContact: string;
  dueOn: string | null;
  invoiceSentOn: string | null;
  invoiceDue: string | null;
  paidOn: string | null;
};

export type DealRowLike = {
  id: string;
  brand_name: string;
  platform: string | null;
  stage: string;
  compensation_cents: number | null;
  deliverables: string;
  deadline: string | null;
  notes: string;
  invoice_sent_date: string | null;
  payment_due_date: string | null;
  payment_received_date: string | null;
  amount_received_cents: number | null;
  proposal_id?: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToDeal(r: DealRowLike, brandId: string | null = null): GalaxyDeal {
  return {
    id: r.id,
    brandName: r.brand_name,
    brandId,
    platform: r.platform,
    stage: (STAGES.some((s) => s.id === r.stage) ? r.stage : "pitched") as GalaxyStage,
    amountCents: r.compensation_cents,
    receivedCents: r.amount_received_cents,
    deliverables: r.deliverables ?? "",
    notes: r.notes ?? "",
    pitchedOn: (r.created_at ?? "").slice(0, 10),
    lastContact: (r.updated_at ?? "").slice(0, 10),
    dueOn: r.deadline,
    invoiceSentOn: r.invoice_sent_date,
    invoiceDue: r.payment_due_date,
    paidOn: r.payment_received_date,
  };
}

/** What a deal is actually worth in money terms: the received
 *  amount when recorded, else the agreed amount once paid. */
export function dealPaidCents(d: GalaxyDeal): number {
  if (d.receivedCents != null) return d.receivedCents;
  return d.amountCents ?? 0;
}

/** Remaining balance on an invoiced deal (never below zero). */
export function dealRemainingCents(d: GalaxyDeal): number {
  if (d.amountCents == null) return 0;
  return Math.max(0, d.amountCents - (d.receivedCents ?? 0));
}

export function isOverdue(d: GalaxyDeal, now = new Date()): boolean {
  return (
    d.stage === "invoiced" &&
    d.invoiceDue !== null &&
    dealRemainingCents(d) > 0 &&
    daysUntil(d.invoiceDue, now) < 0
  );
}

export const activeDeals = (deals: GalaxyDeal[]) =>
  deals.filter((d) => ACTIVE_STAGES.includes(d.stage));

export function owedCents(deals: GalaxyDeal[]): number {
  return deals
    .filter((d) => d.stage === "invoiced")
    .reduce((t, d) => t + dealRemainingCents(d), 0);
}

export function overdueDeals(deals: GalaxyDeal[], now = new Date()): GalaxyDeal[] {
  return deals.filter((d) => isOverdue(d, now));
}

export function overdueCents(deals: GalaxyDeal[], now = new Date()): number {
  return overdueDeals(deals, now).reduce((t, d) => t + dealRemainingCents(d), 0);
}

export type GalaxyIncome = { id: string; source: string; amountCents: number; date: string };
export type GalaxyExpense = { id: string; label: string; amountCents: number; date: string };

export function paidInMonth(
  deals: GalaxyDeal[],
  income: GalaxyIncome[],
  month: string
): number {
  const fromDeals = deals
    .filter((d) => d.stage === "paid" && d.paidOn && monthKeyOf(d.paidOn) === month)
    .reduce((t, d) => t + dealPaidCents(d), 0);
  const fromIncome = income
    .filter((i) => monthKeyOf(i.date) === month)
    .reduce((t, i) => t + i.amountCents, 0);
  return fromDeals + fromIncome;
}

export function spentInMonth(expenses: GalaxyExpense[], month: string): number {
  return expenses
    .filter((e) => monthKeyOf(e.date) === month)
    .reduce((t, e) => t + e.amountCents, 0);
}

/* ---------------- deal flags (Deals board + Money waiting-on) ---------------- */

export type DealFlag = { tone: "bad" | "warn" | "plain"; text: string } | null;

export function dealFlag(d: GalaxyDeal, now = new Date()): DealFlag {
  if (isOverdue(d, now))
    return { tone: "bad", text: `Overdue ${plural(daysAgo(d.invoiceDue as string, now), "day")}` };
  if (d.stage === "invoiced" && d.invoiceDue)
    return { tone: "plain", text: `Due ${fmtDate(d.invoiceDue)}` };
  if ((d.stage === "contracted" || d.stage === "delivering") && d.dueOn) {
    const n = daysUntil(d.dueOn, now);
    if (n < 0) return { tone: "bad", text: `Content ${plural(-n, "day")} late` };
    if (n <= 3) return { tone: "warn", text: n === 0 ? "Due today" : `Due in ${plural(n, "day")}` };
    return { tone: "plain", text: `Due ${fmtDate(d.dueOn)}` };
  }
  if (d.stage === "pitched" && daysAgo(d.lastContact, now) >= 5)
    return { tone: "warn", text: "Follow up" };
  if (d.stage === "negotiating" && daysAgo(d.lastContact, now) >= 4)
    return { tone: "warn", text: "Gone quiet" };
  return null;
}

/* ---------------- directory ---------------- */

export type CapKind = "capped" | "uncapped" | "unknown";
export const CAP_LABEL: Record<CapKind, string> = {
  capped: "Capped",
  uncapped: "Uncapped",
  unknown: "Cap unknown",
};

/** Cap status lives in the affiliate program's research notes —
 *  the same derivation the directory surfaces have always used:
 *  "UNCAPPED" in the notes means uncapped, "cap: capped" means
 *  capped, anything else is honestly unknown. */
export function capFromNotes(notes: string | null | undefined): CapKind {
  if (notes && notes.includes("UNCAPPED")) return "uncapped";
  if (notes && notes.includes("cap: capped")) return "capped";
  return "unknown";
}

export type GalaxyBrand = {
  id: string;
  name: string;
  category: string | null;
  categories: string[];
  program: string | null;
  rate: number | null;
  cap: CapKind;
  accepting: boolean;
  checked: string | null;
  added: string;
  saved: boolean;
};

export function hashHue(s: string): number {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

export function initials(name: string): string {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("") || "UV"
  ).toUpperCase();
}

/* ---------------- profile ---------------- */

export type GalaxyProfile = {
  name: string;
  niche: string;
  categories: string[];
  platforms: string[];
  audience: string;
  weeklyGoal: number;
};

export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  pinterest: "Pinterest",
  twitch: "Twitch",
  x: "X",
  linkedin: "LinkedIn",
  podcast: "Podcast",
  trybe: "Trybe",
  other: "Other",
};

export const platformLabel = (p: string) =>
  PLATFORM_LABELS[p.toLowerCase()] ??
  p.charAt(0).toUpperCase() + p.slice(1);

/* ---------------- Today: the intelligence layer ---------------- */

export type InsightKind = "overdue" | "risk" | "followup" | "pitch" | "rhythm" | "studio";

export type Insight = {
  kind: InsightKind;
  priority: number;
  title: string;
  why: string;
  cta: string;
  act: "reminder" | "open-deal" | "followup" | "pitch" | "logpost" | "go";
  dealId?: string;
  brandId?: string;
  to?: string;
};

export type InsightInput = {
  deals: GalaxyDeal[];
  brands: GalaxyBrand[];
  profile: GalaxyProfile;
  postsThisWeek: number;
  scriptCount: number;
  /** Deal Protection records by deal id (System #2). Optional —
   *  callers that don't load protection simply get no protection
   *  insight; a deal with no record counts as fully unprotected. */
  protectionByDeal?: Record<string, DealProtection>;
  now?: Date;
};

/** Brands worth pitching: accepting, in the creator's niche, not
 *  already in the pipeline. Best first: saved, then uncapped,
 *  then highest rate (the prototype's matchesToPitch order). */
export function matchesToPitch(input: InsightInput, limit = 3): GalaxyBrand[] {
  const inPipe = new Set(
    input.deals.filter((d) => d.stage !== "lost").map((d) => d.brandId).filter(Boolean)
  );
  const inPipeNames = new Set(
    input.deals.filter((d) => d.stage !== "lost").map((d) => d.brandName.toLowerCase())
  );
  const niche = input.profile.niche;
  return input.brands
    .filter(
      (b) =>
        b.accepting &&
        !inPipe.has(b.id) &&
        !inPipeNames.has(b.name.toLowerCase()) &&
        (!niche || b.category === niche || b.categories.includes(niche))
    )
    .sort(
      (a, b) =>
        Number(b.saved) - Number(a.saved) ||
        Number(b.cap === "uncapped") - Number(a.cap === "uncapped") ||
        (b.rate ?? 0) - (a.rate ?? 0)
    )
    .slice(0, limit);
}

export function computeInsights(input: InsightInput): Insight[] {
  const now = input.now ?? new Date();
  const out: Insight[] = [];
  for (const d of input.deals) {
    const b = d.brandName;
    if (isOverdue(d, now)) {
      const late = daysAgo(d.invoiceDue as string, now);
      out.push({
        kind: "overdue",
        priority: 100 + late,
        dealId: d.id,
        title: `Chase ${fmtMoney(dealRemainingCents(d))} from ${b}`,
        why: `The invoice was due ${plural(late, "day")} ago.`,
        cta: "Copy reminder",
        act: "reminder",
      });
    }
    if ((d.stage === "contracted" || d.stage === "delivering") && d.dueOn) {
      const n = daysUntil(d.dueOn, now);
      if (n < 0)
        out.push({
          kind: "risk",
          priority: 92,
          dealId: d.id,
          title: `Deliver to ${b}`,
          why: `Content was due ${plural(-n, "day")} ago.`,
          cta: "Open deal",
          act: "open-deal",
        });
      else if (n <= 3)
        out.push({
          kind: "risk",
          priority: 80 - n,
          dealId: d.id,
          title: `Deliver to ${b}`,
          why:
            n === 0
              ? `${d.deliverables || "Content"} is due today.`
              : `${d.deliverables || "Content"} is due in ${plural(n, "day")}.`,
          cta: "Open deal",
          act: "open-deal",
        });
    }
    if (d.stage === "negotiating" && daysAgo(d.lastContact, now) >= 4) {
      out.push({
        kind: "risk",
        priority: 55,
        dealId: d.id,
        title: `Restart the talk with ${b}`,
        why: `No contact for ${plural(daysAgo(d.lastContact, now), "day")} while negotiating ${fmtMoney(d.amountCents)}.`,
        cta: "Write follow-up",
        act: "followup",
      });
    }
    if (d.stage === "pitched" && daysAgo(d.lastContact, now) >= 5) {
      out.push({
        kind: "followup",
        priority: 60 + daysAgo(d.lastContact, now),
        dealId: d.id,
        title: `Follow up with ${b}`,
        why: `You pitched ${plural(daysAgo(d.lastContact, now), "day")} ago and have no reply yet.`,
        cta: "Write follow-up",
        act: "followup",
      });
    }
  }
  /* Deal Protection (System #2): at most ONE protection insight —
   *  the most urgent contracted/delivering deal whose usage rights
   *  are not recorded. Most urgent = soonest content due date
   *  (undated last), then the largest amount. */
  const unprotected = input.deals
    .filter(
      (d) =>
        (d.stage === "contracted" || d.stage === "delivering") &&
        protectionGaps(d, input.protectionByDeal?.[d.id]).some((g) => g.id === "usage")
    )
    .sort((a, b) => {
      if (a.dueOn && b.dueOn) return a.dueOn.localeCompare(b.dueOn);
      if (a.dueOn) return -1;
      if (b.dueOn) return 1;
      return (b.amountCents ?? 0) - (a.amountCents ?? 0);
    });
  if (unprotected.length) {
    const d = unprotected[0];
    out.push({
      kind: "risk",
      priority: 65,
      dealId: d.id,
      title: `Lock the usage rights with ${d.brandName}`,
      why: `The deal is ${stageOf(d.stage).label.toLowerCase()} but usage rights are not recorded — what the brand may do with your content is not written down.`,
      cta: "Open deal",
      act: "open-deal",
    });
  }
  for (const b of matchesToPitch(input, 3)) {
    const bits = ["Accepting now"];
    if (b.rate != null) bits.push(`${b.rate}% commission, ${CAP_LABEL[b.cap].toLowerCase()}`);
    else bits.push(`commission ${CAP_LABEL[b.cap].toLowerCase()}`);
    if (input.profile.niche && (b.category === input.profile.niche || b.categories.includes(input.profile.niche)))
      bits.push(`matches your ${input.profile.niche.toLowerCase()} niche`);
    out.push({
      kind: "pitch",
      priority: 30 + (b.saved ? 6 : 0),
      brandId: b.id,
      title: `Pitch ${b.name}`,
      why: bits.join(", ") + ".",
      cta: "Write pitch",
      act: "pitch",
    });
  }
  const goal = input.profile.weeklyGoal || 5;
  if (input.postsThisWeek < goal)
    out.push({
      kind: "rhythm",
      priority: 20,
      title: `Post ${plural(goal - input.postsThisWeek, "more video")}`,
      why: `${input.postsThisWeek} of ${goal} posted in the last 7 days.`,
      cta: "Log a post",
      act: "logpost",
    });
  if (input.scriptCount === 0)
    out.push({
      kind: "studio",
      priority: 15,
      title: "Check your next script before you film",
      why: "The Video Lab shows what will make a buyer stop, trust and tap.",
      cta: "Open Video Lab",
      act: "go",
      to: "/studio",
    });
  return out.sort((a, b) => b.priority - a.priority);
}

export const EMPTY_ANSWERS: Record<string, string> = {
  all: "Nothing needs you right now. Pitch a new brand to keep your orbit full.",
  pitch: "No new matches right now. Set your niche in your profile, or browse all brands.",
  followup: "Every pitch has been answered or followed up in the last 5 days.",
  risk: "No deals at risk. Every deadline is more than 3 days away.",
  overdue: "No overdue payments. Every invoice is on time.",
};

export const QUESTIONS: { id: string; q: string }[] = [
  { id: "all", q: "What should I do next?" },
  { id: "pitch", q: "Who should I pitch this week?" },
  { id: "followup", q: "Which pitches need a follow-up?" },
  { id: "risk", q: "Which deals are at risk?" },
  { id: "overdue", q: "Which payments are overdue?" },
];

/* ---------------- message templates ---------------- */

export function pitchText(
  profile: GalaxyProfile,
  brand: GalaxyBrand,
  paidCount: number
): { subject: string; body: string } {
  const where = profile.platforms.length
    ? ` on ${profile.platforms.map(platformLabel).join(" and ")}`
    : "";
  const subject = `Creator partnership: ${profile.name || "Creator"} x ${brand.name}`;
  const body = `Hi ${brand.name} team,

I'm ${profile.name || "[your name]"}, a ${profile.niche ? profile.niche.toLowerCase() : "[niche]"} creator${where}. My audience is ${
    profile.audience
      ? profile.audience.charAt(0).toLowerCase() + profile.audience.slice(1)
      : "[who watches you]"
  }.

I'd love to make ${brand.program === "TikTok Shop" ? "TikTok Shop videos" : "content"} for ${brand.name} that shows the result your customers care about, not just the product. Here's what I have in mind:

- One hook-first video built around a real before and after
- A clear call to action to ${brand.program === "TikTok Shop" ? "your TikTok Shop listing" : "your link"}
- Raw clips you can reuse as ads
${
  paidCount
    ? `\nI've completed ${plural(paidCount, "paid brand partnership")}, and my Ultra Vestra Passport has the details.\n`
    : ""
}
Would you be open to a quick chat this week?

${profile.name || "Your name"}`;
  return { subject, body };
}

export function followText(profile: GalaxyProfile, deal: GalaxyDeal): string {
  return `Hi ${deal.brandName} team,

Floating this back to the top of your inbox. I'd still love to create ${
    profile.niche ? profile.niche.toLowerCase() + " " : ""
  }content for ${deal.brandName}, and I can have a first video ready within a week.

Happy to send two sample hooks if that would help you decide.

${profile.name || "Your name"}`;
}

export function reminderText(profile: GalaxyProfile, deal: GalaxyDeal): string {
  return `Hi ${deal.brandName} team,

A quick note that the invoice for ${fmtMoney(dealRemainingCents(deal))}${
    deal.deliverables ? ` (${deal.deliverables})` : ""
  } was due on ${deal.invoiceDue ? fmtDate(deal.invoiceDue) : "its due date"}. Could you confirm when the payment will be sent?

Thank you,
${profile.name || "Your name"}`;
}

/* ---------------- Money chart ---------------- */

export type MonthMoney = {
  key: string;
  label: string;
  long: string;
  dealsCents: number;
  incomeCents: number;
  totalCents: number;
};

export function monthsBackMoney(
  deals: GalaxyDeal[],
  income: GalaxyIncome[],
  n = 6,
  now = new Date()
): MonthMoney[] {
  const out: MonthMoney[] = [];
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const dealsCents = deals
      .filter((d) => d.stage === "paid" && d.paidOn && monthKeyOf(d.paidOn) === key)
      .reduce((t, d) => t + dealPaidCents(d), 0);
    const incomeCents = income
      .filter((x) => monthKeyOf(x.date) === key)
      .reduce((t, x) => t + x.amountCents, 0);
    out.push({
      key,
      label: m.toLocaleDateString("en-US", { month: "short" }),
      long: m.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      dealsCents,
      incomeCents,
      totalCents: dealsCents + incomeCents,
    });
  }
  return out;
}

export function niceMax(v: number): number {
  if (v <= 0) return 50000; // $500 in cents
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/* ---------------- Money Center: forecast, gaps, monthly detail ------
 * System #1 of the creator-systems program (2026-11-23). Everything
 * below reads ONLY the creator's real deal / income / expense rows.
 * The one expected-payment date the records carry is payment_due_date
 * (deal.invoiceDue): it is set when an invoice is logged and can be
 * edited on an invoiced deal. The content deadline (deal.dueOn) is a
 * delivery date, never a payment date, so it is never used to place
 * money in a month — a contracted deal with no payment due date sits
 * honestly in the "no date set" bucket. */

/** What is still owed on invoiced deals whose payment due date
 *  falls in the given month (YYYY-MM). Invoiced deals with no due
 *  date are counted in NO month — they live in the owed KPI and the
 *  waiting-on list, never in a month they don't belong to. */
export function invoicedOutstandingDueInMonth(
  deals: GalaxyDeal[],
  month: string
): number {
  return deals
    .filter(
      (d) => d.stage === "invoiced" && d.invoiceDue && monthKeyOf(d.invoiceDue) === month
    )
    .reduce((t, d) => t + dealRemainingCents(d), 0);
}

export type ForecastBucketId = "this" | "next" | "later" | "nodate";

export type ForecastBucket = {
  id: ForecastBucketId;
  label: string;
  cents: number;
  deals: GalaxyDeal[];
};

export type ContractedForecast = {
  buckets: ForecastBucket[];
  totalCents: number;
  dealCount: number;
};

/** Contracted income forecast: deals in contracted + delivering,
 *  valued at their agreed amount, grouped by the month payment is
 *  due. Invoiced deals are NEVER counted here — once a deal is
 *  invoiced its balance belongs to the owed figures, so no dollar
 *  is ever counted twice. A due date in an earlier month counts as
 *  this month (it is due now, not later). */
export function contractedForecast(
  deals: GalaxyDeal[],
  now = new Date()
): ContractedForecast {
  const thisKey = monthKeyOf(todayKey(now));
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  const buckets: ForecastBucket[] = [
    { id: "this", label: "Expected this month", cents: 0, deals: [] },
    { id: "next", label: "Expected next month", cents: 0, deals: [] },
    { id: "later", label: "Later", cents: 0, deals: [] },
    { id: "nodate", label: "Contracted — no date set", cents: 0, deals: [] },
  ];
  const byId = new Map(buckets.map((b) => [b.id, b]));
  let totalCents = 0;
  let dealCount = 0;
  for (const d of deals) {
    if (d.stage !== "contracted" && d.stage !== "delivering") continue;
    const cents = d.amountCents ?? 0;
    const dueKey = d.invoiceDue ? monthKeyOf(d.invoiceDue) : null;
    const id: ForecastBucketId =
      dueKey === null
        ? "nodate"
        : dueKey <= thisKey
          ? "this"
          : dueKey === nextKey
            ? "next"
            : "later";
    const bucket = byId.get(id) as ForecastBucket;
    bucket.cents += cents;
    bucket.deals.push(d);
    totalCents += cents;
    dealCount += 1;
  }
  return { buckets, totalCents, dealCount };
}

export type MonthDetail = MonthMoney & {
  invoicedOutstandingCents: number;
  expensesCents: number;
  keptCents: number;
};

/** The chart's months with the full picture per month: paid in
 *  (identical to the chart total — one source of truth), invoiced
 *  but still unpaid by due month, expenses, and what was kept. */
export function monthsBackDetail(
  deals: GalaxyDeal[],
  income: GalaxyIncome[],
  expenses: GalaxyExpense[],
  n = 6,
  now = new Date()
): MonthDetail[] {
  return monthsBackMoney(deals, income, n, now).map((m) => {
    const expensesCents = spentInMonth(expenses, m.key);
    return {
      ...m,
      invoicedOutstandingCents: invoicedOutstandingDueInMonth(deals, m.key),
      expensesCents,
      keptCents: m.totalCents - expensesCents,
    };
  });
}

export type GapMonth = {
  key: string;
  label: string;
  long: string;
  expectedCents: number;
  gapCents: number;
  covered: boolean;
  dealsToClose: number | null;
};

export type IncomeOutlook = {
  enoughHistory: boolean;
  baselineCents: number;
  avgPaidDealCents: number | null;
  months: GapMonth[];
};

/** Income gaps. Baseline = the average monthly paid income (paid
 *  deals + payouts) across the last 6 calendar months — the same
 *  window as the money chart. A baseline is only honest when money
 *  actually came in during at least two different months and the
 *  6-month average is above zero; otherwise enoughHistory is false
 *  and NO figures are produced.
 *
 *  Expected for a month = paid so far that month + invoiced
 *  outstanding due that month + the contracted forecast for that
 *  month. dealsToClose uses the creator's real average paid deal
 *  size and is null when they have no paid deals. */
export function incomeOutlook(
  deals: GalaxyDeal[],
  income: GalaxyIncome[],
  now = new Date()
): IncomeOutlook {
  const paidMonthKeys = new Set<string>();
  for (const d of deals) if (d.stage === "paid" && d.paidOn) paidMonthKeys.add(monthKeyOf(d.paidOn));
  for (const i of income) paidMonthKeys.add(monthKeyOf(i.date));
  let monthsWithPaid = 0;
  for (const k of paidMonthKeys) if (paidInMonth(deals, income, k) > 0) monthsWithPaid += 1;

  const window = monthsBackMoney(deals, income, 6, now);
  const baselineCents = Math.round(
    window.reduce((t, m) => t + m.totalCents, 0) / window.length
  );

  const paidDeals = deals.filter((d) => d.stage === "paid");
  const avgPaidDealCents = paidDeals.length
    ? Math.round(paidDeals.reduce((t, d) => t + dealPaidCents(d), 0) / paidDeals.length)
    : null;

  const enoughHistory = monthsWithPaid >= 2 && baselineCents > 0;
  if (!enoughHistory) return { enoughHistory, baselineCents, avgPaidDealCents, months: [] };

  const forecast = contractedForecast(deals, now);
  const forecastFor = (id: ForecastBucketId) =>
    forecast.buckets.find((b) => b.id === id)?.cents ?? 0;

  const build = (firstOfMonth: Date, contractedCents: number): GapMonth => {
    const key = `${firstOfMonth.getFullYear()}-${String(firstOfMonth.getMonth() + 1).padStart(2, "0")}`;
    const expectedCents =
      paidInMonth(deals, income, key) +
      invoicedOutstandingDueInMonth(deals, key) +
      contractedCents;
    const gapCents = Math.max(0, baselineCents - expectedCents);
    return {
      key,
      label: firstOfMonth.toLocaleDateString("en-US", { month: "long" }),
      long: firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      expectedCents,
      gapCents,
      covered: gapCents === 0,
      dealsToClose:
        gapCents > 0 && avgPaidDealCents != null && avgPaidDealCents > 0
          ? Math.ceil(gapCents / avgPaidDealCents)
          : null,
    };
  };

  return {
    enoughHistory,
    baselineCents,
    avgPaidDealCents,
    months: [
      build(new Date(now.getFullYear(), now.getMonth(), 1), forecastFor("this")),
      build(new Date(now.getFullYear(), now.getMonth() + 1, 1), forecastFor("next")),
    ],
  };
}

/* ---------------- Brand Deal Protection (System #2) -----------------
 * One protection record per deal (public.deal_protection): the
 * contract review checklist + the creator's own evidence of what
 * was agreed. The gaps below are computed ONLY from the record —
 * a missing record counts as nothing checked yet. Warnings never
 * fire for paid or lost deals: the deal is finished, and nagging
 * about paperwork on a finished deal protects nobody. For pitched
 * deals the gaps compute the same way; the board simply doesn't
 * display them (the sheet does) so early pitches stay quiet. */

export type DealProtection = {
  dealId: string;
  contractReviewed: boolean;
  deliverablesAgreed: boolean;
  paymentTermsAgreed: boolean;
  usageRightsSet: boolean;
  exclusivityChecked: boolean;
  usageRightsNote: string;
  exclusivityNote: string;
  termsNote: string;
};

export function emptyProtection(dealId: string): DealProtection {
  return {
    dealId,
    contractReviewed: false,
    deliverablesAgreed: false,
    paymentTermsAgreed: false,
    usageRightsSet: false,
    exclusivityChecked: false,
    usageRightsNote: "",
    exclusivityNote: "",
    termsNote: "",
  };
}

export type ProtectionRowLike = {
  deal_id: string;
  contract_reviewed: boolean;
  deliverables_agreed: boolean;
  payment_terms_agreed: boolean;
  usage_rights_set: boolean;
  exclusivity_checked: boolean;
  usage_rights_note: string;
  exclusivity_note: string;
  terms_note: string;
};

export function rowToProtection(r: ProtectionRowLike): DealProtection {
  return {
    dealId: r.deal_id,
    contractReviewed: r.contract_reviewed,
    deliverablesAgreed: r.deliverables_agreed,
    paymentTermsAgreed: r.payment_terms_agreed,
    usageRightsSet: r.usage_rights_set,
    exclusivityChecked: r.exclusivity_checked,
    usageRightsNote: r.usage_rights_note ?? "",
    exclusivityNote: r.exclusivity_note ?? "",
    termsNote: r.terms_note ?? "",
  };
}

export type ProtectionGapId =
  | "contract"
  | "usage"
  | "exclusivity"
  | "deliverables"
  | "payment";

export type ProtectionGap = { id: ProtectionGapId; text: string };

/** The open protection items on a deal, in the owner's rule order.
 *  Empty for paid/lost deals (never warn) and for a deal whose
 *  record is complete. A null/undefined record = nothing checked. */
export function protectionGaps(
  deal: GalaxyDeal,
  protection: DealProtection | null | undefined
): ProtectionGap[] {
  if (deal.stage === "paid" || deal.stage === "lost") return [];
  const p = protection ?? emptyProtection(deal.id);
  const gaps: ProtectionGap[] = [];
  if (!p.contractReviewed)
    gaps.push({ id: "contract", text: "Contract not marked reviewed" });
  if (!p.usageRightsSet)
    gaps.push({ id: "usage", text: "Usage rights not recorded" });
  if (!p.exclusivityChecked)
    gaps.push({ id: "exclusivity", text: "Exclusivity not checked" });
  if (!p.deliverablesAgreed)
    gaps.push({ id: "deliverables", text: "Deliverables not confirmed in writing" });
  if (!p.paymentTermsAgreed)
    gaps.push({ id: "payment", text: "Payment terms not confirmed" });
  return gaps;
}
