import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  computeProgress,
  type GoalLike,
  type GoalProgress,
  type GoalRecords,
} from "@/lib/goals/progress";
import {
  postsInMonth,
  publishedOnly,
  type PostLike,
} from "@/lib/posts/summary";
import { logCreatorEvent } from "@/lib/events";
import { computeSummary, type RevenueEntryLike } from "@/lib/revenue/summary";

export const runtime = "nodejs";

// Creator Goals — owner-only CRUD over public.creator_goals, with
// progress computed server-side by lib/goals/progress.ts.
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code. The
// caller's id comes from the session — never from the request.
//
// PROGRESS RULE (binding): progress traces to the caller's own
// records or to a number the creator entered — never to anything
// else. The records below are built from creator_posts (published
// rows only, via lib/posts/summary.ts) and revenue_entries
// (RECORDED entries only, via lib/revenue/summary.ts).
// revenue_estimates is never queried by this route: estimated
// earnings cannot move a goal. Followers/views/custom goals read
// the creator-entered manual_current and are labeled as such in
// every response (progress.source).
//
// COMPLETION RULE: when computed progress reaches 100% and the
// goal has no completed_at yet, the server stamps completed_at —
// completion is a fact the records establish, not a button. Once
// stamped it is never un-stamped here: the achievement history
// records that the goal WAS reached, even if a later month's
// progress starts over.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const GOAL_TYPES = ["videos", "earnings", "followers", "views", "custom"] as const;
const PERIODS = ["monthly", "total"] as const;

const CreateSchema = z.object({
  goalType: z.enum(GOAL_TYPES),
  targetValue: z.number().positive().max(1_000_000_000_000),
  unit: z.string().trim().max(30).default(""),
  period: z.enum(PERIODS).default("monthly"),
  manualCurrent: z.number().min(0).max(1_000_000_000_000).nullable().default(null),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  targetValue: z.number().positive().max(1_000_000_000_000).optional(),
  unit: z.string().trim().max(30).optional(),
  manualCurrent: z.number().min(0).max(1_000_000_000_000).nullable().optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type GoalRow = {
  id: string;
  goal_type: GoalLike["goal_type"];
  target_value: number;
  unit: string;
  period: GoalLike["period"];
  manual_current: number | null;
  completed_at: string | null;
  created_at: string;
};

const GOAL_COLUMNS =
  "id, goal_type, target_value, unit, period, manual_current, completed_at, created_at";

const DEFAULT_UNITS: Record<string, string> = {
  videos: "posts",
  earnings: "USD",
  followers: "followers",
  views: "views",
  custom: "",
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Goals."
              : "An active subscription is required to use your Goals.",
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
        { error: "Please log in to use your Goals." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

/** The caller's record figures, from their own rows only. */
async function loadRecords(
  supabase: Supabase,
  userId: string
): Promise<GoalRecords> {
  const [postsRes, entriesRes] = await Promise.all([
    supabase
      .from("creator_posts")
      .select("platform, posted_date, source, state")
      .eq("user_id", userId),
    supabase
      .from("revenue_entries")
      .select("brand_name, amount_cents, status, earned_date, kind")
      .eq("user_id", userId),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  const posts = (postsRes.data ?? []) as PostLike[];
  const entries = (entriesRes.data ?? []) as RevenueEntryLike[];
  const recorded = computeSummary(entries);
  return {
    publishedPostsThisMonth: postsInMonth(posts),
    recordedEarningsThisMonthCents: recorded.currentMonthCents,
    publishedPostsTotal: publishedOnly(posts).length,
    recordedEarningsTotalCents: recorded.totalEarnedCents,
  };
}

function withProgress(goal: GoalRow, records: GoalRecords) {
  const progress: GoalProgress = computeProgress(goal, records);
  return { ...goal, progress };
}

/** Stamp completed_at the first time records establish the goal
 *  was reached. Returns the (possibly updated) row. */
async function stampCompletion(
  supabase: Supabase,
  userId: string,
  goal: GoalRow,
  records: GoalRecords
): Promise<GoalRow> {
  const progress = computeProgress(goal, records);
  if (!progress.complete || goal.completed_at) return goal;
  const completedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("creator_goals")
    .update({ completed_at: completedAt })
    .eq("id", goal.id)
    .eq("user_id", userId)
    .select(GOAL_COLUMNS);
  if (error || !data || data.length === 0) {
    if (error) console.error("Goals completion stamp error:", error);
    return { ...goal, completed_at: completedAt };
  }
  return data[0] as GoalRow;
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  try {
    const records = await loadRecords(owner.supabase, owner.userId);
    const { data, error } = await owner.supabase
      .from("creator_goals")
      .select(GOAL_COLUMNS)
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const goals: (GoalRow & { progress: GoalProgress })[] = [];
    for (const row of (data ?? []) as GoalRow[]) {
      const stamped = await stampCompletion(
        owner.supabase,
        owner.userId,
        row,
        records
      );
      goals.push(withProgress(stamped, records));
    }
    return Response.json({ success: true, goals });
  } catch (e) {
    console.error("Goals load error:", e);
    return Response.json(
      { error: "Your goals could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your goal details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your goal details." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await owner.supabase
      .from("creator_goals")
      .insert({
        user_id: owner.userId,
        goal_type: parsed.data.goalType,
        target_value: parsed.data.targetValue,
        unit:
          parsed.data.unit === ""
            ? DEFAULT_UNITS[parsed.data.goalType]
            : parsed.data.unit,
        period: parsed.data.period,
        manual_current: parsed.data.manualCurrent,
      })
      .select(GOAL_COLUMNS)
      .single();
    if (error) throw error;

    await logCreatorEvent(
      owner.supabase,
      owner.userId,
      "goal_created",
      "goal",
      (data as GoalRow).id,
      { goal_type: parsed.data.goalType }
    );

    const records = await loadRecords(owner.supabase, owner.userId);
    const stamped = await stampCompletion(
      owner.supabase,
      owner.userId,
      data as GoalRow,
      records
    );
    return Response.json(
      { success: true, goal: withProgress(stamped, records) },
      { status: 201 }
    );
  } catch (e) {
    console.error("Goals create error:", e);
    return Response.json(
      { error: "Your goal could not be saved. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your goal details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your goal details." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.targetValue !== undefined)
    update.target_value = parsed.data.targetValue;
  if (parsed.data.unit !== undefined) update.unit = parsed.data.unit;
  if (parsed.data.manualCurrent !== undefined)
    update.manual_current = parsed.data.manualCurrent;

  try {
    const { data, error } = await owner.supabase
      .from("creator_goals")
      .update(update)
      .eq("id", parsed.data.id)
      .eq("user_id", owner.userId)
      .select(GOAL_COLUMNS);
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json({ error: "Goal not found." }, { status: 404 });
    }

    const records = await loadRecords(owner.supabase, owner.userId);
    const stamped = await stampCompletion(
      owner.supabase,
      owner.userId,
      data[0] as GoalRow,
      records
    );
    return Response.json({
      success: true,
      goal: withProgress(stamped, records),
    });
  } catch (e) {
    console.error("Goals update error:", e);
    return Response.json(
      { error: "Your goal could not be updated. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your goal details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_goals")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Goals delete error:", error);
    return Response.json(
      { error: "Your goal could not be deleted. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Goal not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
