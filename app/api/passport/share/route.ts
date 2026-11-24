import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Passport share link — the owner's control over their public
// passport (/p/[slug]). The slug + public flag live on
// public.profiles (passport_slug, passport_public). The public
// page reads through flag-gated RLS policies: nothing is visible
// publicly unless the owner turns this on.
//
// The slug is generated once, from the creator's name plus a
// short suffix from their user id, and never changes afterwards
// — a shared link must not rot. Turning public off keeps the
// slug; the flag alone controls visibility.

const PatchSchema = z
  .object({
    public: z.boolean().optional(),
    shareHistory: z.boolean().optional(),
  })
  .refine((v) => v.public !== undefined || v.shareHistory !== undefined, {
    message: "Nothing to update",
  });

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "creator";
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
              ? "Please log in to manage your Passport."
              : "An active subscription is required to manage your Passport.",
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
        { error: "Please log in to manage your Passport." },
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
    .from("profiles")
    .select("passport_slug, passport_public, passport_share_history")
    .eq("id", owner.userId)
    .maybeSingle();
  if (error) {
    console.error("Passport share load error:", error);
    return Response.json(
      { error: "Your share settings could not be loaded. Please try again." },
      { status: 500 }
    );
  }
  const row = data as {
    passport_slug: string | null;
    passport_public: boolean;
    passport_share_history: boolean;
  } | null;
  return Response.json({
    success: true,
    slug: row?.passport_slug ?? null,
    public: row?.passport_public ?? false,
    shareHistory: row?.passport_share_history ?? false,
  });
}

export async function PATCH(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please check your share settings." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check your share settings." }, { status: 400 });
  }

  const { data: current } = await owner.supabase
    .from("profiles")
    .select("passport_slug, passport_public, passport_share_history")
    .eq("id", owner.userId)
    .maybeSingle();
  const currentRow = current as {
    passport_slug: string | null;
    passport_public: boolean;
    passport_share_history: boolean;
  } | null;
  let slug = currentRow?.passport_slug ?? null;
  const nextPublic = parsed.data.public ?? currentRow?.passport_public ?? false;
  const nextShareHistory =
    parsed.data.shareHistory ?? currentRow?.passport_share_history ?? false;

  if (!slug && nextPublic) {
    const { data: bp } = await owner.supabase
      .from("creator_business_profiles")
      .select("creator_name")
      .eq("user_id", owner.userId)
      .maybeSingle();
    const name =
      ((bp as { creator_name: string | null } | null)?.creator_name ?? "").trim() ||
      "creator";
    slug = `${slugify(name)}-${owner.userId.replace(/-/g, "").slice(0, 6)}`;
  }

  const { data, error } = await owner.supabase
    .from("profiles")
    .update({
      passport_slug: slug,
      passport_public: nextPublic,
      passport_share_history: nextShareHistory,
      updated_at: new Date().toISOString(),
    })
    .eq("id", owner.userId)
    .select("passport_slug, passport_public, passport_share_history");

  if (error) {
    console.error("Passport share save error:", error);
    return Response.json(
      { error: "Your share settings could not be saved. Please try again." },
      { status: 500 }
    );
  }
  const row = (data ?? [])[0] as
    | {
        passport_slug: string | null;
        passport_public: boolean;
        passport_share_history: boolean;
      }
    | undefined;
  return Response.json({
    success: true,
    slug: row?.passport_slug ?? slug,
    public: row?.passport_public ?? nextPublic,
    shareHistory: row?.passport_share_history ?? nextShareHistory,
  });
}
