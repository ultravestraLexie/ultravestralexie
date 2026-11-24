import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  SUPPORT_CATEGORIES,
  rowToSupportTicket,
  type SupportTicketRowLike,
} from "@/lib/galaxy/core";

export const runtime = "nodejs";

// Support requests (trust queue #1) — owner-only create/read over
// public.support_tickets: a signed-in creator files a request from
// the Support page and reads their own requests back. A person
// answers by email; the owner reads tickets from the database.
//
// ISOLATION (binding, same as /api/audience): session client (RLS
// own-row policies apply) and every query scoped to the caller's
// user_id in code. The caller's id comes from the session, never
// from the request. There is no update or delete here — a filed
// request is a record; the table grants users no such policy.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers
// /api/support).

const TICKET_COLUMNS =
  "id, category, subject, message, contact_email, status, created_at";

/** Newest first, capped — the same read the Support page makes. */
const LIST_CAP = 50;

const PostSchema = z.object({
  category: z.enum(SUPPORT_CATEGORIES),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  contactEmail: z.string().trim().email().max(320),
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
              ? "Please log in to contact Support."
              : "An active subscription is required to contact Support.",
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
        { error: "Please log in to contact Support." },
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
      .from("support_tickets")
      .select(TICKET_COLUMNS)
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: false })
      .limit(LIST_CAP);
    if (error) throw error;

    return Response.json({
      success: true,
      tickets: ((data ?? []) as SupportTicketRowLike[]).map((r) =>
        rowToSupportTicket(r)
      ),
    });
  } catch (e) {
    console.error("Support tickets load error:", e);
    return Response.json(
      { error: "Your requests could not be loaded. Please try again." },
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
      { error: "Please check the request details." },
      { status: 400 }
    );
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the request details." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await owner.supabase
      .from("support_tickets")
      .insert({
        user_id: owner.userId,
        category: parsed.data.category,
        subject: parsed.data.subject,
        message: parsed.data.message,
        contact_email: parsed.data.contactEmail,
      })
      .select(TICKET_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json({
      success: true,
      ticket: rowToSupportTicket(data as SupportTicketRowLike),
    });
  } catch (e) {
    console.error("Support ticket save error:", e);
    return Response.json(
      { error: "Your request could not be sent. Please try again." },
      { status: 500 }
    );
  }
}
