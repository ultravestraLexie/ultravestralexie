import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Reputation Passport — owner-only CRUD over public.passport_entries.
// Same gate pattern as the other member API routes (see
// app/api/suggest/route.ts and lib/gate.ts): no session → 401, no
// active/trialing subscription → 403, enforced here AND by the
// middleware via lib/gate-paths.ts. All queries run through the
// session client (lib/supabase/server), so RLS applies as the
// signed-in user; every query is additionally scoped to the caller's
// own user_id in code, the way app/saved/page.tsx scopes its reads.
//
// INTEGRITY RULE (binding): verification_status is exactly
// 'platform_verified' or 'self_reported'. Entries a creator creates
// here are ALWAYS 'self_reported' — the create schema below does not
// accept a verification_status field at all, and the insert sets the
// value explicitly in code. There is deliberately NO code path in
// this route that creates or upgrades an entry to
// 'platform_verified'; that status exists for future platform-backed
// records only (written, if ever, outside this route). The table's
// RLS insert policy enforces the same rule at the database layer
// (see passport-table.sql).
//
// No model/AI calls. No rate limiter: the shared limiter in
// lib/rate-limit.ts is frozen and untouched; authenticated,
// subscription-gated CRUD is the v1 scope.

const SECTIONS = [
  "collaborations",
  "portfolio",
  "performance",
  "testimonials",
  "credentials",
] as const;

type Section = (typeof SECTIONS)[number];

// Per-section payload shapes. All values are creator-entered text;
// bounds mirror the Creator Lab request schema's discipline (every
// field length-capped, required fields non-empty).
const CollaborationPayload = z.object({
  brandName: z.string().min(1).max(200),
  campaignDescription: z.string().min(1).max(1000),
  dateRange: z.string().min(1).max(120),
  deliverables: z.string().min(1).max(1000),
});

const PortfolioPayload = z.object({
  title: z.string().min(1).max(200),
  link: z.string().url().max(500),
  platform: z.string().min(1).max(100),
  notes: z.string().max(1000).default(""),
});

const PerformancePayload = z.object({
  metricLabel: z.string().min(1).max(200),
  value: z.string().min(1).max(100),
  period: z.string().min(1).max(120),
  platform: z.string().min(1).max(100),
});

const TestimonialPayload = z.object({
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(200),
  authorRole: z.string().min(1).max(200),
});

const CredentialPayload = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
});

// A discriminated union on `section`, so a payload can only ever be
// stored under the section whose shape it matches. Note there is no
// verification_status field anywhere in this schema — a client
// cannot supply one, and unknown fields are stripped by zod.
const CreateSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("collaborations"), payload: CollaborationPayload }),
  z.object({ section: z.literal("portfolio"), payload: PortfolioPayload }),
  z.object({ section: z.literal("performance"), payload: PerformancePayload }),
  z.object({ section: z.literal("testimonials"), payload: TestimonialPayload }),
  z.object({ section: z.literal("credentials"), payload: CredentialPayload }),
]);

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

type PassportEntryRow = {
  id: string;
  section: Section;
  payload: Record<string, string>;
  verification_status: "platform_verified" | "self_reported";
  created_at: string;
};

const ENTRY_COLUMNS = "id, section, payload, verification_status, created_at";

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
              ? "Please log in to use your Reputation Passport."
              : "An active subscription is required to use your Reputation Passport.",
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
        { error: "Please log in to use your Reputation Passport." },
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
    .from("passport_entries")
    .select(ENTRY_COLUMNS)
    .eq("user_id", owner.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Passport list error:", error);
    return Response.json(
      { error: "Your passport entries could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    entries: (data ?? []) as PassportEntryRow[],
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
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  const { data, error } = await owner.supabase
    .from("passport_entries")
    .insert({
      user_id: owner.userId,
      section: parsed.data.section,
      payload: parsed.data.payload,
      // Always self-reported. See the integrity rule at the top of
      // this file — nothing in this route may set any other value.
      verification_status: "self_reported",
    })
    .select(ENTRY_COLUMNS)
    .single();

  if (error) {
    console.error("Passport create error:", error);
    return Response.json(
      { error: "Your entry could not be saved. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, entry: data as PassportEntryRow },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = DeleteSchema.safeParse({ id: searchParams.get("id") });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your entry details." },
      { status: 400 }
    );
  }

  // Scoped to the caller's own rows in code as well as by RLS: an id
  // belonging to anyone else simply matches nothing.
  const { data, error } = await owner.supabase
    .from("passport_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", owner.userId)
    .select("id");

  if (error) {
    console.error("Passport delete error:", error);
    return Response.json(
      { error: "Your entry could not be deleted. Please try again." },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
