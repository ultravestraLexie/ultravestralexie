import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SolveMyProblem from "@/components/SolveMyProblem";
import {
  MISSION,
  PROMISE,
  IDENTITY,
  PHILOSOPHY,
  PAGE_STANDARD,
  PAGE_STANDARD_LINE,
  DEPARTMENTS,
  PATHWAY,
  SIGNATURE_TOOLS,
  SUCCESS_MEASURES,
  HONESTY_LINE,
  ULTIMATE_GOAL,
  THE_DIFFERENCE,
} from "@/lib/universe";

export const dynamic = "force-dynamic";

/* ULTRAVESTRA — THE CREATOR PROBLEM-SOLVING UNIVERSE.
 * The homepage is a problem-solving entry point, not a library.
 * A creator arrives with a problem — nobody watches, nobody buys,
 * no brands, no growth — and the page starts there: SOLVE MY
 * PROBLEM is the centerpiece, the six departments are organized
 * around the problems they solve, and every lesson follows the
 * same pathway: Identify → Diagnose → Understand → See It →
 * Practice It → Measure Improvement. Other websites give creators
 * tips. UltraVestra helps them solve the problems behind their
 * results. */

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

const sectionTitle: React.CSSProperties = { fontSize: 30, margin: "0 0 6px", letterSpacing: 1 };
const sectionSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 22px", fontSize: 16 };
const cardStyle: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 20,
  padding: 22,
  height: "100%",
};

export default async function LandingPage() {
  /* The brand count is read live from the published database records —
   * UltraVestra never advertises a number the records do not back. */
  let brandCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase.from("brands").select("id", { count: "exact", head: true }).eq("status", "published");
    brandCount = count ?? 0;
  } catch {
    brandCount = 0;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {/* ============ 1. HERO ============ */}
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
          <span style={pillStyle}>THE CREATOR PROBLEM-SOLVING UNIVERSE</span>
          <h1
            className="wow-title"
            style={{
              fontSize: "clamp(30px, 10vw, 68px)",
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
          <p style={{ fontSize: 14.5, color: "#67e8f9", fontWeight: 700, margin: "10px auto 0", letterSpacing: 0.3, maxWidth: 680 }}>
            Most platforms teach you how to post. UltraVestra teaches you how to make people stop, watch, trust, and buy.
          </p>
          <p
            style={{
              margin: "22px auto 0",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 3.5,
              background: "linear-gradient(92deg, #f0abfc, #a855f7 55%, #22d3ee)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {IDENTITY.beyond}
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
              ["Improve my videos", "/why-is-my-video-not-working"],
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
              brandCount > 0 ? [String(brandCount), "brands researched & sourced"] : ["New", "brands added every week"],
              ["6", "departments built around your problems"],
              ["5", "signature tools to practice with"],
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

      {/* ============ 2. SOLVE MY PROBLEM — the centerpiece ============ */}
      <section>
        <p style={{ textAlign: "center", margin: "0 0 18px", fontSize: 16, color: "#ddd0ff" }}>
          Our mission: <strong style={{ color: "#f0abfc" }}>{MISSION}</strong>
        </p>
        <SolveMyProblem />
      </section>

      {/* ============ 2b. THE ULTRA VESTRA PHILOSOPHY — the defining statement ============ */}
      <section
        style={{
          border: "1px solid #d946ef",
          borderRadius: 28,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168,85,247,0.28) 0%, rgba(26,8,54,0.9) 60%, rgba(13,2,33,0.95) 100%)",
          boxShadow: "0 0 44px rgba(217,70,239,0.30)",
          padding: "52px 28px 46px",
          textAlign: "center",
        }}
      >
        <span style={pillStyle}>THE ULTRA VESTRA PHILOSOPHY</span>
        <h2
          style={{
            fontSize: 40,
            margin: "26px auto 0",
            fontWeight: 800,
            letterSpacing: 1.5,
            lineHeight: 1.2,
            color: "#b3a6e0",
            maxWidth: 900,
          }}
        >
          {PHILOSOPHY.line1}
        </h2>
        <p
          className="wow-title"
          style={{
            fontSize: 52,
            margin: "6px auto 0",
            fontWeight: 800,
            letterSpacing: 1.5,
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {PHILOSOPHY.line2}
        </p>
        <p style={{ fontSize: 21, margin: "20px auto 0", color: "#f3e8ff", fontWeight: 600, maxWidth: 640 }}>
          {PHILOSOPHY.sub}
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 30,
          }}
        >
          {PHILOSOPHY.steps.replace(/\.$/, "").split(". ").map((s, i, arr) => (
            <span key={s} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span
                style={{
                  border: "1px solid #22d3ee",
                  background: "rgba(8,47,73,0.55)",
                  color: "#67e8f9",
                  borderRadius: 999,
                  padding: "9px 20px",
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                }}
              >
                {s}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: "#e879f9", fontSize: 18, fontWeight: 800 }}>→</span>
              )}
            </span>
          ))}
        </div>

        <div style={{ maxWidth: 680, margin: "38px auto 0", textAlign: "left" }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: 2.5,
              color: "#67e8f9",
              textAlign: "center",
            }}
          >
            WHAT THIS MEANS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PAGE_STANDARD.map((p) => (
              <p key={p.dont} style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>
                <span style={{ color: "#8f83b8" }}>{p.dont}</span>{" "}
                <strong style={{ color: "#f3e8ff" }}>{p.instead}</strong>
              </p>
            ))}
          </div>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: 15.5,
              color: "#f0abfc",
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.55,
            }}
          >
            Our standard:{" "}{PAGE_STANDARD_LINE}
          </p>
        </div>

        <p
          style={{
            margin: "34px 0 0",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 3.5,
            background: "linear-gradient(92deg, #f0abfc, #a855f7 55%, #22d3ee)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {PHILOSOPHY.tagline}
        </p>
      </section>

      {/* ============ 3. THE SIX DEPARTMENTS ============ */}
      <section>
        <h2 style={sectionTitle}>THE SIX DEPARTMENTS</h2>
        <p style={sectionSub}>
          The entire universe is built around problems — each department exists
          because creators are stuck on one. Find yours, and the solutions are
          already organized.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 22,
          }}
        >
          {DEPARTMENTS.map((d) => (
            <article
              key={d.n}
              className="glass-card"
              style={{
                borderRadius: 24,
                border: "1px solid #7e22ce",
                background: "rgba(26,8,54,0.78)",
                boxShadow: "0 0 34px rgba(168,85,247,0.35)",
                padding: "22px 24px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span style={{ ...pillStyle, alignSelf: "flex-start" }}>DEPARTMENT {d.n}</span>
              <h3 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: 0.5 }}>
                {d.name}
              </h3>
              <p style={{ margin: 0, fontSize: 16.5, color: "#f0abfc", fontWeight: 700, fontStyle: "italic" }}>
                &ldquo;{d.problem}&rdquo;
              </p>
              <p style={{ margin: 0, color: "#ddd0ff", fontSize: 15.5, lineHeight: 1.55 }}>{d.solutions}</p>
              <ul style={{ margin: "2px 0 0", paddingLeft: 20, lineHeight: 1.9, fontSize: 15 }}>
                {d.tools.map((t) => (
                  <li key={t.name}>
                    <Link href={t.href} style={{ color: "#67e8f9", textDecoration: "none", fontWeight: 600 }}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: "auto", paddingTop: 10 }}>
                <Link
                  href={d.href}
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
                  Enter the department →
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ 4. THE PATHWAY ============ */}
      <section>
        <h2 style={sectionTitle}>EVERY PROBLEM HAS A SOLUTION PATHWAY</h2>
        <p style={sectionSub}>
          Every lesson in UltraVestra follows the same six steps — so you never
          just learn something. You work the problem until it improves.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "stretch",
          }}
        >
          {PATHWAY.map((p, i) => (
            <div key={p.step} style={{ display: "flex", gap: 10, alignItems: "stretch", flex: "1 1 150px" }}>
              <div
                className="glass-card"
                style={{
                  border: "1px solid #7e22ce",
                  background: "rgba(26,8,54,0.78)",
                  borderRadius: 16,
                  padding: "16px 16px 18px",
                  flex: 1,
                }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#67e8f9" }}>
                  STEP {i + 1}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: 17.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {p.step}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#ddd0ff", lineHeight: 1.5 }}>{p.line}</p>
              </div>
              {i < PATHWAY.length - 1 && (
                <span style={{ alignSelf: "center", color: "#e879f9", fontSize: 20, fontWeight: 800 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ 5. FIVE SIGNATURE TOOLS ============ */}
      <section>
        <h2 style={sectionTitle}>FIVE SIGNATURE TOOLS</h2>
        <p style={sectionSub}>
          Understanding is not enough — these are the tools that turn it into
          practice.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {SIGNATURE_TOOLS.map((t) => (
            <Link key={t.name} href={t.href} style={{ textDecoration: "none" }}>
              <article className="glass-card" style={cardStyle}>
                <p style={{ margin: "0 0 10px" }}>
                  <span
                    style={{
                      background: "#052e16",
                      color: "#4ade80",
                      borderRadius: 999,
                      padding: "4px 13px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {t.name === "Brand Intelligence Database" && brandCount > 0
                      ? `Live — ${brandCount} brands researched & sourced`
                      : t.status}
                  </span>
                </p>
                <strong style={{ fontSize: 18.5 }}>{t.name}</strong>
                <p style={{ margin: "8px 0 0", color: "#ddd0ff", fontSize: 15, lineHeight: 1.55 }}>{t.what}</p>
                <p style={{ margin: "12px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 15 }}>Open the tool →</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ 6a. FOUR QUESTIONS ============ */}
      <section>
        <h2 style={sectionTitle}>FOUR QUESTIONS. ONE PLATFORM.</h2>
        <p style={sectionSub}>
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
              href: "/discover",
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
            <Link key={c.q} href={c.href} style={{ textDecoration: "none" }}>
              <article className="glass-card" style={cardStyle}>
                <strong style={{ fontSize: 19 }}>{c.q}</strong>
                <p style={{ margin: "8px 0 0", color: "#ddd0ff", fontSize: 15 }}>{c.a}</p>
                <p style={{ margin: "12px 0 0", color: "#67e8f9", fontWeight: 700, fontSize: 15 }}>Answer it →</p>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ 6b. THE INTELLIGENCE LAYER ============ */}
      <section>
        <h2 style={sectionTitle}>THE INTELLIGENCE LAYER</h2>
        <p style={{ ...sectionSub, maxWidth: 720 }}>
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

      {/* ============ 7. SUCCESS MEASURES ============ */}
      <section>
        <h2 style={sectionTitle}>WE DON&rsquo;T MEASURE ARTICLES. WE MEASURE CREATOR PROGRESS.</h2>
        <p style={{ ...sectionSub, maxWidth: 760 }}>
          Our promise:{" "}{PROMISE} So success here is not how much gets published —
          it is whether creators actually get better.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {SUCCESS_MEASURES.map((s) => (
            <article
              key={s.outcome}
              style={{
                border: "1px solid #3d2a6e",
                background: "rgba(27,18,61,0.72)",
                borderRadius: 16,
                padding: "16px 20px",
              }}
            >
              <strong style={{ fontSize: 16.5 }}>{s.outcome}</strong>
              <p style={{ margin: "4px 0 0", color: "#ddd0ff", fontSize: 14.5 }}>{s.measure}</p>
            </article>
          ))}
        </div>
        <p style={{ margin: "18px 0 0", fontSize: 15, color: "#f0abfc", fontWeight: 700 }}>
          {HONESTY_LINE}
        </p>
      </section>

      {/* ============ 8. CLOSING — the ultimate goal ============ */}
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
              "linear-gradient(180deg, rgba(2,0,8,0.35) 20%, rgba(2,0,8,0.95) 85%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            textAlign: "center",
            padding: "30px 28px 40px",
          }}
        >
          <span style={pillStyle}>THE PLACE CREATORS RETURN TO WHEN THEY GET STUCK</span>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {ULTIMATE_GOAL.map((q) => (
              <p key={q} style={{ margin: 0, fontSize: 17.5, color: "#f3e8ff", fontWeight: 600, fontStyle: "italic" }}>
                &ldquo;{q}&rdquo;
              </p>
            ))}
          </div>
          <h2
            className="wow-title"
            style={{ fontSize: 32, margin: "24px auto 8px", fontWeight: 800, maxWidth: 780, lineHeight: 1.35 }}
          >
            {THE_DIFFERENCE}
          </h2>
          <p style={{ margin: 0, fontSize: 16.5, color: "#67e8f9", fontWeight: 700, letterSpacing: 0.4 }}>
            {IDENTITY.dontJust}
          </p>
          <p
            style={{
              margin: "14px 0 0",
              fontSize: 13.5,
              fontWeight: 800,
              letterSpacing: 3,
              color: "#c084fc",
            }}
          >
            {IDENTITY.intelligence}
          </p>
          <p style={{ marginTop: 22 }}>
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
