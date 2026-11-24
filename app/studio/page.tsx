import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/galaxy/server";
import StudioClient from "./StudioClient";
import DnaLink from "./DnaLink";

export const dynamic = "force-dynamic";

/* STUDIO — the Human Emotion Video Lab. The instant checks run
 * in the browser (lib/galaxy/analyze, the prototype's rules);
 * the full read is the existing Buyer Brain V3 pipeline behind
 * /api/creator-lab, called — never modified. Every check is
 * saved to script_analyses so the lab has a history. */
export default async function StudioPage() {
  await requireSubscription("/studio");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchProfile(supabase, user.id);
  const { data } = await supabase
    .from("script_analyses")
    .select("id, product, script, passed, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const recent = ((data ?? []) as {
    id: string;
    product: string;
    script: string;
    passed: number;
    total: number;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    product: r.product,
    firstLine: (r.script.split(/(?<=[.!?])\s/)[0] ?? r.script).slice(0, 80),
    passed: r.passed,
    total: r.total,
    date: String(r.created_at).slice(0, 10),
  }));

  return (
    <>
      <StudioClient defaultAudience={profile.audience} recent={recent} />
      <DnaLink />
    </>
  );
}
