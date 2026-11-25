import Link from "next/link";
import { requireBusinessAccount } from "@/lib/business-guard";
import { createClient } from "@/lib/supabase/server";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS, FEED2_CSS } from "@/lib/feed-css";

export const dynamic = "force-dynamic";

/* BUSINESS CREATORS (rebuild Phase 4) — the business's real
 * roster: creators whose applications it accepted, with the
 * deal each acceptance created — stage, pay and deliverables
 * read from public.creator_deals, the same record the creator
 * works from. Pending applicants are counted and one tap away.
 * (Replaces the Phase-1 on-device sample preview.) */
export default async function BusinessCreatorsPage() {
  await requireBusinessAccount("/business/creators");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: listingRows } = await supabase
    .from("market_listings")
    .select("id, title")
    .eq("business_user_id", user.id);
  const listings = (listingRows ?? []) as { id: string; title: string }[];
  const titleById = new Map(listings.map((l) => [l.id, l.title]));
  const ids = listings.map((l) => l.id);

  const { data: appRows } = ids.length
    ? await supabase
        .from("market_applications")
        .select("id, listing_id, creator_user_id, status, deal_id, created_at")
        .in("listing_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };
  const apps = (appRows ?? []) as {
    listing_id: string;
    creator_user_id: string;
    status: string;
    deal_id: string | null;
  }[];
  const accepted = apps.filter((a) => a.status === "accepted");
  const pending = apps.filter((a) => a.status === "applied").length;

  const dealIds = accepted.map((a) => a.deal_id).filter((x): x is string => !!x);
  const { data: dealRows } = dealIds.length
    ? await supabase
        .from("creator_deals")
        .select("id, stage, compensation_cents, deliverables")
        .in("id", dealIds)
    : { data: [] };
  const deals = new Map<string, { stage: string; compensation_cents: number | null; deliverables: string }>();
  for (const d of (dealRows ?? []) as { id: string; stage: string; compensation_cents: number | null; deliverables: string }[]) {
    deals.set(d.id, d);
  }

  const creatorIds = [...new Set(accepted.map((a) => a.creator_user_id))];
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

  const fmt = (c: number | null) =>
    c === null ? "—" : `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c % 100 ? 2 : 0 })}`;

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <style>{FEED2_CSS}</style>
      <div className="wrap">
        <div className="label">Business workspace</div>
        <h2 className="eng-title">Creators</h2>
        <p className="sub">
          Your roster — every creator you have accepted through the marketplace, and the deal
          you are running with each of them.
        </p>
        {pending > 0 ? (
          <p className="sub">
            {pending} application{pending === 1 ? "" : "s"} waiting for your decision —{" "}
            <Link className="cta" href="/business/listings">
              review them →
            </Link>
          </p>
        ) : null}
        {accepted.length === 0 ? (
          <div className="empty">
            No creators on your roster yet. When you accept an application, the creator and
            their deal appear here.
          </div>
        ) : (
          accepted.map((a, i) => {
            const d = a.deal_id ? deals.get(a.deal_id) : undefined;
            return (
              <article className="post" key={`${a.listing_id}-${a.creator_user_id}-${i}`}>
                <div className="p-head">
                  <span>
                    <Link className="aname p-name" href={`/creator/${a.creator_user_id}`}>
                      {names.get(a.creator_user_id) ?? "UltraVestra creator"}
                    </Link>
                    <br />
                    <span className="p-meta">{titleById.get(a.listing_id) ?? "Opportunity"}</span>
                  </span>
                  <span className="kind">{d?.stage ?? "contracted"}</span>
                </div>
                <div className="p-cap">
                  {fmt(d?.compensation_cents ?? null)}
                  {d?.deliverables ? ` · ${d.deliverables}` : ""}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
