import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";
import {
  computePostingSummary,
  publishedOnly,
  postsInMonth,
  weekCounts,
  type PostLike,
} from "@/lib/posts/summary";
import {
  computeProgress,
  type GoalLike,
  type GoalRecords,
} from "@/lib/goals/progress";
import { computeSummary, type RevenueEntryLike } from "@/lib/revenue/summary";
import { computeHealth, type DealLike } from "@/lib/business/health";
import {
  buildRecommendations,
  type AdvisorEntryLike,
  type AdvisorGoalInput,
} from "@/lib/advisor/recommendations";
import {
  profileCompleteness,
  identityCompleteness,
  rowToProfile,
  type BusinessProfileRow,
} from "@/lib/business-profile";

export const dynamic = "force-dynamic";

/* THE CREATOR HOME (Build 9 — the owner's design target, phone +
 * desktop). The layout follows his mockups: welcome hero, stat
 * cards, profile ring with checklist, AI Advisor panel, insights,
 * quick actions, identity card, growth chart. HONESTY RULE (his
 * standard): every number on this page is computed live from the
 * creator's own records or the researched directory — where a
 * number does not exist yet, the card says so instead of inventing
 * one. Every feature stays reachable from this page. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background:
    "linear-gradient(165deg, rgba(46,16,101,0.85), rgba(13,2,33,0.9))",
  borderRadius: 22,
  padding: "22px 24px 24px",
  boxShadow: "0 0 30px rgba(168,85,247,0.20)",
};
const card: React.CSSProperties = {
  border: "1px solid #4c1d95",
  background: "rgba(13,2,33,0.65)",
  borderRadius: 18,
  padding: "18px 20px",
  height: "100%",
};
const DASH_CSS = `
.uv-dash{display:flex;flex-direction:column;gap:22px}
.uv-cols{display:grid;grid-template-columns:minmax(0,1fr) 348px;gap:22px;align-items:start}
.uv-left{display:flex;flex-direction:column;gap:22px;min-width:0}
.uv-right{display:flex;flex-direction:column;gap:22px;min-width:0}
.uv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.uv-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.uv-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.uv-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
@media (max-width:1180px){.uv-cols{grid-template-columns:1fr}.uv-stats{grid-template-columns:repeat(2,1fr)}}
@media (max-width:680px){.uv-insights{grid-template-columns:1fr}.uv-quick{grid-template-columns:repeat(2,1fr)}.uv-stats{grid-template-columns:repeat(2,1fr)}}
/* Build 11 (owner-approved homepage fixes): the welcome hero takes
 * ~28% less height on phones — tighter padding, smaller title, the
 * decorative chart hidden — so the creator's real business activity
 * shows sooner. Desktop is unchanged. */
@media (max-width:680px){.uv-hero{padding:20px 18px 22px !important}.uv-hero h1{font-size:26px !important}.uv-hero p{margin-bottom:14px !important}.uv-hero svg{display:none}}
`;

function money(cents: number): string {
  const d = cents / 100;
  return `$${d.toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const EVENT_LINES: Record<string, { icon: string; line: string }> = {
  post_logged: { icon: "🎬", line: "You logged a post" },
  revenue_recorded: { icon: "💵", line: "You recorded revenue" },
  deal_created: { icon: "🤝", line: "You added a deal" },
  deal_stage_changed: { icon: "📈", line: "A deal moved stage" },
  goal_created: { icon: "🎯", line: "You set a creator goal" },
  proposal_created: { icon: "✉️", line: "You created a proposal" },
  proposal_status_changed: { icon: "📬", line: "A proposal changed status" },
  brief_generated: { icon: "🧠", line: "You generated a campaign brief" },
};

/* PostgREST returns at most 1,000 rows per request — with 2,348
 * published brands, an unpaged select silently truncates and every
 * directory count on this page reads low (found by the Build 9
 * production smoke, which showed "of 1,000 brands"). fetchAllRows
 * pages through the full result in stable id order. */
const ROW_PAGE = 1000;
async function fetchAllRows(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += ROW_PAGE) {
    const { data } = await build(from, from + ROW_PAGE - 1);
    const batch = (data ?? []) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < ROW_PAGE) break;
  }
  return rows;
}

export default async function DashboardPage() {
  await requireSubscription("/dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const list = (await fetchAllRows((from, to) =>
    supabase
      .from("brands")
      .select("id, name, country, created_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, to)
  )) as unknown as Brand[];

  let stats = { total: 0, uncapped: 0, capped: 0, unknownCap: 0, accepting: 0, newest: [] as Brand[] };

  if (list.length) {
    const [affiliates, opps] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from("affiliate_programs")
          .select("brand_id, commission_notes, application_url")
          .order("id", { ascending: true })
          .range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase
          .from("opportunities")
          .select("brand_id, status, application_url")
          .order("id", { ascending: true })
          .range(from, to)
      ),
    ]);
    const openSet = new Set<string>();
    for (const o of opps) if (o.status === "open" && o.application_url) openSet.add(o.brand_id as string);
    let uncapped = 0, capped = 0, unknownCap = 0;
    const accepting = new Set<string>(openSet);
    for (const a of affiliates) {
      const notes = (a.commission_notes as string) ?? "";
      if (notes.includes("cap: UNCAPPED")) uncapped++;
      else if (notes.includes("cap: capped")) capped++;
      else unknownCap++;
      if (a.application_url) accepting.add(a.brand_id as string);
    }
    stats = {
      total: list.length,
      uncapped, capped, unknownCap,
      accepting: accepting.size,
      newest: [...list].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 5),
    };
  }

  /* THE CREATOR'S OWN NUMBERS — the same composition the Advisor
   * runs (same libs, same queries), so the home can never disagree
   * with the Advisor, the trackers, or the Goals page. */
  const now = new Date();
  let posting = computePostingSummary([], 5, now);
  let revenue = computeSummary([], now);
  let health = computeHealth([], [], now);
  let recommendations: ReturnType<typeof buildRecommendations> = [];
  let profile = null as ReturnType<typeof rowToProfile> | null;
  let events: { event_type: string; created_at: string }[] = [];
  let weeks: { weekStart: string; count: number }[] = weekCounts([], now, 8);
  type NextAction = { title: string; why: string; href: string; cta: string };
  const todayPlan: NextAction[] = [];
  type SetupStep = { label: string; done: boolean; href: string; cta: string };
  const setupSteps: SetupStep[] = [];

  if (user) {
    const [postsRes, prefsRes, goalsRes, entriesRes, dealsRes, profileRes, eventsRes, sentRes, savedRes, proposalsAllRes, expensesRes] =
      await Promise.all([
        supabase.from("creator_posts").select("platform, posted_date, source, state").eq("user_id", user.id),
        supabase.from("growth_prefs").select("weekly_post_goal").eq("user_id", user.id).maybeSingle(),
        supabase.from("creator_goals").select("goal_type, target_value, unit, period, manual_current, completed_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("revenue_entries").select("brand_name, amount_cents, status, earned_date, due_date, kind").eq("user_id", user.id),
        supabase.from("creator_deals").select("brand_name, platform, stage, compensation_cents, deadline").eq("user_id", user.id),
        supabase.from("creator_business_profiles").select("platforms, content_categories, audience_size, average_views, engagement_rate, audience_demographics, past_partnerships, revenue_streams, business_objectives, creator_name, business_description, unique_selling_proposition, differentiator, professional_experience, business_goals").eq("user_id", user.id).maybeSingle(),
        supabase.from("creator_events").select("event_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("proposals").select("id, created_at").eq("user_id", user.id).eq("status", "sent"),
        supabase.from("saved_brands").select("id").eq("user_id", user.id),
        supabase.from("proposals").select("id").eq("user_id", user.id),
        supabase.from("creator_expenses").select("id").eq("user_id", user.id),
      ]);
    const posts = (postsRes.data ?? []) as PostLike[];
    const weeklyGoal = (prefsRes.data as { weekly_post_goal: number } | null)?.weekly_post_goal ?? 5;
    const entries = (entriesRes.data ?? []) as AdvisorEntryLike[];
    const deals = (dealsRes.data ?? []) as DealLike[];
    const goalRows = (goalsRes.data ?? []) as (GoalLike & { id?: string })[];
    posting = computePostingSummary(posts, weeklyGoal, now);
    revenue = computeSummary(entries as RevenueEntryLike[], now);
    health = computeHealth(entries, deals, now);
    weeks = weekCounts(posts, now, 8);
    const records: GoalRecords = {
      publishedPostsThisMonth: postsInMonth(posts, now),
      recordedEarningsThisMonthCents: revenue.currentMonthCents,
      publishedPostsTotal: publishedOnly(posts).length,
      recordedEarningsTotalCents: revenue.totalEarnedCents,
    };
    const goals: AdvisorGoalInput[] = goalRows.map((goal) => ({
      goal,
      progress: computeProgress(goal, records),
    }));
    const published = publishedOnly(posts);
    const lastPostDate = published.length > 0
      ? published.map((p) => p.posted_date).sort().at(-1) ?? null
      : null;
    profile = profileRes.data ? rowToProfile(profileRes.data as BusinessProfileRow) : null;
    const profileComp = profileRes.error ? null : profileCompleteness(profile);
    recommendations = buildRecommendations(
      { profile: profileComp, posting, lastPostDate, goals, health, revenue, entries, deals },
      now
    );
    events = (eventsRes.data ?? []) as { event_type: string; created_at: string }[];

    /* YOUR CREATOR BUSINESS TODAY — the daily action plan, derived
     * ONLY from this creator's own records plus the live directory
     * count. Priority: money owed first, then deal deadlines,
     * follow-ups due, the weekly posting goal, this month's money
     * record, and new opportunities. An action appears only when
     * its records say so — nothing is invented. */
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = `${todayKey.slice(0, 8)}01`;
    const overduePayments = entries.filter(
      (e) => e.status === "pending" && e.due_date !== null && e.due_date < todayKey
    );
    if (overduePayments.length > 0) {
      const owed = overduePayments.reduce((sum, e) => sum + e.amount_cents, 0);
      todayPlan.push({
        title: `${overduePayments.length} payment${overduePayments.length === 1 ? "" : "s"} overdue — ${money(owed)} still owed to you`,
        why: "Recorded as earned, past the due date, and not yet marked paid. Chase it while the work is still fresh.",
        href: "/revenue",
        cta: "Open Revenue Tracker →",
      });
    }
    const overdueDeals = deals.filter(
      (d) => d.deadline !== null && d.deadline < todayKey && d.stage !== "paid" && d.stage !== "closed"
    ).length;
    if (overdueDeals > 0) {
      todayPlan.push({
        title: `${overdueDeals} deal${overdueDeals === 1 ? "" : "s"} past deadline`,
        why: "The deadline passed and the deal has not reached Paid. Follow up — money waits on an answer.",
        href: "/growth-center/deals",
        cta: "Open Brand Deal Manager →",
      });
    }
    const followUpCutoff = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const sentRows = (sentRes.data ?? []) as { id: string; created_at: string }[];
    const followUpsDue = sentRows.filter((p) => p.created_at <= followUpCutoff).length;
    if (followUpsDue > 0) {
      todayPlan.push({
        title: `${followUpsDue} proposal${followUpsDue === 1 ? "" : "s"} waiting 4+ days`,
        why: "Sent and still unanswered. A short follow-up keeps you top of mind.",
        href: "/proposals",
        cta: "Open Proposals →",
      });
    }
    if (posting.postsThisWeek < posting.weeklyGoal) {
      todayPlan.push({
        title: `${posting.postsThisWeek} of ${posting.weeklyGoal} posts published this week`,
        why: posting.postsThisWeek === 0
          ? "Nothing logged yet this week — consistency is the growth engine. Log or plan your next post."
          : "Part-way to your weekly goal. One more post keeps the rhythm brands notice.",
        href: "/growth-center/posting",
        cta: "Open Posting Tracker →",
      });
    }
    if (!entries.some((e) => (e.earned_date ?? "") >= monthKey)) {
      todayPlan.push({
        title: "No revenue recorded this month",
        why: "Log what you have earned so your business numbers stay true.",
        href: "/revenue",
        cta: "Open Revenue Tracker →",
      });
    }
    if (stats.accepting > 0) {
      todayPlan.push({
        title: `${stats.accepting} brands accepting applications now`,
        why: "Live application routes in the researched directory — the fastest route to your next partnership.",
        href: "/opportunities",
        cta: "Review opportunities →",
      });
    }

    /* GET STARTED CHECKLIST — every step's done state is a real row
     * in the creator's own records, never a guess. "Profile basics"
     * = a creator_business_profiles row exists; "content category"
     * = that profile's real content_categories field is non-empty. */
    setupSteps.push(
      { label: "Add your profile basics", done: profile !== null, href: "/growth-center/profile", cta: "Open profile →" },
      { label: "Set your content category", done: (profile?.contentCategories.length ?? 0) > 0, href: "/growth-center/profile", cta: "Set category →" },
      { label: "Save your first brand", done: (savedRes.data ?? []).length > 0, href: "/opportunities", cta: "Find brands →" },
      { label: "Create your first proposal or deal", done: (proposalsAllRes.data ?? []).length > 0 || deals.length > 0, href: "/proposals", cta: "Start a proposal →" },
      { label: "Record your first revenue or expense", done: entries.length > 0 || (expensesRes.data ?? []).length > 0, href: "/revenue", cta: "Record money →" },
    );
  }
  /* A brand-new creator with no data-backed actions gets one honest
   * starter action instead of an empty plan. */
  if (user && todayPlan.length === 0 && setupSteps.some((s) => !s.done)) {
    todayPlan.push({
      title: "Start with your guided setup",
      why: "A few basics in, and UltraVestra personalizes your matches, scores and advice around your business.",
      href: "/get-started",
      cta: "Open the guided setup →",
    });
  }
  const shownPlan = todayPlan.slice(0, 4);
  const setupDoneCount = setupSteps.filter((s) => s.done).length;
  const setupComplete = setupSteps.length > 0 && setupDoneCount === setupSteps.length;

  const completeness = profileCompleteness(profile);
  const identity = identityCompleteness(profile);
  const profilePct = Math.round((completeness.filled / completeness.total) * 100);
  const topRec = recommendations[0] ?? null;
  const tipRec = recommendations[1] ?? null;
  const deltaPct = revenue.previousMonthCents > 0
    ? Math.round(((revenue.currentMonthCents - revenue.previousMonthCents) / revenue.previousMonthCents) * 100)
    : null;
  const displayName = profile?.creatorName.trim() ? profile.creatorName.trim() : "Creator";
  const heroLine =
    posting.postsThisWeek > 0
      ? `You've published ${posting.postsThisWeek} post${posting.postsThisWeek === 1 ? "" : "s"} this week — ${posting.goalProgressPct}% of your weekly goal. Let's keep the momentum going.`
      : completeness.filled < completeness.total
        ? "Your creator business, all in one place. Track performance, discover opportunities, manage brand partnerships, and build your growth strategy."
        : "Your profile is complete — your matches and advice are fully personalized. Here's where your business stands.";
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));
  const ringC = 2 * Math.PI * 52;

  const checklist: { label: string; done: boolean; note?: string }[] = [
    { label: "Business Profile", done: completeness.filled === completeness.total },
    { label: "Platforms", done: (profile?.platforms.length ?? 0) > 0 },
    { label: "Audience", done: profile !== null && (profile.audienceSize !== null || profile.audienceDemographics.trim() !== "") },
    { label: "Goals", done: profile !== null && (profile.businessGoals.length > 0 || profile.businessObjectives.trim() !== "") },
    { label: "Creator Identity", done: identity.filled === identity.total, note: `${identity.filled} of ${identity.total} · recommended` },
  ];

  /* THE PLATFORM DIRECTORY — every core feature exactly once, each
   * card leading to its own working destination (owner's standard,
   * Build 9b). Duplicates merged: the three Commissions cards are
   * one card now. Growth Center and Profile live in the sidebar, not
   * here. The 16 preserved one-off pages are out of navigation by
   * the owner's order — their code and content stay in place. */
  const sections: { href: string; emoji: string; title: string; line: string; live?: string }[] = [
    { href: "/opportunities", emoji: "🎯", title: "Opportunity Finder", line: "Brands accepting applications, and high-score brands worth pitching.", live: list.length ? `${stats.accepting} accepting now` : undefined },
    { href: "/discover", emoji: "🔎", title: "Product Research", line: "Search brands and products by niche, platform and commission model.", live: list.length ? `${stats.total} brands searchable` : undefined },
    { href: "/commissions", emoji: "💰", title: "Commissions", line: "Every program's earnings ceiling in one place — verified uncapped, capped, and honestly unknown.", live: list.length ? `${stats.uncapped} uncapped · ${stats.capped} capped · ${stats.unknownCap} unknown` : undefined },
    { href: "/brands", emoji: "🧠", title: "Brand Intelligence", line: "Full profiles: scores with reasons, contacts, compensation, sourced evidence.", live: list.length ? `${stats.total} profiles` : undefined },
    { href: "/campaign-match", emoji: "🤝", title: "Campaign Match", line: "Partnership briefs scored against your business profile." },
    { href: "/creator-lab", emoji: "🎬", title: "Creator Lab", line: "Make a better video: hooks, structure, and the exact fix list." },
    { href: "/buyer-brain", emoji: "🛒", title: "Buyer Brain", line: "Five simulated buyers challenge your script before real customers see it." },
    { href: "/ask", emoji: "✨", title: "Ask UltraVestra AI", line: "One question in — a sourced research report with brands, contacts and a pitch out." },
    { href: "/studio", emoji: "🎥", title: "Video Strategy & Script Studio", line: "Build a complete selling script from your own product facts, beat by beat." },
    { href: "/trend-radar", emoji: "📡", title: "Trend Radar", line: "What is rising in your niches, computed from the directory's own research." },
    { href: "/alerts", emoji: "🔔", title: "Opportunity Alerts", line: "New brands and openings matched to your categories, as they land." },
    { href: "/passport", emoji: "🛂", title: "Reputation Passport", line: "Your creator reputation record — the proof brands ask for." },
    { href: "/growth-map", emoji: "🗺️", title: "Creator Growth Map", line: "Your stage today, your next milestone, and the path between them." },
    { href: "/command-center", emoji: "🧭", title: "Command Center", line: "Your whole business in one room — money, deals, content and goals, read together." },
    { href: "/proposals", emoji: "✉️", title: "Proposal Builder", line: "Briefs that become proposals a brand can accept." },
    { href: "/revenue", emoji: "💵", title: "Revenue Tracker", line: "Every dollar recorded — owed, pending and paid." },
    { href: "/saved", emoji: "🔖", title: "Saved Brands", line: "The brands you saved while researching, in one place." },
    { href: "/academy", emoji: "🎓", title: "Creator Academy", line: "Searchable lessons on hooks, scripts, filming, pitching, money and growth.", live: "12 lessons" },
    { href: "/pillars", emoji: "🏛️", title: "The Nine Pillars", line: "The map of the whole platform — every capability, organized by the job it does for your creator business." },
  ];

  const statCards: { icon: string; value: string; label: string; sub: string }[] = [
    {
      icon: "📈",
      value: String(posting.postsThisMonth),
      label: "Posts This Month",
      sub: `${posting.postsThisWeek} this week · ${posting.totalPosts} all time`,
    },
    {
      icon: "💵",
      value: money(revenue.currentMonthCents),
      label: "Recorded This Month",
      sub: deltaPct !== null
        ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs last month`
        : revenue.totalEarnedCents > 0
          ? `${money(revenue.totalEarnedCents)} recorded all time`
          : "Log your first earning",
    },
    {
      icon: "🤝",
      value: String(health.pipeline.openDeals),
      label: "Active Deals",
      sub: health.pipeline.openValueCents > 0
        ? `${money(health.pipeline.openValueCents)} in open pipeline`
        : "No open deals yet",
    },
    {
      icon: "🎯",
      value: list.length ? String(stats.accepting) : "—",
      label: "Brands Accepting",
      sub: list.length ? `of ${stats.total.toLocaleString("en-US")} brands in the directory` : "Directory loading",
    },
  ];

  const quickActions: { href: string; icon: string; label: string }[] = [
    { href: "/growth-center/posting", icon: "▶️", label: "Create Content" },
    { href: "/campaign-match", icon: "🎯", label: "Find Campaigns" },
    { href: "/growth-center/advisor", icon: "📊", label: "Get Advice" },
    { href: "/opportunities", icon: "🛍️", label: "Go to Marketplace" },
  ];

  return (
    <div className="uv-dash">
      <style>{DASH_CSS}</style>
      <div className="uv-cols">
        <div className="uv-left">
          {/* HERO */}
          <section
            className="uv-hero"
            style={{
              ...panel,
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(120deg, rgba(76,29,149,0.95) 0%, rgba(30,8,66,0.95) 55%, rgba(13,2,33,0.95) 100%)",
              padding: "30px 30px 32px",
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 300 170"
              style={{ position: "absolute", right: 6, bottom: 0, width: 300, maxWidth: "55%", opacity: 0.85, pointerEvents: "none" }}
            >
              <defs>
                <linearGradient id="heroBars" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#7c3aed" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#d946ef" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {[26, 48, 40, 74, 62, 102, 92, 132].map((h, i) => (
                <rect key={i} x={18 + i * 34} y={160 - h} width={20} height={h} rx={5} fill="url(#heroBars)" />
              ))}
              <path d="M22 128 L92 96 L150 106 L214 56 L272 22" fill="none" stroke="#f0abfc" strokeWidth={4} strokeLinecap="round" />
              <path d="M252 18 L276 16 L274 40" fill="none" stroke="#f0abfc" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 style={{ fontSize: 34, margin: "0 0 8px", fontWeight: 800, position: "relative" }}>
              Welcome back, {displayName}!
            </h1>
            <p style={{ color: "#e9d5ff", margin: "0 0 20px", fontSize: 16, maxWidth: 480, position: "relative" }}>
              {heroLine}
            </p>
            <Link
              href="/growth-center"
              style={{
                position: "relative",
                display: "inline-block",
                background: "linear-gradient(92deg, #a855f7, #d946ef)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                borderRadius: 999,
                padding: "11px 22px",
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(217,70,239,0.5)",
              }}
            >
              View Your Growth Report →
            </Link>
          </section>

          {/* YOUR CREATOR BUSINESS TODAY — the daily action plan.
              Every line is computed from the creator's own records
              or the live directory count; when nothing needs
              attention, the section says so instead of inventing
              work. At most four actions, money first. */}
          {user && (
            <section style={panel}>
              <h2 style={{ fontSize: 21, margin: "0 0 6px" }}>🌅 Your Creator Business Today</h2>
              {shownPlan.length === 0 ? (
                <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15 }}>
                  You&rsquo;re caught up — nothing in your business needs your attention right now.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {shownPlan.map((a, i) => (
                    <div key={a.title} style={{ display: "flex", gap: 12 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          flex: "0 0 26px",
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: "linear-gradient(92deg, #a855f7, #d946ef)",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 16 }}><strong>{a.title}</strong></p>
                        <p style={{ margin: "2px 0 4px", color: "#ddd0ff", fontSize: 14.5 }}>{a.why}</p>
                        <Link href={a.href} style={{ color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>{a.cta}</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* GET STARTED — the onboarding checklist. Shown while any
              step is incomplete; each step's state is a real row in
              the creator's records. When all five are done it
              collapses to a single completed line. */}
          {user && setupSteps.length > 0 && (
            setupComplete ? (
              <section style={panel}>
                <p style={{ margin: 0, fontSize: 15 }}>
                  ✅ <strong>Get started — complete.</strong>{" "}
                  <span style={{ color: "#ddd0ff" }}>
                    Your profile, category, saved brand, first proposal or deal, and first money record are all in — the daily plan above now runs on your real business.
                  </span>
                </p>
              </section>
            ) : (
              <section style={panel}>
                <h2 style={{ fontSize: 21, margin: "0 0 6px" }}>🚀 Get started</h2>
                <p style={{ color: "#ddd0ff", margin: "0 0 14px", fontSize: 15 }}>
                  {setupDoneCount} of {setupSteps.length} done — each step takes a couple of minutes and makes your matches, scores and advice personal.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 15 }}>
                  {setupSteps.map((s) => (
                    <p key={s.label} style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", color: s.done ? "#e9d5ff" : "#ddd0ff" }}>
                      <span style={{ color: s.done ? "#4ade80" : "#6d5ba8", fontWeight: 800 }}>{s.done ? "✓" : "○"}</span>
                      <span style={{ flex: 1, minWidth: 200 }}>{s.label}</span>
                      {!s.done && (
                        <Link href={s.href} style={{ color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>{s.cta}</Link>
                      )}
                    </p>
                  ))}
                </div>
              </section>
            )
          )}

          {/* STAT CARDS */}
          <section className="uv-stats">
            {statCards.map((s) => (
              <article key={s.label} style={{ ...card, textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 21 }} aria-hidden="true">{s.icon}</p>
                <p style={{ margin: "8px 0 2px", fontSize: 27, fontWeight: 800 }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 13.5, color: "#ddd0ff", fontWeight: 700 }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#4ade80", fontWeight: 700 }}>{s.sub}</p>
              </article>
            ))}
          </section>

          {/* AI ADVISOR PANEL */}
          <section style={panel}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 24 }} aria-hidden="true">✨</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ fontSize: 20, margin: 0 }}>ULTRA VESTRA AI Advisor</h2>
                <p style={{ margin: "2px 0 0", color: "#ddd0ff", fontSize: 13.5 }}>
                  Personalized insights for your creator business.
                </p>
              </div>
              <Link
                href="/growth-center/advisor"
                style={{
                  background: "linear-gradient(92deg, #a855f7, #d946ef)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  borderRadius: 999,
                  padding: "9px 18px",
                  textDecoration: "none",
                }}
              >
                Open Advisor →
              </Link>
            </div>
            {topRec ? (
              <div
                style={{
                  marginTop: 16,
                  border: "1px solid #4c1d95",
                  background: "rgba(13,2,33,0.6)",
                  borderRadius: 16,
                  padding: "14px 18px",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 1, color: "#f0abfc" }}>
                  TOP RECOMMENDATION{" "}
                  <span
                    style={{
                      marginLeft: 8,
                      borderRadius: 999,
                      padding: "2px 10px",
                      fontSize: 11.5,
                      letterSpacing: 0.5,
                      color: "#0d0221",
                      background: topRec.severity === "act" ? "#fbbf24" : topRec.severity === "good" ? "#4ade80" : "#67e8f9",
                    }}
                  >
                    {topRec.severity === "act" ? "ACT NOW" : topRec.severity === "good" ? "ON TRACK" : "WATCH"}
                  </span>
                </p>
                <p style={{ margin: "8px 0 4px", fontSize: 16.5 }}>
                  <strong>{topRec.title}</strong>
                </p>
                <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>{topRec.message}</p>
              </div>
            ) : (
              <p style={{ margin: "14px 0 0", color: "#ddd0ff", fontSize: 15 }}>
                You&rsquo;re caught up — open the Advisor for your full picture.
              </p>
            )}
          </section>

          {/* PERSONALIZED INSIGHTS */}
          <section>
            <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>⭐ Your Personalized Insights</h2>
            <div className="uv-insights">
              <article style={card}>
                <p style={{ margin: 0, fontSize: 22 }} aria-hidden="true">💡</p>
                <p style={{ margin: "8px 0 4px" }}><strong>Top Growth Tip</strong></p>
                {tipRec ? (
                  <>
                    <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14 }}>{tipRec.title}</p>
                    <Link href={tipRec.href} style={{ display: "inline-block", marginTop: 10, color: "#67e8f9", fontWeight: 700, fontSize: 14 }}>
                      Act on it →
                    </Link>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14 }}>
                      {posting.postsThisWeek} of {posting.weeklyGoal} posts published this week.
                    </p>
                    <Link href="/growth-center/posting" style={{ display: "inline-block", marginTop: 10, color: "#67e8f9", fontWeight: 700, fontSize: 14 }}>
                      Open Posting Tracker →
                    </Link>
                  </>
                )}
              </article>
              <article style={card}>
                <p style={{ margin: 0, fontSize: 22 }} aria-hidden="true">🤝</p>
                <p style={{ margin: "8px 0 4px" }}><strong>Campaign Match</strong></p>
                <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14 }}>
                  {list.length
                    ? `${stats.accepting} brands accepting applications — your profile prefills the search.`
                    : "Your profile prefills the search."}
                </p>
                <Link href="/campaign-match" style={{ display: "inline-block", marginTop: 10, color: "#67e8f9", fontWeight: 700, fontSize: 14 }}>
                  Find Campaigns →
                </Link>
              </article>
              <article style={card}>
                <p style={{ margin: 0, fontSize: 22 }} aria-hidden="true">🔥</p>
                <p style={{ margin: "8px 0 4px" }}><strong>Posting Streak</strong></p>
                <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14 }}>
                  {posting.currentStreak > 0
                    ? `${posting.currentStreak} day${posting.currentStreak === 1 ? "" : "s"} in a row — ${posting.postsThisWeek} of ${posting.weeklyGoal} posts this week.`
                    : `No streak yet — log today's post and start one. ${posting.postsThisWeek} of ${posting.weeklyGoal} posts this week.`}
                </p>
                <Link href="/growth-center/posting" style={{ display: "inline-block", marginTop: 10, color: "#67e8f9", fontWeight: 700, fontSize: 14 }}>
                  Log a Post →
                </Link>
              </article>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section>
            <h2 style={{ fontSize: 20, margin: "0 0 14px" }}>⚡ Quick Actions</h2>
            <div className="uv-quick">
              {quickActions.map((q) => (
                <Link key={q.label} href={q.href} style={{ textDecoration: "none" }}>
                  <article
                    style={{
                      ...card,
                      textAlign: "center",
                      padding: "20px 10px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 24 }} aria-hidden="true">{q.icon}</p>
                    <p style={{ margin: "8px 0 0", fontWeight: 800, fontSize: 14.5 }}>{q.label}</p>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          {/* ACADEMY BANNER */}
          <section
            style={{
              ...panel,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              background:
                "linear-gradient(100deg, rgba(88,28,135,0.9), rgba(30,8,66,0.9))",
            }}
          >
            <span style={{ fontSize: 30 }} aria-hidden="true">👑</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 17.5 }}>ULTRA VESTRA Academy</p>
              <p style={{ margin: "2px 0 0", color: "#ddd0ff", fontSize: 14 }}>
                Master content, business and growth.
              </p>
            </div>
            <Link
              href="/academy"
              style={{
                background: "linear-gradient(92deg, #a855f7, #d946ef)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14.5,
                borderRadius: 999,
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Start Learning →
            </Link>
          </section>

        </div>

        <div className="uv-right">
          {/* PROFILE COMPLETION */}
          <section style={panel}>
            <h2 style={{ fontSize: 18.5, margin: "0 0 14px" }}>Profile Completion</h2>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div style={{ position: "relative", width: 118, height: 118, flex: "0 0 118px" }}>
                <svg width="118" height="118" viewBox="0 0 118 118">
                  <circle cx="59" cy="59" r="52" fill="none" stroke="#2e1065" strokeWidth="10" />
                  <circle
                    cx="59"
                    cy="59"
                    r="52"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringC}
                    strokeDashoffset={ringC - (ringC * profilePct) / 100}
                    transform="rotate(-90 59 59)"
                  />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  {profilePct}%
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 14 }}>
                {checklist.map((c) => (
                  <p key={c.label} style={{ margin: 0, color: c.done ? "#e9d5ff" : "#9d8fd6" }}>
                    <span style={{ color: c.done ? "#4ade80" : "#6d5ba8", fontWeight: 800, marginRight: 7 }}>
                      {c.done ? "✓" : "○"}
                    </span>
                    {c.label}
                    {c.note && <span style={{ display: "block", marginLeft: 21, fontSize: 12, color: "#9d8fd6" }}>{c.note}</span>}
                  </p>
                ))}
              </div>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 14, fontWeight: 700, color: profilePct === 100 ? "#4ade80" : "#f0abfc" }}>
              {profilePct === 100
                ? "✅ Your profile is complete!"
                : `${completeness.total - completeness.filled} essential field${completeness.total - completeness.filled === 1 ? "" : "s"} to go.`}
            </p>
            <Link
              href="/growth-center/profile"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 12,
                border: "1px solid #a855f7",
                color: "#f0abfc",
                fontWeight: 800,
                fontSize: 14.5,
                borderRadius: 999,
                padding: "9px 0",
                textDecoration: "none",
              }}
            >
              {profilePct === 100 ? "View Profile →" : "Complete Profile →"}
            </Link>
          </section>

          {/* GROWTH OVERVIEW */}
          <section style={panel}>
            <h2 style={{ fontSize: 18.5, margin: "0 0 4px" }}>Your Growth Overview</h2>
            <p style={{ margin: "0 0 16px", color: "#9d8fd6", fontSize: 13 }}>
              Posts published per week · last 8 weeks
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
              {weeks.map((w) => (
                <div key={w.weekStart} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#e9d5ff" }}>{w.count}</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 26,
                      height: `${Math.max(5, (w.count / maxWeek) * 78)}%`,
                      borderRadius: "6px 6px 3px 3px",
                      background: "linear-gradient(180deg, #e879f9, #7c3aed)",
                      boxShadow: "0 0 12px rgba(168,85,247,0.4)",
                    }}
                  />
                  <span style={{ fontSize: 10, color: "#9d8fd6" }}>{w.weekStart.slice(5)}</span>
                </div>
              ))}
            </div>
            {posting.totalPosts === 0 && (
              <p style={{ margin: "12px 0 0", color: "#ddd0ff", fontSize: 13.5 }}>
                Log your posts and this chart fills in with your real publishing rhythm.
              </p>
            )}
          </section>

          {/* YOUR BUSINESS PROFILE (identity) */}
          <section style={panel}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h2 style={{ fontSize: 18.5, margin: 0, flex: 1 }}>Your Business Profile</h2>
              <Link href="/growth-center/profile" style={{ color: "#67e8f9", fontWeight: 700, fontSize: 13.5 }}>
                Edit Profile →
              </Link>
            </div>
            {profile ? (
              <>
                {profile.creatorName.trim() && (
                  <p style={{ margin: "12px 0 2px", fontSize: 17, fontWeight: 800 }}>{profile.creatorName}</p>
                )}
                {profile.contentCategories.length > 0 && (
                  <p style={{ margin: "0 0 8px", color: "#f0abfc", fontWeight: 700, fontSize: 14.5 }}>
                    {profile.contentCategories.slice(0, 2).join(" & ")} Creator
                  </p>
                )}
                {profile.platforms.length > 0 && (
                  <p style={{ margin: "0 0 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.platforms.map((p) => (
                      <span key={p} style={{ border: "1px solid #7e22ce", borderRadius: 999, padding: "3px 11px", fontSize: 12.5, fontWeight: 700, color: "#e9d5ff" }}>
                        {p}
                      </span>
                    ))}
                  </p>
                )}
                {(profile.businessDescription.trim() || profile.uniqueSellingProposition.trim()) && (
                  <p
                    style={{
                      margin: "0 0 10px",
                      color: "#ddd0ff",
                      fontSize: 14,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {profile.businessDescription.trim() || profile.uniqueSellingProposition.trim()}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 14 }}>
                  <span aria-hidden="true">🎯 </span>
                  <strong>Primary Goal:</strong>{" "}
                  <span style={{ color: "#ddd0ff" }}>
                    {profile.businessGoals[0] ?? (profile.businessObjectives.trim() || "Set your primary goal in your profile.")}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: "12px 0 12px", color: "#ddd0ff", fontSize: 14.5 }}>
                  Tell UltraVestra about your platforms, audience and goals — your matches and advice get built around it.
                </p>
                <Link href="/growth-center/profile" style={{ color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>
                  Set up your profile →
                </Link>
              </>
            )}
          </section>

          {/* LATEST INSIGHTS */}
          <section style={panel}>
            <h2 style={{ fontSize: 18.5, margin: "0 0 12px" }}>💡 Latest Insights</h2>
            {events.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {events.map((e, i) => {
                  const meta = EVENT_LINES[e.event_type] ?? { icon: "✨", line: "Activity in your business" };
                  return (
                    <p key={i} style={{ margin: 0, fontSize: 14.5 }}>
                      <span aria-hidden="true" style={{ marginRight: 8 }}>{meta.icon}</span>
                      {meta.line}
                      <span style={{ display: "block", marginLeft: 27, color: "#9d8fd6", fontSize: 12.5 }}>
                        {e.created_at.slice(0, 10)}
                      </span>
                    </p>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>
                Your activity appears here as you work — posts, deals, revenue and goals, straight from your records.
              </p>
            )}
          </section>
        </div>
      </div>

      {!list.length && (
        <section style={panel}>
          <h2 style={{ fontSize: 21, margin: "0 0 6px" }}>Dashboard data is loading</h2>
          <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15 }}>
            The intelligence database is protected for members — your directory counts will appear here in a moment.
          </p>
        </section>
      )}

      {/* EVERYTHING IN THE PLATFORM — every feature, kept */}
      <section>
        <h2 style={{ fontSize: 21, margin: "0 0 14px" }}>Everything in your platform</h2>
        <div className="uv-cards">
          {sections.map((s) => (
            <Link key={s.title} href={s.href} style={{ textDecoration: "none" }}>
              <article style={card}>
                <p style={{ margin: "0 0 6px", fontSize: 24 }}>{s.emoji}</p>
                <strong style={{ fontSize: 17.5 }}>{s.title}</strong>
                <p style={{ margin: "6px 0 0", color: "#ddd0ff", fontSize: 14.5 }}>{s.line}</p>
                {s.live && <p style={{ margin: "10px 0 0", color: "#4ade80", fontWeight: 700, fontSize: 13.5 }}>{s.live}</p>}
                <p style={{ margin: "8px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>Open →</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {stats.newest.length > 0 && (
        <section style={panel}>
          <h2 style={{ fontSize: 21, margin: "0 0 6px" }}>🌱 Newest research on the radar</h2>
          <p style={{ color: "#ddd0ff", margin: "0 0 14px", fontSize: 15 }}>The most recently added brands in the directory.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.newest.map((b) => (
              <p key={b.id} style={{ margin: 0, fontSize: 15.5 }}>
                <Link href={`/brands/${b.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{b.name}</Link>
                <span style={{ color: "#ddd0ff" }}>{b.country ? ` · ${b.country}` : ""} · added {(b.created_at ?? "").slice(0, 10)}</span>
              </p>
            ))}
          </div>
          <p style={{ margin: "16px 0 0" }}>
            <Link href="/radar" style={{ color: "#67e8f9", fontWeight: 700 }}>Open the full Brand Opportunity Radar →</Link>
          </p>
        </section>
      )}
    </div>
  );
}
