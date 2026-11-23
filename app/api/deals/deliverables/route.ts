import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Build 14 — deliverables tracking under a brand deal: one row
// per promised piece of content (title, due date, status,
// revision rounds), stored in public.deal_deliverables.
//
// ISOLATION (binding): session client (RLS own-row policies
// apply) and every query scoped to the caller's user_id in code.
// A deliverable can only be created under a deal the caller owns
// — validated against creator_deals before insert, the same
// pattern the deals route uses for proposal links.
//
// HONESTY RULE (binding): a deliverable's status is the
// creator's own tracking. "Delivered" means the creator marked
// it delivered — UltraVestra did not send or verify content.

const STATUSES = ["pending", "delivered", "approved"] as const;

const DateOrNull = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const CreateSchema = z.object({
  dealId: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  dueDate: DateOrNull.default(null),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(300).optional(),
  dueDate: DateOrNull.optional(),
  status: z.enum(STATUSES).optional(),
  revisions: z.number().int().min(0).max(1000).optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

const ITEM_COLUMNS =
  "id, deal_id, title, due_date, status, revisions, created_at, updated_at";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Brand Deals."
              : "An active subscription is required to use your Brand Deals.",
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
        { error: "Please log in to use your Brand Deals." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check the deliverable details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the deliverable details." },
      { status: 400 }
    );
  }

  try {
    // The parent deal must be the caller's own.
    const { data: dealRows, error: dealError } = await owner.supabase
      .from("creator_deals")
      .select("id")
      .eq("id", parsed.data.dealId)
      .eq("user_id", owner.userId);
    if (dealError) throw dealError;
    if (!dealRows || dealRows.length === 0) {
      return Response.json({ error: "Deal not found." }, { status: 404 });
    }

    const { data, error } = await owner.supabase
      .from("deal_deliverables")
      .insert({
        user_id: owner.userId,
        deal_id: parsed.data.dealId,
        title: parsed.data.title,
        due_date: parsed.data.dueDate,
      })
      .select(ITEM_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json({ success: true, item: data }, { status: 201 });
  } catch (e) {
    console.error("Deliverable create error:", e);
    return Response.json(
      { error: "The deliverable could not be saved. Please try again." },
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
      { error: "Please check the deliverable details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the deliverable details." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.dueDate !== undefined) update.due_date = parsed.data.dueDate;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.revisions !== undefined)
    update.revisions = parsed.data.revisions;

  try {
    const { data, error } = await owner.supabase
      .from("deal_deliverables")
      .update(update)
      .eq("id", parsed.data.id)
      .eq("user_id", owner.userId)
      .select(ITEM_COLUMNS);
    if (error) throw error;
    if (!data || data.length === 0) {
      return Response.json(
        { error: "Deliverable not found." },
        { status: 404 }
      );
    }
    return Response.json({ success: true, item: data[0] });
  } catch (e) {
    console.error("Deliverable update error:", e);
    return Response.json(
      { error: "The deliverable could not be updated. Please try again." },
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
      { error: "Please check the deliverable details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("deal_deliverables")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Deliverable delete error:", error);
    return Response.json(
      { error: "The deliverable could not be deleted. Please try again." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return Response.json(
      { error: "Deliverable not found." },
      { status: 404 }
    );
  }

  return Response.json({ success: true });
}
