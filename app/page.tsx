import Link from "next/link";

const WORLDS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  img: string;
  href?: string;
  cta?: string;
}[] = [
  {
    n: "01",
    title: "THE BRAND GALAXY",
    desc: "Discover brands worth knowing, researching and working with.",
    bullets: [
      "Brand intelligence database",
      "Affiliate program directory",
      "Commission and payment research",
      "Brand contact information",
      "Ready-to-use outreach pitches",
      "Brand Trust Index",
    ],
    img: "/worlds/world1.jpg",
    href: "/brands",
    cta: "Enter the Brand Galaxy",
  },
  {
    n: "02",
    title: "THE CONTENT LAB",
    desc: "Learn to create content that captures attention and converts.",
    bullets: [
      "Viral hook techniques",
      "Product-selling videos",
      "UGC video tutorials",
      "Filming and editing",
      "Storytelling and persuasion",
      "Video breakdowns",
    ],
    img: "/worlds/world2.jpg",
  },
  {
    n: "03",
    title: "THE MONEY",
    desc: "Understand how creators earn and keep more of their income.",
    bullets: [
      "Commission comparison",
      "Affiliate marketing education",
      "UGC pricing",
      "Brand deal negotiations",
      "Income calculators",
      "Monetization strategies",
    ],
    img: "/worlds/world3.jpg",
  },
  {
    n: "04",
    title: "THE GROWTH ENGINE",
    desc: "Improve your skills across every major creator platform.",
    bullets: [
      "TikTok education",
      "YouTube education",
      "Instagram education",
      "Audience growth",
      "Algorithm updates",
      "Analytics education",
    ],
    img: "/worlds/world4.jpg",
  },
  {
    n: "05",
    title: "THE CREATOR INTELLIGENCE",
    desc: "Intelligent tools that help creators make better decisions.",
    bullets: [
      "AI Video Doctor",
      "Script generator",
      "Hook generator",
      "Content idea engine",
      "Brand matching",
      "Content improvement recommendations",
    ],
    img: "/worlds/world5.jpg",
  },
  {
    n: "06",
    title: "THE OPPORTUNITY RADAR",
    desc: "Find ways to work with brands and discover new income opportunities.",
    bullets: [
      "New affiliate programs",
      "UGC opportunities",
      "Brand ambassador programs",
      "Paid campaigns",
      "Product seeding",
      "Creator opportunities",
    ],
    img: "/worlds/world6.jpg",
    href: "/brands",
    cta: "Scan the Radar",
  },
  {
    n: "07",
    title: "THE KNOWLEDGE VAULT",
    desc: "An organized library of everything a creator needs to know.",
    bullets: [
      "Free guides",
      "Downloadable resources",
      "Creator checklists",
      "Templates",
      "Tutorials",
      "Industry research",
    ],
    img: "/worlds/world7.jpg",
  },
];

const TRUST: { pill: string; bg: string; fg: string; title: string; body: string }[] = [
  {
    pill: "Verified",
    bg: "#052e16",
    fg: "#4ade80",
    title: "Confirmed information",
    body: "Official commission rate, program terms, payment conditions and application links confirmed against sources.",
  },
  {
    pill: "Brand reported",
    bg: "#0b2447",
    fg: "#60a5fa",
    title: "Information supplied by the brand",
    body: "Claims and benefits provided directly by the company but not independently verified.",
  },
  {
    pill: "Creator reported",
    bg: "#3a1c05",
    fg: "#fb923c",
    title: "Real creator experiences",
    body: "Reviews and experiences with dates, context and moderation.",
  },
  {
    pill: "Research lead",
    bg: "#26262e",
    fg: "#d4d4d8",
    title: "Potential opportunity",
    body: "A worthwhile brand to approach even when it has no publicly advertised creator campaign.",
  },
];

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#2e1a5e",
  color: "#c084fc",
  borderRadius: 999,
  padding: "4px 14px",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 2,
};

export default function LandingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      <section
        style={{
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid #3d2a6e",
          boxShadow: "0 0 60px rgba(168,85,247,0.35)",
          backgroundImage: "url(/worlds/hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(7,3,19,0.30) 0%, rgba(7,3,19,0.55) 55%, rgba(7,3,19,0.88) 100%)",
            padding: "72px 28px 56px",
            textAlign: "center",
          }}
        >
          <span style={pillStyle}>THE CREATOR UNIVERSE</span>
          <h1
            style={{
              fontSize: 56,
              margin: "18px 0 10px",
              fontWeight: 800,
              letterSpacing: 1,
              background:
                "linear-gradient(92deg, #ffffff 15%, #c084fc 52%, #e879f9 78%, #22d3ee 105%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "none",
            }}
          >
            UltraVestra
          </h1>
          <p style={{ fontSize: 21, margin: "0 auto", maxWidth: 640, fontWeight: 600 }}>
            Less time searching. More time creating.
            <br />
            Smarter brand partnerships.
          </p>
          <p
            style={{
              fontSize: 16,
              color: "#ddd0ff",
              maxWidth: 620,
              margin: "14px auto 0",
            }}
          >
            The UGC brand intelligence platform. Find the brands worth pitching,
            see the right contact, understand what creators actually earn, and
            send a professional pitch — all in one place.
          </p>
          <form
            action="/brands"
            method="get"
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              name="q"
              placeholder="Search brands in the Galaxy…"
              style={{
                width: 340,
                maxWidth: "85vw",
                padding: "13px 18px",
                borderRadius: 999,
                border: "1px solid #a855f7",
                background: "rgba(10,5,28,0.82)",
                boxShadow: "0 0 22px rgba(168,85,247,0.35)",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "13px 26px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(92deg, #a855f7, #e879f9)",
                color: "#ffffff",
                fontWeight: 700,
                boxShadow: "0 0 26px rgba(232,121,249,0.5)",
              }}
            >
              Search
            </button>
          </form>
          <p
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/brands"
              style={{
                border: "1px solid #c084fc",
                background: "rgba(27,18,61,0.75)",
                padding: "11px 22px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Browse brands
            </Link>
            <Link
              href="/pricing"
              style={{
                border: "1px solid #3d2a6e",
                background: "rgba(10,5,28,0.6)",
                padding: "11px 22px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              See plans
            </Link>
          </p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: 1 }}>
          EXPLORE THE UNIVERSE
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 }}>
          Seven worlds. One platform. Everything a creator needs to find
          brands, make content, and get paid.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 22,
          }}
        >
          {WORLDS.map((w) => (
            <article
              key={w.n}
              style={{
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid #3d2a6e",
                background: "rgba(27,18,61,0.72)",
                boxShadow: "0 0 34px rgba(124,58,237,0.22)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={w.img}
                alt={w.title}
                style={{ width: "100%", display: "block", aspectRatio: "16/10", objectFit: "cover" }}
              />
              <div style={{ padding: "22px 24px 26px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <span style={{ ...pillStyle, alignSelf: "flex-start" }}>WORLD {w.n}</span>
                <h3 style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: 0.5 }}>
                  {w.title}
                </h3>
                <p style={{ margin: 0, color: "#ddd0ff", fontSize: 16 }}>{w.desc}</p>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20, lineHeight: 1.95, fontSize: 16 }}>
                  {w.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <p style={{ marginTop: "auto", paddingTop: 10 }}>
                  {w.href ? (
                    <Link
                      href={w.href}
                      style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        borderRadius: 999,
                        background: "linear-gradient(92deg, #a855f7, #e879f9)",
                        color: "#fff",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 0 20px rgba(232,121,249,0.45)",
                      }}
                    >
                      {w.cta} →
                    </Link>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "1px solid #3d2a6e",
                        color: "#b3a6e0",
                        fontSize: 13,
                        letterSpacing: 1.5,
                        fontWeight: 700,
                      }}
                    >
                      COMING SOON
                    </span>
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: 1 }}>
          EVERY FACT HAS A SOURCE
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 }}>
          This is non-negotiable. Every brand listing in UltraVestra
          distinguishes:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {TRUST.map((t) => (
            <article
              key={t.pill}
              style={{
                border: "1px solid #3d2a6e",
                background: "rgba(27,18,61,0.72)",
                borderRadius: 20,
                padding: 22,
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: t.bg,
                    color: t.fg,
                    borderRadius: 999,
                    padding: "4px 13px",
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  {t.pill}
                </span>
                <strong style={{ fontSize: 17.5 }}>{t.title}</strong>
              </p>
              <p style={{ margin: 0, color: "#ddd0ff", fontSize: 15 }}>{t.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          border: "1px solid #3d2a6e",
          borderRadius: 24,
          background:
            "radial-gradient(600px 260px at 50% -10%, rgba(232,121,249,0.25), transparent 65%), rgba(27,18,61,0.72)",
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        <span style={pillStyle}>ASK ULTRAVESTRA</span>
        <h2 style={{ fontSize: 28, margin: "14px 0 8px" }}>
          An intelligent research assistant
        </h2>
        <p style={{ color: "#ddd0ff", maxWidth: 560, margin: "0 auto", fontSize: 16 }}>
          Ask UltraVestra brings together everything in the platform — brands,
          commissions, contacts and creator intelligence — and answers in one
          place. In training now.
        </p>
        <p style={{ marginTop: 18 }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #3d2a6e",
              color: "#b3a6e0",
              fontSize: 13,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            COMING SOON
          </span>
        </p>
      </section>
    </div>
  );
}
