import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  buildDeadlines,
  computeProtectionSummary,
  todayInChicago,
  type AgreementStatus,
  type Exclusivity,
} from "@/lib/protection/deadlines";

export const runtime = "nodejs";

// Partnership Protection Center — owner-only CRUD over
// public.protection_agreements. Same gate pattern as the other
// member API routes (see app/api/revenue/route.ts and lib/gate.ts):
// no session → 401, no active/trialing subscription → 403, enforced
// here AND by the middleware via lib/gate-paths.ts. All queries run
// through the session client (lib/supabase/server), so RLS applies
// as the signed-in user; every query is additionally scoped to the
// caller's own user_id in code.
//
// WHAT THIS STORES: the terms of the creator's brand partnerships —
// deliverables owed, contract end, usage-rights expiration,
// exclusivity, payment terms — entered by the creator from their
// own agreements.
//
// HONESTY RULES (binding): every term is creator-reported;
// UltraVestra has not seen the signed documents and cannot verify
// them. Every countdown is computed deterministically in code from
// the stored dates (lib/protection/deadlines.ts) against today in
// America/Chicago. NO reminders are sent by this feature — there is
// no email or push anywhere in v1; the deadlines list returned here
// is the reminder surface, and nothing claims otherwise. The stored
// deliverables list is kept as a clean string array: it is the
// baseline the future Scope Creep Alert compares new requests
// against.
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated CRUD is the v1 scope (the Growth Map / Revenue
// precedent).

const STATUSES = ["active", "ended"] as const;
const EXCLUSIVITY_VALUES = ["none", "exclusive"] as const;

/** A real calendar date in 'YYYY-MM-DD' form — the regex pins the
 *  shape and the refine rejects impossibilities like 2026-02-30. */
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

/** An optional date field as the client sends it: '' (or absent)
 *  means "not recorded" and stores NULL; a non-empty value must
 *  itself be a real date — checked after the main parse, so the
 *  error stays the route's own 400. */
const OptionalDateString = z.string().max(10).default("");

const CreateSchema = z.object({
  brandName: z.string().min(1).max(200),
  deliverables: z
    .array(z.string().min(1).max(300))
    .max(50)
    .default([]),
  startDate: OptionalDateString,
  contractEndDate: OptionalDateString,
  usageRightsEnd: OptionalDateString,
  exclusivity: z.enum(EXCLUSIVITY_VALUES).default("none"),
  exclusivityEnd: OptionalDateString,
  paymentTerms: z.string().max(500).default(""),
  notes: z.string().max(1000).default(""),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES),
});

const IdSchema = z.object({
  id: z.string().uuid(),
});

type ProtectionAgreementRow = {
  id: string;
  brand_name: string;
  deliverables: string[];
  start_date: string | null;
  contract_end_date: string | null;
  usage_rights_end: string | null;
  exclusivity: Exclusivity;
  exclusivity_end: string | null;
  payment_terms: string;
  notes: string;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
};

const AGREEMENT_COLUMNS =
  "id, brand_name, deliverables, start_date, contract_end_date, usage_rights_end, exclusivity, exclusivity_end, payment_terms, notes, status, created_at, updated_at";

/** Gate + identity for every handler: 401 when signed out, 403 when
 *  not subscribed, otherwise the session client and the caller's id. */
async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to use your Protection Center."
              : "An active subscription is required to use your Protection Center.",
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
        { error: "Please log in to use your Protection Center." },
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
    .from("protection_agreements")
    .select(AGREEMENT_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Protection list error:", error);
    return Response.json(
      { error: "Your agreements could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const agreements = (data ?? []) as ProtectionAgreementRow[];
  const today = todayInChicago();

  return Response.json({
    success: true,
    agreements,
    // Computed here, from exactly these rows and today's date in
    // America/Chicago — the page renders what it is given and never
    // re-derives different numbers.
    deadlines: buildDeadlines(agreements, today),
    summary: computeProtectionSummary(agreements, today),
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
      { error: "Please check your agreement details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your agreement details." },
      { status: 400 }
    );
  }

  // Each optional date: '' → NULL, otherwise it must be a real date.
  const dateFields = {
    start_date: parsed.data.startDate.trim(),
    contract_end_date: parsed.data.contractEndDate.trim(),
    usage_rights_end: parsed.data.usageRightsEnd.trim(),
    exclusivity_end: parsed.data.exclusivityEnd.trim(),
  };
  for (const value of Object.values(dateFields)) {
    if (value !== "" && !DateString.safeParse(value).success) {
      return Response.json(
        { error: "Please check your agreement details." },
        { status: 400 }
      );
    }
  }
  const orNull = (value: string) => (value === "" ? null : value);

  const { data, error } = await owner.supabase
    .from("protection_agreements")
    .insert({
      user_id: owner.userId,
      brand_name: parsed.data.brandName,
      deliverables: parsed.data.deliverables,
      start_date: orNull(dateFields.start_date),
      contract_end_date: orNull(dateFields.contract_end_date),
      usage_rights_end: orNull(dateFields.usage_rights_end),
      exclusivity: parsed.data.exclusivity,
      exclusivity_end: orNull(dateFields.exclusivity_end),
      payment_terms: parsed.data.paymentTerms,
      notes: parsed.data.notes,
    })
    .select(AGREEMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Protection create error:", error);
    return Response.json(
      { error: "Your agreement could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, agreement: data as ProtectionAgreementRow },
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
      { error: "Please check your update details." },
      { status: 400 }
    );
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your update details." },
      { status: 400 }
    );
  }

  // Fetch the caller's own agreement first: an id belonging to
  // anyone else matches nothing — the same 404 as a missing
  // agreement. In v1 the only patch is the active ↔ ended flip.
  const { data: existing, error: fetchError } = await owner.supabase
    .from("protection_agreements")
    .select(AGREEMENT_COLUMNS)
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: "Agreement not found." }, { status: 404 });
  }

  const { data, error } = await owner.supabase
    .from("protection_agreements")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select(AGREEMENT_COLUMNS)
    .single();

  if (error) {
    console.error("Protection update error:", error);
    return Response.json(
      { error: "Your agreement could not be updated. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    agreement: data as ProtectionAgreementRow,
  });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = IdSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your agreement details." },
      { status: 400 }
    );
  }

  // Scoped to the caller's own rows in code as well as by RLS: an id
  // belonging to anyone else simply matches nothing.
  const { data, error } = await owner.supabase
    .from("protection_agreements")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Protection delete error:", error);
    return Response.json(
      { error: "Your agreement could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Agreement not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
