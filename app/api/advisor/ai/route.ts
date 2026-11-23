import { generateText, Output } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { checkRateLimitShared } from "@/lib/rate-limit";
import {
  computePostingSummary,
  postsInMonth,
  publishedOnly,
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
  rowToProfile,
  type BusinessProfileRow,
} from "@/lib/business-profile";

export const runtime = "nodejs";
export const maxDuration = 60;

// AI Creator Advisor — the written brief (Phase: AI Advisor).
//
// The deterministic evidence core (GET /api/advisor) computes the
// numbers and the rule findings. This route adds the layer the
// owner ordered on 2026-11-22: an AI-written brief over the SAME
// evidence. The model receives one evidence JSON built from the
// caller's own records by the same pure libs the pages use, and
// writes prioritized advice from it.
//
// HONESTY RULES (binding):
// - The model may use ONLY the figures, brands, dates and facts in
//   the evidence JSON. The system prompt forbids inventing any
//   number, and every action's "why" must cite an evidence figure.
// - public.revenue_estimates is NEVER queried here (same binding
//   as the evidence core): estimated earnings cannot shape advice.
// - No income promises, no hype. Thin evidence is stated plainly.
// - If the model call fails, the route answers with an error and
//   the rule-based recommendations remain available on their own
//   route — the brief is an addition, never a dependency.
//
// ISOLATION (binding): session client (RLS own-row policies
// apply), every query scoped to the caller's user_id, and the
// caller's id comes from the session — never from the request.
//
// PACING: one model invocation per request, run through the same
// 429-aware pacer the Buyer Brain uses (Build 5): retry-after
// honored inside the retry budget, fail-closed at the 55-second
// cumulative deadline under the route's 60-second cap.
//
// RATE LIMIT: 10 briefs per user per hour via the shared enforcing
// limiter (fail-closed, per lib/rate-limit.ts). The frozen limiter
// file is imported, never modified; this route's key is its own
// namespace so its bucket never mixes with the Buyer Brain's.

const ADVISOR_AI_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 } as const;
const DEFAULT_WEEKLY_GOAL = 5;
const BRIEF_TIMEOUT_MS = 45_000;
const GENERATION_DEADLINE_MS = 55_000;

const BriefSchema = z.object({
  headline: z.string().min(1).max(300),
  actions: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        why: z.string().min(1).max(500),
        step: z.string().min(1).max(500),
      })
    )
    .min(1)
    .max(5),
  closingNote: z.string().min(1).max(500),
});

type Brief = z.infer<typeof BriefSchema>;

const ADVISOR_SYSTEM = `
You are the UltraVestra AI Creator Advisor. You write ONE short,
prioritized brief for a creator, from the EVIDENCE JSON in the
prompt. That evidence was computed by UltraVestra's rules from the
creator's own records — it is the only truth you may use.

BINDING RULES:
1. Use ONLY numbers, brands, dates and facts that appear in the
   evidence. Never invent a figure, a brand, a date, a follower
   count, or a result. If a fact is not in the evidence, do not
   state it.
2. Every action's "why" must cite the specific evidence figure
   behind it (for example: "2 of 5 posts this week", "$250 recorded
   this month", "1 deal 6 days overdue").
3. Write in plain, direct, warm language. Address the creator as
   "you". Short sentences. No hype, no jargon, no income promises,
   no guaranteed results.
4. Order the actions by importance: money owed or overdue first,
   then deadlines, then posting consistency, then growth.
5. If the evidence is thin — few or no posts, deals, revenue or
   goals recorded, or an incomplete business profile — say so
   plainly in the headline, and make the first actions about
   recording their work and completing their profile. Advice is
   only as good as the records behind it; never dress up missing
   data as insight.
6. The headline is ONE sentence naming the single most important
   thing the evidence shows right now.
7. The closing note is one or two sentences: an honest, grounded
   encouragement tied to a real positive figure in the evidence
   when one exists — otherwise, a plain statement of the first
   step's value.

Return only the structured brief.
`;

// ------------------------------------------------------------------
// Pacing layer — ported from the Buyer Brain route (Build 5), where
// this exact pattern holds calls inside the AI Gateway's
// 5-requests-per-minute quota: a 429 waits (retry-after honored,
// bounded) INSIDE the attempt budget, and a wait that would cross
// the cumulative deadline fails the piece instead.
// ------------------------------------------------------------------
const MAX_429_WAIT_MS = 15_000;
const BACKOFF_BASE_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rateLimitWaitMs(error: unknown, attemptIndex: number): number | null {
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    name?: unknown;
    responseHeaders?: Record<string, string>;
    headers?: Record<string, string>;
  } | null;
  const status =
    typeof e?.status === "number"
      ? e.status
      : typeof e?.statusCode === "number"
        ? e.statusCode
        : undefined;
  const name = typeof e?.name === "string" ? e.name : "";
  const message = error instanceof Error ? error.message : String(error);
  const isRateLimit =
    status === 429 ||
    /rate.?limit/i.test(name) ||
    /\b429\b|too many requests|rate limit/i.test(message);
  if (!isRateLimit) return null;

  const headers = e?.responseHeaders ?? e?.headers ?? {};
  const retryAfter = headers["retry-after"] ?? headers["Retry-After"];
  if (typeof retryAfter === "string" && retryAfter.trim().length > 0) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(Math.max(0, seconds * 1000), MAX_429_WAIT_MS);
    }
    const at = Date.parse(retryAfter);
    if (!Number.isNaN(at)) {
      return Math.min(Math.max(0, at - Date.now()), MAX_429_WAIT_MS);
    }
  }
  return Math.min(BACKOFF_BASE_MS * 2 ** attemptIndex, MAX_429_WAIT_MS);
}

async function runBrief(
  attempt: (signal: AbortSignal) => Promise<Brief>,
  deadlineAt: number
): Promise<Brief> {
  let lastError: unknown = null;
  for (let i = 0; i <= 1; i++) {
    const attemptTimeout = Math.min(BRIEF_TIMEOUT_MS, deadlineAt - Date.now());
    if (attemptTimeout <= 0) {
      lastError = new Error("The generation deadline was reached.");
      break;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);
    try {
      return await attempt(controller.signal);
    } catch (error) {
      lastError = error;
      if (i < 1) {
        const wait = rateLimitWaitMs(error, i);
        if (wait !== null && wait > 0) {
          if (Date.now() + wait >= deadlineAt) break;
          await sleep(wait);
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("The AI did not return a valid brief.");
}

// ------------------------------------------------------------------

type GoalRow = GoalLike & { id: string };

const GOAL_COLUMNS =
  "goal_type, target_value, unit, period, manual_current, completed_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your AI Advisor."
              : "An active subscription is required to use your AI Advisor.",
        },
        { status: gate === "login" ? 401 : 403 }
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Please log in to use your AI Advisor." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

function dollars(cents: number): number {
  return Math.round(cents) / 100;
}

export async function POST() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  if (
    !(await checkRateLimitShared(
      `advisor-ai:user:${owner.userId}`,
      ADVISOR_AI_RATE_LIMIT.limit,
      ADVISOR_AI_RATE_LIMIT.windowMs
    ))
  ) {
    return Response.json(
      {
        error:
          "You've reached the brief limit for now. Please try again in a little while.",
      },
      { status: 429 }
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY || !process.env.AI_MODEL) {
    return Response.json(
      { error: "AI engine is not configured yet." },
      { status: 503 }
    );
  }
  const model = process.env.AI_MODEL;

  try {
    const [postsRes, prefsRes, goalsRes, entriesRes, dealsRes, profileRes] =
      await Promise.all([
        owner.supabase
          .from("creator_posts")
          .select("platform, posted_date, source, state")
          .eq("user_id", owner.userId),
        owner.supabase
          .from("growth_prefs")
          .select("weekly_post_goal")
          .eq("user_id", owner.userId)
          .maybeSingle(),
        owner.supabase
          .from("creator_goals")
          .select(GOAL_COLUMNS)
          .eq("user_id", owner.userId)
          .order("created_at", { ascending: true }),
        owner.supabase
          .from("revenue_entries")
          .select("brand_name, amount_cents, status, earned_date, due_date, kind")
          .eq("user_id", owner.userId),
        owner.supabase
          .from("creator_deals")
          .select("brand_name, platform, stage, compensation_cents, deadline")
          .eq("user_id", owner.userId),
        // Business Profile — read tolerantly, exactly as the
        // evidence core does: a failed read means "not read",
        // never a failed brief.
        owner.supabase
          .from("creator_business_profiles")
          .select(
            "platforms, content_categories, audience_size, average_views, engagement_rate, audience_demographics, past_partnerships, revenue_streams, business_objectives, creator_name, business_description, unique_selling_proposition, differentiator, professional_experience, business_goals"
          )
          .eq("user_id", owner.userId)
          .maybeSingle(),
      ]);

    const failed = [postsRes, goalsRes, entriesRes, dealsRes].find(
      (r) => r.error
    );
    if (failed?.error) throw failed.error;
    if (prefsRes.error) throw prefsRes.error;

    const now = new Date();
    const posts = (postsRes.data ?? []) as PostLike[];
    const weeklyGoal =
      (prefsRes.data as { weekly_post_goal: number } | null)
        ?.weekly_post_goal ?? DEFAULT_WEEKLY_GOAL;
    const entries = (entriesRes.data ?? []) as AdvisorEntryLike[];
    const deals = (dealsRes.data ?? []) as DealLike[];
    const goalRows = (goalsRes.data ?? []) as GoalRow[];

    // The same compositions the owning pages and the evidence core
    // use — one set of numbers, everywhere.
    const posting = computePostingSummary(posts, weeklyGoal, now);
    const revenue = computeSummary(entries as RevenueEntryLike[], now);
    const health = computeHealth(entries, deals, now);

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
    const lastPostDate =
      published.length > 0
        ? published.map((p) => p.posted_date).sort().at(-1) ?? null
        : null;

    const profileRow = profileRes.error
      ? null
      : (profileRes.data as BusinessProfileRow | null);
    const profile = profileRow ? rowToProfile(profileRow) : null;
    const completeness = profileRes.error
      ? null
      : profileCompleteness(profile);

    const recommendations = buildRecommendations(
      { profile: completeness, posting, lastPostDate, goals, health, revenue, entries, deals },
      now
    );

    const evidence = {
      today: now.toISOString().slice(0, 10),
      businessProfile: profile
        ? {
            fieldsCompleted: completeness?.filled ?? 0,
            fieldsTotal: completeness?.total ?? 10,
            platforms: profile.platforms,
            contentCategories: profile.contentCategories,
            audienceSize: profile.audienceSize,
            averageViews: profile.averageViews,
            engagementRatePct: profile.engagementRate,
            revenueStreams: profile.revenueStreams,
            businessGoals: profile.businessGoals,
            businessObjectives: profile.businessObjectives,
            // The identity layer (Build 8) — how this creator's
            // business differs from every other creator's. The
            // brief may use these to fit its advice; they are the
            // creator's own words, quoted from their profile.
            creatorName: profile.creatorName,
            businessDescription: profile.businessDescription,
            uniqueSellingProposition: profile.uniqueSellingProposition,
            whatMakesContentDifferent: profile.differentiator,
            professionalExperience: profile.professionalExperience,
          }
        : {
            fieldsCompleted: 0,
            fieldsTotal: completeness?.total ?? 10,
            note: "No Creator Business Profile saved yet.",
          },
      posting: {
        postsThisWeek: posting.postsThisWeek,
        weeklyGoal: posting.weeklyGoal,
        weeklyGoalProgressPct: posting.goalProgressPct,
        postsThisMonth: posting.postsThisMonth,
        totalPostsRecorded: posting.totalPosts,
        currentStreakDays: posting.currentStreak,
        lastPostDate,
      },
      revenueUSD: {
        recordedThisMonth: dollars(revenue.currentMonthCents),
        recordedLastMonth: dollars(revenue.previousMonthCents),
        totalRecorded: dollars(revenue.totalEarnedCents),
        stillOwedToCreator: dollars(health.outstandingCents),
        received: dollars(health.receivedCents),
        topBrands: health.byBrand.slice(0, 3).map((b) => ({
          brand: b.name,
          recordedUSD: dollars(b.cents),
          sharePct: b.sharePct,
        })),
      },
      deals: {
        openDeals: health.pipeline.openDeals,
        openValueUSD: dollars(health.pipeline.openValueCents),
        paidDeals: health.pipeline.paidDeals,
        tracked: deals.map((d) => ({
          brand: d.brand_name,
          stage: d.stage,
          deadline: d.deadline,
          compensationUSD:
            d.compensation_cents != null ? dollars(d.compensation_cents) : null,
        })),
      },
      goals: goals.map(({ goal, progress }) => ({
        type: goal.goal_type,
        target: goal.target_value,
        unit: goal.unit,
        period: goal.period,
        current: progress.current,
        progressPct: progress.pct,
        complete: progress.complete,
      })),
      ruleFindings: recommendations.map((r) => ({
        severity: r.severity,
        title: r.title,
        message: r.message,
        evidence: r.evidence,
      })),
    };

    const deadlineAt = Date.now() + GENERATION_DEADLINE_MS;
    const brief = await runBrief(async (signal) => {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: BriefSchema }),
        abortSignal: signal,
        system: ADVISOR_SYSTEM,
        prompt: `
Write this creator's advisor brief from their evidence.

EVIDENCE (their own records, computed by UltraVestra's rules —
money figures are US dollars):
${JSON.stringify(evidence, null, 2)}
`,
      });
      if (!output) {
        throw new Error("The AI did not return a valid brief.");
      }
      return output;
    }, deadlineAt);

    return Response.json({
      success: true,
      brief,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("AI Advisor brief error:", e);
    return Response.json(
      {
        error:
          "The AI Advisor could not write your brief right now. Your rule-based recommendations are unaffected — please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
