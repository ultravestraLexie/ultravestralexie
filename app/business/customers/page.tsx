import { requireBusinessAccount } from "@/lib/business-guard";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";

export const dynamic = "force-dynamic";

/* BUSINESS CREATOR PAYMENTS (rebuild Phase 4) — this route was
 * the sample "Customers" preview; a business's real money-out
 * records on UltraVestra are its creator deals, so this page is
 * now the honest ledger of them: what the business committed,
 * what is invoiced, and what creators have marked received —
 * read from the same creator_deals rows the creators work from.
 * (Replaces the Phase-1 on-device sample preview.) */
export default async function BusinessCustomersPage() {
  await requireBusinessAccount("/business/customers");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: listingRows } = await supabase
    .from("market_listings")
    .select("id")
    .eq("business_user_id", user.id);
  const ids = ((listingRows ?? []) as { id: string }[]).map((l) => l.id);

  const { data: appRows } = ids.length
    ? await supabase
        .from("market_applications")
        .select("creator_user_id, deal_id")
        .in("listing_id", ids)
        .eq("status", "accepted")
    : { data: [] };
  const apps = (appRows ?? []) as { creator_user_id: string; deal_id: string | null }[];
  const dealIds = apps.map((a) => a.deal_id).filter((x): x is string => !!x);
  const creatorByDeal = new Map<string, string>();
  for (const a of apps) if (a.deal_id) creatorByDeal.set(a.deal_id, a.creator_user_id);

  const { data: dealRows } = dealIds.length
    ? await supabase
        .from("creator_deals")
        .select("id, stage, compensation_cents, amount_received_cents, deliverables, created_at")
        .in("id", dealIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const deals = (dealRows ?? []) as {
    id: string;
    stage: string;
    compensation_cents: number | null;
    amount_received_cents: number | null;
    deliverables: string;
  }[];

  const creatorIds = [...new Set(apps.map((a) => a.creator_user_id))];
  const { data: nameRows } = creatorIds.length
    ? await supabase
        .from("creator_business_profiles")
        .select("user_id, creator_name")
        .in("user_id", creatorIds)
    : { data: [] };
  const names = new Map<string, string>();
  for (const r of (nameRows ?? []) as { user_id: string; creator_name: string | null }[]) {
    if (r.creator_name) names.set(r.user_id, r.creator_name);
  }

  const fmt = (c: number) =>
    `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c % 100 ? 2 : 0 })}`;
  const committed = deals
    .filter((d) => d.stage !== "lost")
    .reduce((s, d) => s + (d.compensation_cents ?? 0), 0);
  const invoiced = deals
    .filter((d) => d.stage === "invoiced" || d.stage === "paid")
    .reduce((s, d) => s + (d.compensation_cents ?? 0), 0);
  const received = deals.reduce((s, d) => s + (d.amount_received_cents ?? 0), 0);

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Business workspace</div>
        <h2 className="eng-title">Creator payments</h2>
        <p className="sub">
          The money side of your marketplace deals — committed, invoiced, and received by your
          creators. Stages and received amounts update as each creator works their deal in
          Deals; UltraVestra records the deal, payment itself moves between you and the
          creator.
        </p>
        <div className="kpis">
          <div className="kpi">
            <div className="v">{fmt(committed)}</div>
            <div className="k">Committed</div>
          </div>
          <div className="kpi">
            <div className="v">{fmt(invoiced)}</div>
            <div className="k">Invoiced</div>
          </div>
          <div className="kpi">
            <div className="v">{fmt(received)}</div>
            <div className="k">Marked received</div>
          </div>
        </div>
        {deals.length === 0 ? (
          <div className="empty">
            No creator deals yet. Accept an application and its deal — and its money — appears
            here.
          </div>
        ) : (
          deals.map((d) => (
            <article className="post" key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span>
                <span className="p-name">
                  {names.get(creatorByDeal.get(d.id) ?? "") ?? "UltraVestra creator"}
                </span>
                <br />
                <span className="p-meta">
                  {d.stage} · {fmt(d.compensation_cents ?? 0)}
                  {d.amount_received_cents ? ` · ${fmt(d.amount_received_cents)} received` : ""}
                  {d.deliverables ? ` · ${d.deliverables}` : ""}
                </span>
              </span>
              <span className="kind">{d.stage}</span>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
