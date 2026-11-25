import Link from "next/link";
import { MKT_CSS } from "@/lib/marketplace-css";
import { Icon } from "@/components/marketplace/Mkt";

/* LANDING — the owner's local-gigs prototype start screen, ordered
 * 2026-11-24: "Make sure the home page look exactly like this but
 * don't put marketplace put UltraVestra instead." The orbit hero,
 * the headline, the paragraph, the loop chips and the four role
 * cards are the prototype's, with the product named UltraVestra
 * everywhere. All four roles are live in this app (the prototype's
 * agency and brand cards were dead "Soon" cards), so every card
 * opens its role explainer at /roles/<role> — what that role is
 * looking for and what it gets — which hands off to the real flow:
 * creators to the plan-first signup, businesses and brands to free
 * business registration preselected as a brand, agencies preselected
 * as an agency (owner order 2026-11-24 ~11:39 CT: "Make all four
 * lead to things").
 *
 * The Universe landing presentation leaves the homepage; its
 * routes and lib/universe stay in the app untouched. */

function OrbitNode({
  x,
  y,
  c,
  t,
}: {
  x: number;
  y: number;
  c: string;
  t: string;
}) {
  const labelY = y > 150 ? y + 24 : y < 60 ? y - 14 : y + 24;
  return (
    <>
      <circle cx={x} cy={y} r="8" fill={c} filter="url(#mkt-gl)" />
      <text
        x={x}
        y={labelY}
        fill="#F2F4FF"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1"
        textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif"
      >
        {t}
      </text>
    </>
  );
}

const ROLES: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  bg: string;
  fg: string;
}[] = [
  {
    href: "/roles/creator",
    title: "I’m a creator",
    desc: "Find paid local gigs, get paid on time, and prove the customers you bring.",
    icon: "video",
    bg: "rgba(245,196,81,.16)",
    fg: "#F5C451",
  },
  {
    href: "/roles/business",
    title: "I’m a business",
    desc: "Post what you need, find local creators, and turn views into loyal customers.",
    icon: "store",
    bg: "rgba(62,230,224,.14)",
    fg: "#3EE6E0",
  },
  {
    href: "/roles/agency",
    title: "I’m an agency",
    desc: "Represent creators, pitch them to opportunities, and run campaigns for your clients.",
    icon: "building",
    bg: "rgba(255,156,200,.14)",
    fg: "#FF9CC8",
  },
  {
    href: "/roles/brand",
    title: "I’m a brand",
    desc: "Run campaigns with dozens of creators across cities, and keep your best as ambassadors.",
    icon: "crown",
    bg: "rgba(182,156,255,.16)",
    fg: "#B69CFF",
  },
];

const LOOP = ["Discovery", "Collaboration", "Marketing", "Customers", "Revenue", "Retention"];

export default function LandingPage() {
  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <div className="mkt-col" style={{ position: "relative" }}>
        <div className="sky" aria-hidden="true">
          <div className="stars" />
          <div className="glow g1" />
          <div className="glow g2" />
          <div className="glow g3" />
        </div>
        <div className="lift">
          <section className="hero">
            <svg
              className="orbit"
              viewBox="0 0 360 240"
              role="img"
              aria-label="Creators and businesses connected through Ultra Vestra"
            >
              <defs>
                <linearGradient id="mkt-og" x1="0" x2="1">
                  <stop offset="0" stopColor="#F5C451" />
                  <stop offset=".5" stopColor="#B69CFF" />
                  <stop offset="1" stopColor="#3EE6E0" />
                </linearGradient>
                <filter id="mkt-gl" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="180" cy="120" rx="150" ry="86" fill="none" stroke="rgba(130,150,255,.18)" />
              <g className="spin">
                <ellipse cx="180" cy="120" rx="150" ry="86" fill="none" stroke="url(#mkt-og)" strokeWidth="2.5" strokeDasharray="60 420" filter="url(#mkt-gl)" />
              </g>
              <circle cx="180" cy="120" r="44" fill="#0B1030" stroke="#B69CFF" strokeWidth="2" filter="url(#mkt-gl)" />
              <text x="180" y="118" fill="#F2F4FF" fontSize="16" fontWeight="700" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif">
                UV
              </text>
              <text x="180" y="134" fill="#A3ACD6" fontSize="8" fontWeight="700" letterSpacing="1.5" textAnchor="middle" fontFamily="Inter, sans-serif">
                CONNECTS
              </text>
              <OrbitNode x={38} y={120} c="#F5C451" t="CREATORS" />
              <OrbitNode x={322} y={120} c="#3EE6E0" t="BUSINESSES" />
              <OrbitNode x={180} y={30} c="#B69CFF" t="BRANDS" />
              <OrbitNode x={180} y={210} c="#FF9CC8" t="AGENCIES" />
            </svg>
            <div className="label" style={{ color: "var(--m-gold)" }}>
              UltraVestra
            </div>
            <h1>
              Where attention <span className="grad">becomes customers.</span>
            </h1>
            <p>
              Creators turn their talent for attention into income. Local
              businesses get real content, real customers and the tools to
              keep them coming back. You don’t need millions of followers to
              matter.
            </p>
            <ul className="loop" aria-label="How it works">
              {LOOP.map((s, i) => (
                <li key={s}>
                  <span>{s}</span>
                  {i < LOOP.length - 1 ? <Icon name="arrow" /> : null}
                </li>
              ))}
            </ul>
          </section>

          <div className="section-head">
            <h2>Who are you?</h2>
          </div>
          <div className="stack">
            {ROLES.map((r) => (
              <Link key={r.title} href={r.href} className="glass role-card">
                <span className="ico" style={{ background: r.bg, color: r.fg }}>
                  <Icon name={r.icon} />
                </span>
                <span className="grow">
                  <b>{r.title}</b>
                  <span className="d">{r.desc}</span>
                </span>
                <Icon name="chev" />
              </Link>
            ))}
          </div>
          <p className="note">
            Creators join free with a plan. Brands and agencies register free
            — no card required.
          </p>
          <div className="foot">POWERED BY ULTRA VESTRA · CREATE. GROW. BUILD.</div>
        </div>
      </div>
    </div>
  );
}
