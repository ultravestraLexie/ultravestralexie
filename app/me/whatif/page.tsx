import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import WhatIfClient from "./WhatIfClient";

export const dynamic = "force-dynamic";

/* VESTRA WHAT IF — one of the Creator Economy frames the owner
 * ordered into Me (2026-11-24). The prototype's decision simulator,
 * ported exactly (lib/galaxy/economy holds its math, pinned by
 * fixtures derived from the prototype's own code). Inputs and saved
 * comparisons are the creator's own entries, kept on this device;
 * the prototype's disclaimer stands verbatim at the foot. */
export default async function WhatIfPage() {
  await requireSubscription("/me/whatif");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <WhatIfClient />;
}
