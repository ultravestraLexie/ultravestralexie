import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Ask UltraVestra — the flagship feature.
 * A creator asks in plain words; UltraVestra answers with a personalized
 * research report built ONLY from the researched brand database:
 * brands worth approaching, published commission information, who accepts
 * affiliate applications, who is worth pitching without an open campaign,
 * contact details + a ready-to-use pitch, three video concepts, a script
 * and filming blueprint, and the education behind the approach.
 * Every brand fact comes from the database and links to its full profile,
 * where each fact carries its source. Nothing is invented. */

const KEYWORD_CATEGORIES: [string, string][] = [
  ["skincare", "skincare"], ["skin care", "skincare"], ["skin", "skincare"],
  ["beauty", "beauty"], ["makeup", "beauty"], ["cosmetic", "beauty"],
  ["fashion", "fashion"], ["clothing", "fashion"], ["apparel", "fashion"], ["style", "fashion"],
  ["fitness", "fitness"], ["gym", "fitness"], ["workout", "fitness"],
  ["food", "food-drink"], ["drink", "food-drink"], ["cooking", "food-drink"], ["recipe", "food-drink"],
  ["wellness", "wellness"], ["supplement", "wellness"],
  ["health", "health"],
  ["travel", "travel"],
  ["tech", "technology"], ["gadget", "technology"],
  ["pet", "pets"], ["dog", "pets"], ["cat", "pets"],
  ["home", "home"], ["decor", "home"], ["cleaning", "home"],
  ["lifestyle", "lifestyle"],
];

interface Concept { title: string; hook: string; format: string; why: string }

const CONCEPTS: Record<string, Concept[]> = {
  beauty: [
    { title: "The 7-Day Honest Test", hook: "\u201CI used this every day for a week — here is what actually changed.\u201D", format: "Day-1 close-up, one 5-second check-in per day, final side-by-side reveal.", why: "Time turns a claim into proof. Proof is what makes a viewer trust and click." },
    { title: "Get Ready With Me — One Product Does It All", hook: "\u201COne product, full face, watch this.\u201D", format: "Real-time routine, product in frame from second one, finished look as the thumbnail moment.", why: "Viewers copy routines. A product inside a routine sells without sounding like an ad." },
    { title: "The Mistake Everyone Makes", hook: "\u201CYou are applying this wrong — here is the fix.\u201D", format: "Show the common mistake first, then the correct way with the product, before/after in one shot.", why: "Teaching builds authority, and authority is what brands pay for." },
  ],
  skincare: [
    { title: "Morning vs Night — Same Skin, 30 Days", hook: "\u201CSame mirror, same light, 30 days apart.\u201D", format: "Identical lighting and angle on day 1 and day 30, product routine shown in between.", why: "Controlled comparisons are the most believable content in skincare." },
    { title: "The Routine, In Order", hook: "\u201CThe order you apply skincare matters more than the price.\u201D", format: "Number each step on screen, product as the hero of its step, total routine under 60 seconds.", why: "Education plus a product in a system beats a single-product review." },
    { title: "One Problem, One Product", hook: "\u201CIf you struggle with this one thing, watch.\u201D", format: "Name one specific skin problem, demo the product on it, honest result at the end.", why: "Specific problems create specific buyers." },
  ],
  fashion: [
    { title: "One Piece, Three Ways", hook: "\u201CThree outfits, one piece — number two is the one nobody expects.\u201D", format: "Fast transitions, same mirror, price and fit notes on screen.", why: "Versatility removes the #1 reason people do not buy clothing online." },
    { title: "Expectation vs Reality", hook: "\u201CWhat I ordered vs what showed up.\u201D", format: "Site photo first, real try-on second, honest fit verdict.", why: "Honesty about fit is rare — and it is exactly what converts." },
    { title: "The $ Test", hook: "\u201CIs it worth the money? I wore it all week.\u201D", format: "Wear it in real life across several days, report comfort, quality and compliments.", why: "Real-life wear tests outperform studio try-ons." },
  ],
  fitness: [
    { title: "I Replaced My Workout With This", hook: "\u201CI swapped my normal session for this for two weeks.\u201D", format: "Baseline clips, daily 5-second progress, honest final verdict.", why: "A documented experiment is a story viewers follow to the end." },
    { title: "Form Fix Friday", hook: "\u201CYour form on this exercise is costing you gains.\u201D", format: "Wrong form vs right form side by side, product or program woven into the fix.", why: "Coaching content positions you as an expert brands want." },
    { title: "What I Actually Eat / Use In A Day", hook: "\u201CFull day, no filters — here is my real stack.\u201D", format: "Time-stamped clips through the day, each product shown in real use.", why: "Day-in-the-life content makes products part of a lifestyle, not an ad break." },
  ],
  "food-drink": [
    { title: "The 15-Minute Version", hook: "\u201CThis tastes like a restaurant made it — 15 minutes.\u201D", format: "Timer on screen, fast cuts, final taste reaction as the payoff.", why: "Speed plus a genuine reaction is the most shared food format." },
    { title: "Pantry Upgrade", hook: "\u201CSwap this one ingredient and everything tastes better.\u201D", format: "Same dish twice — old way vs upgraded way — blind taste moment.", why: "One clear swap is easy to remember and easy to buy." },
    { title: "Rating My Week Of It", hook: "\u201CI drank/ate this every day this week — honest ranking.\u201D", format: "One clip per day, final ranked list, winner linked.", why: "A series brings viewers back daily and builds the brand relationship." },
  ],
  wellness: [
    { title: "My Non-Negotiable Morning", hook: "\u201CThe 10 minutes that changed my whole day.\u201D", format: "Calm morning routine, product in its real moment, energy check at noon.", why: "Routines are aspirational — viewers buy the feeling the routine creates." },
    { title: "30 Days Of One Habit", hook: "\u201COne habit, 30 days, here are my real results.\u201D", format: "Day 1 baseline, weekly check-ins, honest day-30 verdict.", why: "Consistency content proves discipline — and discipline sells wellness." },
    { title: "What Is Actually In It", hook: "\u201CI read the label so you do not have to.\u201D", format: "Label close-up, three ingredients explained in plain words, verdict.", why: "Label transparency is the trust shortcut in wellness." },
  ],
  health: [
    { title: "I Tracked It For A Month", hook: "\u201CThe numbers before and after surprised me.\u201D", format: "Show your tracked baseline, the daily habit, the month-end numbers.", why: "Measured results beat opinions in health content." },
    { title: "Questions You Should Ask", hook: "\u201CThree questions to ask before you buy any health product.\u201D", format: "Ask each question on camera, answer it using the product as the example.", why: "You become the viewer's trusted filter — brands pay for that position." },
    { title: "My Daily System", hook: "\u201CThe simple system I actually stick to.\u201D", format: "Morning-to-night clips, each step timed, product in real use.", why: "Systems are shareable; shareable content grows accounts." },
  ],
  travel: [
    { title: "Pack With Me — Carry-On Only", hook: "\u201CEverything for 10 days in one carry-on. Watch.\u201D", format: "Overhead packing shot, each product solving a visible problem.", why: "Packing content is saved and rewatched — saves are growth gold." },
    { title: "The Product I Never Travel Without", hook: "\u201CI have taken this to 12 countries. Here is why.\u201D", format: "Real travel clips across locations, one honest downside included.", why: "Field-tested proof beats studio reviews every time." },
    { title: "Travel Mistake, Fixed", hook: "\u201CThis mistake ruined my first day — never again.\u201D", format: "Tell the story, show the fix with the product, end with the smooth version.", why: "Stories with a fix are the most trusted travel format." },
  ],
  technology: [
    { title: "The Desk Setup Upgrade", hook: "\u201CThis one upgrade changed my whole setup.\u201D", format: "Before desk, install moment, after desk — same camera angle.", why: "Before/after in one angle makes the improvement undeniable." },
    { title: "I Tested It So You Do Not Have To", hook: "\u201COne week of real use — the good, the bad, the verdict.\u201D", format: "Daily real-use clips, one flaw named honestly, final score on screen.", why: "Naming a flaw makes the praise believable." },
    { title: "3 Things It Does That Nobody Shows", hook: "\u201CFeature number two is the reason I kept it.\u201D", format: "Three fast demos, each under 15 seconds, best one last.", why: "Hidden-feature lists get saved and shared." },
  ],
  pets: [
    { title: "My Pet Reviews It", hook: "\u201CI let my pet decide — watch the reaction.\u201D", format: "Unbox in front of your pet, real first reaction uncut, one-week follow-up.", why: "Genuine animal reactions are the most honest reviews on the internet." },
    { title: "The Problem Every Owner Knows", hook: "\u201CIf your home looks like this too, watch.\u201D", format: "Show the messy problem first, the product fixing it, the clean result.", why: "Shared problems create instant identification — and clicks." },
    { title: "Worth It After 30 Days?", hook: "\u201C30 days later — still using it? Honest answer.\u201D", format: "Day-1 excitement vs day-30 reality, durability close-ups.", why: "Long-term honesty is rare in pet content and brands notice it." },
  ],
  home: [
    { title: "The 10-Minute Reset", hook: "\u201CThis room went from chaos to calm in 10 minutes.\u201D", format: "Timer on screen, sped-up reset, product as the hero tool, calm final shot.", why: "Transformation plus a timer is endlessly rewatchable." },
    { title: "Small Space, Big Fix", hook: "\u201CThe corner everyone ignores — fixed for good.\u201D", format: "Problem corner close-up, install or apply, wide reveal.", why: "Specific small wins beat vague whole-home content." },
    { title: "Guest-Ready In One Product", hook: "\u201CGuests arriving in an hour — this is my secret.\u201D", format: "Real deadline pressure, fast demo, guest reaction or final reveal.", why: "A deadline creates story tension that holds attention." },
  ],
  lifestyle: [
    { title: "A Day Built Around One Product", hook: "\u201CI built my whole day around this — here is how it went.\u201D", format: "Time-stamped day clips, product appearing naturally in each block.", why: "Integration beats interruption: the product lives inside a life." },
    { title: "Things I Wish I Knew Sooner", hook: "\u201CNumber three would have saved me real money.\u201D", format: "Fast list format, product as one of the lessons, best lesson last.", why: "List content is saved — saves drive the algorithm." },
    { title: "My Honest Favorites This Month", hook: "\u201CFive things I actually finished, loved, and reordered.\u201D", format: "Quick verdict per item, one line of proof each, links in order.", why: "Roundups let one video carry several brand relationships." },
  ],
};

const DEFAULT_CONCEPTS: Concept[] = [
  { title: "The Honest 7-Day Test", hook: "\u201CI used this every day for a week — here is the truth.\u201D", format: "Day-1 first impression, daily 5-second check-ins, honest final verdict.", why: "Documented time turns a claim into proof." },
  { title: "The Problem / Fix", hook: "\u201CIf this problem drives you crazy too, watch this fix.\u201D", format: "Show the problem up close, demo the fix, show the result in the same shot.", why: "Problems get attention; fixes get sales." },
  { title: "What Nobody Tells You", hook: "\u201CThree things nobody tells you about this — number two matters.\u201D", format: "Three fast points, one honest downside, product woven through each.", why: "Insider honesty builds the trust brands pay for." },
];

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "26px 26px 28px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};

const h2style: React.CSSProperties = { fontSize: 25, margin: "0 0 6px", letterSpacing: 0.5 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 18px", fontSize: 15.5 };

function capBadge(notes: string | null) {
  if (notes && notes.includes("UNCAPPED"))
    return { label: "UNCAPPED ✓", bg: "#052e16", fg: "#4ade80" };
  return { label: "Cap not published", bg: "#26262e", fg: "#d4d4d8" };
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; category?: string; name?: string; uncapped?: string; small?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const asked = Boolean(q || sp.category || sp.platform || sp.uncapped || sp.small);
  const text = q.toLowerCase();

  const platform =
    sp.platform ||
    (text.includes("youtube") ? "YouTube" : text.includes("instagram") ? "Instagram" : text.includes("tiktok") || text.includes("tik tok") ? "TikTok" : "");
  let categorySlug = sp.category || "";
  if (!categorySlug) {
    for (const [kw, slug] of KEYWORD_CATEGORIES) {
      if (text.includes(kw)) { categorySlug = slug; break; }
    }
  }
  const wantUncapped = sp.uncapped === "1" || text.includes("uncapped") || text.includes("no cap") || text.includes("unlimited earning");
  const wantSmall = sp.small === "1" || text.includes("smaller creator") || text.includes("small creator") || text.includes("beginner") || text.includes("new creator") || text.includes("micro");
  const creatorName = (sp.name ?? "").trim();

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
  const cats = (categories ?? []) as Category[];
  const catName = cats.find((c) => c.slug === categorySlug)?.name ?? "";

  interface Row {
    brand: Brand; score: number; explanation: Record<string, string>;
    network: string | null; rate: number | null; notes: string | null; appUrl: string | null;
    contactEmail: string | null; contactUrl: string | null; hasOpenOpp: boolean;
    uncapped: boolean; low: boolean;
  }
  let rows: Row[] = [];
  let loggedOutEmpty = false;

  if (asked) {
    let ids: string[] | null = null;
    if (categorySlug) {
      const cat = cats.find((c) => c.slug === categorySlug);
      if (cat) {
        const { data: links } = await supabase.from("brand_categories").select("brand_id").eq("category_id", cat.id);
        ids = (links ?? []).map((l) => l.brand_id as string);
      } else ids = [];
    }
    let query = supabase.from("brands").select("*").eq("status", "published");
    if (ids) query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const { data: brands } = await query;
    const list = (brands ?? []) as Brand[];
    if (!list.length) {
      const { data: { user } } = await supabase.auth.getUser();
      loggedOutEmpty = !user;
    }
    if (list.length) {
      const bIds = list.map((b) => b.id);
      const [{ data: scores }, { data: affiliates }, { data: contacts }, { data: opps }] = await Promise.all([
        supabase.from("brand_scores").select("brand_id, total_score, explanation, scored_at").in("brand_id", bIds).order("scored_at", { ascending: false }),
        supabase.from("affiliate_programs").select("brand_id, network, commission_rate, commission_notes, application_url").in("brand_id", bIds),
        supabase.from("brand_contacts").select("brand_id, email, contact_url").in("brand_id", bIds),
        supabase.from("opportunities").select("brand_id, status, application_url").in("brand_id", bIds),
      ]);
      const scoreMap = new Map<string, { total: number; explanation: Record<string, string> }>();
      for (const s of scores ?? []) if (!scoreMap.has(s.brand_id as string)) scoreMap.set(s.brand_id as string, { total: Number(s.total_score), explanation: (s.explanation ?? {}) as Record<string, string> });
      const affMap = new Map<string, { network: string | null; rate: number | null; notes: string | null; appUrl: string | null }>();
      for (const a of affiliates ?? []) if (!affMap.has(a.brand_id as string)) affMap.set(a.brand_id as string, { network: (a.network as string) ?? null, rate: a.commission_rate != null ? Number(a.commission_rate) : null, notes: (a.commission_notes as string) ?? null, appUrl: (a.application_url as string) ?? null });
      const contactMap = new Map<string, { email: string | null; url: string | null }>();
      for (const c of contacts ?? []) { const cur = contactMap.get(c.brand_id as string); if (!cur) contactMap.set(c.brand_id as string, { email: (c.email as string) ?? null, url: (c.contact_url as string) ?? null }); else { if (!cur.email && c.email) cur.email = c.email as string; if (!cur.url && c.contact_url) cur.url = c.contact_url as string; } }
      const openSet = new Set<string>(); const oppAppMap = new Map<string, string>();
      for (const o of opps ?? []) { if (o.status === "open") openSet.add(o.brand_id as string); if (o.application_url && !oppAppMap.has(o.brand_id as string)) oppAppMap.set(o.brand_id as string, o.application_url as string); }
      rows = list.map((brand) => {
        const aff = affMap.get(brand.id);
        const notes = aff?.notes ?? null;
        return {
          brand,
          score: scoreMap.get(brand.id)?.total ?? 0,
          explanation: scoreMap.get(brand.id)?.explanation ?? {},
          network: aff?.network ?? null,
          rate: aff?.rate ?? null,
          notes,
          appUrl: aff?.appUrl ?? oppAppMap.get(brand.id) ?? null,
          contactEmail: contactMap.get(brand.id)?.email ?? null,
          contactUrl: contactMap.get(brand.id)?.url ?? null,
          hasOpenOpp: openSet.has(brand.id),
          uncapped: Boolean(notes && notes.includes("UNCAPPED")),
          low: Boolean(notes && notes.includes("Creator saturation: low")),
        };
      });
      rows.sort((a, b) => {
        const am = (wantUncapped && a.uncapped ? 1 : 0) + (wantSmall && a.low ? 1 : 0);
        const bm = (wantUncapped && b.uncapped ? 1 : 0) + (wantSmall && b.low ? 1 : 0);
        if (bm !== am) return bm - am;
        return b.score - a.score;
      });
    }
  }

  const filtered = rows.filter((r) => (!wantUncapped || r.uncapped) && (!wantSmall || r.low));
  const mainList = (filtered.length >= 3 ? filtered : rows).slice(0, 8);
  const usingFallback = filtered.length < 3 && rows.length > 0 && (wantUncapped || wantSmall);
  const applyList = rows.filter((r) => r.appUrl).slice(0, 8);
  const pitchList = rows.filter((r) => !r.hasOpenOpp).slice(0, 5);
  const concepts = CONCEPTS[categorySlug] ?? DEFAULT_CONCEPTS;
  const nicheLabel = catName || "your niche";
  const platformLabel = platform || "TikTok";

  const pitchFor = (r: Row) => {
    const who = creatorName || "a UGC creator";
    return `Subject: UGC partnership idea for ${r.brand.name} — ${platformLabel} ${nicheLabel} creator

Hi ${r.brand.name} team,

I am ${who} creating ${nicheLabel.toLowerCase()} content on ${platformLabel}. I researched your brand on UltraVestra (Opportunity Score ${Math.round(r.score)}/100) and I would love to create for you.

My first video idea: "${concepts[0].title}" — ${concepts[0].hook}

I can deliver one polished UGC video with full usage-ready files, captions and a posting version for my own channel. I am happy to start with product seeding or your affiliate program and prove results before we talk paid rates.

Would you be open to a short intro this week? I can send examples of my work right away.

Thank you for your time,
${creatorName || "[Your name]"}
${platformLabel} creator — ${nicheLabel}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <section className="portal-hero" style={{ position: "relative", borderRadius: 28, overflow: "hidden", border: "1px solid #d946ef" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/worlds/ask.jpg" alt="Ask UltraVestra — your creator AI companion" style={{ width: "100%", display: "block", aspectRatio: "16/8", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,0,8,0.05) 40%, rgba(2,0,8,0.92) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "26px 30px" }}>
          <span style={{ alignSelf: "flex-start", background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>ASK ULTRAVESTRA</span>
          <h1 className="wow-title" style={{ fontSize: 46, margin: "10px 0 4px", fontWeight: 800 }}>Your Creator AI Companion</h1>
          <p style={{ margin: 0, fontSize: 17.5, maxWidth: 640, color: "#f3e8ff" }}>Ask in plain words. Get a personalized research report — brands, commissions, contacts, a ready-to-use pitch, video concepts and a filming blueprint. Research, education and action in one answer.</p>
        </div>
      </section>

      <section style={panel}>
        <h2 style={h2style}>Ask your question</h2>
        <p style={sub}>Try the famous one: <em>&ldquo;I&rsquo;m a TikTok creator in beauty. I want brands with uncapped affiliate commissions. I need brands that work with smaller creators. Show me how to make better product videos.&rdquo;</em></p>
        <form method="get" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <textarea name="q" defaultValue={q} placeholder="Ask UltraVestra anything about brands, commissions and content…" rows={3} style={{ width: "100%", borderRadius: 14, padding: "13px 16px", fontSize: 16.5 }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select name="platform" defaultValue={platform} style={{ padding: "11px 14px", borderRadius: 999 }}>
              <option value="">Any platform</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
            </select>
            <select name="category" defaultValue={categorySlug} style={{ padding: "11px 14px", borderRadius: 999 }}>
              <option value="">All niches</option>
              {cats.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
            </select>
            <input type="text" name="name" defaultValue={creatorName} placeholder="Your creator name (for the pitch)" style={{ padding: "11px 16px", borderRadius: 999, flex: "1 1 220px" }} />
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", fontSize: 15.5 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="uncapped" value="1" defaultChecked={wantUncapped} /> Uncapped commissions only</label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="small" value="1" defaultChecked={wantSmall} /> Works with smaller creators</label>
          </div>
          <button type="submit" className="neon-btn" style={{ alignSelf: "flex-start", padding: "14px 32px", borderRadius: 999, border: "none", background: "linear-gradient(92deg, #a855f7, #d946ef 55%, #22d3ee 130%)", color: "#fff", fontWeight: 800, fontSize: 17, boxShadow: "0 0 30px rgba(217,70,239,0.6)" }}>Build my report →</button>
        </form>
      </section>

      {asked && loggedOutEmpty && (
        <section style={panel}>
          <h2 style={h2style}>Log in to unlock your report</h2>
          <p style={sub}>Brand intelligence is protected for members. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> and ask again — your report builds instantly from the live database.</p>
        </section>
      )}

      {asked && !loggedOutEmpty && rows.length === 0 && (
        <section style={panel}>
          <h2 style={h2style}>No matches yet</h2>
          <p style={sub}>No published brands match that niche yet. Try a wider niche — research adds new brands every day.</p>
        </section>
      )}

      {asked && mainList.length > 0 && (
        <>
          <section style={{ textAlign: "center" }}>
            <span style={{ background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>YOUR PERSONALIZED RESEARCH REPORT</span>
            <h2 className="wow-title" style={{ fontSize: 36, margin: "12px 0 4px", fontWeight: 800 }}>{nicheLabel} on {platformLabel}{wantUncapped ? " — uncapped commissions" : ""}{wantSmall ? " — smaller-creator friendly" : ""}</h2>
            <p style={{ color: "#ddd0ff", margin: 0 }}>Built live from {rows.length} researched brands in this niche. Every fact links to its sourced profile.</p>
            {usingFallback && <p style={{ color: "#f0abfc", margin: "8px 0 0" }}>Honest note: fewer than 3 brands in this niche are <strong>verified</strong> for every filter you picked, so your report leads with the verified matches, then the highest-scored brands overall. Nothing is guessed.</p>}
          </section>

          <section style={panel}>
            <h2 style={h2style}>🏆 Brands worth approaching</h2>
            <p style={sub}>Ranked by your filters first, then by Opportunity Score.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mainList.map((r) => (
                <article key={r.brand.id} style={{ border: "1px solid #4c1d95", borderRadius: 16, padding: "16px 18px", background: "rgba(13,2,33,0.65)" }}>
                  <p style={{ margin: "0 0 4px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <Link href={`/brands/${r.brand.id}`} style={{ fontSize: 19, fontWeight: 800, textDecoration: "none" }}>{r.brand.name}</Link>
                    <span style={{ background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13.5 }}>Score {Math.round(r.score)}</span>
                    {r.uncapped && <span style={{ background: "#052e16", color: "#4ade80", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13.5 }}>UNCAPPED ✓</span>}
                    {r.low && <span style={{ background: "#3a1c05", color: "#fb923c", borderRadius: 999, padding: "2px 12px", fontWeight: 700, fontSize: 13.5 }}>Smaller-creator friendly</span>}
                  </p>
                  <p style={{ margin: 0, color: "#ddd0ff", fontSize: 15 }}>{r.explanation.niche_fit || r.brand.description || ""}</p>
                </article>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>📄 Published commission information</h2>
            <p style={sub}>Only what brands and networks actually publish. If a rate is not published, we say so — we never invent one.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 15 }}>
                <thead><tr>{["Brand", "Commission", "Network", "Cap"].map((h) => (<th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #7e22ce", color: "#f0abfc" }}>{h}</th>))}</tr></thead>
                <tbody>
                  {mainList.map((r) => { const b = capBadge(r.notes); return (
                    <tr key={r.brand.id}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #3b1470", fontWeight: 700 }}>{r.brand.name}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #3b1470" }}>{r.rate != null ? `${r.rate}%` : "Not published"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #3b1470" }}>{r.network ?? "Brand direct"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #3b1470" }}><span style={{ background: b.bg, color: b.fg, borderRadius: 999, padding: "2px 10px", fontSize: 12.5, fontWeight: 700 }}>{b.label}</span></td>
                    </tr> ); })}
                </tbody>
              </table>
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🤝 Brands that accept affiliate applications</h2>
            <p style={sub}>A published application route exists for each of these — you can join today.</p>
            {applyList.length === 0 ? <p style={{ color: "#ddd0ff" }}>No published application links in this niche yet — use the pitch section below instead.</p> : (
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.1, fontSize: 15.5 }}>
                {applyList.map((r) => (<li key={r.brand.id}><strong>{r.brand.name}</strong>{" — "}<a href={r.appUrl!} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>Apply ↗</a>{r.rate != null ? ` · ${r.rate}% commission` : ""}{r.uncapped ? " · UNCAPPED ✓" : ""}</li>))}
              </ul>
            )}
          </section>

          <section style={panel}>
            <h2 style={h2style}>📣 Worth pitching — no open campaign advertised</h2>
            <p style={sub}>These brands are not advertising an open campaign right now. That is exactly why a great pitch works: less competition, and the Trust System marks them as Research leads.</p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.1, fontSize: 15.5 }}>
              {pitchList.map((r) => (<li key={r.brand.id}><Link href={`/brands/${r.brand.id}`} style={{ fontWeight: 700 }}>{r.brand.name}</Link>{` — Score ${Math.round(r.score)}`} <span style={{ background: "#26262e", color: "#d4d4d8", borderRadius: 999, padding: "1px 10px", fontSize: 12.5, fontWeight: 700 }}>Research lead</span></li>))}
            </ul>
          </section>

          <section style={panel}>
            <h2 style={h2style}>✉️ Contact details &amp; your ready-to-use pitch</h2>
            <p style={sub}>Copy the pitch, add your name and portfolio link, and send. Contacts shown only where a brand publishes them.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {mainList.slice(0, 3).map((r) => (
                <article key={r.brand.id}>
                  <p style={{ margin: "0 0 6px", fontSize: 17 }}><strong>{r.brand.name}</strong>{r.contactEmail ? <>{" · "}<a href={`mailto:${r.contactEmail}`} style={{ color: "#67e8f9" }}>{r.contactEmail}</a></> : ""}{r.contactUrl ? <>{" · "}<a href={r.contactUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>Creator application ↗</a></> : ""}{!r.contactEmail && !r.contactUrl && r.appUrl ? <>{" · "}<a href={r.appUrl} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>Program page ↗</a></> : ""}</p>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#0d0221", border: "1px solid #4c1d95", borderRadius: 14, padding: "16px 18px", fontSize: 14, lineHeight: 1.6, color: "#f3e8ff", margin: 0 }}>{pitchFor(r)}</pre>
                </article>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>▶️ Three video concepts for {nicheLabel.toLowerCase()}</h2>
            <p style={sub}>Built for {platformLabel}. Film concept one first — the full script is below.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {concepts.map((c, i) => (
                <article key={c.title} style={{ border: "1px solid #4c1d95", borderRadius: 16, padding: "18px", background: "rgba(13,2,33,0.65)" }}>
                  <p style={{ margin: "0 0 6px", color: "#f0abfc", fontWeight: 800, letterSpacing: 1 }}>CONCEPT {i + 1}</p>
                  <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{c.title}</h3>
                  <p style={{ margin: "0 0 8px", fontSize: 15 }}><strong>Hook:</strong> {c.hook}</p>
                  <p style={{ margin: "0 0 8px", fontSize: 15, color: "#ddd0ff" }}><strong>Format:</strong> {c.format}</p>
                  <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}><strong>Why it works:</strong> {c.why}</p>
                </article>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>🎬 Your script &amp; filming blueprint — &ldquo;{concepts[0].title}&rdquo;</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <div>
                <h3 style={{ marginTop: 0 }}>The script</h3>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, fontSize: 15.5 }}>
                  <li><strong>0–3s — Hook:</strong> Say it word for word: {concepts[0].hook} Product already in your hand.</li>
                  <li><strong>3–10s — The problem:</strong> Show the problem up close. One sentence on why it frustrates you.</li>
                  <li><strong>10–35s — The demo:</strong> {concepts[0].format} Keep every cut under 3 seconds.</li>
                  <li><strong>35–50s — The proof:</strong> Show the result in the same light and angle as the problem shot.</li>
                  <li><strong>50–60s — Honest line + CTA:</strong> Name one small downside, then: &ldquo;Link is in my bio — check the commission program if you create too.&rdquo;</li>
                </ul>
              </div>
              <div>
                <h3 style={{ marginTop: 0 }}>Filming blueprint</h3>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, fontSize: 15.5 }}>
                  <li><strong>Light:</strong> Face a window or ring light; never film with light behind you.</li>
                  <li><strong>Frame:</strong> Vertical 9:16, camera at eye level, product in the first frame.</li>
                  <li><strong>Sound:</strong> Quiet room, phone mic close — clear audio beats fancy cameras.</li>
                  <li><strong>Captions:</strong> Caption every word; most viewers start muted.</li>
                  <li><strong>Cover moment:</strong> Screenshot your proof frame as the cover image.</li>
                  <li><strong>Post:</strong> Pin a comment with the product link and one honest sentence.</li>
                </ul>
              </div>
            </div>
          </section>

          <section style={panel}>
            <h2 style={h2style}>💡 Why this approach works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {[
                { t: "Uncapped means your best video has no ceiling", b: "A capped program limits your best month. An uncapped one pays on every sale your content ever makes — that is why this report hunts verified uncapped programs first, and only calls a program uncapped when its own terms say so." },
                { t: "Smaller-creator friendly brands reply", b: "Giant programs get thousands of pitches. Brands with small creator cohorts actually read applications, seed product, and grow with you. Early relationships become paid partnerships." },
                { t: "The first 3 seconds decide everything", b: "Viewers decide before your intro ends. Lead with the hook and the product in hand — the story comes after the attention is earned." },
                { t: "Pitch like a business, not a fan", b: "One clear video idea, one proof offer (seeding or affiliate first), one easy next step. Then follow up once, politely, in 5–7 days. Brands book creators who make saying yes easy." },
              ].map((c) => (
                <article key={c.t} style={{ border: "1px solid #4c1d95", borderRadius: 16, padding: "18px", background: "rgba(13,2,33,0.65)" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>{c.t}</h3>
                  <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{c.b}</p>
                </article>
              ))}
            </div>
            <p style={{ color: "#ddd0ff", fontSize: 14.5, marginBottom: 0 }}>This is more than a chatbot: it connects research, education and action. Every brand above is real, researched and sourced — open any profile to see its evidence.</p>
          </section>
        </>
      )}
    </div>
  );
}
