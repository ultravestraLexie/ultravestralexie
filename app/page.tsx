import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      <section style={{ textAlign: "center", padding: "48px 0 32px" }}>
        <h1 style={{ fontSize: 40, margin: "0 0 12px" }}>
          Less time searching. More time creating.
          <br />
          Smarter brand partnerships.
        </h1>
        <p style={{ fontSize: 18, color: "#444", maxWidth: 640, margin: "0 auto" }}>
          Ultra Vestra is the UGC brand intelligence platform. Find the brands worth
          pitching, see the right contact, understand what creators actually
          earn, and send a professional pitch — all in one place.
        </p>
        <p style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/brands"
            style={{
              background: "#111",
              color: "#fff",
              padding: "12px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Browse brands
          </Link>
          <Link
            href="/pricing"
            style={{
              border: "1px solid #111",
              padding: "12px 22px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            See plans
          </Link>
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {[
          {
            title: "Brands worth pursuing",
            body: "Every worthwhile brand can be researched — even if it is not running a campaign right now. A brand worth pitching is not the same as an open opportunity, and Ultra Vestra shows you both.",
          },
          {
            title: "Opportunity scores that explain themselves",
            body: "Each brand gets a 0–100 Ultra Vestra Opportunity Score built from niche fit, UGC evidence, compensation, contact access, availability and credibility — with the reasons shown, not just a number.",
          },
          {
            title: "Contacts and compensation, with sources",
            body: "Public partnership contacts and creator-reported pay, each with its source and the date it was last checked. No made-up rates, no dead emails.",
          },
          {
            title: "Ready-to-use pitches",
            body: "Personalized pitch templates matched to the brand, plus outreach tracking so you never lose a follow-up.",
          },
        ].map((f) => (
          <article
            key={f.title}
            style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}
          >
            <h3 style={{ marginTop: 0 }}>{f.title}</h3>
            <p style={{ margin: 0, color: "#444", fontSize: 15 }}>{f.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
