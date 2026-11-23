import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/* OPPORTUNITIES — every researched route in, in one place:
 * brands accepting applications now, and brands worth pitching even
 * without an advertised campaign. Status and sources live on profiles. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const h2style: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const scoreChip: React.CSSProperties = { background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 };
const notScoredChip: React.CSSProperties = { background: "#26262e", color: "#d4d4d8", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 };

/* A real score gets the numeric badge; no score row means the brand
 * has not been scored yet — say so, never render a fake "Score 0". */
const scoreBadge = (score: number | null) =>
  score != null
    ? <span style={scoreChip}>Score {Math.round(score)}</span>
    : <span style={notScoredChip}>Not yet scored</span>;

export default async function OpportunitiesPage() {
  await requireSubscription("/opportunities");
  const supabase = await createClient();
  const { data: brands } = await fetchAllPages((from, to) =>
    supabase.from("brands").select("*").eq("status", "published").order("id", { ascending: true }).range(from, to)
  );
  const list = (brands ?? []) as Brand[];
  const { data: { user } } = await supabase.auth.getUser();

  let openList: { brand: Brand; score: number | null; appUrl: string }[] = [];
  let pitchList: { brand: Brand; score: number | null; uncapped: boolean; low: boolean }[] = [];

  if (list.length) {
    const [{ data: scores }, { data: affiliates }, { data: opps }] = await Promise.all([
      fetchAllPages((from, to) => supabase.from("brand_scores").select("brand_id, total_score, scored_at").order("scored_at", { ascending: false }).order("brand_id", { ascending: true }).range(from, to)),
      fetchAllPages((from, to) => supabase.from("affiliate_programs").select("brand_id, commission_notes, application_url").order("id", { ascending: true }).range(from, to)),
      fetchAllPages((from, to) => supabase.from("opportunities").select("brand_id, status, application_url").order("id", { ascending: true }).range(from, to)),
    ]);
    const scoreMap = new Map<string, number>();
    for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, Number(s.total_score));
    const affMap = new Map<string, { notes: string | null; appUrl: string | null }>();
    for (const a of affiliates ?? []) if (!affMap.has(a.brand_id as string)) affMap.set(a.brand_id as string, { notes: (a.commission_notes as string) ?? null, appUrl: (a.application_url as string) ?? null });
    const openMap = new Map<string, string>();
    for (const o of opps ?? []) {
      if (o.status === "open" && o.application_url && !openMap.has(o.brand_id as string)) openMap.set(o.brand_id as string, o.application_url as string);
    }
    for (const brand of list) {
      const aff = affMap.get(brand.id);
      const appUrl = aff?.appUrl ?? openMap.get(brand.id) ?? null;
      /* Unscored is NOT zero: a brand with no brand_scores row keeps
       * score null and renders "Not yet scored" — never a fake 0. */
      const score = scoreMap.get(brand.id) ?? null;
      if (appUrl) openList.push({ brand, score, appUrl });
      else {
        const notes = aff?.notes ?? "";
        pitchList.push({ brand, score, uncapped: notes.includes("UNCAPPED"), low: notes.includes("Creator saturation: low") });
      }
    }
    /* Unscored (null) sorts last, below every real score. */
    const byScoreDesc = (a: { score: number | null }, b: { score: number | null }) =>
      (b.score ?? -1) - (a.score ?? -1);
    openList.sort(byScoreDesc);
    pitchList.sort(byScoreDesc);
    openList = openList.slice(0, 24);
    pitchList = pitchList.slice(0, 24);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>OPPORTUNITY FINDER</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Find your route in</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 620, fontSize: 16 }}>Brands accepting applications right now — and high-score brands worth pitching even when no campaign is advertised. Every entry links to its sourced profile.</p>
      </section>

      {!list.length && (
        <section style={panel}>
          <h2 style={h2style}>{user ? "No opportunities loaded" : "Log in to see opportunities"}</h2>
          <p style={sub}>Opportunity intelligence is protected for members. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> to see which brands are accepting applications and which are worth pitching.</p>
        </section>
      )}

      {list.length > 0 && (
        <>
          <section style={panel}>
            <h2 style={h2style}>✅ Accepting applications</h2>
            <p style={sub}>{openList.length} top brands with a live application route, ranked by Opportunity Score.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {openList.map(({ brand, score, appUrl }) => (
                <p key={brand.id} style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 15.5 }}>
                  <Link href={`/brands/${brand.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{brand.name}</Link>
                  {scoreBadge(score)}
                  <a href={appUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9", fontWeight: 700 }}>Apply →</a>
                </p>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🎯 Worth pitching — no open campaign</h2>
            <p style={sub}>No advertised campaign found, but researched and pitchable. Ask UltraVestra writes the pitch for these.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pitchList.map(({ brand, score, uncapped, low }) => (
                <p key={brand.id} style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 15.5 }}>
                  <Link href={`/brands/${brand.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{brand.name}</Link>
                  {scoreBadge(score)}
                  {uncapped && <span style={{ background: "#052e16", color: "#4ade80", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>UNCAPPED ✓</span>}
                  {low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Smaller-creator friendly</span>}
                  <Link href={`/ask?q=${encodeURIComponent(brand.name)}`} style={{ color: "#f0abfc", fontWeight: 700 }}>Get the pitch →</Link>
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
