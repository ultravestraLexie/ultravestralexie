import { requireSubscription } from "@/lib/gate";
import CreatorMarketHome from "./CreatorMarketHome";

export const dynamic = "force-dynamic";

/* THE CREATOR'S OPPORTUNITIES HOME — the v2 prototype's creator side
 * (owner order 2026-11-24): Discover (business opportunities),
 * opportunity detail + apply, My collabs, and the gig Profile as
 * tabs over the device-local v2 store ("uv-market.v2"). Behind an
 * entry card on /me, the Creator Economy sub-route pattern. Sample
 * data only — nothing is written to the database.
 *
 * Route renamed 2026-11-24 (owner: "Remove marketplace — name
 * UltraVestra"): this page used to live at /me/marketplace; that
 * path now redirects here. */
export default async function OpportunitiesPage() {
  await requireSubscription("/me/opportunities");
  return <CreatorMarketHome />;
}
