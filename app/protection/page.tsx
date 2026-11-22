import { redirect } from "next/navigation";

// The Partnership Protection Center was removed by owner decision
// on 2026-11-22. This stub keeps the old URL from erroring: it
// sends visitors home. The feature's code and table were removed
// in the same change.
export default function ProtectionRemovedPage() {
  redirect("/");
}
