import { requireBusinessAccount } from "@/lib/business-guard";
import CampaignsClient from "./CampaignsClient";

export const dynamic = "force-dynamic";

/* BUSINESS CAMPAIGNS — campaigns list, the opportunity builder and
 * campaign detail with applicant actions (owner order 2026-11-24).
 * Self-guarded like /business/home (brand/agency accounts only).
 * The tool itself is an on-device preview running on labeled sample
 * data in the local store — nothing is posted to real creators. */
export default async function BusinessCampaignsPage() {
  await requireBusinessAccount("/business/campaigns");
  return <CampaignsClient />;
}
