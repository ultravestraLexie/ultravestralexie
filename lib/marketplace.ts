/* Local-gigs market — the pure module behind the owner's local
 * opportunities feature (2026-11-24): the prototype's mechanics,
 * copy and seed data, ported line-for-line where the prototype is
 * the spec — pay models and payout math, creator<->opportunity and
 * business<->creator matching, the collab status machine, promo
 * codes, demo tracking stats, and the customer follow-up generator.
 *
 * Everything here runs on a DEVICE-LOCAL store ("uv-market.v1").
 * Sample collabs are never written to creator_deals or any database
 * table — Deals and Money stay real-data only. The seed is the
 * prototype's sample data verbatim and is labeled SAMPLE in the UI.
 *
 * Pure functions take `now` explicitly so the regression fixtures
 * can pin time; the localStorage wrappers pass Date.now(). */

export const MARKET_STORAGE_KEY = "uv-market.v1";

export const DAY = 864e5;
export const HOUR = 36e5;

export const AREAS_LIST = ["Downtown", "Eastside", "Westside", "Northside", "Southside"];
export const CATS = ["Food", "Beauty", "Fitness", "Retail", "Services", "Home"];
export const NICHES = ["Food", "Beauty", "Fitness", "Retail", "Services", "Home", "Lifestyle", "Tech", "Family"];
export const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts"];
export const COLORS = ["#F5C451", "#B69CFF", "#3EE6E0", "#FF9CC8", "#9DB8FF", "#4ADE80", "#F59E42"];

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type PayModel = "flat" | "perResult" | "productFee";

export type CollabStatus =
  | "invited"
  | "applied"
  | "countered"
  | "accepted"
  | "submitted"
  | "changes"
  | "approved"
  | "live"
  | "declined";

export interface MarketBusiness {
  id: string;
  name: string;
  cat: string;
  area: string;
  dist: number;
  rating: number;
  done: number;
  onTime: number;
  avgSale: number;
  about: string;
}

export interface MarketOpp {
  id: string;
  biz: string;
  title: string;
  videos: number;
  platforms: string[];
  goal: string;
  model: PayModel;
  rate: number;
  per?: number;
  unit?: string;
  product?: string;
  offer: string;
  minF: number;
  local: number;
  days: number;
  spots: number;
  rights: string;
  brief: string;
  status: "open" | "closed";
  posted: number;
}

export interface MarketCreator {
  id: string;
  handle: string;
  name: string;
  niches: string[];
  area: string;
  followers: number;
  eng: number | null;
  views: number | null;
  done: number;
  onTime: number;
  rate: number;
  platforms?: string[];
  isMe?: boolean;
}

export interface MarketMe {
  name: string;
  handle: string;
  niches: string[];
  area: string;
  followers: number;
  platforms: string[];
  rate: number;
}

export interface CollabStats {
  views: number;
  clicks: number;
  leads: number;
  customers: number;
  revenue: number;
}

export interface MarketCollab {
  id: string;
  opp: string;
  cr: string;
  status: CollabStatus;
  rate: number;
  ask?: number;
  by?: "creator" | "business";
  msg?: string;
  passport?: boolean;
  code?: string;
  paid?: boolean;
  paidAt?: number;
  video?: string;
  post?: string;
  caption?: string;
  note?: string | null;
  stats?: CollabStats;
  ts: number;
}

export interface MarketLead {
  what: string;
  amount: number;
  contacted?: number;
  won?: boolean;
}

export interface MarketCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  consent: boolean;
  source: string;
  visits: number;
  spend: number;
  lastVisit?: number;
  nextAppt?: number | null;
  apptWhat?: string;
  reminded?: boolean;
  reviewAsked?: boolean;
  winbackAt?: number;
  lead?: MarketLead;
  created: number;
  log?: { ts: number; t: string }[];
}

export interface MarketAutomation {
  on: boolean;
  days?: number;
  hours?: number;
  text: string;
}

export interface MarketAutomations {
  estimate: MarketAutomation;
  reminder: MarketAutomation;
  review: MarketAutomation;
  winback: MarketAutomation;
}

export interface MarketBizSettings {
  reviewLink: string;
  winbackOffer: string;
  avgSale: number;
}

export interface MarketState {
  v: 1;
  sample: boolean;
  me: MarketMe;
  myBiz: string;
  bizSettings: MarketBizSettings;
  automations: MarketAutomations;
  businesses: MarketBusiness[];
  opps: MarketOpp[];
  creators: MarketCreator[];
  collabs: MarketCollab[];
  customers: MarketCustomer[];
}

// ---------------------------------------------------------------------
// Seed — the prototype's sample data, verbatim. Timestamps are
// computed from `now` exactly as the prototype computed them.
// ---------------------------------------------------------------------

export function seedMarketState(now: number): MarketState {
  function at(daysAhead: number, h: number, m?: number) {
    const d = new Date(now + daysAhead * DAY);
    d.setHours(h, m || 0, 0, 0);
    return d.getTime();
  }
  const soon = at(0, 18, 30) > now + 2 * HOUR ? at(0, 18, 30) : at(1, 12, 30);
  return {
    v: 1,
    sample: true,
    me: { name: "You", handle: "@yourhandle", niches: ["Food", "Lifestyle"], area: "Eastside", followers: 2400, platforms: ["TikTok", "Instagram Reels"], rate: 120 },
    myBiz: "b1",
    bizSettings: { reviewLink: "[YOUR REVIEW LINK]", winbackOffer: "15% off your next order", avgSale: 24 },
    automations: {
      estimate: { on: true, days: 2, text: "Hi {first}, it’s {business}. Just checking in on your {what} quote. Any questions? Happy to help." },
      reminder: { on: true, hours: 24, text: "Hi {first}, a reminder from {business}: you’re booked {when}. Reply C to confirm or R to reschedule." },
      review: { on: true, days: 3, text: "Thanks for visiting {business}, {first}! If you enjoyed it, a quick review would mean a lot: {review}" },
      winback: { on: true, days: 60, text: "Hi {first}, we miss you at {business}! Here’s {offer}. Just show this text when you come in." },
    },
    businesses: [
      { id: "b1", name: "Rosa’s Taqueria", cat: "Food", area: "Eastside", dist: 0.8, rating: 4.9, done: 14, onTime: 100, avgSale: 24, about: "Family taqueria. Famous for birria tacos and Taco Tuesdays." },
      { id: "b2", name: "Fade Kings Barbershop", cat: "Services", area: "Eastside", dist: 1.4, rating: 4.8, done: 9, onTime: 100, avgSale: 35, about: "Walk-ins and appointments. Fades, beards and kids’ cuts." },
      { id: "b3", name: "Thread & Co. Boutique", cat: "Retail", area: "Downtown", dist: 2.1, rating: 4.6, done: 6, onTime: 92, avgSale: 68, about: "Women’s clothing boutique with a new winter collection." },
      { id: "b4", name: "Iron Ridge Gym", cat: "Fitness", area: "Eastside", dist: 1.9, rating: 4.7, done: 11, onTime: 96, avgSale: 49, about: "Neighborhood gym with classes, open 24/7." },
      { id: "b5", name: "Glow Skin Studio", cat: "Beauty", area: "Westside", dist: 3.2, rating: 4.9, done: 8, onTime: 100, avgSale: 85, about: "Facials and skin treatments by licensed estheticians." },
      { id: "b6", name: "Casa Verde Realty", cat: "Home", area: "Northside", dist: 4.4, rating: 4.5, done: 3, onTime: 88, avgSale: 0, about: "Local real estate team. Open houses every weekend." },
    ],
    opps: [
      { id: "o1", biz: "b1", title: "3 videos for our new birria tacos", videos: 3, platforms: ["TikTok", "Instagram Reels"], goal: "Foot traffic", model: "flat", rate: 150, offer: "15% off your first order", minF: 0, local: 5, days: 10, spots: 3, rights: "Organic posts only", brief: "Show the cheese pull, the consommé dip and your honest first bite. Film in the shop, any day after 2pm.", status: "open", posted: now - 3 * DAY },
      { id: "o2", biz: "b2", title: "Get us more local customers", videos: 1, platforms: ["TikTok"], goal: "Bookings", model: "perResult", rate: 50, per: 10, unit: "booked cut", offer: "$5 off your first cut", minF: 0, local: 5, days: 7, spots: 4, rights: "Organic posts only", brief: "Get a fresh cut and film the before and after. Mention we take walk-ins.", status: "open", posted: now - 1 * DAY },
      { id: "o3", biz: "b3", title: "TikTok content for our winter drop", videos: 4, platforms: ["TikTok"], goal: "Online sales", model: "productFee", rate: 200, product: "$150 store credit", offer: "10% off online", minF: 1000, local: 0, days: 14, spots: 2, rights: "Can run as ads for 30 days", brief: "Try on 4 outfits from the winter collection. Styling tips welcome.", status: "open", posted: now - 2 * DAY },
      { id: "o4", biz: "b4", title: "Promote our new membership", videos: 2, platforms: ["TikTok", "Instagram Reels"], goal: "Bookings", model: "perResult", rate: 100, per: 25, unit: "new member", offer: "First month free", minF: 0, local: 5, days: 12, spots: 5, rights: "Organic posts only", brief: "Take a class and show the vibe. Real reactions beat scripts.", status: "open", posted: now - 5 * DAY },
      { id: "o5", biz: "b5", title: "Before & after facial video", videos: 1, platforms: ["Instagram Reels"], goal: "Bookings", model: "flat", rate: 120, offer: "20% off a first facial", minF: 2000, local: 10, days: 9, spots: 2, rights: "Organic posts only", brief: "Book a free facial and share your honest before and after.", status: "open", posted: now - 4 * DAY },
      { id: "o6", biz: "b6", title: "Open house walkthrough video", videos: 1, platforms: ["TikTok", "YouTube Shorts"], goal: "Leads", model: "flat", rate: 250, offer: "Free home value report", minF: 5000, local: 15, days: 6, spots: 1, rights: "Can run as ads for 30 days", brief: "Walk through Saturday’s open house with our agent. Show the best rooms.", status: "open", posted: now - 1 * DAY },
      { id: "o7", biz: "b1", title: "Taco Tuesday launch", videos: 1, platforms: ["TikTok"], goal: "Foot traffic", model: "flat", rate: 150, offer: "2-for-1 tacos on Tuesday", minF: 0, local: 5, days: 7, spots: 1, rights: "Organic posts only", brief: "Show the Taco Tuesday crowd.", status: "closed", posted: now - 40 * DAY },
      { id: "o8", biz: "b5", title: "Spring glow promo", videos: 1, platforms: ["Instagram Reels"], goal: "Bookings", model: "flat", rate: 120, offer: "20% off a first facial", minF: 0, local: 10, days: 7, spots: 1, rights: "Organic posts only", brief: "Share your facial experience.", status: "closed", posted: now - 60 * DAY },
    ],
    creators: [
      { id: "p1", handle: "@maya.makes", name: "Maya Reyes", niches: ["Food", "Lifestyle"], area: "Eastside", followers: 2100, eng: 7.8, views: 3400, done: 6, onTime: 100, rate: 120 },
      { id: "p2", handle: "@jay.creates", name: "Jay Coleman", niches: ["Lifestyle", "Fitness"], area: "Downtown", followers: 12000, eng: 5.1, views: 9800, done: 11, onTime: 100, rate: 180 },
      { id: "p3", handle: "@lena.ugc", name: "Lena Ortiz", niches: ["Beauty", "Retail"], area: "Westside", followers: 48000, eng: 4.2, views: 21000, done: 23, onTime: 96, rate: 350 },
      { id: "p4", handle: "@coco.films", name: "Coco Park", niches: ["Food"], area: "Eastside", followers: 900, eng: 11.3, views: 2600, done: 2, onTime: 100, rate: 90 },
      { id: "p5", handle: "@dre.unboxes", name: "Dre Williams", niches: ["Retail", "Tech"], area: "Northside", followers: 5600, eng: 6.0, views: 4100, done: 5, onTime: 100, rate: 140 },
      { id: "p6", handle: "@sam.cooks", name: "Sam Patel", niches: ["Food", "Family"], area: "Downtown", followers: 31000, eng: 3.9, views: 14000, done: 17, onTime: 94, rate: 300 },
      { id: "p7", handle: "@nia.reviews", name: "Nia Brooks", niches: ["Beauty", "Food"], area: "Eastside", followers: 3200, eng: 8.4, views: 3900, done: 4, onTime: 100, rate: 110 },
      { id: "p8", handle: "@tre.lifts", name: "Tre Morgan", niches: ["Fitness"], area: "Eastside", followers: 7400, eng: 6.6, views: 6200, done: 7, onTime: 100, rate: 150 },
    ],
    collabs: [
      { id: "c1", opp: "o1", cr: "p1", status: "live", rate: 150, code: "MAYA15", paid: true, video: "tiktok.com/@maya.makes (sample)", post: "tiktok.com/@maya.makes (sample)", stats: { views: 8400, clicks: 296, leads: 61, customers: 37, revenue: 888 }, ts: now - 12 * DAY },
      { id: "c2", opp: "o1", cr: "p4", status: "submitted", rate: 150, code: "COCO15", video: "tiktok.com/@coco.films (sample)", caption: "The birria cheese pull at Rosa’s is unreal 🔥 15% off with my code COCO15", ts: now - 1 * DAY },
      { id: "c3", opp: "o1", cr: "p6", status: "applied", rate: 150, ask: 300, by: "creator", msg: "Love your birria! I can film all 3 this week. My food videos average 14K views, so my rate is $300 per video.", ts: now - 6 * HOUR },
      { id: "c4", opp: "o7", cr: "p2", status: "live", rate: 150, code: "JAY2FOR1", paid: true, video: "tiktok.com/@jay.creates (sample)", post: "tiktok.com/@jay.creates (sample)", stats: { views: 15200, clicks: 530, leads: 72, customers: 41, revenue: 984 }, ts: now - 38 * DAY },
      { id: "c5", opp: "o4", cr: "me", status: "accepted", rate: 100, code: "YOURGYM", ts: now - 2 * DAY },
      { id: "c6", opp: "o8", cr: "me", status: "live", rate: 120, code: "YOURGLOW", paid: true, video: "instagram.com/yourhandle (sample)", post: "instagram.com/yourhandle (sample)", stats: { views: 3100, clicks: 98, leads: 22, customers: 9, revenue: 765 }, ts: now - 55 * DAY },
    ],
    customers: [
      { id: "k1", name: "Ana Torres", phone: "(555) 010-2231", email: "ana@example.com", consent: true, source: "p1", visits: 5, spend: 142, lastVisit: now - 1.5 * DAY, created: now - 11 * DAY },
      { id: "k2", name: "Marcus Lee", phone: "(555) 010-4410", email: "", consent: false, source: "p2", visits: 2, spend: 58, lastVisit: now - 75 * DAY, created: now - 37 * DAY - 40 * DAY },
      { id: "k3", name: "Priya Shah", phone: "(555) 010-7782", email: "priya@example.com", consent: true, source: "Google", visits: 0, spend: 0, lead: { what: "catering for 40 people", amount: 680 }, created: now - 3 * DAY },
      { id: "k4", name: "Diego Ramos", phone: "(555) 010-3349", email: "diego@example.com", consent: true, source: "p1", visits: 1, spend: 24, lastVisit: now - 10 * DAY, nextAppt: soon, apptWhat: "catering pickup", created: now - 10 * DAY },
      { id: "k5", name: "Keisha Brown", phone: "(555) 010-9021", email: "keisha@example.com", consent: true, source: "Walk-in", visits: 9, spend: 260, lastVisit: now - 5 * DAY, reviewAsked: true, created: now - 120 * DAY },
      { id: "k6", name: "Tom Nguyen", phone: "(555) 010-1187", email: "tom@example.com", consent: true, source: "p2", visits: 1, spend: 31, lastVisit: now - 1 * DAY, created: now - 1 * DAY },
      { id: "k7", name: "Lucia Morales", phone: "(555) 010-6650", email: "lucia@example.com", consent: true, source: "Instagram", visits: 0, spend: 0, lead: { what: "birthday party for 15", amount: 320, contacted: now - 1 * DAY }, created: now - 4 * DAY },
      { id: "k8", name: "Ben Carter", phone: "(555) 010-5523", email: "ben@example.com", consent: true, source: "Referral", visits: 3, spend: 77, lastVisit: now - 95 * DAY, reviewAsked: true, created: now - 200 * DAY },
      { id: "k9", name: "Sofia Kim", phone: "(555) 010-8874", email: "sofia@example.com", consent: true, source: "p1", visits: 2, spend: 51, lastVisit: now - 14 * DAY, nextAppt: at(4, 19), apptWhat: "table for 6", reviewAsked: true, created: now - 12 * DAY },
      { id: "k10", name: "Omar Haddad", phone: "(555) 010-2290", email: "", consent: false, source: "Walk-in", visits: 1, spend: 18, lastVisit: now - 20 * DAY, reviewAsked: true, created: now - 20 * DAY },
      { id: "k11", name: "Grace Wilson", phone: "(555) 010-4471", email: "grace@example.com", consent: true, source: "Google", visits: 6, spend: 188, lastVisit: now - 12 * DAY, reviewAsked: true, created: now - 90 * DAY },
      { id: "k12", name: "Andre Jackson", phone: "(555) 010-3318", email: "andre@example.com", consent: true, source: "p2", visits: 0, spend: 0, lead: { what: "office lunch for 25", amount: 410 }, created: now - 1 * DAY },
    ],
  };
}

// ---------------------------------------------------------------------
// Store — parse / load / save (device-local only)
// ---------------------------------------------------------------------

export function parseMarketState(raw: unknown, now: number): MarketState {
  if (raw && typeof raw === "object") {
    const r = raw as Partial<MarketState>;
    if (
      r.v === 1 &&
      r.me &&
      Array.isArray(r.businesses) &&
      Array.isArray(r.opps) &&
      Array.isArray(r.creators) &&
      Array.isArray(r.collabs) &&
      Array.isArray(r.customers) &&
      r.automations &&
      r.bizSettings
    ) {
      return r as MarketState;
    }
  }
  return seedMarketState(now);
}

export function loadMarketState(): MarketState {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    if (!raw) return seedMarketState(Date.now());
    return parseMarketState(JSON.parse(raw), Date.now());
  } catch {
    return seedMarketState(Date.now());
  }
}

export function saveMarketState(state: MarketState): void {
  try {
    localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the market lives in this session */
  }
}

// ---------------------------------------------------------------------
// Lookups + formatting (prototype helpers, verbatim behavior)
// ---------------------------------------------------------------------

export function bizById(state: MarketState, id: string): MarketBusiness {
  return state.businesses.filter((b) => b.id === id)[0];
}
export function oppById(state: MarketState, id: string): MarketOpp {
  return state.opps.filter((o) => o.id === id)[0];
}
export function creatorById(state: MarketState, id: string): MarketCreator {
  if (id === "me") {
    const m = state.me;
    return {
      id: "me",
      handle: m.handle,
      name: m.name,
      niches: m.niches,
      area: m.area,
      followers: m.followers,
      platforms: m.platforms,
      eng: null,
      views: null,
      done: state.collabs.filter((c) => c.cr === "me" && c.paid).length,
      onTime: 100,
      rate: m.rate,
      isMe: true,
    };
  }
  return state.creators.filter((c) => c.id === id)[0];
}
export function collabOf(state: MarketState, oppId: string, crId: string): MarketCollab | undefined {
  return state.collabs.filter((c) => c.opp === oppId && c.cr === crId)[0];
}
export function myBizOf(state: MarketState): MarketBusiness {
  return bizById(state, state.myBiz);
}
export function myCollabsOf(state: MarketState): MarketCollab[] {
  return state.collabs.filter((c) => oppById(state, c.opp).biz === state.myBiz);
}

export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
export function fmtK(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".0", "") + "K";
  return String(Math.round(n));
}
export function ago(ts: number, now: number): string {
  const d = (now - ts) / DAY;
  if (d < 1 / 24) return "just now";
  if (d < 1) return Math.round(d * 24) + "h ago";
  if (d < 2) return "yesterday";
  return Math.round(d) + " days ago";
}
export function when(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / DAY);
  if (days === 0) return "today at " + t;
  if (days === 1) return "tomorrow at " + t;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) + " at " + t;
}
export function initialsOf(s: string): string {
  return s
    .replace(/^@/, "")
    .split(/[\s._&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}
export function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}
export function clampNum(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}
export function uid(prefix: string, now: number): string {
  return prefix + now.toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------
// Money — the prototype's pay text and payout math, exactly.
//   flat:       rate per video  -> payout = rate × videos
//   perResult:  base + per × customers brought so far
//   productFee: fee + product   -> payout = fee
// ---------------------------------------------------------------------

export function payText(o: MarketOpp, short?: boolean): string {
  if (o.model === "flat") return money(o.rate) + " per video" + (o.videos > 1 && !short ? " · " + o.videos + " videos (" + money(o.rate * o.videos) + ")" : "");
  if (o.model === "perResult") return money(o.rate) + " + " + money(o.per || 0) + " per " + o.unit;
  return money(o.rate) + " + " + o.product;
}
export function rateLabel(o: MarketOpp): string {
  return o.model === "flat" ? "per video" : o.model === "perResult" ? "base fee" : "fee";
}
export function payout(state: MarketState, c: MarketCollab): number {
  const o = oppById(state, c.opp);
  if (o.model === "flat") return c.rate * o.videos;
  if (o.model === "perResult") return c.rate + (o.per || 0) * ((c.stats && c.stats.customers) || 0);
  return c.rate;
}
export function potentialOf(o: MarketOpp): number {
  return o.model === "flat" ? o.rate * o.videos : o.model === "perResult" ? o.rate + (o.per || 0) * 10 : o.rate;
}
export function budgetTotal(d: { model: PayModel; rate: number; videos: number; spots: number }): number {
  return d.model === "flat" ? d.rate * d.videos * d.spots : d.rate * d.spots;
}

// ---------------------------------------------------------------------
// Matching (prototype scoring, verbatim)
// ---------------------------------------------------------------------

export interface MatchResult {
  score: number;
  reasons: string[];
  warn: string | null;
}

export function matchOpp(state: MarketState, o: MarketOpp, cr: MarketCreator): MatchResult {
  const b = bizById(state, o.biz);
  let score = 0;
  const reasons: string[] = [];
  let warn: string | null = null;
  const niche = cr.niches.indexOf(b.cat) >= 0;
  if (niche) {
    score += 35;
    reasons.push("You create " + b.cat.toLowerCase() + " content");
  } else if (cr.niches.indexOf("Lifestyle") >= 0) {
    score += 15;
    reasons.push("Lifestyle creators fit most local businesses");
  }
  if (cr.area === b.area) {
    score += 25;
    reasons.push("You’re in " + b.area + ", " + b.dist + " mi away");
  } else if (b.dist <= 3) {
    score += 15;
    reasons.push("Close by: " + b.dist + " mi");
  } else score += 5;
  if (cr.followers >= o.minF) {
    score += 20;
    if (o.minF === 0) reasons.push("Any audience size is welcome");
  } else warn = "Needs " + fmtK(o.minF) + "+ followers";
  if (o.platforms.some((p) => (cr.platforms || PLATFORMS).indexOf(p) >= 0)) score += 10;
  if (b.onTime >= 95) {
    score += 9;
    reasons.push("Pays on time (" + b.onTime + "% of deals)");
  }
  return { score: clampNum(score, 0, 99), reasons, warn };
}

export function matchCreator(state: MarketState, b: MarketBusiness, cr: MarketCreator): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (cr.niches.indexOf(b.cat) >= 0) {
    score += 35;
    reasons.push(b.cat + " creator");
  } else if (cr.niches.indexOf("Lifestyle") >= 0) {
    score += 15;
    reasons.push("Lifestyle creator");
  }
  if (cr.area === b.area) {
    score += 25;
    reasons.push("Local to " + b.area);
  }
  if (cr.eng != null && cr.eng >= 6) {
    score += 15;
    reasons.push(cr.eng + "% engagement");
  } else score += 7;
  if (cr.done >= 5) {
    score += 12;
    reasons.push(cr.done + " collabs done");
  } else if (cr.done >= 1) score += 6;
  if (cr.onTime >= 98) score += 10;
  return { score: clampNum(score, 0, 99), reasons };
}

// Demo tracking: in the real app these come from each creator's
// tracking link and promo code. Ported exactly (deterministic hash).
export function demoStats(state: MarketState, c: MarketCollab): CollabStats {
  const cr = creatorById(state, c.cr);
  const o = oppById(state, c.opp);
  const b = bizById(state, o.biz);
  let h = 0;
  for (let i = 0; i < c.id.length; i++) h = (h * 17 + c.id.charCodeAt(i)) % 1000;
  const views = Math.round((cr.views || cr.followers * 1.3) * (0.8 + h / 1000) * Math.max(1, o.videos * 0.7));
  const clicks = Math.round(views * 0.034);
  const leads = Math.round(clicks * 0.21);
  const customers = Math.round(leads * 0.55);
  return { views, clicks, leads, customers, revenue: customers * (b.avgSale || 30) };
}
export function promoCode(cr: MarketCreator, o: MarketOpp): string {
  return (cr.handle.replace(/[^a-z]/gi, "").slice(0, 5) + (o.offer.match(/\d+/) || ["VIP"])[0]).toUpperCase();
}

// ---------------------------------------------------------------------
// Collab state machine — the prototype's transitions. STATUS / STEP
// labels verbatim; every transition stamps ts and returns the collab.
// ---------------------------------------------------------------------

export const STATUS: Record<CollabStatus, [string, string]> = {
  invited: ["Invited", "t-purple"],
  applied: ["Applied", "t-blue"],
  countered: ["Counter offer", "t-gold"],
  accepted: ["Creating", "t-cyan"],
  submitted: ["In review", "t-blue"],
  changes: ["Changes requested", "t-orange"],
  approved: ["Approved", "t-green"],
  live: ["Live", "t-green"],
  declined: ["Declined", "t-faint"],
};
export const STEP: Record<CollabStatus, number> = {
  invited: 0,
  applied: 0,
  countered: 1,
  accepted: 2,
  changes: 2,
  submitted: 3,
  approved: 4,
  live: 5,
  declined: 0,
};
export const STEP_LABELS = ["Apply", "Agree", "Create", "Review", "Post", "Paid"];

export function setCollabStatus(
  state: MarketState,
  collabId: string,
  status: CollabStatus,
  now: number,
  extra?: Partial<MarketCollab>
): MarketCollab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  c.status = status;
  c.ts = now;
  if (extra) Object.assign(c, extra);
  return c;
}

/** Creator applies to an opportunity (prototype applySheet). */
export function applyToOpp(
  state: MarketState,
  oppId: string,
  input: { ask: number; msg: string; passport: boolean },
  now: number
): MarketCollab {
  const o = oppById(state, oppId);
  const me = creatorById(state, "me");
  const c: MarketCollab = {
    id: uid("c", now),
    opp: oppId,
    cr: "me",
    status: "applied",
    rate: o.rate,
    ask: input.ask,
    by: "creator",
    msg: input.msg.slice(0, 600),
    passport: input.passport,
    code: promoCode(me, o),
    ts: now,
  };
  state.collabs.push(c);
  return c;
}

/** Business invites a creator to one of its open campaigns. */
export function inviteCreator(
  state: MarketState,
  oppId: string,
  creatorId: string,
  input: { rate: number; msg: string },
  now: number
): MarketCollab {
  const o = oppById(state, oppId);
  const cr = creatorById(state, creatorId);
  const c: MarketCollab = {
    id: uid("c", now),
    opp: oppId,
    cr: creatorId,
    status: "invited",
    rate: input.rate,
    ask: input.rate,
    by: "business",
    msg: input.msg,
    code: promoCode(cr, o),
    ts: now,
  };
  state.collabs.push(c);
  return c;
}

/** Counter offer — a creator countering moves the collab back to
 *  "applied" (their ask, by creator); a business countering moves
 *  it to "countered" (their ask, by business). Prototype-exact. */
export function counterCollab(
  state: MarketState,
  collabId: string,
  amount: number,
  by: "creator" | "business",
  now: number
): MarketCollab | undefined {
  return setCollabStatus(state, collabId, by === "creator" ? "applied" : "countered", now, { ask: amount, by });
}

/** Accept the standing ask (or the collab's rate) — the deal rate
 *  becomes the ask and the collab moves to "accepted" (Creating),
 *  keeping/assigning its promo code. */
export function acceptCollab(state: MarketState, collabId: string, now: number): MarketCollab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  const agreed = c.ask || c.rate;
  const code = c.code || promoCode(creatorById(state, c.cr), oppById(state, c.opp));
  return setCollabStatus(state, collabId, "accepted", now, { rate: agreed, code });
}

export function declineCollab(state: MarketState, collabId: string, now: number): MarketCollab | undefined {
  return setCollabStatus(state, collabId, "declined", now);
}

export function submitCollab(
  state: MarketState,
  collabId: string,
  input: { video: string; caption: string },
  now: number
): MarketCollab | undefined {
  return setCollabStatus(state, collabId, "submitted", now, {
    video: input.video.slice(0, 300),
    caption: input.caption.slice(0, 500),
    note: null,
  });
}

export function requestChanges(state: MarketState, collabId: string, note: string, now: number): MarketCollab | undefined {
  return setCollabStatus(state, collabId, "changes", now, { note });
}

export function approveCollab(state: MarketState, collabId: string, now: number): MarketCollab | undefined {
  return setCollabStatus(state, collabId, "approved", now);
}

/** Creator posts the approved video — the collab goes live and its
 *  demo tracking stats start counting. */
export function postCollab(state: MarketState, collabId: string, post: string, now: number): MarketCollab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  const stats = demoStats(state, c);
  return setCollabStatus(state, collabId, "live", now, { post: post.slice(0, 300), stats });
}

export function markCollabPaid(state: MarketState, collabId: string, now: number): MarketCollab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  c.paid = true;
  c.paidAt = now;
  c.ts = now;
  return c;
}

// ---------------------------------------------------------------------
// Customers — segments + the follow-up generator (prototype-exact)
// ---------------------------------------------------------------------

export type FollowUpType = "estimate" | "reminder" | "review" | "winback";

export interface FollowUp {
  customer: MarketCustomer;
  type: FollowUpType;
  title: string;
  why: string;
}

export function firstName(name: string): string {
  return name.split(" ")[0];
}

export function fillMsg(state: MarketState, tpl: string, k: MarketCustomer): string {
  const b = myBizOf(state);
  return tpl
    .replace(/\{first\}/g, firstName(k.name))
    .replace(/\{business\}/g, b.name)
    .replace(/\{what\}/g, (k.lead && k.lead.what) || "order")
    .replace(/\{when\}/g, k.nextAppt ? when(k.nextAppt) : "soon")
    .replace(/\{review\}/g, state.bizSettings.reviewLink)
    .replace(/\{offer\}/g, state.bizSettings.winbackOffer);
}

export function segOf(state: MarketState, k: MarketCustomer, now: number): string[] {
  const A = state.automations;
  const segs: string[] = [];
  if (k.lead && !k.lead.won) segs.push("leads");
  if (k.nextAppt && k.nextAppt > now) segs.push("upcoming");
  if (k.lastVisit && now - k.lastVisit < (A.review.days || 0) * DAY && !k.reviewAsked) segs.push("review");
  if (k.visits >= 1 && k.lastVisit && now - k.lastVisit > (A.winback.days || 0) * DAY) segs.push("lapsed");
  if (k.visits >= 4 && segs.indexOf("lapsed") < 0) segs.push("regulars");
  return segs;
}

export function followUps(state: MarketState, now: number): FollowUp[] {
  const A = state.automations;
  const out: FollowUp[] = [];
  state.customers.forEach((k) => {
    if (A.estimate.on && k.lead && !k.lead.won && !k.lead.contacted && now - k.created >= (A.estimate.days || 0) * DAY)
      out.push({ customer: k, type: "estimate", title: "Follow up on their quote", why: "Asked about " + k.lead.what + " (" + money(k.lead.amount) + ") " + ago(k.created, now) + ". No reply yet." });
    if (A.reminder.on && k.nextAppt && k.nextAppt > now && k.nextAppt - now <= (A.reminder.hours || 0) * HOUR && !k.reminded)
      out.push({ customer: k, type: "reminder", title: "Send an appointment reminder", why: (k.apptWhat ? k.apptWhat.charAt(0).toUpperCase() + k.apptWhat.slice(1) + " " : "Booked ") + when(k.nextAppt) + "." });
    if (A.review.on && k.lastVisit && now - k.lastVisit < (A.review.days || 0) * DAY && now - k.lastVisit > 2 * HOUR && !k.reviewAsked)
      out.push({ customer: k, type: "review", title: "Ask for a review", why: "Visited " + ago(k.lastVisit, now) + ". Happy customers rarely review unless asked." });
    if (A.winback.on && k.visits >= 1 && k.lastVisit && now - k.lastVisit > (A.winback.days || 0) * DAY && (!k.winbackAt || now - k.winbackAt > 30 * DAY))
      out.push({ customer: k, type: "winback", title: "Win them back", why: "Hasn’t been back in " + Math.round((now - k.lastVisit) / DAY) + " days. Spent " + money(k.spend) + " over " + k.visits + " visits." });
  });
  return out;
}

export function markFollowUpDone(state: MarketState, item: FollowUp, now: number): void {
  const k = item.customer;
  if (item.type === "estimate" && k.lead) k.lead.contacted = now;
  if (item.type === "reminder") k.reminded = true;
  if (item.type === "review") k.reviewAsked = true;
  if (item.type === "winback") k.winbackAt = now;
  (k.log = k.log || []).push({ ts: now, t: item.title });
}

// ---------------------------------------------------------------------
// Dashboard strip numbers for the business home (computed from the
// store, exactly as the prototype's tab badges / dash computed them)
// ---------------------------------------------------------------------

export function dashboardNumbers(state: MarketState, now: number): {
  activeCampaigns: number;
  applicantsWaiting: number;
  followUpsDue: number;
} {
  return {
    activeCampaigns: state.opps.filter((o) => o.biz === state.myBiz && o.status === "open").length,
    applicantsWaiting: myCollabsOf(state).filter((c) => /applied|submitted/.test(c.status)).length,
    followUpsDue: followUps(state, now).length,
  };
}

/** Business dashboard totals (prototype renderDash math). */
export function dashTotals(state: MarketState): {
  views: number;
  clicks: number;
  leads: number;
  customers: number;
  revenue: number;
  spend: number;
} {
  const mine = myCollabsOf(state);
  const live = mine.filter((c) => c.stats);
  const tot = live.reduce(
    (a, c) => {
      const s = c.stats as CollabStats;
      a.views += s.views;
      a.clicks += s.clicks;
      a.leads += s.leads;
      a.customers += s.customers;
      a.revenue += s.revenue;
      return a;
    },
    { views: 0, clicks: 0, leads: 0, customers: 0, revenue: 0 }
  );
  const spend = mine
    .filter((c) => c.paid || /approved|live/.test(c.status))
    .reduce((s, c) => s + payout(state, c), 0);
  return { ...tot, spend };
}
