"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CAP_LABEL,
  daysAgo,
  fmtDate,
  hashHue,
  initials,
  plural,
  type GalaxyBrand,
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
  inPipeIds,
  inPipeNames,
  paidCount,
}: {
  brands: GalaxyBrand[];
  profile: GalaxyProfile;
  inPipeIds: string[];
  inPipeNames: string[];
  paidCount: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("All");
  const [sort, setSort] = useState<"fit" | "new" | "rate">("fit");
  const [acceptingOnly, setAcceptingOnly] = useState(true);
  const [savedOnly, setSavedOnly] = useState(false);
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
  const inPipe = useMemo(
    () => new Set([...inPipeIds, ...brands.filter((b) => inPipeNames.includes(b.name)).map((b) => b.id)]),
    [inPipeIds, inPipeNames, brands]
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
        (cat === "All" || b.categories.includes(cat))
    );
    const fit = (b: GalaxyBrand) =>
      (niche && b.categories.includes(niche) ? 4 : 0) + (b.accepting ? 2 : 0) + (saved.has(b.id) ? 1 : 0);
    if (sort === "fit") out = [...out].sort((a, b) => fit(b) - fit(a) || (b.rate ?? 0) - (a.rate ?? 0));
    if (sort === "new") out = [...out].sort((a, b) => b.added.localeCompare(a.added));
    if (sort === "rate") out = [...out].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    return out;
  }, [brands, q, program, acceptingOnly, savedOnly, cat, sort, saved, niche]);

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
      }
    } else {
      const { error } = await supabase
        .from("saved_brands")
        .insert({ user_id: user.id, brand_id: b.id });
      if (!error) {
        setSaved((prev) => new Set(prev).add(b.id));
        toast(`${b.name} saved.`);
      }
    }
  }

  const pitchBrand = brands.find((b) => b.id === pitchId) ?? null;

  return (
    <div>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, margin: 0 }}>Brands</h1>
          <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
            Programs you can apply to now. Every commission is labelled capped, uncapped or
            unknown, so you know what you are signing up for.
          </p>
        </div>
      </header>

      <section className="gx-panel">
        <div style={{ display: "grid", gap: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <label style={{ position: "relative", flex: "1 1 260px" }}>
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
            <label>
              <span className="gx-sr">Program</span>
              <select className="gx-input" style={{ width: "auto" }} value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="All">All programs</option>
                {programs.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="gx-sr">Sort</span>
              <select className="gx-input" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
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
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="gx-list">
            {list.map((b) => {
              const isNew = daysAgo(b.added) <= 14;
              const pitched = inPipe.has(b.id);
              const isSaved = saved.has(b.id);
              return (
                <li
                  key={b.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "46px minmax(0,1fr) 110px 170px",
                    gap: 16,
                    alignItems: "center",
                    padding: "15px 2px",
                  }}
                >
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
                    <Link href={`/brands/${b.id}`} style={{ fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
                      {b.name}
                    </Link>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {b.category ? <span className="gx-pill">{b.category}</span> : null}
                      {b.program ? <span className="gx-pill">{b.program}</span> : null}
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
                  </div>
                  <div>
                    <strong style={{ display: "block", font: "500 17px/1.2 var(--display)" }}>
                      {b.rate != null ? `${b.rate}%` : "—"}
                    </strong>
                    <span style={{ fontSize: 12.5, color: b.cap === "uncapped" ? "#B9C8FF" : "var(--ink-3)" }}>
                      {CAP_LABEL[b.cap]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
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
