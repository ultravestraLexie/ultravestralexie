import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/* COMMISSION INTELLIGENCE CENTER — every researched commission program,
 * separated by what its limit actually is: verified UNCAPPED, a stated
 * cap, or a limit no published source states. Rates are only ever the
 * published ones; terms snippets are quoted from the brand's own
 * researched evidence, never invented. */

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

type CapKind = "uncapped" | "capped" | "unknown";
interface Row {
  brand: Brand;
  score: number;
  rate: number | null;
  network: string | null;
  cap: CapKind;
  low: boolean;
  high: boolean;
  terms: string | null;
}

function capOf(notes: string | null): CapKind {
  if (!notes) return "unknown";
  if (notes.includes("cap: UNCAPPED")) return "uncapped";
  if (notes.includes("cap: capped")) return "capped";
  return "unknown";
}

const TERM_WORDS = /cookie|payout|paid|payment|recurring|monthly|net[- ]?\d|days?\b/i;

export default async function CommissionsPage() {
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("*").eq("status", "published");
  const list = (brands ?? []) as Brand[];
  const { data: { user } } = await supabase.auth.getUser();

  let uncapped: Row[] = [];
  let capped: Row[] = [];
  let unknown: Row[] = [];
  let topRates: Row[] = [];

  if (list.length) {
    const [{ data: scores }, { data: affiliates }] = await Promise.all([
      supabase.from("brand_scores").select("brand_id, total_score, scored_at").order("scored_at", { ascending: false }),
      supabase.from("affiliate_programs").select("brand_id, network, commission_rate, commission_notes"),
    ]);
    const scoreMap = new Map<string, number>();
    for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, Number(s.total_score));
    const affMap = new Map<string, { network: string | null; rate: number | null; notes: string | null }>();
    for (const a of affiliates ?? []) {
      if (!affMap.has(a.brand_id as string)) {
        affMap.set(a.brand_id as string, {
          network: (a.network as string) ?? null,
          rate: a.commission_rate != null ? Number(a.commission_rate) : null,
          notes: (a.commission_notes as string) ?? null,
        });
      }
    }
    const rows: Row[] = [];
    for (const brand of list) {
      const aff = affMap.get(brand.id);
      if (!aff) continue;
      rows.push({
        brand,
        score: scoreMap.get(brand.id) ?? 0,
        rate: aff.rate,
        network: aff.network,
        cap: capOf(aff.notes),
        low: Boolean(aff.notes?.includes("Creator saturation: low")),
        high: Boolean(aff.notes?.includes("Creator saturation: high")),
        terms: null,
      });
    }
    const byScore = (a: Row, b: Row) => b.score - a.score;
    uncapped = rows.filter((r) => r.cap === "uncapped").sort(byScore);
    capped = rows.filter((r) => r.cap === "capped").sort(byScore);
    unknown = rows.filter((r) => r.cap === "unknown").sort(byScore);
    topRates = rows.filter((r) => r.rate != null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.score - a.score).slice(0, 10);

    // Terms on record: first evidence line per shown brand that actually
    // talks about cookie windows, payouts, payment or recurring terms.
    const shown = new Map<string, Row>();
    for (const r of [...uncapped.slice(0, 15), ...capped.slice(0, 15), ...topRates]) shown.set(r.brand.id, r);
    if (shown.size) {
      const { data: evidence } = await supabase
        .from("brand_evidence")
        .select("brand_id, evidence_summary")
        .in("brand_id", [...shown.keys()]);
      for (const e of evidence ?? []) {
        const row = shown.get(e.brand_id as string);
        const summary = (e.evidence_summary as string) ?? "";
        if (row && !row.terms && TERM_WORDS.test(summary)) row.terms = summary;
      }
    }
    uncapped = uncapped.slice(0, 15);
    capped = capped.slice(0, 15);
    unknown = unknown.slice(0, 15);
  }

  const rowLine = (r: Row, showTerms = false) => (
    <div key={r.brand.id} style={{ borderBottom: "1px solid rgba(168,85,247,0.18)", paddingBottom: 10 }}>
      <p style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 15.5 }}>
        <Link href={`/brands/${r.brand.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{r.brand.name}</Link>
        <span style={scoreChip}>Score {Math.round(r.score)}</span>
        {r.rate != null
          ? <span style={{ color: "#4ade80", fontWeight: 700 }}>Pays {r.rate}%</span>
          : <span style={{ color: "#ddd0ff" }}>Rate not published</span>}
        {r.network && <span style={{ color: "#67e8f9" }}>via {r.network}</span>}
        {r.low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Smaller-creator friendly</span>}
        {r.high && <span style={{ background: "#3b0764", color: "#f0abfc", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Crowded — 1,000+ creators</span>}
      </p>
      {showTerms && r.terms && (
        <p style={{ margin: "4px 0 0", color: "#ddd0ff", fontSize: 13.5 }}>Terms on record: {r.terms}</p>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#4ade80", border: "1px solid #22c55e", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>COMMISSION INTELLIGENCE CENTER</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Know the limit before you create</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 640, fontSize: 16 }}>
          Every researched program, separated by what its commission limit actually is — verified uncapped,
          a stated cap, or a limit no published source states. A rate is only shown when the brand publishes it.
        </p>
      </section>

      {!list.length && (
        <section style={panel}>
          <h2 style={h2style}>{user ? "No commission data loaded" : "Log in to see commission intelligence"}</h2>
          <p style={sub}>Commission intelligence is protected for members. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> to compare caps, rates and terms.</p>
        </section>
      )}

      {list.length > 0 && (
        <>
          <section style={panel}>
            <h2 style={h2style}>🏆 Highest published rates</h2>
            <p style={sub}>The top published commission rates in the directory, with the terms on record for each. A high rate with a hidden cap can pay less than a lower uncapped one — check the limit below.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topRates.map((r) => rowLine(r, true))}
            </div>
          </section>

          <section style={{ ...panel, borderColor: "#22c55e" }}>
            <h2 style={h2style}>✅ Uncapped commissions — verified ({uncapped.length} shown)</h2>
            <p style={sub}>The program terms themselves state there is no earnings cap. Verified from the brand&apos;s own published terms — never guessed from a percentage.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {uncapped.length ? uncapped.map((r) => rowLine(r, true)) : <p style={sub}>None verified yet.</p>}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🔒 Capped commissions — stated in the terms ({capped.length} shown)</h2>
            <p style={sub}>These programs publish a ceiling on what a creator can earn. The cap itself is on each brand&apos;s profile, in its sourced evidence.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {capped.length ? capped.map((r) => rowLine(r)) : <p style={sub}>No program in the directory currently publishes a stated earnings cap. When one does, it lands here — not in the uncapped list.</p>}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>❔ Unknown commission limits ({unknown.length} shown)</h2>
            <p style={sub}>A published rate is not proof of no cap. These programs publish a rate but no limit statement — treat the ceiling as unknown until the brand confirms it, and ask before you build a series around one.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {unknown.map((r) => rowLine(r))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
