import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/* Renamed 2026-11-24 (owner: "Remove marketplace — name
 * UltraVestra"): the creator opportunities home now lives at
 * /me/opportunities. This stub keeps old links and installed-app
 * bookmarks working. */
export default function OldMarketplaceRedirect() {
  redirect("/me/opportunities");
}
