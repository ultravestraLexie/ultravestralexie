import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Build 14 — deliverables tracking under a brand deal: one row
// per promised piece of content (title, due date, status,
// revision rounds), stored in public.deal_deliverables.
// 2026-11-23 — the deal sheet's deliverables checklist reads
// this route (GET by deal, in position order) and appends via
// POST, which assigns the next position for the deal.
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
  // Build 16 — the attribution chain's missing edge: the post
  // that fulfilled this deliverable. The creator's own claim,
  // validated against their own posts below.
  postId: z.string().uuid().nullable().default(null),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(300).optional(),
  dueDate: DateOrNull.optional(),
  status: z.enum(STATUSES).optional(),
  revisions: z.number().int().min(0).max(1000).optional(),
  postId: z.string().uuid().nullable().optional(),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

const GetSchema = z.object({
  dealId: z.string().uuid(),
});

const ITEM_COLUMNS =
  "id, deal_id, title, due_date, status, revisions, post_id, position, created_at, updated_at";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Build 16b — the attribution audit trail: every change to a
 *  deliverable's post link writes an append-only event carrying
 *  the titles as they are at that moment, so the history stays
 *  readable even after a post is deleted. Best-effort: a failed
 *  event write is logged, never allowed to lose the change
 *  itself. */
async function logAttributionEvent(
  supabase: Supabase,
  userId: string,
  event: {
    dealId: string;
    deliverableId: string;
    deliverableTitle: string;
    action: "linked" | "unlinked";
    fromPostTitle: string | null;
    toPostTitle: string | null;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("attribution_events").insert({
      user_id: userId,
      deal_id: event.dealId,
      deliverable_id: event.deliverableId,
      deliverable_title: event.deliverableTitle,
      action: event.action,
      from_post_title: event.fromPostTitle,
      to_post_title: event.toPostTitle,
    });
    if (error) console.error("Attribution event write error:", error);
  } catch (e) {
    console.error("Attribution event write error:", e);
  }
}

async function postTitle(
  supabase: Supabase,
  userId: string,
  postId: string | null
): Promise<string | null> {
  if (!postId) return null;
  const { data } = await supabase
    .from("creator_posts")
    .select("title")
    .eq("id", postId)
    .eq("user_id", userId)
    .limit(1);
  const title = (data?.[0] as { title: string | null } | undefined)?.title;
  return title && title.trim() !== "" ? title : "Untitled post";
}

/** Build 16 — a post link is accepted only when the post is
 *  one of the caller's own (the revenue route's pattern). */
async function validatePostLink(
  supabase: Supabase,
  userId: string,
  postId: string | null
): Promise<Response | null> {
  if (postId === null) return null;
  const { data, error } = await supabase
    .from("creator_posts")
    .select("id")
    .eq("id", postId)
    .eq("user_id", userId);
  if (error) throw error;
  if (!data || data.length === 0) {
    return Response.json(
      { error: "That post could not be found among your posts." },
      { status: 400 }
    );
  }
  return null;
}

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

/** The deal sheet's checklist read: this deal's deliverables in
 *  checklist order (position, then creation). Owner-scoped like
 *  every handler here, and the parent deal must be the caller's
 *  own — the same validation POST performs before insert. */
export async function GET(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = GetSchema.safeParse({ dealId: searchParams.get("dealId") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the deal reference." },
      { status: 400 }
    );
  }

  try {
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
      .select(ITEM_COLUMNS)
      .eq("deal_id", parsed.data.dealId)
      .eq("user_id", owner.userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    return Response.json({ success: true, items: data ?? [] });
  } catch (e) {
    console.error("Deliverable list error:", e);
    return Response.json(
      { error: "The deliverables could not be loaded. Please try again." },
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

    const postError = await validatePostLink(
      owner.supabase,
      owner.userId,
      parsed.data.postId
    );
    if (postError) return postError;

    // Checklist order: the new item goes at the end of its deal's
    // list (max position + 1). Assigned here, never by the client.
    const { data: lastRows } = await owner.supabase
      .from("deal_deliverables")
      .select("position")
      .eq("deal_id", parsed.data.dealId)
      .eq("user_id", owner.userId)
      .order("position", { ascending: false })
      .limit(1);
    const lastPosition =
      (lastRows?.[0] as { position: number | null } | undefined)?.position ?? -1;

    const { data, error } = await owner.supabase
      .from("deal_deliverables")
      .insert({
        user_id: owner.userId,
        deal_id: parsed.data.dealId,
        title: parsed.data.title,
        due_date: parsed.data.dueDate,
        post_id: parsed.data.postId,
        position: lastPosition + 1,
      })
      .select(ITEM_COLUMNS)
      .single();
    if (error) throw error;

    if (parsed.data.postId) {
      const created = data as { id: string };
      await logAttributionEvent(owner.supabase, owner.userId, {
        dealId: parsed.data.dealId,
        deliverableId: created.id,
        deliverableTitle: parsed.data.title,
        action: "linked",
        fromPostTitle: null,
        toPostTitle: await postTitle(
          owner.supabase,
          owner.userId,
          parsed.data.postId
        ),
      });
    }

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
  if (parsed.data.postId !== undefined) update.post_id = parsed.data.postId;

  try {
    // Build 16b — when the post link changes, capture the
    // current row first so the audit event can name what the
    // link was changed FROM.
    let before: {
      deal_id: string;
      title: string;
      post_id: string | null;
    } | null = null;
    if (parsed.data.postId !== undefined) {
      const postError = await validatePostLink(
        owner.supabase,
        owner.userId,
        parsed.data.postId
      );
      if (postError) return postError;

      const { data: currentRows } = await owner.supabase
        .from("deal_deliverables")
        .select("deal_id, title, post_id")
        .eq("id", parsed.data.id)
        .eq("user_id", owner.userId)
        .limit(1);
      before =
        (currentRows?.[0] as {
          deal_id: string;
          title: string;
          post_id: string | null;
        }) ?? null;
    }
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

    if (
      before &&
      parsed.data.postId !== undefined &&
      before.post_id !== parsed.data.postId
    ) {
      await logAttributionEvent(owner.supabase, owner.userId, {
        dealId: before.deal_id,
        deliverableId: parsed.data.id,
        deliverableTitle: before.title,
        action: parsed.data.postId ? "linked" : "unlinked",
        fromPostTitle: await postTitle(
          owner.supabase,
          owner.userId,
          before.post_id
        ),
        toPostTitle: await postTitle(
          owner.supabase,
          owner.userId,
          parsed.data.postId
        ),
      });
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
