import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import {
  fetchDeals,
  fetchDirectory,
  fetchIncome,
  fetchPosts,
  fetchProfile,
  fetchSavedBrandIds,
  fetchScriptCount,
} from "@/lib/galaxy/server";
import { buildGrowthEngine } from "@/lib/galaxy/engine";
import { daysAgo, neglectedOpportunities } from "@/lib/galaxy/core";
import { ENG_CSS } from "@/lib/engine-css";
import { FEED_CSS } from "@/lib/feed-css";
import BrainClient, { type BrainLogRow } from "@/components/BrainClient";

export const dynamic = "force-dynamic";

/* BRAIN (rebuild Phase 1) — the Command Center. The proactive
 * panel is THE VESTRA ADVANTAGE: the specialist agents' next
 * moves, each with its evidence and its action, computed from the
 * creator's own records by the Growth Engine. The command box
 * routes natural requests to real destinations and writes every
 * routed command to the action log. Nothing here is decorative:
 * every card leads to the work itself. */
export default async function BrainPage() {
  await requireSubscription("/brain");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, posts, savedIds, scriptCount, income, logRows] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
    fetchPosts(supabase, user.id),
    fetchSavedBrandIds(supabase, user.id),
    fetchScriptCount(supabase, user.id),
    fetchIncome(supabase, user.id),
    supabase
      .from("brain_actions")
      .select("action, detail, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const brands = await fetchDirectory(supabase, savedIds);
  const now = new Date();
  const publishedDates = posts.filter((p) => p.state === "published").map((p) => p.date);
  const postsThisWeek = publishedDates.filter((d) => {
    const a = daysAgo(d, now);
    return a >= 0 && a <= 6;
  }).length;
  const engine = buildGrowthEngine({
    deals,
    income,
    publishedPosts: publishedDates.length,
    postsThisWeek,
    scriptCount,
    savedCount: savedIds.size,
    directoryCount: brands.length,
    neglectedCount: neglectedOpportunities(deals, brands).length,
    now,
  });
  void profile;

  const log: BrainLogRow[] = ((logRows.data ?? []) as { action: string; detail: string; created_at: string }[]).map(
    (r) => ({
      action: r.action,
      detail: r.detail,
      when: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  );

  return (
    <div className="eng fd">
      <style>{ENG_CSS}</style>
      <style>{FEED_CSS}</style>
      <div className="wrap">
        <div className="label">Vestra Intelligence</div>
        <h2 className="eng-title">VESTRA BRAIN</h2>
        <p className="sub">
          One intelligence over your whole business. Ask it for the next move, or take the ones
          it already found — every recommendation carries its reason, and every action is logged.
        </p>

        <BrainClient log={log} />

        <div className="brain" style={{ marginTop: 22 }}>
          <div className="label">The Vestra Advantage · Your next moves</div>
          {engine.brain.map((r) => (
            <div className="rec" key={r.title}>
              <span className="tag">{r.agent}</span>
              <div className="grow">
                <div className="t">{r.title}</div>
                <div className="w">{r.why}</div>
              </div>
              <Link href={r.href}>{r.cta}</Link>
            </div>
          ))}
        </div>

        <div className="grid">
          {engine.stages.map((s) => (
            <Link className="stage" href={s.href} key={s.id}>
              <div className="n">{s.name}</div>
              <div className="metric">{s.metric}</div>
              <div className="detail">{s.detail}</div>
              <span className="go">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
