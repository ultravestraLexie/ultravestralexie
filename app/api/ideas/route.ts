import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Creator Ideas — owner-only CRUD over public.creator_ideas.
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code. The
// caller's id comes from the session — never from the request.
//
// An idea is the creator's own raw material — a title, a concept,
// a caption draft. It is not content and it is not a post: nothing
// here counts an idea as published or planned. Turning an idea
// into a planned post is an explicit act the creator takes in the
// Planner, which creates a creator_posts row (state='planned')
// through /api/posts — the idea itself stays an idea.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const PLATFORMS = ["tiktok", "instagram", "facebook", "trybe", "other"] as const;

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  concept: z.string().max(2000).default(""),
  captionDraft: z.string().max(2000).default(""),
  platform: z.enum(PLATFORMS).nullable().default(null),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  concept: z.string().max(2000).optional(),
  captionDraft: z.string().max(2000).optional(),
  platform: z.enum(PLATFORMS).nullable().optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type IdeaRow = {
  id: string;
  title: string;
  concept: string;
  caption_draft: string;
  platform: string | null;
  created_at: string;
  updated_at: string;
};

const IDEA_COLUMNS =
  "id, title, concept, caption_draft, platform, created_at, updated_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Ideas."
              : "An active subscription is required to use your Ideas.",
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
        { error: "Please log in to use your Ideas." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { data, error } = await owner.supabase
    .from("creator_ideas")
    .select(IDEA_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ideas load error:", error);
    return Response.json(
      { error: "Your ideas could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, ideas: (data ?? []) as IdeaRow[] });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your idea details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your idea details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_ideas")
    .insert({
      user_id: owner.userId,
      title: parsed.data.title,
      concept: parsed.data.concept.trim(),
      caption_draft: parsed.data.captionDraft.trim(),
      platform: parsed.data.platform,
    })
    .select(IDEA_COLUMNS)
    .single();

  if (error) {
    console.error("Ideas create error:", error);
    return Response.json(
      { error: "Your idea could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, idea: data as IdeaRow }, { status: 201 });
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your idea details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your idea details." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.concept !== undefined)
    update.concept = parsed.data.concept.trim();
  if (parsed.data.captionDraft !== undefined)
    update.caption_draft = parsed.data.captionDraft.trim();
  if (parsed.data.platform !== undefined) update.platform = parsed.data.platform;

  const { data, error } = await owner.supabase
    .from("creator_ideas")
    .update(update)
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select(IDEA_COLUMNS);

  if (error) {
    console.error("Ideas update error:", error);
    return Response.json(
      { error: "Your idea could not be updated. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Idea not found." }, { status: 404 });
  }

  return Response.json({ success: true, idea: data[0] as IdeaRow });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your idea details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("creator_ideas")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Ideas delete error:", error);
    return Response.json(
      { error: "Your idea could not be deleted. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Idea not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
