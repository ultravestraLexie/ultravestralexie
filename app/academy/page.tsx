import AcademySearch from "@/components/AcademySearch";

export const dynamic = "force-dynamic";

/* CREATOR ACADEMY — the searchable learning library:
 * hooks, scripts, filming, pitching, money and growth for creators. */

export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>CREATOR ACADEMY</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Learn to create content that sells</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto 20px", maxWidth: 600, fontSize: 16 }}>Searchable lessons on hooks, scripts, filming, pitching, pricing and growth — written for creators, free to read.</p>
      </section>
      <AcademySearch initialQuery={(sp.q ?? "").trim()} initialCat={(sp.cat ?? "").trim()} />
    </div>
  );
}
