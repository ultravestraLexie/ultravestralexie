import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { rowToProtection, type ProtectionRowLike } from "@/lib/galaxy/core";

export const runtime = "nodejs";

// Brand Deal Protection (System #2) — owner-only read/write over
// public.deal_protection, one record per deal: the contract review
// checklist plus the creator's evidence of agreed terms.
//
// ISOLATION (binding, same as /api/deals): session client (RLS
// own-row policies apply), every query scoped to the caller's
// user_id in code, and a write is accepted only for a deal the
// caller owns — the protection record can never be attached to
// another creator's deal. The caller's id comes from the session,
// never from the request.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers /api/deals).

const PROTECTION_COLUMNS =
  "deal_id, contract_reviewed, deliverables_agreed, payment_terms_agreed, usage_rights_set, exclusivity_checked, usage_rights_note, exclusivity_note, terms_note";

const GetSchema = z.object({
  dealId: z.string().uuid(),
});

const PutSchema = z.object({
  dealId: z.string().uuid(),
  contractReviewed: z.boolean(),
  deliverablesAgreed: z.boolean(),
  paymentTermsAgreed: z.boolean(),
  usageRightsSet: z.boolean(),
  exclusivityChecked: z.boolean(),
  usageRightsNote: z.string().trim().max(2000).default(""),
  exclusivityNote: z.string().trim().max(2000).default(""),
  termsNote: z.string().trim().max(2000).default(""),
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
              ? "Please log in to use Deal Protection."
              : "An active subscription is required to use Deal Protection.",
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
        { error: "Please log in to use Deal Protection." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A protection record may only exist for the caller's own deal.
 *  Returns an error response, or null when the deal is theirs. */
async function validateDealOwnership(
  supabase: Supabase,
  userId: string,
  dealId: string
): Promise<Response | null> {
  const { data, error } = await supabase
    .from("creator_deals")
    .select("id")
    .eq("id", dealId)
    .eq("user_id", userId);
  if (error) throw error;
  if (!data || data.length === 0) {
    return Response.json({ error: "Deal not found." }, { status: 404 });
  }
  return null;
}

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
    const dealError = await validateDealOwnership(
      owner.supabase,
      owner.userId,
      parsed.data.dealId
    );
    if (dealError) return dealError;

    const { data, error } = await owner.supabase
      .from("deal_protection")
      .select(PROTECTION_COLUMNS)
      .eq("deal_id", parsed.data.dealId)
      .eq("user_id", owner.userId)
      .maybeSingle();
    if (error) throw error;

    return Response.json({
      success: true,
      protection: data ? rowToProtection(data as ProtectionRowLike) : null,
    });
  } catch (e) {
    console.error("Deal protection load error:", e);
    return Response.json(
      { error: "The protection record could not be loaded. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check the protection details." },
      { status: 400 }
    );
  }

  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the protection details." },
      { status: 400 }
    );
  }

  try {
    const dealError = await validateDealOwnership(
      owner.supabase,
      owner.userId,
      parsed.data.dealId
    );
    if (dealError) return dealError;

    const { data, error } = await owner.supabase
      .from("deal_protection")
      .upsert(
        {
          deal_id: parsed.data.dealId,
          user_id: owner.userId,
          contract_reviewed: parsed.data.contractReviewed,
          deliverables_agreed: parsed.data.deliverablesAgreed,
          payment_terms_agreed: parsed.data.paymentTermsAgreed,
          usage_rights_set: parsed.data.usageRightsSet,
          exclusivity_checked: parsed.data.exclusivityChecked,
          usage_rights_note: parsed.data.usageRightsNote,
          exclusivity_note: parsed.data.exclusivityNote,
          terms_note: parsed.data.termsNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "deal_id" }
      )
      .select(PROTECTION_COLUMNS)
      .single();
    if (error) throw error;

    return Response.json({
      success: true,
      protection: rowToProtection(data as ProtectionRowLike),
    });
  } catch (e) {
    console.error("Deal protection save error:", e);
    return Response.json(
      { error: "The protection record could not be saved. Please try again." },
      { status: 500 }
    );
  }
}
