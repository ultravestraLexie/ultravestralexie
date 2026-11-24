import { requireBusinessAccount } from "@/lib/business-guard";
import CreatorsClient from "./CreatorsClient";

export const dynamic = "force-dynamic";

/* BUSINESS CREATORS — the creator directory with Invite (owner
 * order 2026-11-24). Self-guarded like /business/home. An on-device
 * preview over the labeled sample creators in the local store —
 * invites create invited collabs in that store only; no real
 * creator is contacted. */
export default async function BusinessCreatorsPage() {
  await requireBusinessAccount("/business/creators");
  return <CreatorsClient />;
}
