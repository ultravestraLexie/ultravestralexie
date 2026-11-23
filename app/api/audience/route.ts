import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  AUDIENCE_PLATFORMS,
  rowToSnapshot,
  todayKey,
  type AudienceRowLike,
} from "@/lib/galaxy/core";

export const runtime = "nodejs";

// Audience Independence Center (System #6) — owner-only read/write
// over public.audience_snapshots: the creator's own hand-entered
// audience numbers over time. There are NO platform connections
// behind this route; every row is a number the creator typed.
//
// ISOLATION (binding, same as /api/deals/protection): session
// client (RLS own-row policies apply) and every query scoped to
// the caller's user_id in code. The caller's id comes from the
// session, never from the request.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers
// /api/audience).

const SNAPSHOT_COLUMNS =
  "id, platform, followers, engagement_pct, captured_on, created_at";

/** Newest first, capped — the same read the Passport page makes. */
const LIST_CAP = 200;

const PostSchema = z.object({
  platform: z.enum(AUDIENCE_PLATFORMS),
  followers: z.number().int().min(0).max(2_000_000_000),
  engagementPct: z.number().min(0).max(100).nullable().optional(),
  capturedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => !Number.isNaN(Date.parse(s)), "invalid date")
    .optional(),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use the Audience Independence Center."
              : "An active subscription is required to use the Audience Independence Center.",
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
        { error: "Please log in to use the Audience Independence Center." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  try {
    const { data, error } = await owner.supabase
      .from("audience_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("user_id", owner.userId)
      .order("captured_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(LIST_CAP);
    if (error) throw error;

    return Response.json({
      success: true,
      snapshots: ((data ?? []) as AudienceRowLike[]).map((r) =>
        rowToSnapshot(r)
      ),
    });
  } catch (e) {
    console.error("Audience snapshots load error:", e);
    return Response.json(
      { error: "Your audience numbers could not be loaded. Please try again." },
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
      { error: "Please check the audience numbers." },
      { status: 400 }
    );
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the audience numbers." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await owner.supabase
      .from("audience_snapshots")
      .insert({
        user_id: owner.userId,
        platform: parsed.data.platform,
        followers: parsed.data.followers,
        engagement_pct: parsed.data.engagementPct ?? null,
        captured_on: parsed.data.capturedOn ?? todayKey(),
      })
      .select(SNAPSHOT_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json({
      success: true,
      snapshot: rowToSnapshot(data as AudienceRowLike),
    });
  } catch (e) {
    console.error("Audience snapshot save error:", e);
    return Response.json(
      { error: "That entry could not be saved. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = DeleteSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the entry reference." },
      { status: 400 }
    );
  }

  try {
    // Scoped to the caller's user_id in code as well as by RLS —
    // a creator can only ever delete their own rows. The select
    // confirms a row actually went away (typo correction), so a
    // foreign or unknown id is a 404, not a silent success.
    const { data, error } = await owner.supabase
      .from("audience_snapshots")
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", owner.userId)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json({ error: "Entry not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error("Audience snapshot delete error:", e);
    return Response.json(
      { error: "That entry could not be removed. Please try again." },
      { status: 500 }
    );
  }
}
