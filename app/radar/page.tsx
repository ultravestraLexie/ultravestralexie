import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/* BRAND OPPORTUNITY RADAR — four live lanes over the researched database:
 * brands accepting creators now, brands worth pitching, the newest
 * researched brands (emerging), and quiet high-value programs that are
 * not widely advertised. Everything is computed from sourced records —
 * a lane only shows what the research actually supports. */

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

interface Row {
  brand: Brand;
  score: number | null;
  rate: number | null;
  appUrl: string | null;
  uncapped: boolean;
  low: boolean;
}

export default async function RadarPage() {
  await requireSubscription("/radar");
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("*").eq("status", "published");
  const list = (brands ?? []) as Brand[];
  const { data: { user } } = await supabase.auth.getUser();

  let accepting: Row[] = [];
  let pitching: Row[] = [];
  let emerging: Row[] = [];
  let quiet: Row[] = [];

  if (list.length) {
    const [{ data: scores }, { data: affiliates }, { data: opps }] = await Promise.all([
      supabase.from("brand_scores").select("brand_id, total_score, scored_at").order("scored_at", { ascending: false }),
      supabase.from("affiliate_programs").select("brand_id, commission_rate, commission_notes, application_url"),
      supabase.from("opportunities").select("brand_id, status, application_url"),
    ]);
    const scoreMap = new Map<string, number>();
    for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, Number(s.total_score));
    const affMap = new Map<string, { rate: number | null; notes: string | null; appUrl: string | null }>();
    for (const a of affiliates ?? []) {
      if (!affMap.has(a.brand_id as string)) {
        affMap.set(a.brand_id as string, {
          rate: a.commission_rate != null ? Number(a.commission_rate) : null,
          notes: (a.commission_notes as string) ?? null,
          appUrl: (a.application_url as string) ?? null,
        });
      }
    }
    const openMap = new Map<string, string>();
    for (const o of opps ?? []) {
      if (o.status === "open" && o.application_url && !openMap.has(o.brand_id as string)) openMap.set(o.brand_id as string, o.application_url as string);
    }
    const rows: Row[] = list.map((brand) => {
      const aff = affMap.get(brand.id);
      const notes = aff?.notes ?? "";
      return {
        brand,
        /* No score row = not yet scored (null), never a fake 0. */
        score: scoreMap.get(brand.id) ?? null,
        rate: aff?.rate ?? null,
        appUrl: aff?.appUrl ?? openMap.get(brand.id) ?? null,
        uncapped: notes.includes("cap: UNCAPPED"),
        low: notes.includes("Creator saturation: low"),
      };
    });
    /* Unscored (null) sorts below every real score; the score-gated
     * lanes (70+ / 60+) only admit brands that actually have a score. */
    const byScore = (a: Row, b: Row) => (b.score ?? -1) - (a.score ?? -1);
    accepting = rows.filter((r) => r.appUrl).sort(byScore).slice(0, 18);
    pitching = rows.filter((r) => !r.appUrl && r.score != null && r.score >= 70).sort(byScore).slice(0, 18);
    emerging = [...rows].sort((a, b) => (b.brand.created_at ?? "").localeCompare(a.brand.created_at ?? "")).slice(0, 12);
    quiet = rows.filter((r) => !r.appUrl && (r.uncapped || r.low) && r.score != null && r.score >= 60).sort(byScore).slice(0, 18);
  }

  const line = (r: Row, extra?: React.ReactNode) => (
    <p key={r.brand.id} style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 15.5 }}>
      <Link href={`/brands/${r.brand.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{r.brand.name}</Link>
      {r.score != null
        ? <span style={scoreChip}>Score {Math.round(r.score)}</span>
        : <span style={{ background: "#26262e", color: "#d4d4d8", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Not yet scored</span>}
      {r.rate != null && <span style={{ color: "#4ade80", fontWeight: 700 }}>Pays {r.rate}%</span>}
      {r.uncapped && <span style={{ background: "#052e16", color: "#4ade80", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>UNCAPPED ✓</span>}
      {r.low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Smaller-creator friendly</span>}
      {extra}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>BRAND OPPORTUNITY RADAR</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>See the opportunity before everyone else</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 640, fontSize: 16 }}>
          Four live lanes over the researched database: brands taking creators now, brands worth pitching,
          the newest brands researched, and quiet programs that are not widely advertised.
        </p>
      </section>

      {!list.length && (
        <section style={panel}>
          <h2 style={h2style}>{user ? "Radar is warming up" : "Log in to see the radar"}</h2>
          <p style={sub}>Opportunity intelligence is protected for members. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> to see all four lanes.</p>
        </section>
      )}

      {list.length > 0 && (
        <>
          <section style={panel}>
            <h2 style={h2style}>📡 Accepting creators now</h2>
            <p style={sub}>A live application route is on record for each of these. Ranked by Opportunity Score.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accepting.map((r) => line(r, <a href={r.appUrl as string} target="_blank" rel="noreferrer" style={{ color: "#67e8f9", fontWeight: 700 }}>Apply →</a>))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🎯 Worth pitching</h2>
            <p style={sub}>Score 70+ with no advertised campaign. Most creators never ask — a good pitch is the whole edge. Ask UltraVestra writes it.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pitching.map((r) => line(r, <Link href={`/ask?q=${encodeURIComponent(r.brand.name)}`} style={{ color: "#f0abfc", fontWeight: 700 }}>Get the pitch →</Link>))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🌱 Emerging — newest on the radar</h2>
            <p style={sub}>The most recently researched brands in the directory. New programs are where the early creators get in before a niche crowds.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emerging.map((r) => line(r))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🔕 Under the radar</h2>
            <p style={sub}>Verified uncapped or smaller-creator friendly, scoring 60+, with no open campaign found. Not widely advertised — that is the point.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {quiet.length ? quiet.map((r) => line(r, <Link href={`/ask?q=${encodeURIComponent(r.brand.name)}`} style={{ color: "#f0abfc", fontWeight: 700 }}>Get the pitch →</Link>)) : <p style={sub}>Nothing qualifies right now.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
