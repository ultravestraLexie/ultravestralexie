import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  FEEDBACK_KINDS,
  rowToFeedback,
  type FeedbackRowLike,
} from "@/lib/galaxy/core";

export const runtime = "nodejs";

// Customer feedback (trust queue #7) — owner-only create/read over
// public.feedback: a signed-in creator tells us what is working,
// what is missing, what is hard, or that they are thinking of
// leaving. The owner reads feedback from the database.
//
// Feedback is NOT a support ticket: no reference number, no
// status, and no reply is promised. contact_ok only records that
// the creator said we MAY email them about it.
//
// ISOLATION (binding, same as /api/support): session client (RLS
// own-row policies apply) and every query scoped to the caller's
// user_id in code. The caller's id comes from the session, never
// from the request. There is no update or delete here — feedback
// is a record; the table grants users no such policy.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers
// /api/feedback).

const FEEDBACK_COLUMNS = "id, kind, message, contact_ok, created_at";

/** Newest first, capped — a creator's own recent feedback. */
const LIST_CAP = 20;

const PostSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  message: z.string().trim().min(10).max(4000),
  contactOk: z.boolean(),
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
              ? "Please log in to leave feedback."
              : "An active subscription is required to leave feedback.",
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
        { error: "Please log in to leave feedback." },
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
      .from("feedback")
      .select(FEEDBACK_COLUMNS)
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: false })
      .limit(LIST_CAP);
    if (error) throw error;

    return Response.json({
      success: true,
      feedback: ((data ?? []) as FeedbackRowLike[]).map((r) =>
        rowToFeedback(r)
      ),
    });
  } catch (e) {
    console.error("Feedback load error:", e);
    return Response.json(
      { error: "Your feedback could not be loaded. Please try again." },
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
      { error: "Please check your feedback." },
      { status: 400 }
    );
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your feedback." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await owner.supabase
      .from("feedback")
      .insert({
        user_id: owner.userId,
        kind: parsed.data.kind,
        message: parsed.data.message,
        contact_ok: parsed.data.contactOk,
      })
      .select(FEEDBACK_COLUMNS)
      .single();
    if (error) throw error;

    const entry = rowToFeedback(data as FeedbackRowLike);
    return Response.json({ ok: true, success: true, id: entry.id, feedback: entry });
  } catch (e) {
    console.error("Feedback save error:", e);
    return Response.json(
      { error: "Your feedback could not be sent. Please try again." },
      { status: 500 }
    );
  }
}
