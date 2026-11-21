import Link from "next/link";

const WORLDS: {
  n: string;
  title: string;
  desc: string;
  bullets: string[];
  img: string;
  href?: string;
  cta?: string;
  tag?: string;
}[] = [
  {
    n: "01",
    title: "THE BRAND GALAXY",
    desc: "Opportunity discovery: brands worth knowing, researching and working with — with the Opportunity Radar built in.",
    bullets: [
      "Brand intelligence database",
      "Affiliate program directory",
      "Opportunity Radar — new programs & campaigns",
      "Commission and payment research",
      "Brand contact information",
      "Ready-to-use outreach pitches",
      "Brand ambassador programs & product seeding",
      "Brand Trust Index",
    ],
    img: "/worlds/tablet.jpg",
    href: "/brands",
    cta: "Enter the Brand Galaxy",
    tag: "NOW WITH THE OPPORTUNITY RADAR",
  },
  {
    n: "02",
    title: "THE CONTENT LAB",
    desc: "Video education: learn to create content that captures attention and converts.",
    bullets: [
      "Viral hook techniques",
      "Product-selling videos",
      "Creator video tutorials",
      "Filming and editing",
      "Storytelling and persuasion",
      "Video breakdowns",
    ],
    img: "/worlds/world2.jpg",
    href: "/coach",
    cta: "Enter the Content Lab",
  },
  {
    n: "03",
    title: "THE MONEY",
    desc: "Earnings intelligence: understand how creators earn and keep more of their income.",
    bullets: [
      "Commission comparison",
      "Affiliate marketing education",
      "Creator pricing",
      "Brand deal negotiations",
      "Income calculators",
      "Monetization strategies",
    ],
    img: "/worlds/world3.jpg",
    href: "/commissions",
    cta: "Enter The Money",
  },
  {
    n: "04",
    title: "THE GROWTH ENGINE",
    desc: "Platform growth: improve your skills across every major creator platform.",
    bullets: [
      "TikTok education",
      "YouTube education",
      "Instagram education",
      "Audience growth",
      "Algorithm updates",
      "Analytics education",
    ],
    img: "/worlds/world4.jpg",
    href: "/academy?cat=Growth",
    cta: "Enter the Growth Engine",
  },
  {
    n: "05",
    title: "THE CREATOR INTELLIGENCE",
    desc: "The central brain of UltraVestra. Ask it anything about your creator business — it answers from the researched database: brands worth approaching, published commissions, contacts, a ready pitch, video concepts and a filming blueprint.",
    bullets: [
      "Ask UltraVestra — sourced research reports",
      "Video Lab — why a video performs or stalls",
      "Script Studio — scripts built from your facts",
      "Brand matching & Opportunity Scores",
      "Content improvement recommendations",
    ],
    img: "/worlds/control.jpg",
    href: "/ask",
    cta: "Ask the Brain",
    tag: "THE CENTRAL BRAIN",
  },
  {
    n: "06",
    title: "THE KNOWLEDGE VAULT",
    desc: "The creator resource center: an organized library of everything a creator needs to know.",
    bullets: [
      "Free guides",
      "Downloadable resources",
      "Creator checklists",
      "Templates",
      "Tutorials",
      "Industry research",
    ],
    img: "/worlds/world7.jpg",
    href: "/academy",
    cta: "Open the Vault",
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
        className="portal-hero"
        style={{
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid #d946ef",
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
            className="wow-title"
            style={{
              fontSize: 68,
              margin: "18px 0 10px",
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            UltraVestra
          </h1>
          <p style={{ fontSize: 31, margin: "0 auto", maxWidth: 720, fontWeight: 800, lineHeight: 1.25 }}>
            The Intelligence Behind Your Creator Business.
          </p>
          <p
            style={{
              fontSize: 16.5,
              color: "#ddd0ff",
              maxWidth: 640,
              margin: "12px auto 0",
            }}
          >
            Discover where to grow, what to promote, how to earn, and how to create
            content that converts — across the platforms you already use.
          </p>
          <p style={{ fontSize: 15, color: "#f0abfc", fontWeight: 700, margin: "10px auto 0", letterSpacing: 0.4 }}>
            Search smarter. Find better brands. Create content that sells.
          </p>
          <form
            action="/discover"
            method="get"
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 26,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              name="q"
              placeholder="Search anything… e.g. beauty brands with uncapped commissions"
              style={{
                width: 460,
                maxWidth: "88vw",
                padding: "14px 20px",
                borderRadius: 999,
                border: "1px solid #a855f7",
                background: "rgba(10,5,28,0.85)",
                boxShadow: "0 0 26px rgba(168,85,247,0.4)",
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              className="neon-btn"
              style={{
                padding: "14px 30px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(92deg, #a855f7, #e879f9)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 16,
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
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              ["Find brands", "/discover?q=brands+with+affiliate+programs"],
              ["Find commissions", "/discover?q=uncapped+commissions"],
              ["Find campaigns", "/discover?q=brands+accepting+applications"],
              ["Improve my videos", "/academy"],
              ["Find brand contacts", "/discover?q=brand+contacts"],
              ["Learn creator skills", "/academy"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                style={{
                  border: "1px solid #c084fc",
                  background: "rgba(27,18,61,0.78)",
                  padding: "10px 20px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {label}
              </Link>
            ))}
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 30,
            }}
          >
            {[
              ["400+", "brands researched & sourced"],
              ["2", "search engines — database + live web"],
              ["5", "connected experiences"],
            ].map(([num, label]) => (
              <div
                key={label}
                className="float-slow"
                style={{
                  border: "1px solid #d946ef",
                  background: "rgba(13,2,33,0.72)",
                  borderRadius: 18,
                  padding: "12px 22px",
                  boxShadow: "0 0 24px rgba(217,70,239,0.4)",
                  minWidth: 170,
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    background: "linear-gradient(92deg, #f0abfc, #22d3ee)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {num}
                </div>
                <div style={{ fontSize: 13.5, color: "#ddd0ff" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: 1 }}>
          EXPLORE THE UNIVERSE
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 }}>
          Six worlds. One journey. Everything a creator needs to find
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
              className="glass-card"
              style={{
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid #7e22ce",
                background: "rgba(26,8,54,0.78)",
                boxShadow: "0 0 34px rgba(168,85,247,0.35)",
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
                <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ ...pillStyle, alignSelf: "flex-start" }}>WORLD {w.n}</span>
                  {w.tag && (
                    <span style={{ ...pillStyle, alignSelf: "flex-start", background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff" }}>{w.tag}</span>
                  )}
                </span>
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
          THE INTELLIGENCE LAYER
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16, maxWidth: 720 }}>
          UltraVestra does not compete with the platforms you already create on.
          It is the intelligence layer that helps you succeed on all of them.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
          {[
            ["TikTok", "helps creators sell."],
            ["Amazon", "helps creators monetize."],
            ["eBay", "helps creators refer buyers."],
            ["Instagram", "helps creators collaborate."],
            ["Trybe", "helps creators work with brands."],
          ].map(([name, line]) => (
            <p key={name} style={{ margin: 0, fontSize: 16.5, color: "#ddd0ff" }}>
              <strong style={{ color: "#f3e8ff" }}>{name}</strong> {line}
            </p>
          ))}
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 19,
              lineHeight: 1.5,
              background: "linear-gradient(92deg, #f0abfc, #67e8f9)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 800,
            }}
          >
            UltraVestra helps you figure out where to go, what to promote, what
            you could earn, and how to create content that converts.
          </p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: 1 }}>
          FOUR QUESTIONS. ONE PLATFORM.
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 }}>
          Search smarter. Find better brands. Create content that sells.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {[
            {
              href: "/radar",
              q: "Where should I go?",
              a: "Find relevant creator opportunities across platforms.",
            },
            {
              href: "/brands",
              q: "What should I promote?",
              a: "Research brands, products, and audience fit.",
            },
            {
              href: "/commissions",
              q: "What could I earn?",
              a: "Compare commission structures and earning terms.",
            },
            {
              href: "/coach",
              q: "How do I sell better?",
              a: "Learn hooks, scripts, video strategy, and conversion.",
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
              <article
                className="glass-card"
                style={{
                  border: "1px solid #7e22ce",
                  background: "rgba(26,8,54,0.78)",
                  borderRadius: 20,
                  padding: 22,
                  height: "100%",
                }}
              >
                <strong style={{ fontSize: 19 }}>{c.q}</strong>
                <p style={{ margin: "8px 0 0", color: "#ddd0ff", fontSize: 15 }}>{c.a}</p>
                <p style={{ margin: "12px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 15 }}>Answer it →</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: 1 }}>
          THREE INTELLIGENCE CENTERS
        </h2>
        <p style={{ color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 }}>
          Built on the researched database — every number sourced, every limit
          labeled honestly.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {[
            {
              href: "/commissions",
              emoji: "💰",
              title: "Commission Intelligence Center",
              body: "Capped, uncapped and unknown commission limits — separated. Compare published rates, recurring terms and payment conditions before you create.",
            },
            {
              href: "/coach",
              emoji: "🔬",
              title: "Creator Video Intelligence Lab",
              body: "Run the diagnostic on your last video. Learn why it performed — or why it stalled — across hooks, demonstration, storytelling, retention and sales conversion.",
            },
            {
              href: "/radar",
              emoji: "📡",
              title: "Brand Opportunity Radar",
              body: "Brands accepting creators, brands worth pitching, emerging products, and quiet opportunities that are not widely advertised.",
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
              <article
                className="glass-card"
                style={{
                  border: "1px solid #7e22ce",
                  background: "rgba(26,8,54,0.78)",
                  borderRadius: 20,
                  padding: 22,
                  height: "100%",
                }}
              >
                <p style={{ margin: "0 0 10px", fontSize: 26 }}>{c.emoji}</p>
                <strong style={{ fontSize: 18 }}>{c.title}</strong>
                <p style={{ margin: "8px 0 0", color: "#ddd0ff", fontSize: 15 }}>{c.body}</p>
                <p style={{ margin: "12px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 15 }}>Open →</p>
              </article>
            </Link>
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
        className="portal-hero"
        style={{
          position: "relative",
          border: "1px solid #d946ef",
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/worlds/control.jpg"
          alt="Ask UltraVestra control room"
          style={{ width: "100%", display: "block", aspectRatio: "16/7", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(2,0,8,0.25) 30%, rgba(2,0,8,0.94) 88%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            textAlign: "center",
            padding: "30px 28px 36px",
          }}
        >
          <span style={pillStyle}>ASK ULTRAVESTRA — NOW LIVE</span>
          <h2 className="wow-title" style={{ fontSize: 34, margin: "14px 0 8px", fontWeight: 800 }}>
            The feature that makes UltraVestra famous
          </h2>
          <p style={{ color: "#f3e8ff", maxWidth: 620, margin: "0 auto", fontSize: 16.5 }}>
            &ldquo;I&rsquo;m a Trybe creator in beauty. I want brands with
            uncapped affiliate commissions, that work with smaller creators.
            Show me how to make better product videos.&rdquo; — Ask
            UltraVestra answers with a personalized research report: brands
            worth approaching, published commissions, contacts, a ready-to-use
            pitch, three video concepts, a script and a filming blueprint.
          </p>
          <p style={{ marginTop: 20 }}>
            <Link
              href="/ask"
              className="neon-btn"
              style={{
                display: "inline-block",
                padding: "14px 34px",
                borderRadius: 999,
                background: "linear-gradient(92deg, #a855f7, #d946ef 55%, #22d3ee 130%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 17,
                textDecoration: "none",
                boxShadow: "0 0 32px rgba(217,70,239,0.65)",
              }}
            >
              Ask UltraVestra →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
