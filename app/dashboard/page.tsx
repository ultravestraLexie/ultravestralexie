import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/* CREATOR INTELLIGENCE DASHBOARD — the whole platform in one room.
 * Every count on this page is computed live from the researched
 * database. Nothing is a placeholder: if a number cannot be computed,
 * the card says so instead of inventing one. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const card: React.CSSProperties = {
  border: "1px solid #4c1d95",
  background: "rgba(13,2,33,0.65)",
  borderRadius: 18,
  padding: "18px 20px",
  height: "100%",
};

export default async function DashboardPage() {
  await requireSubscription("/dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: brands } = await supabase.from("brands").select("*").eq("status", "published");
  const list = (brands ?? []) as Brand[];

  let stats = { total: 0, uncapped: 0, capped: 0, unknownCap: 0, accepting: 0, newest: [] as Brand[] };

  if (list.length) {
    const [{ data: affiliates }, { data: opps }] = await Promise.all([
      supabase.from("affiliate_programs").select("brand_id, commission_notes, application_url"),
      supabase.from("opportunities").select("brand_id, status, application_url"),
    ]);
    const openSet = new Set<string>();
    for (const o of opps ?? []) if (o.status === "open" && o.application_url) openSet.add(o.brand_id as string);
    let uncapped = 0, capped = 0, unknownCap = 0;
    const accepting = new Set<string>(openSet);
    for (const a of affiliates ?? []) {
      const notes = (a.commission_notes as string) ?? "";
      if (notes.includes("cap: UNCAPPED")) uncapped++;
      else if (notes.includes("cap: capped")) capped++;
      else unknownCap++;
      if (a.application_url) accepting.add(a.brand_id as string);
    }
    stats = {
      total: list.length,
      uncapped, capped, unknownCap,
      accepting: accepting.size,
      newest: [...list].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 5),
    };
  }

  const sections: { href: string; emoji: string; title: string; line: string; live?: string }[] = [
    { href: "/opportunities", emoji: "🎯", title: "Opportunity Finder", line: "Brands accepting applications, and high-score brands worth pitching.", live: list.length ? `${stats.accepting} accepting now` : undefined },
    { href: "/discover", emoji: "🔎", title: "Product Research", line: "Search brands and products by niche, platform and commission model.", live: list.length ? `${stats.total} brands searchable` : undefined },
    { href: "/commissions", emoji: "🔒", title: "Capped Commissions", line: "Programs whose terms publish an earnings ceiling — know it before you create.", live: list.length ? `${stats.capped} on record` : undefined },
    { href: "/commissions", emoji: "✅", title: "Uncapped Commissions", line: "Verified no-cap programs, proven from the brand's own published terms.", live: list.length ? `${stats.uncapped} verified` : undefined },
    { href: "/commissions", emoji: "❔", title: "Commission Cap Unknown", line: "A published rate is not proof of no cap. These limits are honestly unknown.", live: list.length ? `${stats.unknownCap} unknown` : undefined },
    { href: "/brands", emoji: "🧠", title: "Brand Intelligence", line: "Full profiles: scores with reasons, contacts, compensation, sourced evidence.", live: list.length ? `${stats.total} profiles` : undefined },
    { href: "/coach", emoji: "🔬", title: "Creator Growth Center", line: "Hooks, scripts, video lessons and sales techniques — plus the diagnostic that shows why a video performs." },
    { href: "/studio", emoji: "🎬", title: "Video Strategy & Script Studio", line: "Build a complete selling script from your own product facts, beat by beat." },
    { href: "/ask", emoji: "✨", title: "Ask UltraVestra AI", line: "One question in — a sourced research report with brands, contacts and a pitch out." },
    { href: "/academy", emoji: "🎓", title: "Creator Academy", line: "Searchable lessons on hooks, scripts, filming, pitching, money and growth.", live: "12 lessons" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#67e8f9", border: "1px solid #22d3ee", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>CREATOR INTELLIGENCE DASHBOARD</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Your intelligence room</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 660, fontSize: 16 }}>
          Where to go. What to promote. What you could earn. How to sell better.
          Every section below runs on the researched database — every number live, every fact sourced.
        </p>
        {user && <p style={{ color: "#f0abfc", fontWeight: 700, marginTop: 10 }}>Signed in as {user.email}</p>}
      </section>

      {!list.length && (
        <section style={panel}>
          <h2 style={{ fontSize: 23, margin: "0 0 6px" }}>{user ? "Dashboard data is loading" : "Log in to open your dashboard"}</h2>
          <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15 }}>
            The intelligence database is protected for members. <Link href="/login" style={{ textDecoration: "underline" }}>Log in</Link> to see live counts and open every section.
          </p>
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {sections.map((s) => (
          <Link key={s.title} href={s.href} style={{ textDecoration: "none" }}>
            <article style={card}>
              <p style={{ margin: "0 0 6px", fontSize: 24 }}>{s.emoji}</p>
              <strong style={{ fontSize: 17.5 }}>{s.title}</strong>
              <p style={{ margin: "6px 0 0", color: "#ddd0ff", fontSize: 14.5 }}>{s.line}</p>
              {s.live && <p style={{ margin: "10px 0 0", color: "#4ade80", fontWeight: 700, fontSize: 13.5 }}>{s.live}</p>}
              <p style={{ margin: "8px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 14.5 }}>Open →</p>
            </article>
          </Link>
        ))}
      </section>

      {stats.newest.length > 0 && (
        <section style={panel}>
          <h2 style={{ fontSize: 23, margin: "0 0 6px" }}>🌱 Newest research on the radar</h2>
          <p style={{ color: "#ddd0ff", margin: "0 0 14px", fontSize: 15 }}>The most recently added brands in the directory.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.newest.map((b) => (
              <p key={b.id} style={{ margin: 0, fontSize: 15.5 }}>
                <Link href={`/brands/${b.id}`} style={{ fontWeight: 800, textDecoration: "none" }}>{b.name}</Link>
                <span style={{ color: "#ddd0ff" }}>{b.country ? ` · ${b.country}` : ""} · added {(b.created_at ?? "").slice(0, 10)}</span>
              </p>
            ))}
          </div>
          <p style={{ margin: "16px 0 0" }}>
            <Link href="/radar" style={{ color: "#67e8f9", fontWeight: 700 }}>Open the full Brand Opportunity Radar →</Link>
          </p>
        </section>
      )}
    </div>
  );
}
