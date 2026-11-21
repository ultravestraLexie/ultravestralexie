import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category } from "@/lib/types";
import { extractIntent, scoreBrand } from "@/lib/search";
import { webSearch } from "@/lib/websearch";
import SaveBrandButton from "@/components/SaveBrandButton";

export const dynamic = "force-dynamic";

/* DISCOVER — the UltraVestra universal search.
 * One search across two engines:
 *  A) the verified UltraVestra intelligence database (researched brands,
 *     commissions, campaigns, contacts — every fact sourced on its profile)
 *  B) the live public web (labeled clearly as unverified live results)
 * Results are separated, ranked, and explained. Nothing is invented:
 * unknown stays unknown. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const h2style: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const chip = (color: string): React.CSSProperties => ({
  border: `1px solid ${color}`, color, borderRadius: 999, padding: "2px 11px", fontWeight: 700, fontSize: 12.5,
});

const POPULAR: [string, string][] = [
  ["Beauty brands with uncapped commissions", "/discover?q=beauty+brands+with+uncapped+commissions"],
  ["Skincare programs for small creators", "/discover?q=skincare+affiliate+programs+accepting+small+creators"],
  ["Brands accepting applications", "/discover?q=brands+accepting+applications"],
  ["Pet brands worth pitching", "/discover?q=pet+brands+worth+pitching"],
  ["Highest published commissions", "/discover?q=brands+paying+at+least+20%25+commission"],
  ["TikTok Shop brands", "/discover?q=tiktok+shop+brands"],
  ["Travel eSIM & connectivity products", "/discover?q=esim+travel+connectivity+products"],
  ["Home gadgets & devices", "/discover?q=home+gadget+devices"],
  ["Supplement & protein brands", "/discover?q=supplement+protein+brands"],
  ["Creator hooks and video tips", "/academy"],
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; platform?: string; uncapped?: string; captype?: string; network?: string; small?: string; apply?: string }>;
}) {
  await requireSubscription("/discover");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const intent = extractIntent(q);
  const capType = sp.captype || (intent.uncapped || sp.uncapped === "1" ? "uncapped" : intent.capped ? "capped" : "");
  const wantSmall = intent.small || sp.small === "1";
  const minRate = intent.minRate;
  const catFilter = sp.cat ?? "";
  const platformSel = sp.platform || intent.platform;
  const networkSel = (sp.network || intent.network || "").toLowerCase();
  const applyOnly = sp.apply === "1";

  const supabaseCats = await createClient();
  const { data: catData } = await supabaseCats.from("categories").select("id, name, slug").order("name");
  const allCats = (catData ?? []) as Category[];

  interface Row {
    brand: Brand; score: number; network: string | null; rate: number | null; notes: string | null; checkedAt: string | null;
    appUrl: string | null; contactEmail: string | null; contactUrl: string | null; hasOpenOpp: boolean;
    uncapped: boolean; capped: boolean; low: boolean; cats: { slug: string; name: string }[]; relevance: number; reasons: string[];
  }
  let rows: Row[] = [];
  let loggedOut = false;
  const socialsMap = new Map<string, Set<string>>();

  if (q) {
    const supabase = await createClient();
    const { data: brands } = await supabase.from("brands").select("*").eq("status", "published");
    const list = (brands ?? []) as Brand[];
    if (!list.length) {
      const { data: { user } } = await supabase.auth.getUser();
      loggedOut = !user;
    }
    if (list.length) {
      const [{ data: scores }, { data: affiliates }, { data: contacts }, { data: opps }, { data: links }, { data: socials }] = await Promise.all([
        supabase.from("brand_scores").select("brand_id, total_score, scored_at").order("scored_at", { ascending: false }),
        supabase.from("affiliate_programs").select("brand_id, network, commission_rate, commission_notes, application_url, last_checked_at"),
        supabase.from("brand_contacts").select("brand_id, email, contact_url"),
        supabase.from("opportunities").select("brand_id, status, application_url"),
        supabase.from("brand_categories").select("brand_id, categories ( slug, name )"),
        supabase.from("brand_socials").select("brand_id, platform"),
      ]);
      const scoreMap = new Map<string, number>();
      for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, Number(s.total_score));
      const affMap = new Map<string, { network: string | null; rate: number | null; notes: string | null; appUrl: string | null; checkedAt: string | null }>();
      for (const a of affiliates ?? []) if (!affMap.has(a.brand_id as string)) affMap.set(a.brand_id as string, { network: (a.network as string) ?? null, rate: a.commission_rate != null ? Number(a.commission_rate) : null, notes: (a.commission_notes as string) ?? null, appUrl: (a.application_url as string) ?? null, checkedAt: (a.last_checked_at as string) ?? null });
      const contactMap = new Map<string, { email: string | null; url: string | null }>();
      for (const c of contacts ?? []) { const cur = contactMap.get(c.brand_id as string); if (!cur) contactMap.set(c.brand_id as string, { email: (c.email as string) ?? null, url: (c.contact_url as string) ?? null }); else { if (!cur.email && c.email) cur.email = c.email as string; if (!cur.url && c.contact_url) cur.url = c.contact_url as string; } }
      const openSet = new Set<string>(); const oppAppMap = new Map<string, string>();
      for (const o of opps ?? []) { if (o.status === "open") openSet.add(o.brand_id as string); if (o.application_url && !oppAppMap.has(o.brand_id as string)) oppAppMap.set(o.brand_id as string, o.application_url as string); }
      const catsMap = new Map<string, { slug: string; name: string }[]>();
      for (const l of links ?? []) {
        const row = l as unknown as { brand_id: string; categories: { slug: string; name: string } | null };
        if (!row.categories) continue;
        const arr = catsMap.get(row.brand_id) ?? [];
        arr.push({ slug: row.categories.slug, name: row.categories.name });
        catsMap.set(row.brand_id, arr);
      }
      for (const s of socials ?? []) {
        const set = socialsMap.get(s.brand_id as string) ?? new Set<string>();
        if (s.platform) set.add((s.platform as string).toLowerCase());
        socialsMap.set(s.brand_id as string, set);
      }
      rows = list.map((brand) => {
        const aff = affMap.get(brand.id);
        const notes = aff?.notes ?? null;
        const catsOf = catsMap.get(brand.id) ?? [];
        const { relevance, reasons } = scoreBrand(
          { name: brand.name, description: brand.description, categoryNames: catsOf.map((c) => c.name), categorySlugs: catsOf.map((c) => c.slug), network: aff?.network ?? null, country: brand.country },
          intent.tokens,
        );
        return {
          brand, score: scoreMap.get(brand.id) ?? 0, network: aff?.network ?? null, rate: aff?.rate ?? null, notes, checkedAt: aff?.checkedAt ?? null,
          appUrl: aff?.appUrl ?? oppAppMap.get(brand.id) ?? null,
          contactEmail: contactMap.get(brand.id)?.email ?? null, contactUrl: contactMap.get(brand.id)?.url ?? null,
          hasOpenOpp: openSet.has(brand.id),
          uncapped: Boolean(notes && notes.includes("UNCAPPED")), capped: Boolean(notes && notes.includes("cap: capped")), low: Boolean(notes && notes.includes("Creator saturation: low")),
          cats: catsOf, relevance, reasons,
        };
      });
    }
  }

  const passesCap = (r: Row) => capType === "uncapped" ? r.uncapped : capType === "capped" ? r.capped : capType === "unknown" ? (!r.uncapped && !r.capped) : true;
  const passes = (r: Row) => passesCap(r) && (!wantSmall || r.low) && (minRate == null || (r.rate != null && r.rate >= minRate));
  const matched = rows.filter((r) => r.relevance > 0);
  let pool = intent.tokens.length && matched.length >= 3 ? matched : rows;
  if (catFilter) pool = pool.filter((r) => r.cats.some((c) => c.slug === catFilter));
  if (networkSel) pool = pool.filter((r) => (r.network ?? "").toLowerCase().includes(networkSel));
  if (platformSel) {
    /* Platform was previously display-only here. Apply it the same
     * way /ask applies its category: restrict the pool only when at
     * least 3 pool brands genuinely carry the platform (published
     * socials for TikTok/YouTube/Instagram; the program route or the
     * researched description for Trybe), otherwise leave the pool
     * untouched so a search never empties out over a label. */
    const key = platformSel.toLowerCase();
    const inPlat = pool.filter((r) =>
      key === "trybe"
        ? (r.network ?? "").toLowerCase().includes("trybe") || (r.brand.description ?? "").toLowerCase().includes("trybe")
        : (socialsMap.get(r.brand.id)?.has(key) ?? false)
    );
    if (inPlat.length >= 3) pool = inPlat;
  }
  if (applyOnly) pool = pool.filter((r) => r.appUrl);
  const networkCounts = new Map<string, number>();
  for (const r of rows) if (r.network) networkCounts.set(r.network, (networkCounts.get(r.network) ?? 0) + 1);
  const networkOptions = [...networkCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([n]) => n);
  const ranked = [...pool].sort((a, b) => {
    const pa = passes(a) ? 1 : 0; const pb = passes(b) ? 1 : 0;
    if (pb !== pa) return pb - pa;
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return b.score - a.score;
  });
  const top = ranked.slice(0, 10);
  const applyList = ranked.filter((r) => r.appUrl).slice(0, 8);
  const pitchList = ranked.filter((r) => !r.hasOpenOpp && passes(r)).slice(0, 5);
  const contactList = ranked.filter((r) => r.contactEmail || r.contactUrl).slice(0, 8);

  const web = q ? await webSearch(`${q} affiliate program creator`, 8) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>DISCOVER</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Search the creator universe</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 620, fontSize: 16 }}>One search, two engines: the verified UltraVestra intelligence database, and the live public web. Database facts are researched and sourced. Web results are labeled and unverified.</p>
        <form method="get" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", marginTop: 20 }}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <input type="text" name="q" defaultValue={q} placeholder="Search brands, commissions, campaigns, creator tips…" style={{ width: 480, maxWidth: "88vw", padding: "14px 20px", borderRadius: 999, border: "1px solid #a855f7", background: "rgba(10,5,28,0.85)", fontSize: 16 }} />
            <button type="submit" className="neon-btn" style={{ padding: "14px 30px", borderRadius: 999, border: "none", background: "linear-gradient(92deg, #a855f7, #d946ef 55%, #22d3ee 130%)", color: "#fff", fontWeight: 800, fontSize: 16 }}>Search</button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", alignItems: "center", fontSize: 14.5 }}>
            <select name="cat" defaultValue={catFilter} style={{ padding: "9px 13px", borderRadius: 999 }}>
              <option value="">All niches</option>
              {allCats.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
            </select>
            <select name="platform" defaultValue={platformSel} style={{ padding: "9px 13px", borderRadius: 999 }}>
              <option value="">Any platform</option>
              <option value="Trybe">Trybe</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
            </select>
            <select name="captype" defaultValue={capType} style={{ padding: "9px 13px", borderRadius: 999 }}>
              <option value="">Any commission type</option>
              <option value="uncapped">Uncapped ∞</option>
              <option value="capped">Capped</option>
              <option value="unknown">Cap unknown</option>
            </select>
            <select name="network" defaultValue={networkSel} style={{ padding: "9px 13px", borderRadius: 999 }}>
              <option value="">Any affiliate program</option>
              {networkOptions.map((n) => (<option key={n} value={n.toLowerCase()}>{n}</option>))}
            </select>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="small" value="1" defaultChecked={wantSmall} /> Smaller creators</label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="apply" value="1" defaultChecked={applyOnly} /> Accepting applications</label>
          </div>
        </form>
        {!q && (
          <p style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
            {POPULAR.map(([label, href]) => (
              <Link key={label} href={href} style={{ border: "1px solid #4c1d95", background: "rgba(27,18,61,0.7)", padding: "8px 16px", borderRadius: 999, textDecoration: "none", fontSize: 14.5 }}>{label}</Link>
            ))}
          </p>
        )}
      </section>

      {q && loggedOut && (
        <section style={panel}>
          <h2 style={h2style}>Database results are for members</h2>
          <p style={sub}>The verified brand database is protected. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> to search {rows.length ? rows.length : "400+"} researched brands. The live web results below are open to everyone.</p>
        </section>
      )}

      {q && !loggedOut && (
        <section style={panel}>
          <h2 style={h2style}>🏆 From the UltraVestra database</h2>
          <p style={sub}>
            Searched {rows.length} researched brands — {matched.length} matched your words
            {capType === "uncapped" ? " · filter: UNCAPPED ✓" : capType === "capped" ? " · filter: capped" : capType === "unknown" ? " · filter: cap unknown" : ""}{networkSel ? ` · program: ${networkSel}` : ""}{platformSel ? ` · platform: ${platformSel}` : ""}{wantSmall ? " · filter: smaller creators" : ""}{minRate != null ? ` · filter: pays at least ${minRate}%` : ""}.
            Ranked by filters, match, then Opportunity Score. Open a profile to see every fact&rsquo;s source.
          </p>
          {top.length === 0 && <p style={{ color: "#f0abfc", margin: 0 }}>Not enough verified information in the database for this search yet — see the live web results below, and try wider words.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {top.map((r) => (
              <article key={r.brand.id} style={{ border: "1px solid #4c1d95", borderRadius: 16, padding: "14px 18px", background: "rgba(13,2,33,0.65)" }}>
                <p style={{ margin: "0 0 4px", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href={`/brands/${r.brand.id}`} style={{ fontSize: 18.5, fontWeight: 800, textDecoration: "none" }}>{r.brand.name}</Link>
                  <span style={{ background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13 }}>Score {Math.round(r.score)}</span>
                  <span style={chip("#67e8f9")}>Database</span>
                  {r.uncapped && <span style={{ background: "#052e16", color: "#4ade80", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13 }}>UNCAPPED ✓</span>}
                  {r.low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13 }}>Smaller-creator friendly</span>}
                  {r.reasons.map((reason) => (<span key={reason} style={chip("#22d3ee")}>Matched: {reason}</span>))}
                  {r.rate != null && <span style={chip("#e9d5ff")}>Pays {r.rate}%</span>}
                  {r.rate == null && <span style={chip("#a1a1aa")}>Rate not published</span>}
                  {!r.uncapped && <span style={chip("#a1a1aa")}>Ceiling: not stated</span>}
                  {!r.low && <span style={chip("#a1a1aa")}>Creator competition: insufficient data</span>}
                  <SaveBrandButton brandId={r.brand.id} />
                </p>
                <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>
                  {r.cats.map((c) => c.name).join(" · ")}{r.network ? ` · via ${r.network}` : " · Brand direct"}
                  {r.appUrl ? <> · <a href={r.appUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>Apply</a></> : " · Worth pitching (no open campaign found)"}
                  {r.checkedAt ? ` · Facts last checked ${new Date(r.checkedAt).toISOString().slice(0, 10)}` : ""}
                  {" "}· <Link href={`/brands/${r.brand.id}`} style={{ color: "#f0abfc" }}>Full profile &amp; sources →</Link>
                </p>
              </article>
            ))}
          </div>
          {top.length > 0 && (
            <p style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "18px 0 0" }}>
              <Link href={`/ask?q=${encodeURIComponent(q)}${platformSel ? `&platform=${encodeURIComponent(platformSel)}` : ""}${catFilter ? `&category=${encodeURIComponent(catFilter)}` : ""}`} className="neon-btn" style={{ padding: "11px 22px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>Get the full Ask UltraVestra report for this search →</Link>
              <Link href="/academy" style={{ padding: "11px 22px", borderRadius: 999, border: "1px solid #22d3ee", color: "#67e8f9", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Improve my videos — Creator Academy</Link>
            </p>
          )}
        </section>
      )}

      {q && !loggedOut && contactList.length > 0 && (
        <section style={panel}>
          <h2 style={h2style}>📇 Brand contacts from your search</h2>
          <p style={sub}>Public business contacts from the researched records. Full details and sources live on each profile.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contactList.map((r) => (
              <p key={r.brand.id} style={{ margin: 0, fontSize: 15 }}>
                <Link href={`/brands/${r.brand.id}`} style={{ fontWeight: 700, textDecoration: "none" }}>{r.brand.name}</Link>
                {r.contactEmail ? <> — <a href={`mailto:${r.contactEmail}`} style={{ color: "#67e8f9" }}>{r.contactEmail}</a></> : r.contactUrl ? <> — <a href={r.contactUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>Contact page</a></> : null}
              </p>
            ))}
          </div>
          {pitchList.length > 0 && (
            <p style={{ color: "#ddd0ff", fontSize: 14.5, margin: "14px 0 0" }}>Worth pitching even without an open campaign: {pitchList.map((r) => r.brand.name).join(", ")}.</p>
          )}
          {applyList.length > 0 && (
            <p style={{ color: "#ddd0ff", fontSize: 14.5, margin: "6px 0 0" }}>Accepting applications now: {applyList.map((r) => r.brand.name).join(", ")}.</p>
          )}
        </section>
      )}

      {q && (
        <section style={panel}>
          <h2 style={h2style}>🌐 From the live web</h2>
          <p style={sub}>Live results from public sources — <strong>not yet verified by UltraVestra research</strong>. Always check the official program page and its terms before relying on any rate or claim.</p>
          {web.length === 0 && <p style={{ color: "#f0abfc", margin: 0 }}>The live web search returned nothing this time. Try different words, or browse the <Link href="/brands" style={{ textDecoration: "underline" }}>brand directory</Link>.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {web.map((w) => (
              <article key={w.url} style={{ border: "1px solid #3b1470", borderRadius: 14, padding: "12px 16px", background: "rgba(13,2,33,0.5)" }}>
                <p style={{ margin: "0 0 3px", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                  <a href={w.url} target="_blank" rel="noreferrer" style={{ fontSize: 16.5, fontWeight: 700, color: "#e9d5ff" }}>{w.title}</a>
                  <span style={chip("#a1a1aa")}>Live web · Unverified</span>
                  {w.domain && <span style={{ color: "#a1a1aa", fontSize: 13 }}>{w.domain}</span>}
                </p>
                {w.snippet && <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>{w.snippet}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
