import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { computePostingSummary } from "@/lib/posts/summary";

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

const CreateSchema = z.object({
  platform: z.enum(PLATFORMS),
  postedDate: DateString,
  title: z.string().max(200).default(""),
  externalUrl: z.string().max(1000).default(""),
  note: z.string().max(500).default(""),
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
  external_url: string | null;
  title: string | null;
  note: string | null;
  created_at: string;
};

const POST_COLUMNS =
  "id, platform, posted_date, source, external_url, title, note, created_at";

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

  const posts = (postsRes.data ?? []) as PostRow[];
  const weeklyGoal =
    (prefsRes.data as { weekly_post_goal: number } | null)?.weekly_post_goal ??
    DEFAULT_WEEKLY_GOAL;

  return Response.json({
    success: true,
    posts,
    weeklyGoal,
    summary: computePostingSummary(posts, weeklyGoal),
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
      external_url: externalUrl === "" ? null : externalUrl,
      title: parsed.data.title.trim() === "" ? null : parsed.data.title.trim(),
      note: parsed.data.note.trim() === "" ? null : parsed.data.note.trim(),
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
