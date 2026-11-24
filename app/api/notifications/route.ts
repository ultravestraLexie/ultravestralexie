import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  rowToNotificationPrefs,
  type NotificationPrefsRowLike,
} from "@/lib/galaxy/core";

export const runtime = "nodejs";

// Notification choices (trust queue #6) — the creator's alert
// preferences and alert dismissals over public.notification_prefs
// and public.notification_dismissals. The alerts themselves are
// derived from deal rows by core.buildAlerts and shown on Today;
// this route only reads/writes the creator's own choices.
//
// Alerts are IN-APP ONLY — there is no verified sending domain
// yet, so nothing here sends or promises email.
//
// ISOLATION (binding, same as /api/support): session client (RLS
// own-row policies apply) and every query scoped to the caller's
// user_id in code. The caller's id comes from the session, never
// from the request.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts covers
// /api/notifications).

const PostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("dismiss"),
    key: z.string().trim().min(1).max(200),
  }),
  z.object({
    action: z.literal("prefs"),
    overdue: z.boolean(),
    dueSoon: z.boolean(),
    quietDeals: z.boolean(),
  }),
]);

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to manage your alerts."
              : "An active subscription is required to manage your alerts.",
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
        { error: "Please log in to manage your alerts." },
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
    const [prefsRes, dismissRes] = await Promise.all([
      owner.supabase
        .from("notification_prefs")
        .select("overdue, due_soon, quiet_deals")
        .eq("user_id", owner.userId)
        .maybeSingle(),
      owner.supabase
        .from("notification_dismissals")
        .select("alert_key")
        .eq("user_id", owner.userId),
    ]);
    if (prefsRes.error) throw prefsRes.error;
    if (dismissRes.error) throw dismissRes.error;

    return Response.json({
      success: true,
      prefs: rowToNotificationPrefs(
        prefsRes.data as NotificationPrefsRowLike | null
      ),
      dismissedKeys: (
        (dismissRes.data ?? []) as { alert_key: string }[]
      ).map((r) => r.alert_key),
    });
  } catch (e) {
    console.error("Notification state load error:", e);
    return Response.json(
      { error: "Your alert settings could not be loaded. Please try again." },
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
      { error: "Please check the alert settings." },
      { status: 400 }
    );
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check the alert settings." },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === "dismiss") {
      // Idempotent: dismissing an already-dismissed alert is a
      // no-op, never an error the creator has to read.
      const { error } = await owner.supabase
        .from("notification_dismissals")
        .upsert(
          { user_id: owner.userId, alert_key: parsed.data.key },
          { onConflict: "user_id,alert_key", ignoreDuplicates: true }
        );
      if (error) throw error;
      return Response.json({ success: true, dismissed: parsed.data.key });
    }

    const { data, error } = await owner.supabase
      .from("notification_prefs")
      .upsert(
        {
          user_id: owner.userId,
          overdue: parsed.data.overdue,
          due_soon: parsed.data.dueSoon,
          quiet_deals: parsed.data.quietDeals,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("overdue, due_soon, quiet_deals")
      .single();
    if (error) throw error;

    return Response.json({
      success: true,
      prefs: rowToNotificationPrefs(data as NotificationPrefsRowLike),
    });
  } catch (e) {
    console.error("Notification save error:", e);
    return Response.json(
      { error: "Your alert settings could not be saved. Please try again." },
      { status: 500 }
    );
  }
}
