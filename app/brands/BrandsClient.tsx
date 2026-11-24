"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CAP_LABEL,
  applicationLabel,
  brandMatchesNiche,
  brandPaymentHistory,
  currentApplication,
  daysAgo,
  dealsForBrand,
  fmtDate,
  fmtMoney,
  hashHue,
  initials,
  parseKey,
  plural,
  type GalaxyBrand,
  type GalaxyDeal,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { PitchSheet } from "@/components/galaxy/PitchSheet";
import { Icon, I, toast } from "@/components/galaxy/ui";

/* BRANDS client — search / program / sort / chips over the full
 * directory, save toggles written straight to saved_brands (RLS),
 * and the pitch writer. Filtering mirrors the prototype exactly. */

export default function BrandsClient({
  brands,
  profile,
  deals,
  paidCount,
  today,
}: {
  brands: GalaxyBrand[];
  profile: GalaxyProfile;
  deals: GalaxyDeal[];
  paidCount: number;
  /* The server's today (YYYY-MM-DD) — the "New" badge's day math
   * anchors to it, never to the browser's local clock. */
  today: string;
}) {
  const router = useRouter();
  const now = parseKey(today);
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("All");
  const [sort, setSort] = useState<"fit" | "new" | "rate">("fit");
  const [acceptingOnly, setAcceptingOnly] = useState(true);
  const [savedOnly, setSavedOnly] = useState(false);
  const [myAppsOnly, setMyAppsOnly] = useState(false);
  const [nicheOnly, setNicheOnly] = useState(false);
  const [cat, setCat] = useState("All");
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(brands.filter((b) => b.saved).map((b) => b.id))
  );
  const [pitchId, setPitchId] = useState<string | null>(null);

  const programs = useMemo(
    () => [...new Set(brands.map((b) => b.program).filter(Boolean) as string[])].sort(),
    [brands]
  );
  const categories = useMemo(
    () => [...new Set(brands.flatMap((b) => b.categories))].sort(),
    [brands]
  );
  /* System #3: the creator's own deals per brand — application
   * state and payment history are read from these rows only. */
  const dealsByBrand = useMemo(() => {
    const map = new Map<string, GalaxyDeal[]>();
    for (const b of brands) {
      const ds = dealsForBrand(deals, b);
      if (ds.length > 0) map.set(b.id, ds);
    }
    return map;
  }, [brands, deals]);
  const inPipe = useMemo(
    () =>
      new Set(
        [...dealsByBrand.entries()]
          .filter(([, ds]) => ds.some((d) => d.stage !== "lost"))
          .map(([id]) => id)
      ),
    [dealsByBrand]
  );
  const niche = profile.niche;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = brands.filter(
      (b) =>
        (!needle ||
          b.name.toLowerCase().includes(needle) ||
          b.categories.some((c) => c.toLowerCase().includes(needle)) ||
          (b.program ?? "").toLowerCase().includes(needle)) &&
        (program === "All" || b.program === program) &&
        (!acceptingOnly || b.accepting) &&
        (!savedOnly || saved.has(b.id)) &&
        (!myAppsOnly || dealsByBrand.has(b.id)) &&
        (!nicheOnly || brandMatchesNiche(b, niche)) &&
        (cat === "All" || b.categories.includes(cat))
    );
    const fit = (b: GalaxyBrand) =>
      (niche && b.categories.includes(niche) ? 4 : 0) + (b.accepting ? 2 : 0) + (saved.has(b.id) ? 1 : 0);
    if (sort === "fit") out = [...out].sort((a, b) => fit(b) - fit(a) || (b.rate ?? 0) - (a.rate ?? 0));
    if (sort === "new") out = [...out].sort((a, b) => b.added.localeCompare(a.added));
    if (sort === "rate") out = [...out].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    if (myAppsOnly) {
      const activity = (b: GalaxyBrand) => {
        const app = currentApplication(dealsByBrand.get(b.id) ?? []);
        return app ? app.updatedAt || app.lastContact || app.pitchedOn : "";
      };
      out = [...out].sort((a, b) => activity(b).localeCompare(activity(a)));
    }
    return out;
  }, [brands, q, program, acceptingOnly, savedOnly, myAppsOnly, nicheOnly, cat, sort, saved, niche, dealsByBrand]);

  async function toggleSave(b: GalaxyBrand) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (saved.has(b.id)) {
      const { error } = await supabase
        .from("saved_brands")
        .delete()
        .eq("user_id", user.id)
        .eq("brand_id", b.id);
      if (!error) {
        setSaved((prev) => {
          const next = new Set(prev);
          next.delete(b.id);
          return next;
        });
        router.refresh();
      }
    } else {
      const { error } = await supabase
        .from("saved_brands")
        .insert({ user_id: user.id, brand_id: b.id });
      if (!error) {
        setSaved((prev) => new Set(prev).add(b.id));
        toast(`${b.name} saved.`);
        router.refresh();
      }
    }
  }

  const pitchBrand = brands.find((b) => b.id === pitchId) ?? null;

  return (
    <div>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 className="gx-h1">Brands</h1>
          <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
            Find opportunities. Programs you can apply to now. Every commission is labelled capped, uncapped or
            unknown, so you know what you are signing up for. “Accepting” means a live
            application route was found for the brand — these are application routes, not
            campaigns posted by brands, and no earnings are promised.
          </p>
        </div>
      </header>

      <section className="gx-panel">
        <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
          <div className="gx-toolbar-row">
            <label className="gx-toolbar-search">
              <span className="gx-sr">Search brands</span>
              <span style={{ position: "absolute", left: 13, top: "50%", translate: "0 -50%", color: "var(--ink-3)", display: "inline-flex" }}>
                <Icon html={'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5L17 17"/></svg>'} size={17} />
              </span>
              <input
                className="gx-input"
                type="search"
                placeholder="Search brands, categories or programs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoComplete="off"
              />
            </label>
            <label className="gx-toolbar-label">
              <span className="gx-sr">Program</span>
              <select className="gx-input gx-toolbar-select" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="All">All programs</option>
                {programs.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </label>
            <label className="gx-toolbar-label">
              <span className="gx-sr">Sort</span>
              <select className="gx-input gx-toolbar-select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="fit">Best fit for you</option>
                <option value="new">Newest</option>
                <option value="rate">Highest commission</option>
              </select>
            </label>
          </div>
          <div className="gx-chips" role="group" aria-label="Filter brands">
            <button type="button" className="gx-chip" aria-pressed={acceptingOnly} onClick={() => setAcceptingOnly((v) => !v)}>
              Accepting now
            </button>
            <button type="button" className="gx-chip" aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)}>
              Saved
            </button>
            <button type="button" className="gx-chip" aria-pressed={myAppsOnly} onClick={() => setMyAppsOnly((v) => !v)}>
              My applications
            </button>
            {niche ? (
              <button type="button" className="gx-chip" aria-pressed={nicheOnly} onClick={() => setNicheOnly((v) => !v)}>
                For your niche
              </button>
            ) : null}
            {["All", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                className="gx-chip"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c === "All" ? "All categories" : c}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: "12px 2px 0" }} aria-live="polite">
          {plural(list.length, "brand")}
        </p>

        {list.length === 0 ? (
          <div className="gx-empty">
            <p>No brands match these filters.</p>
            <button
              type="button"
              className="gx-btn gx-btn-sm"
              onClick={() => {
                setQ("");
                setProgram("All");
                setCat("All");
                setAcceptingOnly(false);
                setSavedOnly(false);
                setMyAppsOnly(false);
                setNicheOnly(false);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="gx-list">
            {list.map((b) => {
              const isNew = daysAgo(b.added, now) <= 14;
              const pitched = inPipe.has(b.id);
              const isSaved = saved.has(b.id);
              const myDeals = dealsByBrand.get(b.id) ?? [];
              const app = currentApplication(myDeals);
              const history = brandPaymentHistory(myDeals);
              return (
                <li key={b.id} className="gx-brand-row">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      font: "600 12.5px var(--display)",
                      color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,.45)",
                      background: `radial-gradient(circle at 32% 28%, hsl(${hashHue(b.id)} 85% 72%), hsl(${hashHue(b.id)} 62% 42%) 55%, hsl(${hashHue(b.id)} 70% 18%))`,
                      boxShadow: `inset -6px -8px 14px rgba(0,0,0,.35), 0 0 18px -4px hsl(${hashHue(b.id)} 80% 60% / .6)`,
                    }}
                  >
                    {initials(b.name)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/brands/${b.id}`} style={{ fontWeight: 600, fontSize: 15.5, textDecoration: "none", overflowWrap: "anywhere" }}>
                      {b.name}
                    </Link>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {b.category ? <span className="gx-pill">{b.category}</span> : null}
                      {b.program ? <span className="gx-pill">{b.program}</span> : null}
                      {b.verified ? <span className="gx-pill gx-pill-good">✓ Verified</span> : null}
                      {niche && b.categories.includes(niche) ? (
                        <span className="gx-pill gx-pill-fit">Matches your niche</span>
                      ) : null}
                      {isNew ? <span className="gx-pill gx-pill-ver">New</span> : null}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      {b.accepting ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#A6F0C9" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--good)", display: "inline-block" }} />
                          Accepting
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)" }}>
                          Not accepting now
                        </span>
                      )}
                      {b.checked ? (
                        <small style={{ color: "var(--ink-3)", fontSize: 12, marginLeft: 8 }}>
                          Checked {fmtDate(b.checked)}
                        </small>
                      ) : null}
                    </div>
                    {app ? (
                      <div className="gx-brand-meta">
                        Your application: <strong>{applicationLabel(app)}</strong>
                      </div>
                    ) : null}
                    {history ? (
                      <div className="gx-brand-meta">
                        Paid you <strong>{fmtMoney(history.totalPaidCents)}</strong>
                        {history.avgDaysToPay != null
                          ? ` · ~${history.avgDaysToPay} days to pay`
                          : ""}{" "}
                        · from your deals
                      </div>
                    ) : null}
                    {b.provenance ? (
                      <div className="gx-brand-meta" style={{ color: "var(--ink-3)" }}>
                        {b.provenance.line}
                      </div>
                    ) : null}
                  </div>
                  <div className="gx-brand-rate">
                    <strong>{b.rate != null ? `${b.rate}%` : "—"}</strong>
                    <span style={{ fontSize: 12.5, color: b.cap === "uncapped" ? "#B9C8FF" : "var(--ink-3)" }}>
                      {CAP_LABEL[b.cap]}
                    </span>
                  </div>
                  <div className="gx-brand-actions">
                    <button
                      type="button"
                      className="gx-icon-btn"
                      aria-pressed={isSaved}
                      aria-label={`${isSaved ? "Unsave" : "Save"} ${b.name}`}
                      onClick={() => void toggleSave(b)}
                    >
                      <Icon html={I.star} size={18} />
                    </button>
                    {pitched ? (
                      <Link href="/deals" className="gx-btn gx-btn-sm gx-btn-quiet" style={{ textDecoration: "none" }}>
                        In Deals
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="gx-btn gx-btn-sm"
                        disabled={!b.accepting}
                        onClick={() => setPitchId(b.id)}
                      >
                        Write pitch
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <PitchSheet
        brand={pitchBrand}
        profile={profile}
        paidCount={paidCount}
        open={Boolean(pitchBrand)}
        onClose={() => setPitchId(null)}
        onSent={() => router.refresh()}
      />
    </div>
  );
}
