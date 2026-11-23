import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { computeDealPayment, type DealLike } from "@/lib/business/health";

export const runtime = "nodejs";

// Build 16b — invoice integrity: the issued copy of record.
//
// The invoice PAGE is a live view of the deal record — it
// changes when the record changes. An ISSUED invoice must not.
// POST here freezes the document server-side, from the
// creator's own records at this moment: figures, dates, terms,
// deliverables, and each deliverable's fulfilling post (title,
// URL, platform, posted date) exactly as they stand now. The
// snapshot lands in public.invoice_snapshots, which is
// insert-only through the API — a correction is a new version,
// never a rewrite of the original.
//
// GET returns a deal's issued versions, oldest first.

const DealIdSchema = z.object({ dealId: z.string().uuid() });

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

export async function GET(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = DealIdSchema.safeParse({ dealId: searchParams.get("dealId") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the invoice details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("invoice_snapshots")
    .select("id, version, invoice_number, issued_at, snapshot")
    .eq("deal_id", parsed.data.dealId)
    .eq("user_id", owner.userId)
    .order("version", { ascending: true });

  if (error) {
    console.error("Invoice snapshots list error:", error);
    return Response.json(
      { error: "The issued invoices could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, snapshots: data ?? [] });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check the invoice details." },
      { status: 400 }
    );
  }

  const parsed = DealIdSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the invoice details." },
      { status: 400 }
    );
  }

  try {
    // The deal must be the caller's own.
    const { data: dealRows, error: dealError } = await owner.supabase
      .from("creator_deals")
      .select(
        "id, brand_name, platform, stage, compensation_cents, deliverables, invoice_sent_date, payment_terms, payment_due_date, payment_received_date, amount_received_cents, created_at"
      )
      .eq("id", parsed.data.dealId)
      .eq("user_id", owner.userId);
    if (dealError) throw dealError;
    if (!dealRows || dealRows.length === 0) {
      return Response.json({ error: "Deal not found." }, { status: 404 });
    }
    const deal = dealRows[0] as {
      id: string;
      brand_name: string;
      platform: string | null;
      stage: string;
      compensation_cents: number | null;
      deliverables: string;
      invoice_sent_date: string | null;
      payment_terms: string | null;
      payment_due_date: string | null;
      payment_received_date: string | null;
      amount_received_cents: number | null;
      created_at: string;
    };

    const { data: itemRows } = await owner.supabase
      .from("deal_deliverables")
      .select("id, title, due_date, status, revisions, post_id")
      .eq("deal_id", deal.id)
      .eq("user_id", owner.userId)
      .order("created_at", { ascending: true });
    const items = (itemRows ?? []) as {
      id: string;
      title: string;
      due_date: string | null;
      status: string;
      revisions: number;
      post_id: string | null;
    }[];

    // Freeze each fulfilling post's identity as it stands NOW:
    // title, URL, platform, posted date. If the post is later
    // edited or deleted, this copy does not move.
    const postIds = items
      .map((i) => i.post_id)
      .filter((v): v is string => typeof v === "string");
    const postById = new Map<
      string,
      { title: string; url: string | null; platform: string; postedDate: string }
    >();
    if (postIds.length > 0) {
      const { data: postRows } = await owner.supabase
        .from("creator_posts")
        .select("id, title, external_url, platform, posted_date")
        .eq("user_id", owner.userId)
        .in("id", postIds);
      for (const p of (postRows ?? []) as {
        id: string;
        title: string | null;
        external_url: string | null;
        platform: string;
        posted_date: string;
      }[]) {
        postById.set(p.id, {
          title:
            p.title && p.title.trim() !== "" ? p.title : "Untitled post",
          url: p.external_url,
          platform: p.platform,
          postedDate: p.posted_date,
        });
      }
    }

    const { data: profileRows } = await owner.supabase
      .from("creator_business_profiles")
      .select("creator_name")
      .eq("user_id", owner.userId)
      .limit(1);
    const creatorName =
      (profileRows?.[0] as { creator_name: string } | undefined)
        ?.creator_name ?? null;

    const payment = computeDealPayment(deal as unknown as DealLike, new Date());
    const invoiceNumber = `UV-${(
      deal.invoice_sent_date ?? deal.created_at.slice(0, 10)
    ).replaceAll("-", "")}-${deal.id.slice(0, 6).toUpperCase()}`;

    const snapshot = {
      invoiceNumber,
      brandName: deal.brand_name,
      brandPlatform: deal.platform,
      creatorName,
      invoiceDate: deal.invoice_sent_date,
      terms: deal.payment_terms,
      dueDate: payment.dueDate,
      dueDateCalculated: payment.dueDateCalculated,
      stage: deal.stage,
      deliverablesText: deal.deliverables,
      items: items.map((i) => ({
        deliverableId: i.id,
        title: i.title,
        status: i.status,
        dueDate: i.due_date,
        revisions: i.revisions,
        post: i.post_id ? (postById.get(i.post_id) ?? null) : null,
      })),
      amountCents: deal.compensation_cents,
      receivedCents: payment.receivedCents,
      receivedDate: deal.payment_received_date,
      balanceDueCents: payment.fullyPaid
        ? 0
        : (payment.remainingCents ?? deal.compensation_cents),
      fullyPaid: payment.fullyPaid,
    };

    const { count } = await owner.supabase
      .from("invoice_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("deal_id", deal.id)
      .eq("user_id", owner.userId);
    const version = (count ?? 0) + 1;

    const { data, error } = await owner.supabase
      .from("invoice_snapshots")
      .insert({
        user_id: owner.userId,
        deal_id: deal.id,
        version,
        invoice_number: invoiceNumber,
        snapshot,
      })
      .select("id, version, invoice_number, issued_at, snapshot")
      .single();
    if (error) throw error;

    return Response.json({ success: true, snapshot: data }, { status: 201 });
  } catch (e) {
    console.error("Invoice issue error:", e);
    return Response.json(
      { error: "The invoice could not be issued. Please try again." },
      { status: 500 }
    );
  }
}
