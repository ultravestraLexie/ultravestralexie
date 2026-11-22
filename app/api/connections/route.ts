import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

export const runtime = "nodejs";

// Social Connections — owner-only management of the caller's
// public.social_connections rows (one per platform).
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code. The
// caller's id comes from the session — never from the request.
//
// STATUS RULE (binding): a connection's status is its real state.
// Phase 1 has no OAuth and no platform approval, so the only
// statuses this route can produce are 'not_connected' and
// 'link_only' (the creator saved a profile link — that syncs
// nothing and the UI says so). The write schema has NO status
// field: a client that sends status='connected' has it ignored,
// because nothing the client does can make a connection real.
// 'pending_approval' and 'connected' are system-set in a later
// phase when the platforms' approvals and OAuth exist.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const PLATFORMS = ["tiktok", "instagram", "facebook", "trybe"] as const;

const UpsertSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().max(100).default(""),
  profileUrl: z.string().max(1000).default(""),
});

const PlatformSchema = z.object({
  platform: z.enum(PLATFORMS),
});

type ConnectionRow = {
  platform: string;
  handle: string | null;
  profile_url: string | null;
  status: string;
};

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to manage your connections."
              : "An active subscription is required to manage your connections.",
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
        { error: "Please log in to manage your connections." },
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
    .from("social_connections")
    .select("platform, handle, profile_url, status")
    .eq("user_id", owner.userId);

  if (error) {
    console.error("Connections load error:", error);
    return Response.json(
      { error: "Your connections could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const byPlatform = new Map(
    ((data ?? []) as ConnectionRow[]).map((row) => [row.platform, row])
  );

  // All four platforms, always — a platform with no row is in its
  // true default state: not connected, nothing saved.
  const connections = PLATFORMS.map((platform) => {
    const row = byPlatform.get(platform);
    return {
      platform,
      handle: row?.handle ?? null,
      profileUrl: row?.profile_url ?? null,
      status: row?.status ?? "not_connected",
    };
  });

  return Response.json({ success: true, connections });
}

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your connection details." },
      { status: 400 }
    );
  }

  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your connection details." },
      { status: 400 }
    );
  }

  const handle = parsed.data.handle.trim();
  const profileUrl = parsed.data.profileUrl.trim();
  if (handle === "" && profileUrl === "") {
    return Response.json(
      { error: "Add a handle or a profile link first." },
      { status: 400 }
    );
  }
  if (profileUrl !== "" && !/^https?:\/\//i.test(profileUrl)) {
    return Response.json(
      { error: "Please check your connection details." },
      { status: 400 }
    );
  }

  // Saving a link is the ONLY client-writable state, and it is
  // exactly what it says: link_only. If a row somehow already
  // carries a system-set status (pending_approval / connected from
  // a later phase), a link edit must not downgrade it — so an
  // existing system status is preserved.
  const { data: existing } = await owner.supabase
    .from("social_connections")
    .select("status")
    .eq("user_id", owner.userId)
    .eq("platform", parsed.data.platform)
    .maybeSingle();

  const existingStatus = (existing as { status: string } | null)?.status;
  const status =
    existingStatus === "connected" || existingStatus === "pending_approval"
      ? existingStatus
      : "link_only";

  const { data, error } = await owner.supabase
    .from("social_connections")
    .upsert(
      {
        user_id: owner.userId,
        platform: parsed.data.platform,
        handle: handle === "" ? null : handle,
        profile_url: profileUrl === "" ? null : profileUrl,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    )
    .select("platform, handle, profile_url, status")
    .single();

  if (error) {
    console.error("Connections save error:", error);
    return Response.json(
      { error: "Your connection could not be saved. Please try again." },
      { status: 500 }
    );
  }

  const row = data as ConnectionRow;
  return Response.json({
    success: true,
    connection: {
      platform: row.platform,
      handle: row.handle,
      profileUrl: row.profile_url,
      status: row.status,
    },
  });
}

export async function DELETE(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { searchParams } = new URL(request.url);
  const parsed = PlatformSchema.safeParse({
    platform: searchParams.get("platform"),
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your connection details." },
      { status: 400 }
    );
  }

  // Reset to the true default state: no handle, no link, not
  // connected. A platform with no row is already in that state, so
  // a missing row is a success, not an error. OAuth fields from a
  // later phase are cleared too — a reset means reset.
  const { error } = await owner.supabase
    .from("social_connections")
    .update({
      handle: null,
      profile_url: null,
      status: "not_connected",
      platform_account_id: null,
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      scopes: null,
      connected_at: null,
      last_sync_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", owner.userId)
    .eq("platform", parsed.data.platform);

  if (error) {
    console.error("Connections reset error:", error);
    return Response.json(
      { error: "Your connection could not be removed. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
