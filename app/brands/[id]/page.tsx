import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SaveBrandButton from "@/components/SaveBrandButton";
import type {
  Brand,
  BrandContact,
  BrandEvidence,
  BrandScore,
  CompensationReport,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const SCORE_ROWS: {
  key: keyof Pick<
    BrandScore,
    | "niche_fit"
    | "ugc_evidence"
    | "compensation"
    | "contact_access"
    | "opportunity_availability"
    | "credibility"
  >;
  label: string;
  max: number;
}[] = [
  { key: "niche_fit", label: "Niche & content fit", max: 30 },
  { key: "ugc_evidence", label: "Evidence of creator collaborations", max: 20 },
  { key: "compensation", label: "Compensation attractiveness", max: 20 },
  { key: "contact_access", label: "Contact accessibility", max: 15 },
  { key: "opportunity_availability", label: "Opportunity availability", max: 10 },
  { key: "credibility", label: "Brand credibility", max: 5 },
];

function trustPill(confidence: string | null | undefined) {
  switch (confidence) {
    case "verified":
      return { label: "Verified", bg: "#052e16", fg: "#4ade80" };
    case "publicly_reported":
      return { label: "Brand reported", bg: "#0b2447", fg: "#60a5fa" };
    case "needs_review":
      return { label: "Research lead", bg: "#26262e", fg: "#d4d4d8" };
    default:
      return { label: confidence ?? "Research lead", bg: "#26262e", fg: "#d4d4d8" };
  }
}

function Pill({ confidence }: { confidence: string | null | undefined }) {
  const p = trustPill(confidence);
  return (
    <span
      style={{
        background: p.bg,
        color: p.fg,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {p.label}
    </span>
  );
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!brand) notFound();
  const b = brand as Brand;

  const [{ data: catLinks }, { data: contacts }, { data: socials },
    { data: products }, { data: evidence }, { data: comp },
    { data: scores }, { data: opps }, { data: affiliates },
    { data: terms }] = await Promise.all([
    supabase
      .from("brand_categories")
      .select("categories(name, slug)")
      .eq("brand_id", id),
    supabase.from("brand_contacts").select("*").eq("brand_id", id),
    supabase.from("brand_socials").select("*").eq("brand_id", id),
    supabase.from("brand_products").select("*").eq("brand_id", id),
    supabase
      .from("brand_evidence")
      .select("*")
      .eq("brand_id", id)
      .order("observed_at", { ascending: false }),
    supabase
      .from("compensation_reports")
      .select("*")
      .eq("brand_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("brand_scores")
      .select("*")
      .eq("brand_id", id)
      .order("scored_at", { ascending: false })
      .limit(1),
    supabase
      .from("opportunities")
      .select("*")
      .eq("brand_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("affiliate_programs").select("*").eq("brand_id", id),
    supabase.from("payment_terms").select("*").eq("brand_id", id),
  ]);

  const score = (scores?.[0] ?? null) as BrandScore | null;
  const categoryNames = (
    (catLinks ?? []) as unknown as { categories: { name: string } | null }[]
  )
    .map((l) => l.categories?.name)
    .filter(Boolean) as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{b.name}</h1>
          {score && (
            <span
              style={{
                background: "linear-gradient(92deg, #a855f7, #e879f9)",
                color: "#ffffff",
                borderRadius: 999,
                padding: "4px 14px",
                fontWeight: 700,
                boxShadow: "0 0 18px rgba(232,121,249,0.45)",
              }}
            >
              Opportunity Score: {Math.round(Number(score.total_score))} / 100
            </span>
          )}
          <SaveBrandButton brandId={b.id} />
        </div>
        {categoryNames.length > 0 && (
          <p style={{ color: "#b3a6e0" }}>{categoryNames.join(" · ")}</p>
        )}
        {b.description && <p style={{ maxWidth: 720 }}>{b.description}</p>}
        <p style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
          {b.website && (
            <a href={b.website} target="_blank" rel="noreferrer">
              Official website ↗
            </a>
          )}
          {(socials ?? []).map((s) => (
            <a key={s.id} href={s.url as string} target="_blank" rel="noreferrer">
              {s.platform as string}
              {s.handle ? ` (${s.handle as string})` : ""} ↗
            </a>
          ))}
          {b.country && <span>{b.country}</span>}
        </p>
      </header>

      {score && (
        <section>
          <h2>Why this score</h2>
          <table style={{ borderCollapse: "collapse", minWidth: 340 }}>
            <tbody>
              {SCORE_ROWS.map((row) => (
                <tr key={row.key}>
                  <td style={{ padding: "6px 12px 6px 0" }}>{row.label}</td>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>
                    {Number(score[row.key])} / {row.max}
                  </td>
                  <td style={{ padding: "6px 0 6px 16px", color: "#b3a6e0" }}>
                    {score.explanation?.[row.key] ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "#b3a6e0", fontSize: 13 }}>
            Scored {fmtDate(score.scored_at)}. A brand with no active campaign
            can still be an excellent prospect — the score separates
            &ldquo;worth pitching&rdquo; from &ldquo;verified open
            opportunity&rdquo;.
          </p>
        </section>
      )}

      <section>
        <h2>Who to contact</h2>
        {((contacts ?? []) as BrandContact[]).length === 0 ? (
          <p style={{ color: "#b3a6e0" }}>No public contact researched yet.</p>
        ) : (
          <ul>
            {((contacts ?? []) as BrandContact[]).map((c) => (
              <li key={c.id}>
                <strong>{c.contact_name ?? c.contact_type ?? "Partnerships"}</strong>
                {c.job_title ? ` — ${c.job_title}` : ""}
                {c.email ? (
                  <>
                    {" · "}
                    <a href={`mailto:${c.email}`}>{c.email}</a>
                  </>
                ) : null}
                {c.contact_url ? (
                  <>
                    {" · "}
                    <a href={c.contact_url} target="_blank" rel="noreferrer">
                      Creator application ↗
                    </a>
                  </>
                ) : null}
                {" "}
                <Pill confidence={c.verification_status} />
                {c.last_verified_at ? (
                  <span style={{ color: "#b3a6e0", fontSize: 13 }}>
                    {" "}
                    checked {fmtDate(c.last_verified_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>What creators report earning</h2>
        {((comp ?? []) as CompensationReport[]).length === 0 ? (
          <p style={{ color: "#b3a6e0" }}>
            Payment unknown — no verified compensation information found yet.
          </p>
        ) : (
          <ul>
            {((comp ?? []) as CompensationReport[]).map((r) => (
              <li key={r.id}>
                {r.content_type ?? "Content"}:{" "}
                {r.amount != null
                  ? `${r.currency} ${Number(r.amount).toLocaleString()}`
                  : "amount not reported"}
                {r.payment_type ? ` (${r.payment_type})` : ""}
                {r.verified ? " · verified" : " · publicly reported"}
                {r.source_date ? ` · ${fmtDate(r.source_date)}` : ""}
                {r.source_url ? (
                  <>
                    {" · "}
                    <a href={r.source_url} target="_blank" rel="noreferrer">
                      source ↗
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {(terms ?? []).length > 0 && (
          <ul>
            {(terms ?? []).map((t) => (
              <li key={t.id as string}>
                Terms: usage rights {t.usage_rights ?? "—"}; exclusivity{" "}
                {t.exclusivity ?? "—"}; payment {t.payment_timeline ?? "—"}
              </li>
            ))}
          </ul>
        )}
        {(affiliates ?? []).length > 0 && (
          <>
            <h3>Affiliate program</h3>
            <ul>
              {(affiliates ?? []).map((a) => (
                <li key={a.id as string}>
                  {a.network ?? "Direct"}
                  {a.commission_rate != null
                    ? ` — ${Number(a.commission_rate)}% commission`
                    : ""}
                  {a.application_url ? (
                    <>
                      {" · "}
                      <a href={a.application_url as string} target="_blank" rel="noreferrer">
                        Apply ↗
                      </a>
                    </>
                  ) : null}{" "}
                  <span style={{ color: "#b3a6e0", fontSize: 13 }}>
                    ({a.status as string})
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2>Open opportunities</h2>
        {(opps ?? []).length === 0 ? (
          <p style={{ color: "#b3a6e0" }}>
            No verified open opportunity right now. This brand may still be
            worth pitching directly.
          </p>
        ) : (
          <ul>
            {(opps ?? []).map((o) => (
              <li key={o.id as string}>
                <strong>{o.title as string}</strong> ({o.status as string})
                {o.compensation_min != null || o.compensation_max != null ? (
                  <>
                    {" — "}
                    {o.currency as string}{" "}
                    {o.compensation_min != null
                      ? Number(o.compensation_min).toLocaleString()
                      : "?"}
                    –
                    {o.compensation_max != null
                      ? Number(o.compensation_max).toLocaleString()
                      : "?"}
                  </>
                ) : null}
                {o.application_url ? (
                  <>
                    {" · "}
                    <a href={o.application_url as string} target="_blank" rel="noreferrer">
                      Apply ↗
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(products ?? []).length > 0 && (
        <section>
          <h2>Products</h2>
          <ul>
            {(products ?? []).map((p) => (
              <li key={p.id as string}>
                {p.product_url ? (
                  <a href={p.product_url as string} target="_blank" rel="noreferrer">
                    {p.name as string}
                  </a>
                ) : (
                  (p.name as string)
                )}
                {p.description ? ` — ${p.description as string}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Research evidence</h2>
        {((evidence ?? []) as BrandEvidence[]).length === 0 ? (
          <p style={{ color: "#b3a6e0" }}>No evidence records yet.</p>
        ) : (
          <ul>
            {((evidence ?? []) as BrandEvidence[]).map((e) => (
              <li key={e.id}>
                <Pill confidence={e.confidence} />{" "}
                <a href={e.source_url} target="_blank" rel="noreferrer">
                  {e.evidence_type ?? e.source_type ?? "Source"} ↗
                </a>{" "}
                — {e.evidence_summary ?? ""}{" "}
                <span style={{ color: "#b3a6e0", fontSize: 13 }}>
                  (observed {fmtDate(e.observed_at)}
                  {e.last_checked_at
                    ? `, last checked ${fmtDate(e.last_checked_at)}`
                    : ""}
                  )
                </span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ color: "#b3a6e0", fontSize: 13 }}>
          Every fact on this page carries its source, the date it was
          collected, and its verification status.
        </p>
      </section>
    </div>
  );
}
