import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import {
  buildExport,
  moneyLedger,
  todayKey,
  type ExportRow,
} from "@/lib/galaxy/core";
import { fetchDeals, fetchExpenses } from "@/lib/galaxy/server";
import { SUBSCRIBED_STATUSES } from "@/lib/gate-paths";

export const runtime = "nodejs";

// Data export (trust queue #2) — "Creators must be able to
// retrieve their business records." One JSON file with ONLY the
// signed-in creator's own records: profile, deals (+ protection +
// stage history), the separated money ledger plus raw expense /
// revenue rows, audience numbers, saved brands, support tickets
// and the subscription row.
//
// ISOLATION (binding, same as /api/audience and /api/support):
// session client (RLS own-row policies apply) and every query
// scoped to the caller's user_id in code. The caller's id comes
// from the session, never from the request. buildExport also
// strips any secret-looking key, so no credential column can ride
// along. Gate pattern identical to the other member API routes:
// 401 / 403 here AND via the middleware (lib/gate-paths.ts covers
// /api/export).

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to download your data."
              : "An active subscription is required to download your data.",
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
        { error: "Please log in to download your data." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

type Client = Awaited<ReturnType<typeof createClient>>;

/** All of the caller's rows from one table, paginated so nothing
 *  truncates at 1,000. Throws on error — an export that silently
 *  drops a section would misstate what we hold. */
async function ownRows(
  supabase: Client,
  table: string,
  userId: string,
  orderColumn = "id"
): Promise<ExportRow[]> {
  const { data, error } = await fetchAllPages((from, to) =>
    supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order(orderColumn, { ascending: true })
      .range(from, to)
  );
  if (error) throw error;
  return (data ?? []) as ExportRow[];
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;
  const { supabase, userId } = owner;

  try {
    const [
      profileRes,
      creatorProfileRes,
      deals,
      dealProtection,
      dealStageHistory,
      expensesRaw,
      revenueEntries,
      audienceSnapshots,
      savedBrands,
      supportTickets,
      subRes,
      galaxyDeals,
      galaxyExpenses,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      ownRows(supabase, "creator_deals", userId),
      ownRows(supabase, "deal_protection", userId),
      ownRows(supabase, "deal_stage_history", userId),
      ownRows(supabase, "creator_expenses", userId),
      ownRows(supabase, "revenue_entries", userId),
      ownRows(supabase, "audience_snapshots", userId),
      ownRows(supabase, "saved_brands", userId, "brand_id"),
      ownRows(supabase, "support_tickets", userId),
      supabase
        .from("subscriptions")
        .select(
          "id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      fetchDeals(supabase, userId),
      fetchExpenses(supabase, userId),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (creatorProfileRes.error) throw creatorProfileRes.error;
    if (subRes.error) throw subRes.error;

    /* The row Settings shows: the live subscription when there is
     * one, otherwise the most recent — the creator's own record
     * either way. */
    const subRows = (subRes.data ?? []) as ExportRow[];
    const subscription =
      subRows.find((r) =>
        (SUBSCRIBED_STATUSES as readonly string[]).includes(
          String(r.status ?? "")
        )
      ) ??
      subRows[0] ??
      null;

    const payload = buildExport({
      exportedAt: new Date().toISOString(),
      profile: (profileRes.data as ExportRow | null) ?? null,
      creatorProfile: (creatorProfileRes.data as ExportRow | null) ?? null,
      deals,
      dealProtection,
      dealStageHistory,
      expenses: expensesRaw,
      revenueEntries,
      ledger: moneyLedger(galaxyDeals, galaxyExpenses),
      audienceSnapshots,
      savedBrands,
      supportTickets,
      subscription,
    });

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ultravestra-export-${todayKey()}.json"`,
      },
    });
  } catch (e) {
    console.error("Data export error:", e);
    return Response.json(
      { error: "Your export could not be prepared. Please try again." },
      { status: 500 }
    );
  }
}
