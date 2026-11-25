import Link from "next/link";
import { requireBusinessAccount } from "@/lib/business-guard";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";

export const dynamic = "force-dynamic";

/* BUSINESS CAMPAIGNS (rebuild Phase 4) — the business's real
 * campaigns: every marketplace listing is a campaign, and its
 * numbers come from the same records the decisions happen on —
 * applications received, creators accepted, and the deal value
 * committed. Managing a campaign (posting, deciding, closing)
 * happens on Listings; this page is the honest scoreboard.
 * (Replaces the Phase-1 on-device sample preview.) */
export default async function BusinessCampaignsPage() {
  await requireBusinessAccount("/business/campaigns");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: listingRows } = await supabase
    .from("market_listings")
    .select("id, title, category, compensation_cents, status, created_at")
    .eq("business_user_id", user.id)
    .order("created_at", { ascending: false });
  const listings = (listingRows ?? []) as {
    id: string;
    title: string;
    category: string;
    compensation_cents: number | null;
    status: string;
  }[];
  const ids = listings.map((l) => l.id);

  const { data: appRows } = ids.length
    ? await supabase
        .from("market_applications")
        .select("id, listing_id, status, deal_id")
        .in("listing_id", ids)
    : { data: [] };
  const apps = (appRows ?? []) as { listing_id: string; status: string; deal_id: string | null }[];
  const dealIds = apps.map((a) => a.deal_id).filter((x): x is string => !!x);
  const { data: dealRows } = dealIds.length
    ? await supabase.from("creator_deals").select("id, compensation_cents").in("id", dealIds)
    : { data: [] };
  const dealPay = new Map<string, number>();
  for (const d of (dealRows ?? []) as { id: string; compensation_cents: number | null }[]) {
    dealPay.set(d.id, d.compensation_cents ?? 0);
  }

  const fmt = (c: number) =>
    `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c % 100 ? 2 : 0 })}`;
  const rows = listings.map((l) => {
    const mine = apps.filter((a) => a.listing_id === l.id);
    const accepted = mine.filter((a) => a.status === "accepted");
    const committed = accepted.reduce((s, a) => s + (a.deal_id ? dealPay.get(a.deal_id) ?? 0 : 0), 0);
    return { ...l, applied: mine.length, accepted: accepted.length, committed };
  });
  const totalCommitted = rows.reduce((s, r) => s + r.committed, 0);
  const totalAccepted = rows.reduce((s, r) => s + r.accepted, 0);

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Business workspace</div>
        <h2 className="eng-title">Campaigns</h2>
        <p className="sub">
          Every opportunity you post is a campaign. These numbers are the real ones — the same
          applications and deals your creators see.
        </p>
        <div className="kpis">
          <div className="kpi">
            <div className="v">{rows.length}</div>
            <div className="k">Campaigns</div>
          </div>
          <div className="kpi">
            <div className="v">{totalAccepted}</div>
            <div className="k">Creators working</div>
          </div>
          <div className="kpi">
            <div className="v">{fmt(totalCommitted)}</div>
            <div className="k">Deal value committed</div>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="empty">
            No campaigns yet. Post your first opportunity and it becomes a campaign here the
            moment it is live.
          </div>
        ) : (
          rows.map((r) => (
            <article className="post" key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span>
                <span className="p-name">{r.title}</span>
                <br />
                <span className="p-meta">
                  {r.category} · {r.status} · {r.applied} application{r.applied === 1 ? "" : "s"} ·{" "}
                  {r.accepted} accepted · {fmt(r.committed)} committed
                </span>
              </span>
              <Link className="cbtn" href="/business/listings">
                Manage →
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
