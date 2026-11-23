import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { initials, platformLabel } from "@/lib/galaxy/core";
import { Icon, I } from "@/components/galaxy/icons";

export const dynamic = "force-dynamic";

/* PUBLIC PASSPORT — /p/[slug]. Read-only, no login. Reads run
 * through the ANON client: the only rows RLS will return are
 * those belonging to a creator whose passport is public
 * (profiles.passport_public = true with a slug set — see
 * migration 2026-11-23-galaxy-redesign.sql), and for deals only
 * stage='paid'. A private or unknown slug finds nothing and
 * 404s. Verified = paid deals tracked in Ultra Vestra;
 * self-reported items are labelled as such, exactly like the
 * member view. */

export default async function PublicPassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) notFound();
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: prof } = await supabase
    .from("profiles")
    .select("id, passport_slug, passport_public")
    .eq("passport_slug", slug)
    .eq("passport_public", true)
    .maybeSingle();
  if (!prof) notFound();
  const userId = (prof as { id: string }).id;

  const [{ data: bp }, { data: dealRows }, { data: entryRows }] = await Promise.all([
    supabase
      .from("creator_business_profiles")
      .select("creator_name, content_categories, platforms, audience_demographics")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("creator_deals")
      .select("brand_name, deliverables, payment_received_date")
      .eq("user_id", userId)
      .eq("stage", "paid")
      .order("payment_received_date", { ascending: false }),
    supabase
      .from("passport_entries")
      .select("section, payload")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const profile = bp as {
    creator_name: string | null;
    content_categories: string[] | null;
    platforms: string[] | null;
    audience_demographics: string | null;
  } | null;
  const name = profile?.creator_name ?? "Ultra Vestra creator";
  const niche = profile?.content_categories?.[0] ?? "";
  const platforms = profile?.platforms ?? [];
  const paidDeals = (dealRows ?? []) as {
    brand_name: string;
    deliverables: string;
    payment_received_date: string | null;
  }[];
  const entries = (entryRows ?? []) as {
    section: string;
    payload: Record<string, string>;
  }[];
  const collabs = entries.filter((e) => e.section === "collaborations");
  const testimonials = entries.filter((e) => e.section === "testimonials");
  const brandsPaid = new Set(paidDeals.map((d) => d.brand_name)).size;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <section className="gx-panel">
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 22, alignItems: "center" }}>
          <div
            aria-hidden="true"
            className="gx-pass-avatar"
            style={{
              borderRadius: "50%",
              padding: 3,
              background: "conic-gradient(from 200deg,#9B5CFF,#4C74FF,#5FD0FF,#9B5CFF)",
              boxShadow: "0 0 34px -6px rgba(130,110,255,.8)",
            }}
          >
            <div
              className="gx-pass-avatar-inner"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "radial-gradient(circle at 35% 30%,#24307A,#090D33)",
              }}
            >
              {initials(name)}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="gx-pass-name">{name}</h1>
            <p style={{ margin: "6px 0 0", color: "var(--ink-2)" }}>
              {[
                niche ? `${niche} creator` : "",
                platforms.length ? `on ${platforms.map(platformLabel).join(", ")}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
            {profile?.audience_demographics ? (
              <p className="gx-muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
                Audience: {profile.audience_demographics}
              </p>
            ) : null}
          </div>
        </div>
        <div className="gx-figs">
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">{paidDeals.length}</strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Verified collaborations</span>
          </div>
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">{brandsPaid}</strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Brands paid them</span>
          </div>
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">
              {collabs.length + testimonials.length}
            </strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Self-reported items</span>
          </div>
        </div>
      </section>

      <div className="gx-pass-grid">
        <section className="gx-panel" aria-labelledby="p-col-h">
          <div className="gx-panel-head">
            <h2 id="p-col-h">Collaborations</h2>
          </div>
          {paidDeals.length || collabs.length ? (
            <ul className="gx-list">
              {paidDeals.map((d, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 14px", padding: "13px 0", alignItems: "start" }}>
                  <div>
                    <strong>{d.brand_name}</strong>
                    <small style={{ display: "block", color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
                      {d.deliverables || "Brand partnership"}
                      {d.payment_received_date
                        ? `, paid ${new Date(d.payment_received_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                        : ""}
                    </small>
                  </div>
                  <span className="gx-pill gx-pill-ver">
                    <Icon html={I.ver} size={13} /> Verified
                  </span>
                </li>
              ))}
              {collabs.map((c, i) => (
                <li key={`c${i}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 14px", padding: "13px 0", alignItems: "start" }}>
                  <div>
                    <strong>{c.payload.brandName}</strong>
                    <small style={{ display: "block", color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
                      {[c.payload.campaignDescription, c.payload.deliverables].filter(Boolean).join(" — ")}
                      {c.payload.dateRange ? `, ${c.payload.dateRange}` : ""}
                    </small>
                  </div>
                  <span className="gx-pill">Self-reported</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="gx-empty">
              <p>No collaborations listed yet.</p>
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "14px 0 0" }}>
            Verified means the deal was tracked in Ultra Vestra from pitch to payment. Anything
            the creator added themselves is labelled self-reported.
          </p>
        </section>

        <section className="gx-panel" aria-labelledby="p-tst-h">
          <div className="gx-panel-head">
            <h2 id="p-tst-h">What brands say</h2>
          </div>
          {testimonials.length ? (
            <div>
              {testimonials.map((t, i) => (
                <blockquote key={i} style={{ margin: 0, padding: "14px 0", borderTop: "1px solid var(--line)" }}>
                  <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55 }}>“{t.payload.quote}”</p>
                  <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>
                    <span>
                      {[t.payload.authorName, t.payload.authorRole].filter(Boolean).join(", ")}
                    </span>
                    <span className="gx-pill">Self-reported</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="gx-empty">
              <p>No testimonials yet.</p>
            </div>
          )}
        </section>
      </div>

      <p style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, marginTop: 26 }}>
        Track record verified by Ultra Vestra — the Creator Business OS.
      </p>
    </div>
  );
}
