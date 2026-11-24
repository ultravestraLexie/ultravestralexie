"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HELP_LIST_MIN,
  HELP_POPULAR,
  KB,
  SECTION_NAME,
  articleById,
  searchHelp,
} from "@/lib/galaxy/help";
import HelpShell, {
  ArticleRow,
  HIcon,
  useHelp,
} from "../helpcenter/HelpUi";

/* The Help Center view (prototype): search over the ported corpus
 * (the same engine Ask Vestra Help uses), popular questions, and
 * the help articles grouped by category. Privacy/Terms articles
 * appear in search results too, labeled with their section — the
 * prototype searched one combined KB. */

function HelpCenterInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const { openChat } = useHelp();

  const query = q.trim();
  const results = useMemo(
    () =>
      query
        ? searchHelp(query)
            .filter((r) => r.score >= HELP_LIST_MIN)
            .slice(0, 10)
        : [],
    [query]
  );

  const cats = useMemo(() => {
    const out: string[] = [];
    KB.forEach((a) => {
      if (a.s === "help" && !out.includes(a.cat)) out.push(a.cat);
    });
    return out;
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      <div className="back-row">
        <Link className="icon-btn" href="/settings" aria-label="Back to Settings">
          <HIcon n="back" />
        </Link>
        <span style={{ font: "700 18px var(--h-display)" }}>Settings</span>
      </div>
      <h2 className="page-title">Help Center</h2>
      <p className="page-sub">Everything about Ultra Vestra, in plain words.</p>
      <form className="search" role="search" onSubmit={onSubmit}>
        <HIcon n="search" />
        <label className="sr-only" htmlFor="help-q">
          Search the Help Center
        </label>
        <input
          id="help-q"
          type="search"
          placeholder="Search the Help Center"
          autoComplete="off"
          maxLength={120}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <div className="group-label" style={{ marginTop: 18 }}>
        Popular questions
      </div>
      <div className="chips">
        {HELP_POPULAR.map((id) => {
          const a = articleById.get(id);
          if (!a) return null;
          return (
            <Link
              key={id}
              className="chip"
              style={{ textDecoration: "none" }}
              href={`/settings/article/${id}`}
            >
              {a.t}
            </Link>
          );
        })}
      </div>

      {query ? (
        <>
          <div className="cat-head">
            {results.length ? `Results for “${query}”` : "No results"}
          </div>
          <nav className="glass list" aria-label="Search results">
            {!results.length ? (
              <div className="empty">
                Nothing matched. Try other words, or ask Vestra Help.
              </div>
            ) : (
              results.map((r) => (
                <ArticleRow
                  key={r.a.id}
                  article={r.a}
                  sub={`${SECTION_NAME[r.a.s]} › ${r.a.cat}`}
                />
              ))
            )}
          </nav>
        </>
      ) : (
        cats.map((cat) => {
          const arts = KB.filter((a) => a.s === "help" && a.cat === cat);
          return (
            <div key={cat}>
              <div className="cat-head">
                {cat}
                <span className="count">{arts.length} articles</span>
              </div>
              <nav className="glass list" aria-label={cat}>
                {arts.map((a) => (
                  <ArticleRow key={a.id} article={a} />
                ))}
              </nav>
            </div>
          );
        })
      )}

      <section
        className="glass pad"
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 180 }}>
          <b style={{ font: "700 17px var(--h-display)" }}>Still need help?</b>
          <div style={{ fontSize: 13, color: "var(--h-muted)", marginTop: 4 }}>
            Ask Vestra Help, or talk to a person.
          </div>
        </div>
        <button type="button" className="btn primary" onClick={() => openChat()}>
          <HIcon n="chat" />
          Ask Vestra Help
        </button>
      </section>
    </>
  );
}

export default function HelpCenterClient({
  accountEmail,
}: {
  accountEmail: string;
}) {
  return (
    <HelpShell accountEmail={accountEmail}>
      <HelpCenterInner />
    </HelpShell>
  );
}
