import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { computePostingSummary, planSummary } from "@/lib/posts/summary";
import { logCreatorEvent } from "@/lib/events";

export const runtime = "nodejs";

// Posting Tracker — owner-only CRUD over public.creator_posts plus
// the caller's weekly goal in public.growth_prefs.
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code. The
// caller's id comes from the session — never from the request.
//
// SOURCE RULE (binding): a post's source is a stored fact —
// 'manual' (the creator logged it) or 'verified' (a platform sync
// confirmed it). In Phase 1 there is no sync, so this route FORCES
// source='manual' server-side on every insert: the create schema
// has no source field at all, and a client that sends one anyway
// has it ignored. No client action can mint a 'verified' row.
//
// STATE RULE (Phase 2, binding): a row's state — 'published',
// 'planned', or 'draft' — is the creator's own workflow label and
// the client MAY set it (create + PATCH). State is not evidence:
// changing state never changes source, so marking a planned post
// "published" records the creator's claim that it went out — the
// row stays source='manual', labeled "Logged by you", exactly like
// every other Phase 1/2 row. Only 'published' rows count toward
// streaks, totals, and goals (lib/posts/summary.ts).
//
// The summary is computed in code (lib/posts/summary.ts) from
// exactly the rows the GET returns — the page renders the server's
// numbers, never its own.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const PLATFORMS = ["tiktok", "instagram", "facebook", "trybe", "other"] as const;

const DateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

const STATES = ["published", "planned", "draft"] as const;

const CreateSchema = z.object({
  platform: z.enum(PLATFORMS),
  postedDate: DateString,
  state: z.enum(STATES).default("published"),
  title: z.string().max(200).default(""),
  caption: z.string().max(2000).default(""),
  externalUrl: z.string().max(1000).default(""),
  note: z.string().max(500).default(""),
  // Build 13: optional manual view count — typed in by the
  // creator, labeled "reported by you" wherever it renders.
  viewsCount: z.number().int().min(0).max(2_000_000_000).nullable().default(null),
});

const PostStateSchema = z.object({
  id: z.string().uuid(),
  state: z.enum(STATES),
});

const PostViewsSchema = z.object({
  id: z.string().uuid(),
  viewsCount: z.number().int().min(0).max(2_000_000_000).nullable(),
});

const GoalSchema = z.object({
  weeklyGoal: z.number().int().min(1).max(50),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type PostRow = {
  id: string;
  platform: string;
  posted_date: string;
  source: "manual" | "verified";
  state: "published" | "planned" | "draft";
  external_url: string | null;
  title: string | null;
  caption: string | null;
  note: string | null;
  views_count: number | null;
  created_at: string;
};

const POST_COLUMNS =
  "id, platform, posted_date, source, state, external_url, title, caption, note, views_count, created_at";

const DEFAULT_WEEKLY_GOAL = 5;

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Posting Tracker."
              : "An active subscription is required to use your Posting Tracker.",
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
        { error: "Please log in to use your Posting Tracker." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const [postsRes, prefsRes] = await Promise.all([
    owner.supabase
      .from("creator_posts")
      .select(POST_COLUMNS)
      .eq("user_id", owner.userId)
      .order("posted_date", { ascending: false })
      .order("created_at", { ascending: false }),
    owner.supabase
      .from("growth_prefs")
      .select("weekly_post_goal")
      .eq("user_id", owner.userId)
      .maybeSingle(),
  ]);

  const failed = [postsRes, prefsRes].find((r) => r.error);
  if (failed?.error) {
    console.error("Posting Tracker load error:", failed.error);
    return Response.json(
      { error: "Your posts could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const rawPosts = (postsRes.data ?? []) as PostRow[];
  const weeklyGoal =
    (prefsRes.data as { weekly_post_goal: number } | null)?.weekly_post_goal ??
    DEFAULT_WEEKLY_GOAL;

  // Build 13 — attribution: recorded revenue the creator linked
  // to each post (revenue_entries.post_id). Reported by the
  // creator, never verified by us; a failure here degrades the
  // figures to zero rather than failing the tracker.
  const linkedByPost = new Map<string, number>();
  const { data: linkedRows } = await owner.supabase
    .from("revenue_entries")
    .select("post_id, amount_cents")
    .eq("user_id", owner.userId)
    .not("post_id", "is", null);
  for (const row of (linkedRows ?? []) as {
    post_id: string;
    amount_cents: number;
  }[]) {
    linkedByPost.set(
      row.post_id,
      (linkedByPost.get(row.post_id) ?? 0) + row.amount_cents
    );
  }
  const posts = rawPosts.map((p) => ({
    ...p,
    linked_revenue_cents: linkedByPost.get(p.id) ?? 0,
  }));

  return Response.json({
    success: true,
    posts,
    weeklyGoal,
    summary: computePostingSummary(rawPosts, weeklyGoal),
    plan: planSummary(rawPosts),
  });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your post details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your post details." },
      { status: 400 }
    );
  }

  const externalUrl = parsed.data.externalUrl.trim();
  if (
    externalUrl !== "" &&
    !/^https?:\/\//i.test(externalUrl)
  ) {
    return Response.json(
      { error: "Please check your post details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_posts")
    .insert({
      user_id: owner.userId,
      platform: parsed.data.platform,
      posted_date: parsed.data.postedDate,
      // Phase 1: every row a client can create is manual. There is
      // deliberately no way to send a different value.
      source: "manual",
      // Phase 2: state is the creator's workflow label (see the
      // STATE RULE above) — it never touches source.
      state: parsed.data.state,
      external_url: externalUrl === "" ? null : externalUrl,
      title: parsed.data.title.trim() === "" ? null : parsed.data.title.trim(),
      caption:
        parsed.data.caption.trim() === "" ? null : parsed.data.caption.trim(),
      note: parsed.data.note.trim() === "" ? null : parsed.data.note.trim(),
      views_count: parsed.data.viewsCount,
    })
    .select(POST_COLUMNS)
    .single();

  if (error) {
    console.error("Posting Tracker create error:", error);
    return Response.json(
      { error: "Your post could not be saved. Please try again." },
      { status: 500 }
    );
  }

  await logCreatorEvent(
    owner.supabase,
    owner.userId,
    "post_logged",
    "post",
    (data as PostRow).id,
    { platform: parsed.data.platform, state: parsed.data.state }
  );

  return Response.json(
    { success: true, post: data as PostRow },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your goal." },
      { status: 400 }
    );
  }

  // Phase 2: a PATCH carrying an id + state is a post state change
  // (e.g. planned → published, "mark published"). Anything else is
  // the Phase 1 weekly-goal save below. A state change touches ONLY
  // the state column of the caller's own row — source is never in
  // the update, so no state change can mint a 'verified' row.
  if (
    typeof body === "object" &&
    body !== null &&
    "id" in body &&
    "state" in body
  ) {
    const stateParsed = PostStateSchema.safeParse(body);
    if (!stateParsed.success) {
      return Response.json(
        { error: "Please check your post details." },
        { status: 400 }
      );
    }
    const { data, error } = await owner.supabase
      .from("creator_posts")
      .update({ state: stateParsed.data.state })
      .eq("id", stateParsed.data.id)
      .eq("user_id", owner.userId)
      .select(POST_COLUMNS);

    if (error) {
      console.error("Posting Tracker state update error:", error);
      return Response.json(
        { error: "Your post could not be updated. Please try again." },
        { status: 500 }
      );
    }
    if (!data || data.length === 0) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    return Response.json({ success: true, post: data[0] as PostRow });
  }

  // Build 13: a PATCH carrying an id + viewsCount updates ONLY the
  // manual view count on the caller's own post.
  if (
    typeof body === "object" &&
    body !== null &&
    "id" in body &&
    "viewsCount" in body
  ) {
    const viewsParsed = PostViewsSchema.safeParse(body);
    if (!viewsParsed.success) {
      return Response.json(
        { error: "Please check your post details." },
        { status: 400 }
      );
    }
    const { data, error } = await owner.supabase
      .from("creator_posts")
      .update({ views_count: viewsParsed.data.viewsCount })
      .eq("id", viewsParsed.data.id)
      .eq("user_id", owner.userId)
      .select(POST_COLUMNS);
    if (error) {
      console.error("Posting Tracker views update error:", error);
      return Response.json(
        { error: "Your post could not be updated. Please try again." },
        { status: 500 }
      );
    }
    if (!data || data.length === 0) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    return Response.json({ success: true, post: data[0] as PostRow });
  }

  const parsed = GoalSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your goal." },
      { status: 400 }
    );
  }

  // Upsert the caller's own prefs row (created on first change —
  // a missing row reads as the default goal).
  const { data, error } = await owner.supabase
    .from("growth_prefs")
    .upsert(
      {
        user_id: owner.userId,
        weekly_post_goal: parsed.data.weeklyGoal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("weekly_post_goal")
    .single();

  if (error) {
    console.error("Posting Tracker goal save error:", error);
    return Response.json(
      { error: "Your goal could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    weeklyGoal: (data as { weekly_post_goal: number }).weekly_post_goal,
  });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your post details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_posts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Posting Tracker delete error:", error);
    return Response.json(
      { error: "Your post could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
