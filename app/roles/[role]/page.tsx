import Link from "next/link";
import { notFound } from "next/navigation";
import { MKT_CSS } from "@/lib/marketplace-css";
import { Icon } from "@/components/marketplace/Mkt";
import { ROLES, otherRoles, roleBySlug } from "@/lib/roles";

/* ROLE EXPLAINER — one page per "Who are you?" card (owner order
 * 2026-11-24 ~11:39 CT: "make sure when you click each one it work
 * and lead you to explain what each would be look for. Make all four
 * lead to things"). Explains what the role is looking for and what
 * it gets on UltraVestra, then hands off to the real flow. Public:
 * /roles is not in GATED_PREFIXES. */

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }));
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const info = roleBySlug(role);
  if (!info) notFound();
  const others = otherRoles(info.slug);

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
          <p>
            <Link href="/" className="muted">
              ← Who are you?
            </Link>
          </p>
          <section className="hero" style={{ textAlign: "left" }}>
            <span
              className="ico"
              style={{
                background: info.bg,
                color: info.fg,
                display: "inline-flex",
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={info.icon} />
            </span>
            <div className="label" style={{ color: info.fg, marginTop: 14 }}>
              {info.label}
            </div>
            <h1>{info.title}</h1>
            <p>{info.desc}</p>
          </section>

          <div className="section-head">
            <h2>What you’re looking for</h2>
          </div>
          <div className="glass pad">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {info.lookingFor.map((line) => (
                <li key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: info.fg, flexShrink: 0, marginTop: 2 }}>
                    <Icon name="check" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="section-head">
            <h2>What you get on UltraVestra</h2>
          </div>
          <div className="glass pad">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {info.gets.map((line) => (
                <li key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: info.fg, flexShrink: 0, marginTop: 2 }}>
                    <Icon name="check" />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="note">{info.note}</p>
          <Link href={info.ctaHref} className="btn gold block">
            {info.ctaLabel}
            <Icon name="arrow" />
          </Link>

          <div className="section-head">
            <h2>Not you? Pick again</h2>
          </div>
          <div className="stack">
            {others.map((r) => (
              <Link key={r.slug} href={`/roles/${r.slug}`} className="glass role-card">
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
          <div className="foot">POWERED BY ULTRA VESTRA · CREATE. GROW. BUILD.</div>
        </div>
      </div>
    </div>
  );
}
