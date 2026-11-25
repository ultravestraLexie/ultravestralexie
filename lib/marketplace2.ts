/* Marketplace v2 — the home-pages store (owner order 2026-11-24,
 * the v2 prototype file): the v1 local-gigs seed verbatim PLUS the
 * prototype's seedExtra — a 36-creator network (generated with the
 * prototype's own LCG so the numbers are deterministic), the brand
 * Aurelia Skin Co. with its two campaigns and 26 collabs, two
 * ambassadors, and the Northstar Creator Co. agency (roster, clients,
 * 15% fee) with its six agency collabs.
 *
 * Everything runs on a DEVICE-LOCAL store ("uv-market.v2"), separate
 * from "uv-market.v1" so the shipped v1 surfaces (business tools,
 * /brands local opportunities) keep their exact behavior. Sample
 * collabs are never written to creator_deals or any database table.
 *
 * One bridge: on load, the v2 `me` adopts the v1 store's profile
 * fields when a v1 profile exists on this device, so the gig profile
 * the creator edits (Profile tab, v1 store) is the profile the v2
 * Discover matching scores with.
 *
 * Pure functions take `now` explicitly so fixtures can pin time. */

import {
  DAY,
  HOUR,
  MARKET_STORAGE_KEY,
  fmtK,
  type CollabStats,
  type CollabStatus,
  type MarketAutomations,
  type MarketBizSettings,
  type MarketBusiness,
  type MarketCollab,
  type MarketCreator,
  type MarketCustomer,
  type MarketMe,
  type MarketOpp,
} from "./marketplace";

export const MARKET2_STORAGE_KEY = "uv-market.v2";

export const CITIES = ["Chicago", "Houston", "Atlanta", "Phoenix", "Dallas", "Miami"];
export const TIERS: [string, string, number][] = [
  ["Nano", "Nano (1K–10K)", 1000],
  ["Micro", "Micro (10K–100K)", 10000],
  ["Mid", "Mid (100K+)", 100000],
];

// ---------------------------------------------------------------------
// Types — v1 shapes plus the v2 additions (brand businesses, campaign
// cities/tiers, agency-routed collabs, the network, the agency, the
// ambassador list).
// ---------------------------------------------------------------------

export interface M2Business extends MarketBusiness {
  type?: "brand";
}

export interface M2Opp extends MarketOpp {
  cities?: string[];
  tiers?: string[];
}

export interface M2Collab extends MarketCollab {
  via?: "agency";
}

export interface M2Agency {
  name: string;
  fee: number;
  roster: string[];
  clients: string[];
  pending: string[];
  off: Record<string, boolean>;
}

export interface M2Ambassador {
  cr: string;
  retainer: number;
  posts: number;
  start: number;
  months: number;
}

export interface M2State {
  v: 2;
  sample: boolean;
  me: MarketMe;
  myBiz: string;
  myBrand: string;
  bizSettings: MarketBizSettings;
  automations: MarketAutomations;
  businesses: M2Business[];
  opps: M2Opp[];
  creators: MarketCreator[];
  network: MarketCreator[];
  collabs: M2Collab[];
  customers: MarketCustomer[];
  agency: M2Agency;
  ambassadors: M2Ambassador[];
}

// ---------------------------------------------------------------------
// Seed — the v1 seed verbatim, then the prototype's seedExtra ported
// line-for-line (same LCG, same call order, so the generated network
// and every calcStats number match the prototype exactly).
// ---------------------------------------------------------------------

export function tierOf(followers: number): string {
  return followers >= 100000 ? "Mid" : followers >= 10000 ? "Micro" : "Nano";
}

export function hashOf(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Engagement-aware demo tracking (prototype calcStats, exact). In
 *  the real app these numbers come from tracking links and promo
 *  codes. */
export function calcStats(cr: MarketCreator, videos: number, avgSale: number, salt: string): CollabStats {
  const h = hashOf(salt) % 1000;
  const eng = cr.eng || 5;
  const views = Math.round((cr.views || cr.followers * 1.3) * (0.8 + h / 1000) * Math.max(1, videos * 0.7));
  const clicks = Math.round(views * (0.012 + eng * 0.003));
  const leads = Math.round(clicks * 0.21);
  const customers = Math.round(leads * 0.55);
  return { views, clicks, leads, customers, revenue: customers * (avgSale || 30) };
}

export function seedMarket2State(now: number): M2State {
  function at(daysAhead: number, h: number, m?: number) {
    const d = new Date(now + daysAhead * DAY);
    d.setHours(h, m || 0, 0, 0);
    return d.getTime();
  }
  const soon = at(0, 18, 30) > now + 2 * HOUR ? at(0, 18, 30) : at(1, 12, 30);
  const s: M2State = {
    v: 2,
    sample: true,
    me: { name: "You", handle: "@yourhandle", niches: ["Food", "Lifestyle"], area: "Eastside", followers: 2400, platforms: ["TikTok", "Instagram Reels"], rate: 120 },
    myBiz: "b1",
    myBrand: "r1",
    bizSettings: { reviewLink: "[YOUR REVIEW LINK]", winbackOffer: "15% off your next order", avgSale: 24 },
    automations: {
      estimate: { on: true, days: 2, text: "Hi {first}, it’s {business}. Just checking in on your {what} quote. Any questions? Happy to help." },
      reminder: { on: true, hours: 24, text: "Hi {first}, a reminder from {business}: you’re booked {when}. Reply C to confirm or R to reschedule." },
      review: { on: true, days: 3, text: "Thanks for visiting {business}, {first}! If you enjoyed it, a quick review would mean a lot: {review}" },
      winback: { on: true, days: 60, text: "Hi {first}, we miss you at {business}! Here’s {offer}. Just show this text when you come in." },
    } as MarketAutomations,
    businesses: [
      { id: "b1", name: "Rosa’s Taqueria", cat: "Food", area: "Eastside", dist: 0.8, rating: 4.9, done: 14, onTime: 100, avgSale: 24, about: "Family taqueria. Famous for birria tacos and Taco Tuesdays." },
      { id: "b2", name: "Fade Kings Barbershop", cat: "Services", area: "Eastside", dist: 1.4, rating: 4.8, done: 9, onTime: 100, avgSale: 35, about: "Walk-ins and appointments. Fades, beards and kids’ cuts." },
      { id: "b3", name: "Thread & Co. Boutique", cat: "Retail", area: "Downtown", dist: 2.1, rating: 4.6, done: 6, onTime: 92, avgSale: 68, about: "Women’s clothing boutique with a new winter collection." },
      { id: "b4", name: "Iron Ridge Gym", cat: "Fitness", area: "Eastside", dist: 1.9, rating: 4.7, done: 11, onTime: 96, avgSale: 49, about: "Neighborhood gym with classes, open 24/7." },
      { id: "b5", name: "Glow Skin Studio", cat: "Beauty", area: "Westside", dist: 3.2, rating: 4.9, done: 8, onTime: 100, avgSale: 85, about: "Facials and skin treatments by licensed estheticians." },
      { id: "b6", name: "Casa Verde Realty", cat: "Home", area: "Northside", dist: 4.4, rating: 4.5, done: 3, onTime: 88, avgSale: 0, about: "Local real estate team. Open houses every weekend." },
      { id: "r1", type: "brand", name: "Aurelia Skin Co.", cat: "Beauty", area: "Nationwide", dist: 0, rating: 4.8, done: 42, onTime: 98, avgSale: 42, about: "Clean skincare sold online and in 300 stores." },
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
      { id: "o9", biz: "r1", title: "Winter skin reset: 20 creators, 6 cities", videos: 1, platforms: ["TikTok", "Instagram Reels"], goal: "Online sales", model: "productFee", rate: 250, product: "a free full-size set ($96 value)", offer: "20% off online", minF: 1000, local: 0, cities: [...CITIES], tiers: ["Nano", "Micro"], days: 14, spots: 20, rights: "Can run as ads for 30 days", brief: "Show your real winter routine with the Barrier Repair set. Honest texture shots and a 7-day check-in work best.", status: "open", posted: now - 2 * DAY },
      { id: "o10", biz: "r1", title: "Fall launch seeding", videos: 1, platforms: ["TikTok", "Instagram Reels"], goal: "Online sales", model: "productFee", rate: 200, product: "a free starter set ($54 value)", offer: "15% off online", minF: 1000, local: 0, cities: [...CITIES], tiers: ["Nano", "Micro", "Mid"], days: 14, spots: 16, rights: "Can run as ads for 30 days", brief: "Unbox the starter set and share your honest first impressions.", status: "closed", posted: now - 50 * DAY },
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
    network: [],
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
    agency: { name: "Northstar Creator Co.", fee: 15, roster: ["p1", "p4", "p7", "p8"], clients: ["b2", "b4"], pending: [], off: { p8: true } },
    ambassadors: [],
  };

  // ---- seedExtra (prototype, line-for-line) ----
  let n = 7;
  const rnd = () => {
    n = (n * 16807) % 2147483647;
    return (n - 1) / 2147483646;
  };
  const FIRST = ["Ava", "Mia", "Zoe", "Liam", "Kai", "Noah", "Isla", "Leo", "Ivy", "Eli", "Luna", "Owen", "Nova", "Jade", "Rio", "Skye", "Theo", "Ella", "Max", "Remy", "Sage", "Aria", "Cole", "Dani", "Gia", "Hugo", "Iris", "Jax", "Kira", "Lola", "Milo", "Nina", "Omari", "Pia", "Quinn", "Rory"];
  const SUF = [".glow", ".daily", ".skin", ".beauty", ".vibes", ".life", ".routine", ".edits", ".diaries", ".studio", ".loves", ".tries"];
  for (let i = 0; i < 36; i++) {
    const slot = i % 9;
    const tier = slot < 5 ? "Nano" : slot < 8 ? "Micro" : "Mid";
    const f = tier === "Nano" ? 1200 + Math.round(rnd() * 8500) : tier === "Micro" ? 12000 + Math.round(rnd() * 80000) : 110000 + Math.round(rnd() * 290000);
    const eng = Math.round((tier === "Nano" ? 6 + rnd() * 5 : tier === "Micro" ? 3.5 + rnd() * 3 : 1.8 + rnd() * 2) * 10) / 10;
    const views = Math.round(f * (tier === "Nano" ? 1.3 : tier === "Micro" ? 0.45 : 0.25) * (0.8 + rnd() * 0.6));
    const rate = Math.round((tier === "Nano" ? 80 + rnd() * 140 : tier === "Micro" ? 400 + rnd() * 600 : 1200 + rnd() * 2500) / 10) * 10;
    const nn: string[] = rnd() < 0.7 ? ["Beauty"] : [];
    nn.push(["Lifestyle", "Fitness", "Family", "Retail"][Math.floor(rnd() * 4)]);
    s.network.push({
      id: "n" + (i + 1),
      handle: "@" + FIRST[i].toLowerCase() + SUF[i % SUF.length],
      name: FIRST[i],
      niches: nn,
      area: CITIES[i % CITIES.length],
      followers: f,
      eng,
      views,
      done: tier === "Nano" ? 1 + Math.floor(rnd() * 8) : tier === "Micro" ? 5 + Math.floor(rnd() * 20) : 15 + Math.floor(rnd() * 45),
      onTime: 90 + Math.round(rnd() * 10),
      rate,
    });
  }
  const code = (cr: MarketCreator, tail: string) =>
    (cr.handle.replace(/[^a-z]/gi, "").slice(0, 5) + tail).toUpperCase();
  [0, 2, 4, 5, 6, 8, 9, 11, 13, 14, 15, 17, 19, 20, 23, 26].forEach((ix, k) => {
    const cr = s.network[ix];
    s.collabs.push({
      id: "cb" + ix,
      opp: "o10",
      cr: cr.id,
      status: "live",
      paid: true,
      rate: tierOf(cr.followers) === "Nano" ? 200 : cr.rate,
      code: code(cr, "15"),
      stats: calcStats(cr, 1, 42, "cb" + ix),
      ts: now - (44 - k) * DAY,
    });
  });
  const winter: [number, CollabStatus][] = [
    [1, "invited"], [3, "invited"], [7, "invited"],
    [10, "accepted"], [12, "accepted"], [16, "accepted"], [21, "accepted"],
    [18, "submitted"], [22, "submitted"], [25, "applied"],
  ];
  winter.forEach(([ix, status]) => {
    const cr = s.network[ix];
    const fee = tierOf(cr.followers) === "Nano" ? 250 : cr.rate;
    const c: M2Collab = {
      id: "cw" + ix,
      opp: "o9",
      cr: cr.id,
      status,
      rate: 250,
      ask: status === "invited" ? 250 : fee,
      by: status === "applied" ? "creator" : "business",
      code: code(cr, "20"),
      ts: now - ((ix % 5) + 1) * 5 * HOUR,
    };
    if (status !== "invited" && status !== "applied") c.rate = fee;
    if (status === "applied")
      c.msg = "I’d love to do this! My winter routine videos average " + fmtK(cr.views || 0) + " views. My rate is $" + fee + " plus the set.";
    if (status === "submitted") {
      c.video = cr.handle.replace("@", "tiktok.com/@") + " (sample draft)";
      c.caption = "Day 7 with the Barrier Repair set. 20% off with my code " + c.code + " #ad";
    }
    s.collabs.push(c);
  });
  const fall = s.collabs
    .filter((c) => c.opp === "o10")
    .sort((a, b) => (b.stats!.revenue / b.rate) - (a.stats!.revenue / a.rate));
  s.ambassadors = [
    { cr: fall[0].cr, retainer: 500, posts: 4, start: now - 60 * DAY, months: 6 },
    { cr: fall[1].cr, retainer: 400, posts: 3, start: now - 150 * DAY, months: 6 },
  ];
  const c = s.creators;
  s.collabs.push(
    { id: "c7", opp: "o2", cr: "p7", via: "agency", status: "countered", rate: 50, ask: 65, by: "business", msg: "We can do $65 base. Nia’s reviews always bring people in.", code: "NIA5", ts: now - 5 * HOUR },
    { id: "c8", opp: "o4", cr: "p8", via: "agency", status: "live", paid: true, rate: 140, code: "TRE25", video: "tiktok.com/@tre.lifts (sample)", post: "tiktok.com/@tre.lifts (sample)", stats: calcStats(c[7], 2, 49, "c8"), ts: now - 20 * DAY },
    { id: "c9", opp: "o5", cr: "p7", via: "agency", status: "applied", rate: 120, ask: 140, by: "creator", passport: true, msg: "Northstar here, pitching @nia.reviews: 3.2K local followers, 8.4% engagement, and her beauty reviews convert.", code: "NIA20", ts: now - 1 * DAY },
    { id: "c10", opp: "o2", cr: "p1", via: "agency", status: "invited", rate: 60, ask: 60, by: "business", msg: "Loved Maya’s taco video. Want to do one for us?", code: "MAYA5", ts: now - 3 * HOUR },
    { id: "c11", opp: "o4", cr: "p1", via: "agency", status: "accepted", rate: 100, code: "MAYAGYM", ts: now - 1 * DAY },
    { id: "c12", opp: "o2", cr: "p2", status: "live", paid: true, rate: 50, code: "JAY5", video: "tiktok.com/@jay.creates (sample)", post: "tiktok.com/@jay.creates (sample)", stats: calcStats(c[1], 1, 35, "c12"), ts: now - 25 * DAY }
  );
  return s;
}

// ---------------------------------------------------------------------
// Store — parse / load / save (device-local only)
// ---------------------------------------------------------------------

export function parseMarket2State(raw: unknown, now: number): M2State {
  if (raw && typeof raw === "object") {
    const r = raw as Partial<M2State>;
    if (
      r.v === 2 &&
      r.me &&
      Array.isArray(r.businesses) &&
      Array.isArray(r.opps) &&
      Array.isArray(r.creators) &&
      Array.isArray(r.network) &&
      Array.isArray(r.collabs) &&
      Array.isArray(r.customers) &&
      Array.isArray(r.ambassadors) &&
      r.agency &&
      r.automations &&
      r.bizSettings
    ) {
      return r as M2State;
    }
  }
  return seedMarket2State(now);
}

/** Adopt the v1 gig profile into the v2 `me` (see header note). */
function adoptV1Me(state: M2State): M2State {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    if (!raw) return state;
    const v1 = JSON.parse(raw) as { me?: MarketMe };
    if (v1 && v1.me && typeof v1.me.handle === "string") {
      state.me = {
        name: v1.me.name || "You",
        handle: v1.me.handle,
        niches: Array.isArray(v1.me.niches) && v1.me.niches.length ? v1.me.niches : state.me.niches,
        area: v1.me.area || state.me.area,
        followers: typeof v1.me.followers === "number" ? v1.me.followers : state.me.followers,
        platforms: Array.isArray(v1.me.platforms) && v1.me.platforms.length ? v1.me.platforms : state.me.platforms,
        rate: typeof v1.me.rate === "number" ? v1.me.rate : state.me.rate,
      };
    }
  } catch {
    /* no v1 profile on this device — the seed profile stands */
  }
  return state;
}

export function loadMarket2State(): M2State {
  try {
    const raw = localStorage.getItem(MARKET2_STORAGE_KEY);
    if (!raw) return adoptV1Me(seedMarket2State(Date.now()));
    return adoptV1Me(parseMarket2State(JSON.parse(raw), Date.now()));
  } catch {
    return adoptV1Me(seedMarket2State(Date.now()));
  }
}

export function saveMarket2State(state: M2State): void {
  try {
    localStorage.setItem(MARKET2_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the market lives in this session */
  }
}

// ---------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------

export function bizById2(state: M2State, id: string): M2Business {
  return state.businesses.filter((b) => b.id === id)[0];
}
export function oppById2(state: M2State, id: string): M2Opp {
  return state.opps.filter((o) => o.id === id)[0];
}
export function creatorById2(state: M2State, id: string): MarketCreator {
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
      done: state.collabs.filter((x) => x.cr === "me" && x.paid).length,
      onTime: 100,
      rate: m.rate,
      isMe: true,
    };
  }
  return (
    state.creators.filter((x) => x.id === id)[0] ||
    state.network.filter((x) => x.id === id)[0]
  );
}
export function collabOf2(state: M2State, oppId: string, crId: string): M2Collab | undefined {
  return state.collabs.filter((x) => x.opp === oppId && x.cr === crId)[0];
}
export function locText2(b: M2Business): string {
  return b.type === "brand" ? b.cat + " · Brand · Ships nationwide" : b.cat + " · " + b.area + " · " + b.dist + " mi";
}

// ---------------------------------------------------------------------
// Money + matching (prototype v2, exact — incl. the brand branch of
// matchOpp with its cities/tiers logic)
// ---------------------------------------------------------------------

export function payout2(state: M2State, c: M2Collab): number {
  const o = oppById2(state, c.opp);
  if (o.model === "flat") return c.rate * o.videos;
  if (o.model === "perResult") return c.rate + (o.per || 0) * ((c.stats && c.stats.customers) || 0);
  return c.rate;
}

export interface Match2 {
  score: number;
  reasons: string[];
  warn: string | null;
}

export function matchOpp2(state: M2State, o: M2Opp, cr: MarketCreator): Match2 {
  const b = bizById2(state, o.biz);
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
  if (b.type === "brand") {
    if (o.cities && o.cities.indexOf(cr.area) >= 0) {
      score += 25;
      reasons.push("Running in your city, " + cr.area);
    } else {
      score += 18;
      reasons.push("Work from anywhere. They ship the product to you");
    }
    if (o.tiers && o.tiers.indexOf(tierOf(cr.followers)) < 0)
      warn = "Looking for " + o.tiers.join(" and ") + " creators";
  } else if (cr.area === b.area) {
    score += 25;
    reasons.push("You’re in " + b.area + ", " + b.dist + " mi away");
  } else if (b.dist <= 3) {
    score += 15;
    reasons.push("Close by: " + b.dist + " mi");
  } else score += 5;
  if (cr.followers >= o.minF) {
    if (!warn) score += 20;
    if (o.minF === 0) reasons.push("Any audience size is welcome");
  } else warn = "Needs " + fmtK(o.minF) + "+ followers";
  const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts"];
  if (o.platforms.some((p) => (cr.platforms || PLATFORMS).indexOf(p) >= 0)) score += 10;
  if (b.onTime >= 95) {
    score += 9;
    reasons.push("Pays on time (" + b.onTime + "% of deals)");
  }
  return { score: Math.max(0, Math.min(99, score)), reasons, warn };
}

export function sumStats2(list: M2Collab[]): CollabStats {
  return list.reduce(
    (a, c) => {
      if (c.stats) {
        a.views += c.stats.views;
        a.clicks += c.stats.clicks;
        a.leads += c.stats.leads;
        a.customers += c.stats.customers;
        a.revenue += c.stats.revenue;
      }
      return a;
    },
    { views: 0, clicks: 0, leads: 0, customers: 0, revenue: 0 }
  );
}

export function spendOf2(state: M2State, list: M2Collab[]): number {
  return list
    .filter((c) => c.paid || /approved|live/.test(c.status))
    .reduce((sum, c) => sum + payout2(state, c), 0);
}

export function roiText(rev: number, spend: number): string {
  return spend ? (rev / spend).toFixed(1) + "×" : "—";
}

// ---------------------------------------------------------------------
// Agency + brand sets
// ---------------------------------------------------------------------

export function agencyCollabs2(state: M2State): M2Collab[] {
  return state.collabs.filter((c) => c.via === "agency" && state.agency.roster.indexOf(c.cr) >= 0);
}
export function brandCollabs2(state: M2State): M2Collab[] {
  return state.collabs.filter((c) => oppById2(state, c.opp).biz === state.myBrand);
}
export function isAmbassador2(state: M2State, id: string): boolean {
  return state.ambassadors.some((a) => a.cr === id);
}
export function feeSplitText(state: M2State, amount: number): string {
  const f = state.agency.fee / 100;
  const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");
  return "Your " + state.agency.fee + "% fee: " + money(amount * f) + " · creator gets " + money(amount * (1 - f));
}

// ---------------------------------------------------------------------
// Collab transitions on the v2 store (prototype state machine)
// ---------------------------------------------------------------------

export function setStatus2(
  state: M2State,
  collabId: string,
  status: CollabStatus,
  now: number,
  extra?: Partial<M2Collab>
): M2Collab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  c.status = status;
  c.ts = now;
  if (extra) Object.assign(c, extra);
  return c;
}

export function uid2(prefix: string, now: number): string {
  return prefix + now.toString(36) + Math.random().toString(36).slice(2, 6);
}

export function promoCode2(cr: MarketCreator, o: M2Opp): string {
  return (cr.handle.replace(/[^a-z]/gi, "").slice(0, 5) + (o.offer.match(/\d+/) || ["VIP"])[0]).toUpperCase();
}

/** Creator applies from Discover (prototype applySheet). */
export function applyToOpp2(
  state: M2State,
  oppId: string,
  input: { ask: number; msg: string; passport: boolean },
  now: number
): M2Collab {
  const o = oppById2(state, oppId);
  const me = creatorById2(state, "me");
  const c: M2Collab = {
    id: uid2("c", now),
    opp: oppId,
    cr: "me",
    status: "applied",
    rate: o.rate,
    ask: input.ask,
    by: "creator",
    msg: input.msg.slice(0, 600),
    passport: input.passport,
    code: promoCode2(me, o),
    ts: now,
  };
  state.collabs.push(c);
  return c;
}

/** Agency pitches a roster creator to an opportunity (prototype
 *  pitch flow: an "applied" collab routed via the agency, with the
 *  Passport attached). */
export function pitchCollab2(
  state: M2State,
  oppId: string,
  creatorId: string,
  input: { ask: number; msg: string },
  now: number
): M2Collab {
  const o = oppById2(state, oppId);
  const cr = creatorById2(state, creatorId);
  const c: M2Collab = {
    id: uid2("c", now),
    opp: oppId,
    cr: creatorId,
    via: "agency",
    status: "applied",
    rate: o.rate,
    ask: input.ask,
    by: "creator",
    msg: input.msg.slice(0, 600),
    passport: true,
    code: promoCode2(cr, o),
    ts: now,
  };
  state.collabs.push(c);
  return c;
}

export function acceptCollab2(state: M2State, collabId: string, now: number): M2Collab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  const agreed = c.ask || c.rate;
  const code = c.code || promoCode2(creatorById2(state, c.cr), oppById2(state, c.opp));
  return setStatus2(state, collabId, "accepted", now, { rate: agreed, code });
}

export function declineCollab2(state: M2State, collabId: string, now: number): M2Collab | undefined {
  return setStatus2(state, collabId, "declined", now);
}

/** Counter — for the creator (or their agency) the collab returns to
 *  "applied" carrying their ask; for a business it becomes
 *  "countered". Prototype-exact. */
export function counterCollab2(
  state: M2State,
  collabId: string,
  amount: number,
  by: "creator" | "business",
  now: number
): M2Collab | undefined {
  return setStatus2(state, collabId, by === "creator" ? "applied" : "countered", now, { ask: amount, by });
}

export function submitCollab2(
  state: M2State,
  collabId: string,
  input: { video: string; caption: string },
  now: number
): M2Collab | undefined {
  return setStatus2(state, collabId, "submitted", now, {
    video: input.video.slice(0, 300),
    caption: input.caption.slice(0, 500),
    note: null,
  });
}

/** Creator posts the approved video — live, with v2 demo tracking. */
export function postCollab2(state: M2State, collabId: string, post: string, now: number): M2Collab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  const o = oppById2(state, c.opp);
  const stats = calcStats(creatorById2(state, c.cr), o.videos, bizById2(state, o.biz).avgSale || 30, c.id);
  return setStatus2(state, collabId, "live", now, { post: post.slice(0, 300), stats });
}

export function markPaid2(state: M2State, collabId: string, now: number): M2Collab | undefined {
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  if (!c) return undefined;
  c.paid = true;
  c.paidAt = now;
  c.ts = now;
  return c;
}
