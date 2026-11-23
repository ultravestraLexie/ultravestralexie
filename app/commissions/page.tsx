import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/* COMMISSION INTELLIGENCE CENTER — the commission system, exact.
 * Three buckets, by what the published evidence actually states:
 *   CAPPED   — a published maximum earnings limit and its conditions.
 *   UNCAPPED — evidence that no maximum total earnings ceiling applies.
 *   UNKNOWN  — the available evidence does not state the cap.
 * CRITICAL RULE: if no published cap can be found, the program goes
 * into Unknown — never Uncapped by assumption.
 * Every result shows only what is published: rate and its type, cap
 * and conditions, attribution window, payout conditions, the official
 * source link, the date last checked, and the verification status.
 * Anything not published is labeled "Not published" — never invented. */

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
  score: number | null;
  rate: number | null;
  network: string | null;
  cap: CapKind;
  low: boolean;
  high: boolean;
  checkedAt: string | null;
  cookieDays: string | null;
  payout: string | null;
  flat: boolean;
  recurring: boolean;
  sourceUrl: string | null;
  verification: string | null;
}

function capOf(notes: string | null): CapKind {
  if (!notes) return "unknown";
  if (notes.includes("cap: UNCAPPED")) return "uncapped";
  if (notes.includes("cap: capped")) return "capped";
  return "unknown";
}

const CONF_RANK: Record<string, number> = { verified: 3, publicly_reported: 2, needs_review: 1 };

export default async function CommissionsPage() {
  await requireSubscription("/commissions");
  const supabase = await createClient();
  const { data: brands } = await supabase.from("brands").select("*").eq("status", "published");
  const list = (brands ?? []) as Brand[];
  const { data: { user } } = await supabase.auth.getUser();

  let uncapped: Row[] = [];
  let capped: Row[] = [];
  let unknown: Row[] = [];
  let topRates: Row[] = [];
  let counts = { uncapped: 0, capped: 0, unknown: 0 };

  if (list.length) {
    const [{ data: scores }, { data: affiliates }] = await Promise.all([
      supabase.from("brand_scores").select("brand_id, total_score, scored_at").order("scored_at", { ascending: false }),
      supabase.from("affiliate_programs").select("brand_id, network, commission_rate, commission_notes, last_checked_at"),
    ]);
    const scoreMap = new Map<string, number>();
    for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, Number(s.total_score));
    const affMap = new Map<string, { network: string | null; rate: number | null; notes: string | null; checkedAt: string | null }>();
    for (const a of affiliates ?? []) {
      if (!affMap.has(a.brand_id as string)) {
        affMap.set(a.brand_id as string, {
          network: (a.network as string) ?? null,
          rate: a.commission_rate != null ? Number(a.commission_rate) : null,
          notes: (a.commission_notes as string) ?? null,
          checkedAt: (a.last_checked_at as string) ?? null,
        });
      }
    }
    const rows: Row[] = [];
    for (const brand of list) {
      const aff = affMap.get(brand.id);
      if (!aff) continue;
      rows.push({
        brand,
        /* No score row = not yet scored (null), never a fake 0. */
        score: scoreMap.get(brand.id) ?? null,
        rate: aff.rate,
        network: aff.network,
        cap: capOf(aff.notes),
        low: Boolean(aff.notes?.includes("Creator saturation: low")),
        high: Boolean(aff.notes?.includes("Creator saturation: high")),
        checkedAt: aff.checkedAt,
        cookieDays: null, payout: null, flat: false, recurring: false,
        sourceUrl: null, verification: null,
      });
    }
    counts = {
      uncapped: rows.filter((r) => r.cap === "uncapped").length,
      capped: rows.filter((r) => r.cap === "capped").length,
      unknown: rows.filter((r) => r.cap === "unknown").length,
    };
    /* Unscored (null) sorts below every real score. */
    const byScore = (a: Row, b: Row) => (b.score ?? -1) - (a.score ?? -1);
    uncapped = rows.filter((r) => r.cap === "uncapped").sort(byScore);
    capped = rows.filter((r) => r.cap === "capped").sort(byScore);
    unknown = rows.filter((r) => r.cap === "unknown").sort(byScore);
    topRates = rows.filter((r) => r.rate != null).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || (b.score ?? -1) - (a.score ?? -1)).slice(0, 10);

    // Published detail, extracted from the brand's own researched
    // evidence: attribution window, payout conditions, flat/recurring
    // terms, the official source, and the strongest verification status.
    const shown = new Map<string, Row>();
    for (const r of [...uncapped.slice(0, 15), ...capped.slice(0, 15), ...unknown.slice(0, 15), ...topRates]) shown.set(r.brand.id, r);
    if (shown.size) {
      const { data: evidence } = await supabase
        .from("brand_evidence")
        .select("brand_id, evidence_summary, source_url, confidence")
        .in("brand_id", [...shown.keys()]);
      for (const e of evidence ?? []) {
        const row = shown.get(e.brand_id as string);
        if (!row) continue;
        const summary = (e.evidence_summary as string) ?? "";
        if (!row.sourceUrl && e.source_url) row.sourceUrl = e.source_url as string;
        const conf = (e.confidence as string) ?? "";
        if (conf && (!row.verification || (CONF_RANK[conf] ?? 0) > (CONF_RANK[row.verification] ?? 0))) row.verification = conf;
        if (!row.cookieDays) {
          const m = summary.match(/(\d{1,3})[- ]day (?:cookie|attribution|referral)/i);
          if (m) row.cookieDays = m[1];
        }
        if (!row.payout && /payout|paid (?:out|monthly|via)|monthly payouts|minimum (?:payout|threshold)|payment threshold/i.test(summary)) {
          const sentence = summary.split(/(?<=[.!])\s+/).find((s) => /payout|paid|payment|threshold/i.test(s));
          if (sentence) row.payout = sentence.trim();
        }
        if (/flat (?:\$|fee|bounty|payment|commission)/i.test(summary) || /\$\d+ per (?:approved|sale|piece|video)/i.test(summary)) row.flat = true;
        if (/recurring/i.test(summary)) row.recurring = true;
      }
    }
    uncapped = uncapped.slice(0, 15);
    capped = capped.slice(0, 15);
    unknown = unknown.slice(0, 15);
  }

  const detailLine = (r: Row) => (
    <p style={{ margin: "4px 0 0", color: "#ddd0ff", fontSize: 13.5 }}>
      {r.cookieDays ? `Attribution window: ${r.cookieDays} days (as published)` : "Attribution window: not published"}
      {r.payout ? ` · Payout: ${r.payout}` : " · Payout conditions: not published"}
    </p>
  );

  const rowLine = (r: Row, showDetail = false) => (
    <div key={r.brand.id} style={{ borderBottom: "1px solid rgba(168,85,247,0.18)", paddingBottom: 10 }}>
      <p style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 15.5 }}>
        <Link href={`/brands/${r.brand.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{r.brand.name}</Link>
        {r.score != null
          ? <span style={scoreChip}>Score {Math.round(r.score)}</span>
          : <span style={{ background: "#26262e", color: "#d4d4d8", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Not yet scored</span>}
        {r.rate != null
          ? <span style={{ color: "#4ade80", fontWeight: 700 }}>Pays {r.rate}% · percentage-based{r.recurring ? " · recurring published" : ""}</span>
          : r.flat
            ? <span style={{ color: "#4ade80", fontWeight: 700 }}>Flat payment published — see terms</span>
            : <span style={{ color: "#ddd0ff" }}>Rate not published</span>}
        {r.network && <span style={{ color: "#67e8f9" }}>Platform: {r.network}</span>}
        {r.low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Smaller-creator friendly</span>}
        {r.high && <span style={{ background: "#3b0764", color: "#f0abfc", borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>Crowded — 1,000+ creators</span>}
      </p>
      {showDetail && detailLine(r)}
      {showDetail && (
        <p style={{ margin: "2px 0 0", color: "#b3a6e0", fontSize: 13 }}>
          {r.sourceUrl ? <>Source: <a href={r.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>official program source ↗</a></> : "Source: on the brand profile"}
          {r.checkedAt ? ` · Last checked ${r.checkedAt.slice(0, 10)}` : ""}
          {r.verification ? ` · Verification: ${r.verification.replace("_", " ")}` : ""}
          {" · "}<Link href={`/brands/${r.brand.id}`} style={{ color: "#f0abfc" }}>Full evidence →</Link>
        </p>
      )}
    </div>
  );

  const bucketCard = (kind: CapKind, symbol: string, title: string, def: string, bg: string, fg: string) => (
    <div style={{ border: `1px solid ${fg}`, background: bg, borderRadius: 18, padding: "18px 20px", flex: "1 1 220px" }}>
      <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 17 }}>{title}</p>
      <p style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 900, color: fg }}>{symbol}</p>
      <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14 }}>{def}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#4ade80", border: "1px solid #22c55e", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>COMMISSION INTELLIGENCE CENTER</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>The commission system, exact</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 660, fontSize: 16 }}>
          Every researched program, separated by what its published evidence actually states — with the rate,
          the cap, the attribution window, the payout conditions, the source, and the date last checked.
        </p>
      </section>

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {bucketCard("capped", "CAP", "Capped", "Published maximum earnings limit and conditions.", "rgba(69,10,10,0.55)", "#f87171")}
        {bucketCard("uncapped", "∞", "Uncapped", "Evidence that no maximum total earnings ceiling applies.", "rgba(5,46,22,0.55)", "#4ade80")}
        {bucketCard("unknown", "?", "Unknown", "The available evidence does not state the cap.", "rgba(38,38,46,0.55)", "#d4d4d8")}
      </section>

      <p style={{ margin: 0, fontSize: 15.5, border: "1px solid #e879f9", borderRadius: 14, padding: "12px 18px", background: "rgba(59,7,100,0.4)" }}>
        <strong>Critical rule:</strong> if we cannot find a published cap, the program goes into <strong>Unknown</strong> — never Uncapped by assumption.
      </p>

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
            <p style={sub}>The top published commission rates in the directory, with the full published detail for each. A high rate with a hidden cap can pay less than a lower uncapped one — check the limit below.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topRates.map((r) => rowLine(r, true))}
            </div>
          </section>

          <section style={{ ...panel, borderColor: "#22c55e" }}>
            <h2 style={h2style}>∞ Uncapped — evidence of no ceiling ({counts.uncapped} total, top {uncapped.length} shown)</h2>
            <p style={sub}>The program&apos;s own published terms state there is no maximum total earnings ceiling. Verified from the brand&apos;s own terms — never guessed from a percentage.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {uncapped.length ? uncapped.map((r) => rowLine(r, true)) : <p style={sub}>None verified yet.</p>}
            </div>
          </section>

          <section style={{ ...panel, borderColor: "#f87171" }}>
            <h2 style={h2style}>CAP Capped — published maximum limit ({counts.capped} total, top {capped.length} shown)</h2>
            <p style={sub}>These programs publish a maximum earnings limit and its conditions. The cap itself is quoted in each brand&apos;s sourced evidence.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {capped.length ? capped.map((r) => rowLine(r, true)) : <p style={sub}>No program in the directory currently publishes a stated earnings cap. When one does, it lands here — not in the uncapped list.</p>}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>? Unknown — evidence does not state the cap ({counts.unknown} total, top {unknown.length} shown)</h2>
            <p style={sub}>A published rate is not proof of no cap. Until the brand publishes a limit statement, the ceiling stays unknown — ask before you build a series around one.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {unknown.map((r) => rowLine(r, true))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
