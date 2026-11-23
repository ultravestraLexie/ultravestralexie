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
  return "$" + Math.round((cents ?? 0) / 100).toLocaleString("en-US");
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
