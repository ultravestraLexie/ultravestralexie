import { requireSubscription } from "@/lib/gate";
import CreatorMarketHome from "./CreatorMarketHome";

export const dynamic = "force-dynamic";

/* THE CREATOR'S MARKETPLACE HOME — the v2 prototype's creator side
 * (owner order 2026-11-24): Discover (business opportunities),
 * opportunity detail + apply, My collabs, and the gig Profile as
 * tabs over the device-local v2 store ("uv-market.v2"). Behind an
 * entry card on /me, the Creator Economy sub-route pattern. Sample
 * data only — nothing is written to the database. */
export default async function MarketProfilePage() {
  await requireSubscription("/me/marketplace");
  return <CreatorMarketHome />;
}
