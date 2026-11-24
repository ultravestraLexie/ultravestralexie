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

/** Whole days from date key a to date key b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / DAY);
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
  /** Full-precision updated_at (ISO timestamp) from the row.
   *  lastContact above is its calendar-date part, for display;
   *  prune decisions use this field, never the date — two writes
   *  on the same day must stay distinguishable. Optional because
   *  hand-built literals (fixtures, seeds) may omit it; a missing
   *  timestamp simply never wins a time comparison. */
  updatedAt?: string;
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
    updatedAt: r.updated_at ?? "",
    dueOn: r.deadline,
    invoiceSentOn: r.invoice_sent_date,
    invoiceDue: r.payment_due_date,
    paidOn: r.payment_received_date,
  };
}

/** Fingerprint of every field a deal write can change. Two deal
 *  objects with the same fingerprint are the same committed state
 *  for everything the Galaxy views render. */
export function dealWriteFingerprint(d: GalaxyDeal): string {
  return JSON.stringify([
    d.brandName,
    d.platform,
    d.stage,
    d.amountCents,
    d.receivedCents,
    d.deliverables,
    d.notes,
    d.dueOn,
    d.invoiceSentOn,
    d.invoiceDue,
    d.paidOn,
    d.lastContact,
  ]);
}

/* -------- live deal sync (mutation responses over server props) --------
 * A deal write's response body IS the committed row (the deals API
 * awaits the update's .select() before responding), so hosts apply
 * it locally the moment the write succeeds instead of relying only
 * on router.refresh() — a fire-and-forget RSC refetch whose payload
 * can be rendered from a read that predates the latest write when
 * advances happen in rapid succession. The refresh still runs as a
 * backstop for server-computed props; these helpers decide what the
 * screen shows in the meantime, deterministically. */

/** Server rows in server order, with any locally-applied write
 *  results laid over them by id; write results the server list does
 *  not contain yet (a just-created deal) append at the end, where
 *  the server's created_at ordering will put them too. */
export function mergeDealUpdates(
  server: GalaxyDeal[],
  updates: Record<string, GalaxyDeal>
): GalaxyDeal[] {
  if (Object.keys(updates).length === 0) return server;
  const seen = new Set<string>();
  const out = server.map((d) => {
    seen.add(d.id);
    return updates[d.id] ?? d;
  });
  for (const d of Object.values(updates)) {
    if (!seen.has(d.id)) out.push(d);
  }
  return out;
}

/** Drop locally-applied writes the server rows have caught up
 *  with. A write is pruned ONLY when the server row demonstrably
 *  carries it or supersedes it:
 *
 *  - CARRIED: the server row's fingerprint equals the write's —
 *    stage and every writable field match, so the server row IS
 *    the write's committed state and server truth owns the row.
 *  - SUPERSEDED: the server row's full-precision updated_at is
 *    STRICTLY LATER than the write's. A row read is atomic, so a
 *    later updated_at can only come from a different write that
 *    committed after ours (e.g. an edit in another tab); that
 *    newer state wins. An EQUAL timestamp is our own write (or a
 *    same-instant one) and a SMALLER one is a raced refresh whose
 *    read predates our write — neither may prune: time alone,
 *    at equal or earlier values, proves nothing about the stage.
 *
 *  (Round 1 compared lastContact here — a calendar DATE, so two
 *  writes on the same day were indistinguishable and the test was
 *  time-based rather than state-based. updatedAt carries the full
 *  timestamp. Both rows pass through rowToDeal from the same
 *  stored column, so the comparison is like-for-like.)
 *
 *  A server row that is OLDER than the applied write is a raced
 *  refresh: the write stays. Returns the same reference when
 *  nothing was pruned. */
export function pruneDealUpdates(
  server: GalaxyDeal[],
  updates: Record<string, GalaxyDeal>
): Record<string, GalaxyDeal> {
  const byId = new Map(server.map((d) => [d.id, d]));
  let next: Record<string, GalaxyDeal> | null = null;
  for (const [id, u] of Object.entries(updates)) {
    const s = byId.get(id);
    if (!s) continue;
    const carried = dealWriteFingerprint(s) === dealWriteFingerprint(u);
    const superseded =
      (s.updatedAt ?? "") !== "" &&
      (u.updatedAt ?? "") !== "" &&
      (s.updatedAt as string) > (u.updatedAt as string);
    if (carried || superseded) {
      if (!next) next = { ...updates };
      delete next[id];
    }
  }
  return next ?? updates;
}

/* -------- the committed-write store ----------------------------------
 * The writes above live in a store that OUTLIVES any single host
 * component. Round 1 kept them in useState inside the sync hook —
 * i.e. in the Deals board component's own state — so if a raced
 * router.refresh() payload application remounted or reset that
 * component between a write landing and the sheet closing, the
 * overlay vanished and the board fell back to the payload's
 * pre-write snapshot until the next refresh arrived (battAH
 * round 2: the invoice step rendered in its old column at first
 * look, then self-corrected seconds later). Hosts now subscribe
 * to a module-level store instead: a remounted host re-derives
 * the merged deals from the store on its very first render, so
 * the first post-close render shows the committed write no
 * matter what the refresh cycle did to the component tree. */

export type DealWriteStore = {
  /** Record a committed write result (from the API response). */
  apply(deal: GalaxyDeal): void;
  /** Drop writes the given server rows have caught up with. */
  prune(server: GalaxyDeal[]): void;
  /** Current applied writes, keyed by deal id. The reference is
   *  stable until a write is applied or pruned away. */
  snapshot(): Record<string, GalaxyDeal>;
  subscribe(listener: () => void): () => void;
};

export function createDealWriteStore(): DealWriteStore {
  let writes: Record<string, GalaxyDeal> = {};
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of [...listeners]) l();
  };
  return {
    apply(deal) {
      writes = { ...writes, [deal.id]: deal };
      emit();
    },
    prune(server) {
      const next = pruneDealUpdates(server, writes);
      if (next !== writes) {
        writes = next;
        emit();
      }
    },
    snapshot() {
      return writes;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
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
  /** True only when at least one brand_evidence row is on file
   *  for this brand (System #3 verified-identity rule). */
  verified: boolean;
  /** Where this listing's information comes from (trust queue
   *  #5), derived by brandProvenance from the same evidence rows
   *  + program. Optional: older constructors omit it. */
  provenance?: BrandProvenance;
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

/* ---------------- Verified Brand Opportunities (System #3) ----------------
 * Every surface in this section stands on the creator's own rows
 * or on research artifacts actually on file. The owner's hard
 * line: no fake opportunities, no misleading earning promises. */

/** Verified identity: a brand is verified only when at least one
 *  brand_evidence row is on file for it — a real verification
 *  artifact with a source URL. No evidence, no badge, no
 *  exceptions. */
export function brandIsVerified(evidenceCount: number): boolean {
  return evidenceCount >= 1;
}

/** The niche predicate Today's matchesToPitch uses, extracted so
 *  Brands' "For your niche" filter applies the identical rule:
 *  with no niche set everything matches; otherwise the brand's
 *  primary category or any of its categories must be the niche. */
export function brandMatchesNiche(b: GalaxyBrand, niche: string): boolean {
  return !niche || b.category === niche || b.categories.includes(niche);
}

/** Deals belonging to a brand: by brand id when a deal carries
 *  one, else by exact brand name — the matching the codebase
 *  already uses everywhere (creator_deals rows carry a brand
 *  name; the id exists only on proposal-linked deals). */
export function dealsForBrand(
  deals: GalaxyDeal[],
  brand: { id: string; name: string }
): GalaxyDeal[] {
  return deals.filter((d) =>
    d.brandId ? d.brandId === brand.id : d.brandName === brand.name
  );
}

/** The application state shown for a brand, from the creator's
 *  own deal with it: the stage in plain words, with the pitch
 *  date while a pitch is fresh. */
export function applicationLabel(d: GalaxyDeal): string {
  switch (d.stage) {
    case "pitched":
      return `Pitched ${fmtDate(d.pitchedOn)}`;
    case "negotiating":
      return "Negotiating";
    case "contracted":
      return "Contracted";
    case "delivering":
      return "Delivering";
    case "invoiced":
      return "Invoiced";
    case "paid":
      return "Paid ✓";
    case "lost":
      return "Closed";
  }
}

/** The creator's current application to a brand: their most
 *  recently active deal with it (full updated timestamp first,
 *  then last-contact date, then pitch date). */
export function currentApplication(deals: GalaxyDeal[]): GalaxyDeal | null {
  if (deals.length === 0) return null;
  const key = (d: GalaxyDeal) => d.updatedAt || d.lastContact || d.pitchedOn;
  return deals.reduce((a, b) => (key(b) > key(a) ? b : a));
}

export type BrandPaymentHistory = {
  totalPaidCents: number;
  paidDeals: number;
  /** Average days from invoice sent to payment received across
   *  the paid deals that carry BOTH dates; null when no paid deal
   *  carries both. A paid deal missing either date counts toward
   *  the totals but never toward the average. */
  avgDaysToPay: number | null;
};

/** Payment reputation from the creator's OWN paid deals only.
 *  There is no cross-creator payment data on the platform and
 *  none is invented here. Returns null when the creator has no
 *  paid deal in the set — surfaces then show nothing. */
export function brandPaymentHistory(
  deals: GalaxyDeal[]
): BrandPaymentHistory | null {
  const paid = deals.filter((d) => d.stage === "paid");
  if (paid.length === 0) return null;
  let total = 0;
  let days = 0;
  let timed = 0;
  for (const d of paid) {
    total += dealPaidCents(d);
    if (d.invoiceSentOn && d.paidOn) {
      days += daysBetween(d.invoiceSentOn, d.paidOn);
      timed += 1;
    }
  }
  return {
    totalPaidCents: total,
    paidDeals: paid.length,
    avgDaysToPay: timed > 0 ? Math.round(days / timed) : null,
  };
}

/* ---------------- profile ---------------- */

export type GalaxyProfile = {
  name: string;
  niche: string;
  categories: string[];
  platforms: string[];
  audience: string;
  weeklyGoal: number;
  /** The business-profile description (creator_business_profiles
   *  .business_description). Optional: older constructors omit it;
   *  the Creator Loop's Grow checklist reads it as the bio. */
  description?: string;
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
        brandMatchesNiche(b, niche)
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
  /* Creator Business Advisor (System #5): concentration risk.
   *  One brand at 60%+ of the creator's paid-deal income over the
   *  last 6 months is a weak income source made visible — but
   *  only with at least two paid deals: a single paid deal is
   *  trivially 100% and proves no pattern. */
  const concentration = incomeConcentration(input.deals, now);
  if (
    concentration &&
    concentration.paidDealCount >= 2 &&
    concentration.topSharePct >= 60
  ) {
    out.push({
      kind: "risk",
      priority: 58,
      title: `${concentration.topBrandName} is ${concentration.topSharePct}% of your deal income`,
      why: "One brand brings in most of your paid deal money — if they pause, the month breaks.",
      cta: "Pitch someone new",
      act: "go",
      to: "/brands",
    });
  }
  const pitchMatches = matchesToPitch(input, 3);
  for (const b of pitchMatches) {
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
  /* Creator Business Advisor (System #5): a saved brand the
   *  creator never pitched is a neglected opportunity. Fires for
   *  the first such brand that the pitch matches above did NOT
   *  already produce an action for — never a duplicate. */
  const neglectedPick = neglectedOpportunities(input.deals, input.brands).find(
    (b) => !pitchMatches.some((m) => m.id === b.id)
  );
  if (neglectedPick) {
    const bits = ["Saved by you", "accepting now"];
    if (neglectedPick.rate != null)
      bits.push(`${neglectedPick.rate}% commission, ${CAP_LABEL[neglectedPick.cap].toLowerCase()}`);
    out.push({
      kind: "pitch",
      priority: 34,
      brandId: neglectedPick.id,
      title: `You saved ${neglectedPick.name} — pitch them`,
      why: bits.join(", ") + ". You have not pitched them yet.",
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

/* ---------------- Creator Pricing Intelligence (System #4) ----------
 * The owner is explicit: creators don't know what to charge. This
 * section answers with the ONLY two honest sources of numbers —
 * the creator's own inputs and their own deal history. There is
 * NO market-rate data anywhere in this app and none is invented
 * here: no benchmark, no "creators like you charge…", no derived
 * per-view rate from history (history has fees but no view counts,
 * so a per-1k price can never be back-solved from it). Prefilled
 * uplift percentages are editable EXAMPLES and are labelled as
 * such on screen. Every formula is disclosed in plain words next
 * to its result ("How this is figured"). All money is integer
 * cents; inputs are clamped to finite, non-negative values. */

export type PricingInputs = {
  /** Average views per video (creator-entered). */
  avgViews: number;
  /** Creator-set price per 1,000 views, in cents. */
  pricePer1kCents: number;
  /** Videos in the package. */
  videos: number;
  /** Hours the package takes. */
  hours: number;
  /** Target hourly rate, in cents. */
  hourlyRateCents: number;
  /** Months of paid usage (ads / whitelisting). */
  usageMonths: number;
  /** Usage uplift, percent of base PER MONTH (editable example). */
  usageUpliftPct: number;
  /** Months of category exclusivity. */
  exclusivityMonths: number;
  /** Exclusivity uplift, percent of base PER MONTH (editable example). */
  exclusivityUpliftPct: number;
};

const cleanNum = (n: number): number =>
  Number.isFinite(n) && n > 0 ? n : 0;

export type QuoteBaseSource = "views" | "time" | "tie" | "none";

export type PricingQuote = {
  viewPriceCents: number;
  timeFloorCents: number;
  baseCents: number;
  baseSource: QuoteBaseSource;
  usageFeeCents: number;
  exclusivityFeeCents: number;
  totalCents: number;
};

/** The quote. Two independent ways to price the content itself —
 *  what the views are worth at the creator's own per-1k price, and
 *  the time floor (hours × their target hourly rate) — and the
 *  base is the HIGHER of the two, so a quote never underprices the
 *  creator's time nor their reach. Usage and exclusivity are
 *  additive on the base: base × uplift% × months each. */
export function computeQuote(input: PricingInputs): PricingQuote {
  const avgViews = cleanNum(input.avgViews);
  const pricePer1kCents = cleanNum(input.pricePer1kCents);
  const videos = cleanNum(input.videos);
  const hours = cleanNum(input.hours);
  const hourlyRateCents = cleanNum(input.hourlyRateCents);
  const usageMonths = cleanNum(input.usageMonths);
  const usageUpliftPct = cleanNum(input.usageUpliftPct);
  const exclusivityMonths = cleanNum(input.exclusivityMonths);
  const exclusivityUpliftPct = cleanNum(input.exclusivityUpliftPct);

  const viewPriceCents = Math.round((avgViews / 1000) * pricePer1kCents * videos);
  const timeFloorCents = Math.round(hours * hourlyRateCents);
  const baseCents = Math.max(viewPriceCents, timeFloorCents);
  const baseSource: QuoteBaseSource =
    baseCents === 0
      ? "none"
      : viewPriceCents === timeFloorCents
        ? "tie"
        : viewPriceCents > timeFloorCents
          ? "views"
          : "time";
  const usageFeeCents = Math.round(baseCents * (usageUpliftPct / 100) * usageMonths);
  const exclusivityFeeCents = Math.round(
    baseCents * (exclusivityUpliftPct / 100) * exclusivityMonths
  );
  return {
    viewPriceCents,
    timeFloorCents,
    baseCents,
    baseSource,
    usageFeeCents,
    exclusivityFeeCents,
    totalCents: baseCents + usageFeeCents + exclusivityFeeCents,
  };
}

/** A compact dollars-and-cents formatter for the pricing surface,
 *  where exact cents matter (rates, per-hour figures). fmtMoney
 *  rounds to whole dollars for the money views; pricing shows the
 *  real cents so the arithmetic on screen always adds up. */
export function fmtMoneyExact(cents: number | null | undefined): string {
  const v = (cents ?? 0) / 100;
  const sign = v < 0 ? "−$" : "$";
  return (
    sign +
    Math.abs(v).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Plain number for formulas: trims a trailing .0 ("10", "2.5"). */
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export type QuoteLine = {
  id: "base" | "usage" | "exclusivity";
  label: string;
  detail: string;
  cents: number;
};

/** The itemised quote, exactly as shown on screen — the fixtures
 *  pin that these lines always sum to the quote total. Details
 *  spell out the arithmetic in plain words (the on-screen "How
 *  this is figured" disclosure). Usage / exclusivity lines appear
 *  only when their months are set; a zero base produces no lines. */
export function quoteLines(input: PricingInputs, quote: PricingQuote): QuoteLine[] {
  if (quote.baseCents === 0) return [];
  const videos = cleanNum(input.videos);
  const baseDetail =
    quote.baseSource === "time"
      ? `${fmtNum(cleanNum(input.hours))} hours × ${fmtMoneyExact(cleanNum(input.hourlyRateCents))} an hour — your time floor, the higher of the two ways to price it`
      : quote.baseSource === "views"
        ? `${fmtNum(cleanNum(input.avgViews))} average views × ${fmtMoneyExact(cleanNum(input.pricePer1kCents))} per 1,000 views × ${plural(videos, "video")} — your view price, the higher of the two ways to price it`
        : `Your view price and your time floor both come to ${fmtMoneyExact(quote.baseCents)}`;
  const lines: QuoteLine[] = [
    {
      id: "base",
      label: videos > 0 ? `Content — ${plural(videos, "video")}` : "Content",
      detail: baseDetail,
      cents: quote.baseCents,
    },
  ];
  const usageMonths = cleanNum(input.usageMonths);
  if (usageMonths > 0) {
    lines.push({
      id: "usage",
      label: `Usage rights — ${plural(usageMonths, "month")}`,
      detail: `${fmtMoneyExact(quote.baseCents)} base × ${fmtNum(cleanNum(input.usageUpliftPct))}% per month × ${plural(usageMonths, "month")} of paid usage (ads, whitelisting)`,
      cents: quote.usageFeeCents,
    });
  }
  const exclusivityMonths = cleanNum(input.exclusivityMonths);
  if (exclusivityMonths > 0) {
    lines.push({
      id: "exclusivity",
      label: `Exclusivity — ${plural(exclusivityMonths, "month")}`,
      detail: `${fmtMoneyExact(quote.baseCents)} base × ${fmtNum(cleanNum(input.exclusivityUpliftPct))}% per month × ${plural(exclusivityMonths, "month")} of category exclusivity`,
      cents: quote.exclusivityFeeCents,
    });
  }
  return lines;
}

/** The creator's average PAID deal fee from their own history —
 *  the only history anchor the rate calculator shows. Null when
 *  they have no paid deals: no anchor is invented. */
export function averagePaidFeeCents(deals: GalaxyDeal[]): number | null {
  const paid = deals.filter((d) => d.stage === "paid");
  if (paid.length === 0) return null;
  return Math.round(
    paid.reduce((t, d) => t + dealPaidCents(d), 0) / paid.length
  );
}

export type ProfitabilityInput = {
  feeCents: number;
  hours: number;
  hourlyRateCents: number;
  costsCents: number;
};

export type Profitability = {
  /** fee − hours × target rate − costs. */
  profitCents: number;
  /** (fee − costs) / hours; null when hours is 0 — dividing by
   *  zero hours would invent a rate, so there is no verdict. */
  effectiveHourlyCents: number | null;
  /** The fee at which the effective hourly exactly hits the
   *  target: hours × target rate + costs. Null when hours is 0. */
  feeNeededCents: number | null;
  verdict: "above" | "at" | "below" | "unknown";
};

/** What a deal actually pays the creator once their time is
 *  priced at their own target rate. */
export function dealProfitability(input: ProfitabilityInput): Profitability {
  const feeCents = cleanNum(input.feeCents);
  const hours = cleanNum(input.hours);
  const hourlyRateCents = cleanNum(input.hourlyRateCents);
  const costsCents = cleanNum(input.costsCents);
  const timeCostCents = Math.round(hours * hourlyRateCents);
  const profitCents = feeCents - timeCostCents - costsCents;
  if (hours === 0) {
    return { profitCents, effectiveHourlyCents: null, feeNeededCents: null, verdict: "unknown" };
  }
  const effectiveHourlyCents = Math.round((feeCents - costsCents) / hours);
  return {
    profitCents,
    effectiveHourlyCents,
    feeNeededCents: timeCostCents + costsCents,
    verdict:
      effectiveHourlyCents > hourlyRateCents
        ? "above"
        : effectiveHourlyCents < hourlyRateCents
          ? "below"
          : "at",
  };
}

export type NegotiationPrep = {
  avgPaidFeeCents: number | null;
  paidDealCount: number;
  /** Fastest payment the creator has actually experienced: the
   *  fewest days from invoice sent to payment received across
   *  their paid deals carrying both dates (a payment logged
   *  before its invoice date counts as 0 — paid immediately).
   *  Null when no paid deal carries both dates. */
  fastestDaysToPay: number | null;
  /** Typical payment speed from System #3's brandPaymentHistory
   *  over ALL the creator's paid deals (same invoice-sent →
   *  payment-received rule); null under the same condition. */
  avgDaysToPay: number | null;
  timedDeals: number;
};

/** Negotiation prep inputs, all from the creator's real rows. */
export function negotiationPrep(deals: GalaxyDeal[]): NegotiationPrep {
  const history = brandPaymentHistory(deals);
  let fastest: number | null = null;
  let timed = 0;
  for (const d of deals) {
    if (d.stage !== "paid" || !d.invoiceSentOn || !d.paidOn) continue;
    const days = Math.max(0, daysBetween(d.invoiceSentOn, d.paidOn));
    fastest = fastest === null ? days : Math.min(fastest, days);
    timed += 1;
  }
  return {
    avgPaidFeeCents: averagePaidFeeCents(deals),
    paidDealCount: deals.filter((d) => d.stage === "paid").length,
    fastestDaysToPay: fastest,
    avgDaysToPay: history?.avgDaysToPay ?? null,
    timedDeals: timed,
  };
}

/** A copyable counter-offer in the creator's own voice, built
 *  from the quote they just figured: total first, then the
 *  itemised terms in plain language. Usage / exclusivity lines
 *  appear only when those rights are part of the quote. */
export function counterOfferText(
  profile: GalaxyProfile,
  input: PricingInputs,
  quote: PricingQuote,
  brandName?: string
): string {
  const videos = cleanNum(input.videos);
  const usageMonths = cleanNum(input.usageMonths);
  const exclusivityMonths = cleanNum(input.exclusivityMonths);
  const parts: string[] = [
    `Hi ${brandName ? `${brandName} team` : "team"},`,
    "",
    `Thanks for the offer. For this package my rate is ${fmtMoneyExact(quote.totalCents)}:`,
    "",
    `- ${fmtMoneyExact(quote.baseCents)} for the content${videos > 0 ? ` (${plural(videos, "video")})` : ""}`,
  ];
  if (usageMonths > 0 && quote.usageFeeCents > 0)
    parts.push(
      `- ${fmtMoneyExact(quote.usageFeeCents)} for ${plural(usageMonths, "month")} of paid usage rights (ads and whitelisting)`
    );
  if (exclusivityMonths > 0 && quote.exclusivityFeeCents > 0)
    parts.push(
      `- ${fmtMoneyExact(quote.exclusivityFeeCents)} for ${plural(exclusivityMonths, "month")} of category exclusivity`
    );
  parts.push(
    "",
    "Usage and exclusivity are priced separately from the content fee, so you only pay for the rights you actually use. If you want a shorter usage or exclusivity period, the total adjusts with it.",
    "",
    profile.name || "Your name"
  );
  return parts.join("\n");
}

/* ---------------- Creator Business Advisor (System #5) -------------
 * The advisor layer on Today: DIAGNOSTICS, not a second action
 * list. Every figure below is computed from the creator's own
 * records under the owner's rule — every recommendation uses the
 * creator's actual business information. Nothing is benchmarked,
 * estimated or invented: a pattern that isn't in the rows is
 * reported as not there. */

export type IncomeConcentration = {
  topBrandName: string;
  /** Top brand's share of paid-deal income, whole percent. */
  topSharePct: number;
  topCents: number;
  totalCents: number;
  paidDealCount: number;
  /** Distinct brands among the paid deals in the window. */
  payingBrands: number;
  /** Months in the window whose paid-deal income was above zero. */
  monthsWithIncome: number;
};

/** Income concentration over PAID DEALS ONLY, last 6 calendar
 *  months (the same window as the money chart). Payout/income
 *  entries are a different source with no brand attached, so they
 *  are never blended in — the panel says the share is figured
 *  from paid deals. Returns null when no deal was paid in the
 *  window: there is no income pattern to read. */
export function incomeConcentration(
  deals: GalaxyDeal[],
  now = new Date()
): IncomeConcentration | null {
  const windowKeys = new Set(monthsBackMoney(deals, [], 6, now).map((m) => m.key));
  const paid = deals.filter(
    (d) => d.stage === "paid" && d.paidOn && windowKeys.has(monthKeyOf(d.paidOn))
  );
  if (paid.length === 0) return null;
  const byBrand = new Map<string, number>();
  const byMonth = new Map<string, number>();
  let total = 0;
  for (const d of paid) {
    const cents = dealPaidCents(d);
    byBrand.set(d.brandName, (byBrand.get(d.brandName) ?? 0) + cents);
    const mk = monthKeyOf(d.paidOn as string);
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + cents);
    total += cents;
  }
  let topBrandName = "";
  let topCents = -1;
  for (const [name, cents] of byBrand) {
    if (cents > topCents) {
      topBrandName = name;
      topCents = cents;
    }
  }
  return {
    topBrandName,
    topSharePct: total > 0 ? Math.round((topCents / total) * 100) : 0,
    topCents,
    totalCents: total,
    paidDealCount: paid.length,
    payingBrands: byBrand.size,
    monthsWithIncome: [...byMonth.values()].filter((c) => c > 0).length,
  };
}

/** Neglected opportunities: brands the creator SAVED, that are
 *  accepting, and that they have NEVER pitched — no deal with the
 *  brand in any stage, live or lost (a brand already pitched and
 *  lost was not neglected; it was tried). Matching is by brand id
 *  when a deal carries one, else by name — the matching the
 *  codebase uses everywhere. Best first: uncapped, then highest
 *  commission (the matchesToPitch order, minus the niche rule —
 *  a saved brand is the creator's own pick, niche or not). */
export function neglectedOpportunities(
  deals: GalaxyDeal[],
  brands: GalaxyBrand[]
): GalaxyBrand[] {
  const dealBrandIds = new Set(deals.map((d) => d.brandId).filter(Boolean));
  const dealNames = new Set(deals.map((d) => d.brandName.toLowerCase()));
  return brands
    .filter(
      (b) =>
        b.saved &&
        b.accepting &&
        !dealBrandIds.has(b.id) &&
        !dealNames.has(b.name.toLowerCase())
    )
    .sort(
      (a, b) =>
        Number(b.cap === "uncapped") - Number(a.cap === "uncapped") ||
        (b.rate ?? 0) - (a.rate ?? 0)
    );
}

export type AdvisorReport = {
  concentration: IncomeConcentration | null;
  /** Neglected brands to show (at most 3). */
  neglected: GalaxyBrand[];
  /** Total neglected brands, shown and unshown. */
  neglectedCount: number;
  /** Next month's gap read from the Money Center's incomeOutlook
   *  — the same math Money shows. Null when history is
   *  insufficient: Money already carries the honest empty state,
   *  so the advisor omits the line instead of repeating a
   *  non-answer. */
  weekAhead: GapMonth | null;
  /** The baseline weekAhead is measured against (valid whenever
   *  weekAhead is non-null). */
  baselineCents: number;
};

/** The full advisor read for Today, from the rows the page
 *  already loads: deals (incl. paid history), brands (incl.
 *  saved) and payout/income entries. */
export function computeAdvisor(
  input: { deals: GalaxyDeal[]; brands: GalaxyBrand[]; income: GalaxyIncome[] },
  now = new Date()
): AdvisorReport {
  const neglectedAll = neglectedOpportunities(input.deals, input.brands);
  const outlook = incomeOutlook(input.deals, input.income, now);
  return {
    concentration: incomeConcentration(input.deals, now),
    neglected: neglectedAll.slice(0, 3),
    neglectedCount: neglectedAll.length,
    weekAhead: outlook.enoughHistory ? (outlook.months[1] ?? null) : null,
    baselineCents: outlook.baselineCents,
  };
}

/** Today's first move: the title of the single highest-priority
 *  insight the existing engine produced (the list arrives sorted,
 *  highest first). Null when the list is empty — the panel then
 *  shows the engine's own honest empty line. */
export function firstMoveTitle(insights: Insight[]): string | null {
  return insights.length ? insights[0].title : null;
}

/* ---------------- Audience Independence Center (System #6) ----------
 * The owner's problem statement: creators depend too heavily on
 * social platforms and their algorithms. This section tracks the
 * audience the creator ENTERS BY HAND (public.audience_snapshots)
 * — there are no platform API connections, and every figure here
 * is computed only from the creator's own snapshots. The email
 * list is the owned antidote: it counts toward total reach and
 * the owned share, but it is EXCLUDED from platform reach and
 * from the dependency share — a big list must never make the
 * platform risk look bigger, and a platform must never get credit
 * for the audience the creator actually owns.
 *
 * Snapshots are ordered newest-first per platform by captured_on,
 * ties broken by created_at (the later entry wins — it is the
 * correction). Growth needs two snapshots: with only one, growth
 * is null (there is no story yet), never zero-by-default. */

export const AUDIENCE_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "x",
  "facebook",
  "twitch",
  "podcast",
  "email",
  "other",
] as const;

export type AudiencePlatform = (typeof AUDIENCE_PLATFORMS)[number];

export const isAudiencePlatform = (p: string): p is AudiencePlatform =>
  (AUDIENCE_PLATFORMS as readonly string[]).includes(p);

/** Display label for an audience platform — the email list is
 *  named for what it is: the audience the creator owns. */
export const audiencePlatformLabel = (p: string): string =>
  p === "email" ? "Email list" : platformLabel(p);

/** Platform options for the log form: the creator's own profile
 *  platforms first (those the snapshot enum can hold), then the
 *  rest of the enum in canonical order. The email list is in the
 *  enum, so it is always available. */
export function audiencePlatformOptions(profilePlatforms: string[]): string[] {
  const own = profilePlatforms
    .map((p) => p.toLowerCase())
    .filter((p, i, arr) => isAudiencePlatform(p) && arr.indexOf(p) === i);
  const rest = AUDIENCE_PLATFORMS.filter((p) => !own.includes(p));
  return [...own, ...rest];
}

export type AudienceSnapshot = {
  id: string;
  platform: string;
  followers: number;
  engagementPct: number | null;
  /** YYYY-MM-DD the creator says the numbers are as of. */
  capturedOn: string;
  createdAt: string;
};

export type AudienceRowLike = {
  id: string;
  platform: string;
  followers: number;
  engagement_pct: number | string | null;
  captured_on: string;
  created_at: string;
};

export function rowToSnapshot(r: AudienceRowLike): AudienceSnapshot {
  return {
    id: r.id,
    platform: r.platform,
    followers: r.followers,
    engagementPct: r.engagement_pct == null ? null : Number(r.engagement_pct),
    capturedOn: String(r.captured_on).slice(0, 10),
    createdAt: r.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Support — somewhere to go when something breaks (trust queue #1,  */
/* owner order 2026-11-23). A signed-in creator files a request from  */
/* the Support page; the row lands in public.support_tickets and a    */
/* person answers by email. The category list is closed and shared:   */
/* the form, the API validation and the table's check constraint all  */
/* use exactly these six values — the fixtures pin that the SQL and   */
/* this list cannot drift apart.                                     */
/* ------------------------------------------------------------------ */

export const SUPPORT_CATEGORIES = [
  "billing",
  "account-access",
  "deals-money",
  "passport",
  "bug",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const isSupportCategory = (c: string): c is SupportCategory =>
  (SUPPORT_CATEGORIES as readonly string[]).includes(c);

/** Display label for a support category — the words the creator
 *  picked from, shown back on their request list. */
export const supportCategoryLabel = (c: string): string =>
  ({
    billing: "Billing",
    "account-access": "Account access",
    "deals-money": "Deals & money records",
    passport: "Passport",
    bug: "Bug — something is broken",
    other: "Something else",
  })[c] ?? "Something else";

export type SupportTicket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  contactEmail: string;
  status: string;
  createdAt: string;
};

export type SupportTicketRowLike = {
  id: string;
  category: string;
  subject: string;
  message: string;
  contact_email: string;
  status: string;
  created_at: string;
};

export function rowToSupportTicket(r: SupportTicketRowLike): SupportTicket {
  return {
    id: r.id,
    category: r.category,
    subject: r.subject,
    message: r.message,
    contactEmail: r.contact_email,
    status: r.status,
    createdAt: r.created_at,
  };
}

/** The reference a creator quotes back to us: the first block of
 *  the row's own id — a real value from the insert, never invented. */
export const supportTicketRef = (t: Pick<SupportTicket, "id">): string =>
  t.id.slice(0, 8);

/** Status words for the creator's own list: a fresh request is
 *  "Received"; any later state shows the stored word as written. */
export const supportStatusLabel = (status: string): string =>
  status === "open" ? "Received" : status;

/** Newest first: later captured_on wins; on the same day, the
 *  later-entered row wins (it is the correction). */
function byRecency(a: AudienceSnapshot, b: AudienceSnapshot): number {
  if (a.capturedOn !== b.capturedOn)
    return b.capturedOn.localeCompare(a.capturedOn);
  return b.createdAt.localeCompare(a.createdAt);
}

/** Snapshots for one platform, newest first. */
export function platformHistory(
  snapshots: AudienceSnapshot[],
  platform: string
): AudienceSnapshot[] {
  return snapshots.filter((s) => s.platform === platform).sort(byRecency);
}

/** The latest snapshot per platform that has one, keyed by
 *  platform. Platforms never logged are absent, not zero. */
export function latestPerPlatform(
  snapshots: AudienceSnapshot[]
): Map<string, AudienceSnapshot> {
  const out = new Map<string, AudienceSnapshot>();
  for (const s of [...snapshots].sort(byRecency)) {
    if (!out.has(s.platform)) out.set(s.platform, s);
  }
  return out;
}

export type EngagementTrend = "up" | "down" | "flat";

export type PlatformStanding = {
  platform: string;
  /** Latest snapshot's follower count. */
  followers: number;
  /** Latest snapshot's date (YYYY-MM-DD). */
  capturedOn: string;
  /** Latest snapshot's engagement %, when the creator entered it. */
  engagementPct: number | null;
  /** Latest − previous followers; null with a single snapshot. */
  growthSinceLast: number | null;
  /** Latest − first followers; null with a single snapshot. */
  growthSinceFirst: number | null;
  /** Latest vs previous engagement %; null when either is missing
   *  (or there is no previous snapshot). */
  engagementTrend: EngagementTrend | null;
};

/** One standing per tracked platform, biggest audience first
 *  (ties by platform name). Empty input → empty list. */
export function audienceStandings(
  snapshots: AudienceSnapshot[]
): PlatformStanding[] {
  const platforms = [...new Set(snapshots.map((s) => s.platform))];
  const out: PlatformStanding[] = platforms.map((platform) => {
    const hist = platformHistory(snapshots, platform);
    const latest = hist[0];
    const previous = hist[1] ?? null;
    const first = hist[hist.length - 1];
    let engagementTrend: EngagementTrend | null = null;
    if (
      previous &&
      latest.engagementPct != null &&
      previous.engagementPct != null
    ) {
      const diff = latest.engagementPct - previous.engagementPct;
      engagementTrend =
        Math.abs(diff) < 1e-9 ? "flat" : diff > 0 ? "up" : "down";
    }
    return {
      platform,
      followers: latest.followers,
      capturedOn: latest.capturedOn,
      engagementPct: latest.engagementPct,
      growthSinceLast: previous ? latest.followers - previous.followers : null,
      growthSinceFirst:
        hist.length > 1 ? latest.followers - first.followers : null,
      engagementTrend,
    };
  });
  return out.sort(
    (a, b) => b.followers - a.followers || a.platform.localeCompare(b.platform)
  );
}

export type AudienceSummary = {
  /** Sum of latest followers across every tracked platform,
   *  email included. Null when nothing is tracked. */
  totalReach: number | null;
  /** Sum of latest followers across platforms EXCLUDING email.
   *  Null when no platform is tracked. */
  platformReach: number | null;
  /** Latest email-list size; null when the list is untracked. */
  emailFollowers: number | null;
  /** The platform (never email) with the largest latest audience. */
  biggestPlatform: string | null;
  biggestFollowers: number | null;
  /** Biggest platform ÷ platform reach, whole percent. Null when
   *  there is no platform reach to divide. */
  dependencyPct: number | null;
  /** The runner-up platform — the hedge against the biggest. */
  secondPlatform: string | null;
  secondPct: number | null;
  /** Email ÷ total reach, whole percent. Null when total reach
   *  is zero or nothing is tracked. */
  ownedPct: number | null;
};

/** The dependency + ownership read. Email is excluded from
 *  platform reach and from the dependency share by design (see
 *  the section note). Zero snapshots → every figure null. */
export function audienceSummary(
  snapshots: AudienceSnapshot[]
): AudienceSummary {
  const empty: AudienceSummary = {
    totalReach: null,
    platformReach: null,
    emailFollowers: null,
    biggestPlatform: null,
    biggestFollowers: null,
    dependencyPct: null,
    secondPlatform: null,
    secondPct: null,
    ownedPct: null,
  };
  if (!snapshots.length) return empty;
  const standings = audienceStandings(snapshots);
  const email = standings.find((s) => s.platform === "email") ?? null;
  const platforms = standings.filter((s) => s.platform !== "email");
  const totalReach = standings.reduce((t, s) => t + s.followers, 0);
  const platformReach = platforms.length
    ? platforms.reduce((t, s) => t + s.followers, 0)
    : null;
  const biggest = platforms[0] ?? null;
  const second = platforms[1] ?? null;
  return {
    totalReach,
    platformReach,
    emailFollowers: email ? email.followers : null,
    biggestPlatform: biggest ? biggest.platform : null,
    biggestFollowers: biggest ? biggest.followers : null,
    dependencyPct:
      biggest && platformReach && platformReach > 0
        ? Math.round((biggest.followers / platformReach) * 100)
        : null,
    secondPlatform: second ? second.platform : null,
    secondPct:
      second && platformReach && platformReach > 0
        ? Math.round((second.followers / platformReach) * 100)
        : null,
    ownedPct:
      totalReach > 0
        ? Math.round(((email?.followers ?? 0) / totalReach) * 100)
        : null,
  };
}

/** The plain verdict on the dependency share — the owner's
 *  thresholds: at 70%+ one platform controls the reach; at half,
 *  half the reach rides on it; below half the reach is spread. */
export function dependencyVerdict(dependencyPct: number): string {
  if (dependencyPct >= 70) return "One platform controls most of your reach";
  if (dependencyPct >= 50) return "Half your reach rides on one platform";
  return "Your reach is spread across platforms";
}

/** The next-step math: how many owned subscribers moving just 1%
 *  of the biggest platform's audience to the email list adds. */
export function onePercentMove(biggestFollowers: number): number {
  return Math.round(biggestFollowers * 0.01);
}

/* ---------------- Money trust: the separated ledger -----------------
 * Owner order 2026-11-23 ("Money — Build trust"): projected,
 * invoiced, collected and expenses are four DIFFERENT things and
 * the page must never blur them. An invoice is a bill, not money
 * received; a contract is a promise, not income. This ledger is
 * the one place the four are stated side by side, each with its
 * per-deal lines so any figure can be traced, plus a
 * reconciliation that PROVES the partition: every eligible deal
 * (contracted / delivering / invoiced / paid) sits in exactly one
 * bucket by stage, and the boolean comes from that set math —
 * it is computed, never asserted.
 *
 * Bucket rules (stage decides; money follows the stage):
 *  - PROJECTED  contracted + delivering, valued at what is still
 *    to come on them (dealRemainingCents — agreed minus anything
 *    already received).
 *  - INVOICED   invoiced, valued at the outstanding balance
 *    (dealRemainingCents). Money billed, not money received.
 *  - COLLECTED  money actually received: dealPaidCents on paid
 *    deals, plus any recorded received amount on a deal still in
 *    an earlier stage (a partial payment is collected money the
 *    moment it lands; the rest of that deal stays in its stage
 *    bucket at the remaining balance, so nothing double-counts).
 *  - EXPENSES   the creator's expense rows, kept apart entirely.
 *  KEPT = COLLECTED − EXPENSES. Projected and invoiced money is
 *  NEVER netted against expenses — you cannot keep money you do
 *  not have yet.
 *  Pitched / negotiating deals are pipeline, not income: they sit
 *  in NO bucket and are only counted (pipelineCount) so the page
 *  can say so. Lost deals are excluded everywhere. */

export type LedgerBucketId = "projected" | "invoiced" | "collected";

export type LedgerLine = {
  dealId: string;
  brandName: string;
  stage: GalaxyStage;
  /** The cents this line contributes to its bucket. */
  cents: number;
  /** The date that governs the line (payment due date for
   *  projected / invoiced, payment received date for collected);
   *  null when the record carries none. */
  date: string | null;
  /** True for a partial payment received on a deal whose stage
   *  bucket is projected or invoiced — the line belongs to
   *  collected for money, but the DEAL's one reconciliation home
   *  stays its stage bucket. */
  partial: boolean;
};

export type LedgerBucket = {
  id: LedgerBucketId;
  cents: number;
  /** Primary lines: the deals whose reconciliation home this is. */
  lines: LedgerLine[];
};

export type MoneyLedger = {
  projected: LedgerBucket;
  invoiced: LedgerBucket;
  collected: LedgerBucket & {
    /** Partial-payment lines (money received on deals whose home
     *  bucket is projected or invoiced). Included in cents. */
    partialLines: LedgerLine[];
    thisMonthCents: number;
  };
  expensesCents: number;
  expensesThisMonthCents: number;
  /** COLLECTED − EXPENSES, all time and this month. */
  keptCents: number;
  keptThisMonthCents: number;
  /** Pitched + negotiating: pipeline, deliberately unbucketed. */
  pipelineCount: number;
  pipelineCents: number;
  /** Projected + invoiced + collected. */
  totalAcrossBucketsCents: number;
  /** Deals in contracted / delivering / invoiced / paid. */
  eligibleCount: number;
  /** True when the independent partition check passes: bucket
   *  home sets are disjoint and their union is the eligible set. */
  reconciles: boolean;
};

/** The money actually received on one deal, wherever it sits:
 *  the recorded received amount when there is one (partial or
 *  full), else the agreed amount once the deal is paid. */
function collectedPortionCents(d: GalaxyDeal): number {
  if (d.receivedCents != null) return Math.max(0, d.receivedCents);
  return d.stage === "paid" ? (d.amountCents ?? 0) : 0;
}

export function moneyLedger(
  deals: GalaxyDeal[],
  expenses: GalaxyExpense[],
  now = new Date()
): MoneyLedger {
  const thisMonth = monthKeyOf(todayKey(now));
  const projectedLines: LedgerLine[] = [];
  const invoicedLines: LedgerLine[] = [];
  const collectedLines: LedgerLine[] = [];
  const partialLines: LedgerLine[] = [];
  let pipelineCount = 0;
  let pipelineCents = 0;

  for (const d of deals) {
    switch (d.stage) {
      case "contracted":
      case "delivering":
        projectedLines.push({
          dealId: d.id,
          brandName: d.brandName,
          stage: d.stage,
          cents: dealRemainingCents(d),
          date: d.invoiceDue,
          partial: false,
        });
        break;
      case "invoiced":
        invoicedLines.push({
          dealId: d.id,
          brandName: d.brandName,
          stage: d.stage,
          cents: dealRemainingCents(d),
          date: d.invoiceDue,
          partial: false,
        });
        break;
      case "paid":
        collectedLines.push({
          dealId: d.id,
          brandName: d.brandName,
          stage: d.stage,
          cents: dealPaidCents(d),
          date: d.paidOn,
          partial: false,
        });
        break;
      case "pitched":
      case "negotiating":
        pipelineCount += 1;
        pipelineCents += d.amountCents ?? 0;
        break;
      case "lost":
        break;
    }
    /* A partial payment on a deal that has not reached paid is
     *  collected money already; the deal's remaining balance
     *  stays in its stage bucket above (dealRemainingCents nets
     *  the receipt out), so the two lines never overlap. Paid
     *  deals are skipped — their full receipt is their home line. */
    if (d.stage !== "paid" && d.stage !== "lost") {
      const got = collectedPortionCents(d);
      if (got > 0) {
        partialLines.push({
          dealId: d.id,
          brandName: d.brandName,
          stage: d.stage,
          cents: got,
          date: d.paidOn,
          partial: true,
        });
      }
    }
  }

  const sum = (lines: LedgerLine[]) => lines.reduce((t, l) => t + l.cents, 0);
  const projectedCents = sum(projectedLines);
  const invoicedCents = sum(invoicedLines);
  const collectedCents = sum(collectedLines) + sum(partialLines);
  const collectedThisMonth = [...collectedLines, ...partialLines]
    .filter((l) => l.date && monthKeyOf(l.date) === thisMonth)
    .reduce((t, l) => t + l.cents, 0);

  const expensesCents = expenses.reduce((t, e) => t + e.amountCents, 0);
  const expensesThisMonthCents = spentInMonth(expenses, thisMonth);

  /* Reconciliation — an INDEPENDENT second pass. The eligible set
   *  is rebuilt from the stage list alone, and each bucket's home
   *  set is rebuilt from the primary lines; the ledger reconciles
   *  only when the three home sets are pairwise disjoint and
   *  their union is exactly the eligible set. */
  const eligibleIds = new Set(
    deals
      .filter(
        (d) =>
          d.stage === "contracted" ||
          d.stage === "delivering" ||
          d.stage === "invoiced" ||
          d.stage === "paid"
      )
      .map((d) => d.id)
  );
  const homeSets = [projectedLines, invoicedLines, collectedLines].map(
    (lines) => new Set(lines.map((l) => l.dealId))
  );
  const union = new Set<string>();
  let disjoint = true;
  for (const s of homeSets) {
    for (const id of s) {
      if (union.has(id)) disjoint = false;
      union.add(id);
    }
  }
  const reconciles =
    disjoint &&
    union.size === eligibleIds.size &&
    [...eligibleIds].every((id) => union.has(id));

  return {
    projected: { id: "projected", cents: projectedCents, lines: projectedLines },
    invoiced: { id: "invoiced", cents: invoicedCents, lines: invoicedLines },
    collected: {
      id: "collected",
      cents: collectedCents,
      lines: collectedLines,
      partialLines,
      thisMonthCents: collectedThisMonth,
    },
    expensesCents,
    expensesThisMonthCents,
    keptCents: collectedCents - expensesCents,
    keptThisMonthCents: collectedThisMonth - expensesThisMonthCents,
    pipelineCount,
    pipelineCents,
    totalAcrossBucketsCents: projectedCents + invoicedCents + collectedCents,
    eligibleCount: eligibleIds.size,
    reconciles,
  };
}

/* ---------------- Passport public address (slug) -------------------
 * A creator's public Passport lives at /p/<slug>. The slug starts
 * auto-generated (creator name + a suffix from the user id, in the
 * share route) and the creator may replace it with one they choose.
 * The rules live here, in one place, so the API route and the
 * fixtures can never drift: 3–30 characters, lowercase letters /
 * numbers / hyphens only, never starting or ending with a hyphen,
 * and never a word the app itself routes on. */

export const PASSPORT_SLUG_MIN = 3;
export const PASSPORT_SLUG_MAX = 30;

export const RESERVED_PASSPORT_SLUGS: ReadonlySet<string> = new Set([
  "login",
  "signup",
  "welcome",
  "get-started",
  "pricing",
  "api",
  "p",
  "today",
  "brands",
  "deals",
  "studio",
  "money",
  "passport",
  "settings",
  "admin",
  "support",
  "terms",
  "privacy",
]);

export type PassportSlugCheck =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/** Normalize (trim + lowercase) and validate a chosen Passport
 *  slug. Returns the normalized slug on success, or the plain
 *  reason it cannot be used. */
export function validatePassportSlug(raw: string): PassportSlugCheck {
  const slug = raw.trim().toLowerCase();
  if (slug.length < PASSPORT_SLUG_MIN || slug.length > PASSPORT_SLUG_MAX) {
    return {
      ok: false,
      error: `Your address must be ${PASSPORT_SLUG_MIN}–${PASSPORT_SLUG_MAX} characters.`,
    };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers and hyphens only.",
    };
  }
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return {
      ok: false,
      error: "Your address cannot start or end with a hyphen.",
    };
  }
  if (RESERVED_PASSPORT_SLUGS.has(slug)) {
    return { ok: false, error: "That address is reserved — try another." };
  }
  return { ok: true, slug };
}

/** Uniqueness as a pure check over the rows that already hold a
 *  slug: a conflict is a row owned by SOMEONE ELSE holding the
 *  candidate. The caller's own row never conflicts with itself.
 *  (The profiles_passport_slug_key unique index is the database
 *  backstop behind this check.) */
export function passportSlugTaken(
  candidate: string,
  holders: { id: string; passport_slug: string | null }[],
  selfId: string
): boolean {
  return holders.some((h) => h.passport_slug === candidate && h.id !== selfId);
}

/* ---------------- Passport track record (verified) ------------------
 * The figures a creator may put on their public Passport when
 * they opt in: computed ONLY from their own paid deals — the same
 * records the private Passport already calls verified. Brand
 * names only ever leave this function alongside counts and a
 * total; the public page shows no per-deal amounts. */

export type PassportTrackRecord = {
  paidDealCount: number;
  totalCollectedCents: number;
  /** Distinct brands that paid, alphabetical. */
  brandNames: string[];
  brandsPaidCount: number;
  /** Average days from invoice sent to payment received across
   *  paid deals carrying BOTH dates; null when none do. */
  avgDaysToPay: number | null;
};

export function passportTrackRecord(deals: GalaxyDeal[]): PassportTrackRecord {
  const history = brandPaymentHistory(deals);
  const brandNames = [
    ...new Set(
      deals.filter((d) => d.stage === "paid").map((d) => d.brandName)
    ),
  ].sort((a, b) => a.localeCompare(b));
  return {
    paidDealCount: history?.paidDeals ?? 0,
    totalCollectedCents: history?.totalPaidCents ?? 0,
    brandNames,
    brandsPaidCount: brandNames.length,
    avgDaysToPay: history?.avgDaysToPay ?? null,
  };
}

/** The methodology disclosure shown wherever the audience
 *  independence indicators appear (private Audience panel and the
 *  public Passport track record) — one text, so the explanation
 *  can never drift between the two surfaces. */
export const AUDIENCE_METHODOLOGY =
  "How this is calculated — Dependency: your biggest platform's followers ÷ your total followers across platforms (email list not counted). Owned: your email list ÷ your total audience including email. Follower and email numbers are entered by the creator; UltraVestra does not pull them from the platforms. Deal figures are verified from deal records marked paid on UltraVestra.";

/* ---------------- The Creator Loop ----------------------------------
 * The product's organizing loop, in the owner's words (2026-11-23):
 * FIND → NEGOTIATE → PROTECT → COLLECT → GROW — "That loop is more
 * valuable than offering 50 disconnected AI tools." His rule:
 * "Make the loop communicate progress, not just display five
 * numbers."
 *
 * V2 (owner's reference component, pasted 2026-11-23 19:47 CT —
 * its DESIGN and LOGIC ported into this stack, not its code):
 * every step carries a SEVERITY, and the panel leads with the
 * single most urgent step ("Your next move").
 *
 *   critical — "Act now"   (#f87171)
 *   action   — "To do"     (#fb923c)
 *   attention— "Heads up"  (#facc15)
 *   clear    — "On track"  (#4ade80)
 *
 * loopNextMove picks the step to act on first: highest severity
 * wins; ties break COLLECT > PROTECT > NEGOTIATE > FIND > GROW
 * (money first, per the owner's design). Screen order NEVER
 * re-sorts — it is a cycle, not a ranking; only the next-move
 * card ranks.
 *
 * Every headline, figure and item traces to a real field:
 *  - FIND review items are saved brands never pitched
 *    (neglectedOpportunities — the codebase's own definition).
 *    There is no closing-date data anywhere, so no closing-soon
 *    branch exists.
 *  - NEGOTIATE idle days read the deal's last deal_stage_history
 *    entry, falling back to the deal's updated_at (GalaxyDeal's
 *    lastContact is that date). There is no "waiting on" field,
 *    so no waiting-on-you branch exists. FOLLOW_UP_DAYS = 3,
 *    the owner's number.
 *  - PROTECT checks the real deal_protection items via
 *    protectionGaps. His kill-fee and revision-cap checks have
 *    no columns in deal_protection and are NOT checked; the
 *    record's exclusivity and deliverables items are.
 *  - COLLECT money comes only from moneyLedger /
 *    dealRemainingCents. "Delivering" means work in progress —
 *    there is no delivered-but-uninvoiced signal in the data,
 *    so no such item exists.
 *  - GROW's checklist items are each backed by a real field:
 *    bio = creator_business_profiles.business_description,
 *    niches = its content_categories, public =
 *    profiles.passport_public, track record =
 *    profiles.passport_share_history, audience = an
 *    audience_snapshots row exists. His portfolio / rates /
 *    verified-social items have no live field behind them and
 *    are not checklist items. */

export type LoopStepId = "find" | "negotiate" | "protect" | "collect" | "grow";

export type LoopSeverity = "critical" | "action" | "attention" | "clear";

export const LOOP_SEVERITY_RANK: Record<LoopSeverity, number> = {
  critical: 3,
  action: 2,
  attention: 1,
  clear: 0,
};

export const LOOP_SEVERITY_LABEL: Record<LoopSeverity, string> = {
  critical: "Act now",
  action: "To do",
  attention: "Heads up",
  clear: "On track",
};

export const LOOP_SEVERITY_TONE: Record<LoopSeverity, string> = {
  critical: "#f87171",
  action: "#fb923c",
  attention: "#facc15",
  clear: "#4ade80",
};

/** Stage accent colours (the owner's design): each step keeps
 *  its own colour regardless of severity. */
export const LOOP_ACCENT: Record<LoopStepId, string> = {
  find: "#60a5fa",
  negotiate: "#a78bfa",
  protect: "#2dd4bf",
  collect: "#fbbf24",
  grow: "#f472b6",
};

/** Next-move tie-break when severities are equal: money first. */
const LOOP_TIEBREAK: Record<LoopStepId, number> = {
  collect: 5,
  protect: 4,
  negotiate: 3,
  find: 2,
  grow: 1,
};

export type LoopItem = {
  id: string;
  title: string;
  meta: string;
  tone: LoopSeverity;
  /** Small button label; null renders no button. */
  actionLabel: string | null;
  /** Where the button (and the step CTA, via focus) navigates. */
  href: string;
  /** True when the item is finished (Grow checklist checkmarks). */
  done?: boolean;
};

export type LoopStep = {
  id: LoopStepId;
  /** The owner's word for the step: FIND / NEGOTIATE / … */
  label: string;
  status: LoopSeverity;
  headline: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  /** The item the step's CTA acts on, when there is one. */
  focus: LoopItem | null;
  items: LoopItem[];
};

export type CreatorLoopInput = {
  deals: GalaxyDeal[];
  expenses: GalaxyExpense[];
  savedCount: number;
  acceptingCount: number;
  /** The directory, when available — Find's review items are the
   *  saved brands in it that were never pitched. */
  brands?: GalaxyBrand[];
  protectionByDeal?: Record<string, DealProtection>;
  /** Latest deal_stage_history created_at per deal id (ISO
   *  timestamps) — Negotiate's idle clock. A deal with no history
   *  rows falls back to its updated_at. */
  lastActivityByDeal?: Record<string, string>;
  snapshots: AudienceSnapshot[];
  passportPublic: boolean;
  passportShareHistory: boolean;
  passportSlug: string | null;
  /** Grow checklist: the business-profile description is written
   *  (creator_business_profiles.business_description). */
  profileBio?: boolean;
  /** Grow checklist: content categories are chosen
   *  (creator_business_profiles.content_categories). */
  profileNiches?: boolean;
  now?: Date;
};

/** Active deals a creator should keep going (the owner's
 *  pipeline target). */
export const LOOP_PIPELINE_TARGET = 3;
/** Days with no recorded movement before a talk counts as gone
 *  quiet (the owner's number). */
export const LOOP_FOLLOW_UP_DAYS = 3;

const bySeverity = (a: LoopItem, b: LoopItem) =>
  LOOP_SEVERITY_RANK[b.tone] - LOOP_SEVERITY_RANK[a.tone];

const joinAnd = (a: string[]): string =>
  a.length < 2
    ? a.join("")
    : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

/* ---------- 01 FIND ---------- */
function loopFind(input: CreatorLoopInput): LoopStep {
  const deals = input.deals;
  const review = input.brands ? neglectedOpportunities(deals, input.brands) : [];
  const items: LoopItem[] = review.map((b) => ({
    id: b.id,
    title: b.name,
    meta:
      b.rate != null
        ? `${b.rate}% commission, ${CAP_LABEL[b.cap].toLowerCase()}`
        : `Commission ${CAP_LABEL[b.cap].toLowerCase()}`,
    tone: "attention",
    actionLabel: "Review",
    href: `/brands/${b.id}`,
  }));
  const active = deals.filter(
    (d) => d.stage !== "paid" && d.stage !== "lost"
  ).length;
  if (items.length > 0) {
    return {
      id: "find",
      label: "FIND",
      status: "attention",
      headline: `${plural(items.length, "saved brand")} to review`,
      detail: "Saved by you and never pitched. The strongest offer is first.",
      ctaLabel: `Review ${items[0].title}`,
      ctaHref: items[0].href,
      focus: items[0],
      items,
    };
  }
  if (active < LOOP_PIPELINE_TARGET) {
    return {
      id: "find",
      label: "FIND",
      status: "attention",
      headline: `Pipeline is thin: ${plural(active, "active deal")}`,
      detail: `Line up ${plural(LOOP_PIPELINE_TARGET - active, "more brand")} to stay booked.`,
      ctaLabel: "Discover brands",
      ctaHref: "/brands",
      focus: null,
      items,
    };
  }
  return {
    id: "find",
    label: "FIND",
    status: "clear",
    headline: `Pipeline healthy · ${plural(active, "active deal")}`,
    detail: "No saved brands waiting for a pitch.",
    ctaLabel: "Browse brands",
    ctaHref: "/brands",
    focus: null,
    items,
  };
}

/** The calendar date a deal last moved: its latest
 *  deal_stage_history entry when one is on file, else its
 *  updated_at (whose date part is GalaxyDeal.lastContact). The
 *  Creator Loop's Negotiate step and the in-app alerts (trust
 *  queue #6) share this one definition of "last activity", so a
 *  deal can never read as quiet in one place and active in the
 *  other. */
export function dealLastActivityKey(
  d: GalaxyDeal,
  lastActivityByDeal?: Record<string, string>
): string {
  const ts = lastActivityByDeal?.[d.id] ?? d.updatedAt ?? "";
  return ts ? ts.slice(0, 10) : d.lastContact;
}

/** Whole days since the deal last moved (0 when no date is on
 *  file at all). */
export function dealIdleDays(
  d: GalaxyDeal,
  lastActivityByDeal: Record<string, string> | undefined,
  now: Date
): number {
  const key = dealLastActivityKey(d, lastActivityByDeal);
  return key ? Math.max(0, daysAgo(key, now)) : 0;
}

/* ---------- 02 NEGOTIATE ---------- */
function loopNegotiate(input: CreatorLoopInput, now: Date): LoopStep {
  const talks = input.deals.filter(
    (d) => d.stage === "pitched" || d.stage === "negotiating"
  );
  /** Whole days since the deal last moved: its latest stage-
   *  history entry, else its updated_at (lastContact). */
  const idleOf = (d: GalaxyDeal): number =>
    dealIdleDays(d, input.lastActivityByDeal, now);
  const rows = talks.map((d) => {
    const idle = idleOf(d);
    const quiet = idle >= LOOP_FOLLOW_UP_DAYS;
    const item: LoopItem = {
      id: d.id,
      title: d.brandName,
      meta: quiet
        ? `${fmtMoney(d.amountCents)} · no reply in ${plural(idle, "day")}`
        : `${fmtMoney(d.amountCents)} · updated ${
            idle === 0 ? "today" : idle === 1 ? "yesterday" : `${idle} days ago`
          }`,
      tone: quiet ? "attention" : "clear",
      actionLabel: quiet ? "Follow up" : "Open",
      href: "/deals",
    };
    return { d, idle, quiet, item };
  });
  const items = rows
    .slice()
    .sort((a, b) => bySeverity(a.item, b.item) || b.idle - a.idle)
    .map((r) => r.item);
  if (talks.length === 0) {
    return {
      id: "negotiate",
      label: "NEGOTIATE",
      status: "clear",
      headline: "No open negotiations",
      detail: "Pitch a brand from Find to start a deal.",
      ctaLabel: "Start a pitch",
      ctaHref: "/brands",
      focus: null,
      items,
    };
  }
  const quiet = rows
    .filter((r) => r.quiet)
    .sort((a, b) => b.idle - a.idle);
  if (quiet.length > 0) {
    const top = quiet[0];
    return {
      id: "negotiate",
      label: "NEGOTIATE",
      status: "attention",
      headline: `Follow up with ${top.d.brandName}`,
      detail: `No reply in ${plural(top.idle, "day")}. A short nudge keeps the deal moving.`,
      ctaLabel: `Follow up with ${top.d.brandName}`,
      ctaHref: "/deals",
      focus: top.item,
      items,
    };
  }
  const total = talks.reduce((s, d) => s + (d.amountCents ?? 0), 0);
  return {
    id: "negotiate",
    label: "NEGOTIATE",
    status: "clear",
    headline: `${plural(talks.length, "deal")} in talks · ${fmtMoney(total)}`,
    detail: `Nothing has gone quiet — follow-ups start at ${LOOP_FOLLOW_UP_DAYS} quiet days.`,
    ctaLabel: "View negotiations",
    ctaHref: "/deals",
    focus: null,
    items,
  };
}

/* ---------- 03 PROTECT ---------- */
/** The protection checks, in protectionGaps' rule order, with
 *  the owner's phrases and why-lines. His five map to the real
 *  deal_protection record as: signed → contract_reviewed,
 *  paymentTerms → payment_terms_agreed, usageRights →
 *  usage_rights_set; killFee and revisionCap have NO columns
 *  and are not checked. The record's own exclusivity and
 *  deliverables items are checked too. */
const LOOP_PROTECTION: Record<
  ProtectionGapId,
  { label: string; phrase: string; why: string }
> = {
  contract: {
    label: "Signed contract",
    phrase: "a signed contract",
    why: "Nothing is enforceable until both sides sign.",
  },
  usage: {
    label: "Usage-rights limit",
    phrase: "a usage-rights limit",
    why: "Cap how long and where the brand can run your content.",
  },
  exclusivity: {
    label: "Exclusivity check",
    phrase: "an exclusivity check",
    why: "Know whether the brand expects you off competitors, and for how long, before you agree.",
  },
  deliverables: {
    label: "Deliverables in writing",
    phrase: "deliverables in writing",
    why: "Agree the exact deliverables in writing so the scope can't creep.",
  },
  payment: {
    label: "Payment terms",
    phrase: "payment terms",
    why: "Set a due date (e.g. Net 30) so a late payment is clearly late.",
  },
};

function loopProtect(input: CreatorLoopInput): LoopStep {
  const agreed = input.deals.filter(
    (d) =>
      d.stage === "contracted" || d.stage === "delivering" || d.stage === "invoiced"
  );
  const rows = agreed.map((d) => {
    const missing = protectionGaps(d, input.protectionByDeal?.[d.id]);
    const unsigned = missing.some((g) => g.id === "contract");
    const item: LoopItem = {
      id: d.id,
      title: d.brandName,
      meta: missing.length
        ? `Missing: ${missing.map((g) => LOOP_PROTECTION[g.id].label).join(", ")}`
        : "Fully protected",
      tone: unsigned ? "critical" : missing.length ? "action" : "clear",
      actionLabel: missing.length ? "Fix" : null,
      href: "/deals",
    };
    return { d, missing, item };
  });
  const items = rows.map((r) => r.item).sort(bySeverity);
  const gaps = rows
    .filter((r) => r.missing.length > 0)
    .sort((a, b) => bySeverity(a.item, b.item));
  if (agreed.length === 0) {
    return {
      id: "protect",
      label: "PROTECT",
      status: "clear",
      headline: "No active agreements yet",
      detail: "Every contract you sign will be checked here.",
      ctaLabel: "See the contract checklist",
      ctaHref: "/deals",
      focus: null,
      items,
    };
  }
  if (gaps.length === 0) {
    return {
      id: "protect",
      label: "PROTECT",
      status: "clear",
      headline:
        agreed.length === 1
          ? "Your agreement is protected"
          : agreed.length === 2
            ? "Both agreements are protected"
            : `All ${agreed.length} agreements are protected`,
      detail: "Every active deal has the key protections.",
      ctaLabel: "View contracts",
      ctaHref: "/deals",
      focus: null,
      items,
    };
  }
  const top = gaps[0];
  if (top.item.tone === "critical") {
    return {
      id: "protect",
      label: "PROTECT",
      status: "critical",
      headline: `${top.d.brandName} has no signed contract`,
      detail: LOOP_PROTECTION.contract.why,
      ctaLabel: `Get ${top.d.brandName} signed`,
      ctaHref: "/deals",
      focus: top.item,
      items,
    };
  }
  const count = gaps.reduce((s, r) => s + r.missing.length, 0);
  return {
    id: "protect",
    label: "PROTECT",
    status: "action",
    headline:
      gaps.length === 1
        ? `${top.d.brandName} is missing ${joinAnd(top.missing.map((g) => LOOP_PROTECTION[g.id].phrase))}`
        : `${plural(count, "protection gap")} across ${gaps.length} agreements`,
    detail: LOOP_PROTECTION[top.missing[0].id].why,
    ctaLabel: `Fix the ${top.d.brandName} contract`,
    ctaHref: "/deals",
    focus: top.item,
    items,
  };
}

/* ---------- 04 COLLECT ---------- */
function loopCollect(input: CreatorLoopInput, now: Date): LoopStep {
  const ledger = moneyLedger(input.deals, input.expenses, now);
  const owed = input.deals.filter(
    (d) => d.stage === "invoiced" && dealRemainingCents(d) > 0
  );
  const rows = owed.map((d) => {
    const remaining = dealRemainingCents(d);
    const due = d.invoiceDue ? daysUntil(d.invoiceDue, now) : null;
    const late = due !== null && due < 0 ? -due : 0;
    const item: LoopItem = {
      id: d.id,
      title: d.brandName,
      meta:
        late > 0
          ? `${fmtMoney(remaining)} · ${plural(late, "day")} overdue`
          : `${fmtMoney(remaining)} · due ${
              due === null
                ? "on receipt"
                : due === 0
                  ? "today"
                  : due === 1
                    ? "tomorrow"
                    : `in ${due} days`
            }`,
      tone: late > 0 ? "critical" : "attention",
      actionLabel: late > 0 ? "Remind" : "View",
      href: "/deals",
    };
    return { d, item, late };
  });
  const items = rows.map((r) => r.item).sort(bySeverity);
  if (owed.length === 0) {
    return {
      id: "collect",
      label: "COLLECT",
      status: "clear",
      headline: "Nothing awaiting payment",
      detail:
        ledger.collected.cents > 0
          ? `${fmtMoney(ledger.collected.cents)} collected so far.`
          : "Finished deals will show up here until they're paid.",
      ctaLabel: "View earnings",
      ctaHref: "/money",
      focus: null,
      items,
    };
  }
  const overdueRows = rows.filter((r) => r.late > 0);
  const notes: string[] = [];
  if (overdueRows.length === 1)
    notes.push(
      `${overdueRows[0].d.brandName} is ${plural(overdueRows[0].late, "day")} overdue`
    );
  else if (overdueRows.length > 1)
    notes.push(`${overdueRows.length} invoices are overdue`);
  const first = rows.slice().sort((a, b) => bySeverity(a.item, b.item))[0];
  return {
    id: "collect",
    label: "COLLECT",
    status: overdueRows.length ? "critical" : "action",
    headline: `${plural(owed.length, "deal")} awaiting payment · ${fmtMoney(ledger.invoiced.cents)}`,
    detail: notes.length
      ? notes.join(". ") + "."
      : "Every invoice is sent and on schedule.",
    ctaLabel:
      first.late > 0 ? `Send a reminder to ${first.d.brandName}` : "Track payments",
    ctaHref: first.late > 0 ? "/deals" : "/money",
    focus: first.item,
    items,
  };
}

/* ---------- 05 GROW ---------- */
type GrowCheck = { id: string; label: string; phrase: string; done: boolean };

function loopGrow(input: CreatorLoopInput): LoopStep {
  const checks: GrowCheck[] = [
    { id: "bio", label: "Write your bio", phrase: "write your bio", done: input.profileBio ?? false },
    { id: "niches", label: "Choose your niches", phrase: "choose your niches", done: input.profileNiches ?? false },
    { id: "public", label: "Make your Passport public", phrase: "make your Passport public", done: input.passportPublic },
    { id: "share", label: "Share your track record", phrase: "turn on track-record sharing", done: input.passportShareHistory },
    { id: "audience", label: "Add your audience numbers", phrase: "add your audience numbers", done: input.snapshots.length > 0 },
  ];
  const items: LoopItem[] = checks
    .map((c) => ({
      id: c.id,
      title: c.label,
      meta: c.done ? "Done" : "Not done yet",
      tone: (c.done ? "clear" : "attention") as LoopSeverity,
      actionLabel: c.done ? null : "Finish",
      href: "/passport",
      done: c.done,
    }))
    .sort((a, b) => Number(a.done) - Number(b.done));
  const left = checks.filter((c) => !c.done);
  const doneCount = checks.length - left.length;
  if (input.passportPublic && left.length === 0) {
    return {
      id: "grow",
      label: "GROW",
      status: "clear",
      headline: "Your Passport is live",
      detail: "Brands can find and verify you. Keep your track record current.",
      ctaLabel: "View Passport",
      ctaHref: "/passport",
      focus: null,
      items,
    };
  }
  /* Everything except going public is done (public is itself
   *  one of the five checks, so this is the only way to be
   *  complete-but-private). */
  if (left.length === 1 && left[0].id === "public") {
    return {
      id: "grow",
      label: "GROW",
      status: "action",
      headline: "Passport is ready to go public",
      detail: "Everything else is complete. Publish it so brands can find you.",
      ctaLabel: "Publish Passport",
      ctaHref: "/passport",
      focus: null,
      items,
    };
  }
  const next = left[0];
  return {
    id: "grow",
    label: "GROW",
    status: "attention",
    headline: `Passport ${doneCount}/${checks.length} done · ${plural(left.length, "step")} to go public`,
    detail: `Still needed: ${joinAnd(left.map((c) => c.phrase))}.`,
    ctaLabel: `Next: ${next.label}`,
    ctaHref: "/passport",
    focus: items.find((i) => i.id === next.id) ?? null,
    items,
  };
}

/* ---------- the loop ---------- */
export function creatorLoop(input: CreatorLoopInput): LoopStep[] {
  const now = input.now ?? new Date();
  return [
    loopFind(input),
    loopNegotiate(input, now),
    loopProtect(input),
    loopCollect(input, now),
    loopGrow(input),
  ];
}

/** The single step to act on first: highest severity wins, ties
 *  break money-first (collect > protect > negotiate > find >
 *  grow). Null when every step is clear. */
export function loopNextMove(steps: LoopStep[]): LoopStep | null {
  const ranked = steps
    .filter((s) => LOOP_SEVERITY_RANK[s.status] > 0)
    .sort(
      (a, b) =>
        LOOP_SEVERITY_RANK[b.status] - LOOP_SEVERITY_RANK[a.status] ||
        LOOP_TIEBREAK[b.id] - LOOP_TIEBREAK[a.id]
    );
  return ranked[0] ?? null;
}

/** Steps at "On track" — the health bar's clear count. */
export const loopClearCount = (steps: LoopStep[]): number =>
  steps.filter((s) => s.status === "clear").length;

/* ================= Data export (trust queue #2) ===================
 * "Creators must be able to retrieve their business records."
 * buildExport assembles the download payload from rows the route
 * already fetched for the signed-in creator — and ONLY that
 * creator: the route scopes every query to the session user_id,
 * and this builder drops any key that looks like a secret, so a
 * stray credential column can never ride along in a creator's own
 * file. Sections are always present (empty arrays when the creator
 * has no rows) — an export that silently omits a section would
 * read as "we hold nothing", which may not be true. */

export type ExportRow = Record<string, unknown>;

const SECRET_KEY_PATTERN =
  /(secret|api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|private[-_]?key|password|service[-_]?role|client[-_]?secret)/i;

/** Recursively copy a value with secret-looking keys removed. */
export function stripSecretKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSecretKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(k)) continue;
      out[k] = stripSecretKeys(v);
    }
    return out;
  }
  return value;
}

const cleanRow = (r: ExportRow | null): ExportRow | null =>
  r == null ? null : (stripSecretKeys(r) as ExportRow);
const cleanRows = (rows: ExportRow[]): ExportRow[] =>
  rows.map((r) => stripSecretKeys(r) as ExportRow);

export const EXPORT_SECTIONS = [
  { key: "profile", label: "Profile — your account and creator profile rows" },
  { key: "deals", label: "Deals — your deals, their protection records and stage history" },
  { key: "money", label: "Money — the separated money ledger (projected / invoiced / collected / expenses) plus your raw expense and revenue rows" },
  { key: "audience", label: "Audience — the audience numbers you entered" },
  { key: "savedBrands", label: "Saved brands — the brands you saved" },
  { key: "supportTickets", label: "Support tickets — the requests you filed" },
  { key: "subscription", label: "Subscription — your plan and status (no payment secrets)" },
] as const;

export type ExportInput = {
  /** ISO timestamp of the export. */
  exportedAt: string;
  profile: ExportRow | null;
  creatorProfile: ExportRow | null;
  deals: ExportRow[];
  dealProtection: ExportRow[];
  dealStageHistory: ExportRow[];
  expenses: ExportRow[];
  revenueEntries: ExportRow[];
  ledger: MoneyLedger;
  audienceSnapshots: ExportRow[];
  savedBrands: ExportRow[];
  supportTickets: ExportRow[];
  subscription: ExportRow | null;
};

export function buildExport(input: ExportInput) {
  return {
    export: {
      product: "UltraVestra",
      kind: "Creator business records export",
      exportedAt: input.exportedAt,
      sections: EXPORT_SECTIONS.map((s) => ({ key: s.key, label: s.label })),
    },
    profile: {
      account: cleanRow(input.profile),
      creatorProfile: cleanRow(input.creatorProfile),
    },
    deals: {
      deals: cleanRows(input.deals),
      protection: cleanRows(input.dealProtection),
      stageHistory: cleanRows(input.dealStageHistory),
    },
    money: {
      ledger: input.ledger,
      expenses: cleanRows(input.expenses),
      revenueEntries: cleanRows(input.revenueEntries),
    },
    audience: cleanRows(input.audienceSnapshots),
    savedBrands: cleanRows(input.savedBrands),
    supportTickets: cleanRows(input.supportTickets),
    subscription: cleanRow(input.subscription),
  };
}

export type CreatorExport = ReturnType<typeof buildExport>;

/* ================= Brand provenance (trust queue #5) ==============
 * "Creators need to know where brand information comes from."
 * Three honest states, derived only from real fields:
 *  - evidence: brand_evidence rows exist — name the source the
 *    strongest row came from and when it was recorded. Only a row
 *    whose confidence is 'verified' earns the word "Verified";
 *    any other confidence is "Recorded from", never dressed up.
 *  - program: no evidence, but an affiliate program/network is on
 *    file — a listing, stated as a listing.
 *  - unknown: neither — the absence is stated, not papered over.
 * This is information only: the Verified badge rule
 * (brandIsVerified) is untouched. */

export type BrandEvidenceLike = {
  source_url?: string | null;
  source_type?: string | null;
  evidence_type?: string | null;
  confidence?: string | null;
  observed_at?: string | null;
  last_checked_at?: string | null;
};

export type BrandProvenanceKind = "evidence" | "program" | "unknown";
export type BrandProvenance = { kind: BrandProvenanceKind; line: string };

const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
  official_site: "the brand's official site",
  social: "the brand's social profile",
  affiliate_network: "an affiliate network listing",
  creator_report: "a creator report",
  listing: "a public listing",
  direct: "the brand directly",
};

function evidenceSourceLabel(row: BrandEvidenceLike): string {
  const byType = row.source_type ? EVIDENCE_SOURCE_LABELS[row.source_type] : undefined;
  if (byType) return byType;
  if (row.source_url) {
    try {
      const host = new URL(row.source_url).hostname.replace(/^www\./, "");
      if (host) return host;
    } catch {
      /* not a URL — fall through to the generic label */
    }
  }
  return "a public source";
}

const CONFIDENCE_RANK: Record<string, number> = {
  verified: 0,
  publicly_reported: 1,
  needs_review: 2,
  expired: 3,
};

/** The row provenance quotes: strongest confidence first, then
 *  most recently checked / observed. */
function strongestEvidence(
  rows: BrandEvidenceLike[]
): BrandEvidenceLike | null {
  let best: BrandEvidenceLike | null = null;
  for (const r of rows) {
    if (!best) {
      best = r;
      continue;
    }
    const rank = CONFIDENCE_RANK[r.confidence ?? ""] ?? 4;
    const bestRank = CONFIDENCE_RANK[best.confidence ?? ""] ?? 4;
    if (rank !== bestRank) {
      if (rank < bestRank) best = r;
      continue;
    }
    const when = r.last_checked_at ?? r.observed_at ?? "";
    const bestWhen = best.last_checked_at ?? best.observed_at ?? "";
    if (when > bestWhen) best = r;
  }
  return best;
}

function provenanceDate(row: BrandEvidenceLike): string | null {
  const raw = row.last_checked_at ?? row.observed_at;
  if (!raw) return null;
  const d = parseKey(String(raw).slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function brandProvenance(
  brand: { program?: string | null },
  evidenceRows: BrandEvidenceLike[]
): BrandProvenance {
  const rows = evidenceRows ?? [];
  if (rows.length > 0) {
    const top = strongestEvidence(rows)!;
    const source = evidenceSourceLabel(top);
    const date = provenanceDate(top);
    const when = date ? ` · recorded ${date}` : "";
    return top.confidence === "verified"
      ? { kind: "evidence", line: `Verified from ${source}${when}.` }
      : { kind: "evidence", line: `Recorded from ${source}${when}.` };
  }
  if (brand.program) {
    return {
      kind: "program",
      line: `Listed from the ${brand.program} affiliate program. No independent evidence on file yet.`,
    };
  }
  return { kind: "unknown", line: "Source not recorded for this listing." };
}


/* ------------------------------------------------------------------ */
/* NOTIFICATIONS (trust queue #6, owner order 2026-11-23): "Never     */
/* miss a deadline, negotiation or payment." Alerts are IN-APP only:  */
/* the sending domain is not live yet, so no surface may promise      */
/* email alerts. buildAlerts derives every alert from the creator's   */
/* own deal rows — the same fields the Creator Loop reads — and each  */
/* alert carries a STABLE key (type : deal : the date that makes it   */
/* true) so a dismissal sticks to exactly that alert: when the date   */
/* changes, it is a different alert and may show again.               */
/* ------------------------------------------------------------------ */

export type NotificationPrefs = {
  overdue: boolean;
  dueSoon: boolean;
  quietDeals: boolean;
};

/** Every alert type starts ON: a creator who never opens Settings
 *  still gets told about overdue money. */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  overdue: true,
  dueSoon: true,
  quietDeals: true,
};

export type NotificationPrefsRowLike = {
  overdue: boolean | null;
  due_soon: boolean | null;
  quiet_deals: boolean | null;
};

export function rowToNotificationPrefs(
  r: NotificationPrefsRowLike | null | undefined
): NotificationPrefs {
  if (!r) return { ...DEFAULT_NOTIFICATION_PREFS };
  return {
    overdue: r.overdue !== false,
    dueSoon: r.due_soon !== false,
    quietDeals: r.quiet_deals !== false,
  };
}

export type AlertKind = "overdue" | "due-soon" | "quiet";
export type AlertTone = "critical" | "attention";

export type GalaxyAlert = {
  /** Stable identity: `<type>:<dealId>:<date>` — a dismissal is
   *  stored against this exact string. */
  key: string;
  kind: AlertKind;
  tone: AlertTone;
  title: string;
  detail: string;
  href: string;
};

/** An invoice due within this many days (today counts) earns a
 *  due-soon alert; once it passes, the overdue alert takes over. */
export const ALERT_DUE_SOON_DAYS = 3;

/** Derive the creator's in-app alerts from their deals.
 *  - overdue: an invoiced deal with money still owed whose
 *    payment_due_date is before today (critical).
 *  - due-soon: the same, due today or within ALERT_DUE_SOON_DAYS
 *    days (attention).
 *  - quiet: a pitched/negotiating deal idle for at least
 *    LOOP_FOLLOW_UP_DAYS days, idleness measured by
 *    dealIdleDays — the Creator Loop's own clock (attention).
 *  Each preference gates its own type; a dismissed key removes
 *  exactly that alert. Order: overdue first (most overdue
 *  first), then due-soon (soonest first), then quiet (longest
 *  idle first) — money before conversation, always. */
export function buildAlerts(
  deals: GalaxyDeal[],
  prefs: NotificationPrefs,
  dismissedKeys: Iterable<string>,
  todayKey: string,
  lastActivityByDeal?: Record<string, string>
): GalaxyAlert[] {
  const now = parseKey(todayKey);
  const dismissed = new Set(dismissedKeys);
  const overdue: { alert: GalaxyAlert; days: number }[] = [];
  const dueSoon: { alert: GalaxyAlert; days: number }[] = [];
  const quiet: { alert: GalaxyAlert; idle: number }[] = [];

  for (const d of deals) {
    if (d.stage === "invoiced" && d.invoiceDue) {
      const remaining = dealRemainingCents(d);
      if (remaining > 0) {
        const days = daysUntil(d.invoiceDue, now);
        if (days < 0 && prefs.overdue) {
          const key = `overdue:${d.id}:${d.invoiceDue}`;
          if (!dismissed.has(key)) {
            overdue.push({
              days: -days,
              alert: {
                key,
                kind: "overdue",
                tone: "critical",
                title: `${d.brandName} is ${plural(-days, "day")} overdue`,
                detail: `${fmtMoney(remaining)} still owed · invoice was due ${fmtDate(d.invoiceDue)}`,
                href: "/deals",
              },
            });
          }
        } else if (days >= 0 && days <= ALERT_DUE_SOON_DAYS && prefs.dueSoon) {
          const key = `due:${d.id}:${d.invoiceDue}`;
          if (!dismissed.has(key)) {
            dueSoon.push({
              days,
              alert: {
                key,
                kind: "due-soon",
                tone: "attention",
                title:
                  days === 0
                    ? `${d.brandName} is due today`
                    : days === 1
                      ? `${d.brandName} is due tomorrow`
                      : `${d.brandName} is due in ${days} days`,
                detail: `${fmtMoney(remaining)} owed · due ${fmtDate(d.invoiceDue)}`,
                href: "/deals",
              },
            });
          }
        }
      }
    }

    if (
      (d.stage === "pitched" || d.stage === "negotiating") &&
      prefs.quietDeals
    ) {
      const idle = dealIdleDays(d, lastActivityByDeal, now);
      if (idle >= LOOP_FOLLOW_UP_DAYS) {
        const key = `quiet:${d.id}:${dealLastActivityKey(d, lastActivityByDeal)}`;
        if (!dismissed.has(key)) {
          quiet.push({
            idle,
            alert: {
              key,
              kind: "quiet",
              tone: "attention",
              title: `Follow up with ${d.brandName}`,
              detail: `No movement in ${plural(idle, "day")} — a short nudge keeps the deal moving.`,
              href: "/deals",
            },
          });
        }
      }
    }
  }

  overdue.sort((a, b) => b.days - a.days);
  dueSoon.sort((a, b) => a.days - b.days);
  quiet.sort((a, b) => b.idle - a.idle);
  return [...overdue, ...dueSoon, ...quiet].map((x) => x.alert);
}

/* ------------------------------------------------------------------ */
/* CUSTOMER FEEDBACK (trust queue #7, owner order 2026-11-23):        */
/* "Identify why users stay or leave." Feedback is NOT a support      */
/* ticket: no reference number, no status, and no reply is promised   */
/* — the creator may only opt in to being emailed about it. The kind  */
/* list is closed and shared: the form, the API validation and the    */
/* table's check constraint name exactly the same four values.        */
/* ------------------------------------------------------------------ */

export const FEEDBACK_KINDS = [
  "working",
  "missing",
  "hard",
  "leaving",
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const isFeedbackKind = (k: string): k is FeedbackKind =>
  (FEEDBACK_KINDS as readonly string[]).includes(k);

/** The words the creator picks from — also the words shown back
 *  anywhere their feedback is listed. */
export const feedbackKindLabel = (k: string): string =>
  ({
    working: "What's working",
    missing: "What's missing",
    hard: "Something is hard to use",
    leaving: "I'm thinking of leaving",
  })[k] ?? "What's working";

export type FeedbackEntry = {
  id: string;
  kind: string;
  message: string;
  contactOk: boolean;
  createdAt: string;
};

export type FeedbackRowLike = {
  id: string;
  kind: string;
  message: string;
  contact_ok: boolean;
  created_at: string;
};

export function rowToFeedback(r: FeedbackRowLike): FeedbackEntry {
  return {
    id: r.id,
    kind: r.kind,
    message: r.message,
    contactOk: r.contact_ok,
    createdAt: r.created_at,
  };
}
