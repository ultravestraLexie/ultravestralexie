"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HELP_CONFIG,
  SECTION_NAME,
  SECTION_PATH,
  relatedFor,
  type HelpArticle,
} from "@/lib/galaxy/help";
import HelpShell, {
  ArticleBody,
  ArticleRow,
  HIcon,
  useHelp,
} from "../../helpcenter/HelpUi";

/* The Article view (prototype): breadcrumb back to the article's
 * section, the body, a "Was this helpful?" vote (kept on-device,
 * like the prototype's — there is no analytics backend for it),
 * and related articles. A "No" vote opens Ask Vestra Help with
 * the article title prefilled, as the prototype does. Terms
 * articles carry the protocol's effective date. */

const VOTE_KEY = "uv-helpful.v1";

function ArticleInner({ article }: { article: HelpArticle }) {
  const { openChat, toast } = useHelp();
  const [vote, setVote] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOTE_KEY);
      if (raw) {
        const votes = JSON.parse(raw) as Record<string, string>;
        if (votes[article.id] === "yes" || votes[article.id] === "no")
          setVote(votes[article.id] as "yes" | "no");
      }
    } catch {
      /* device-local only; a fresh vote still works */
    }
  }, [article.id]);

  function cast(v: "yes" | "no") {
    setVote(v);
    try {
      const raw = localStorage.getItem(VOTE_KEY);
      const votes = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      votes[article.id] = v;
      localStorage.setItem(VOTE_KEY, JSON.stringify(votes));
    } catch {
      /* ignore — the vote is a nicety, not a record */
    }
    if (v === "yes") toast("Thanks for letting us know!");
    else {
      toast("Sorry about that. Vestra Help can dig deeper.");
      openChat(article.t);
    }
  }

  const related = relatedFor(article);

  return (
    <>
      <div className="back-row">
        <Link
          className="icon-btn"
          href={SECTION_PATH[article.s]}
          aria-label={`Back to ${SECTION_NAME[article.s]}`}
        >
          <HIcon n="back" />
        </Link>
        <span style={{ font: "700 18px var(--h-display)" }}>
          {SECTION_NAME[article.s]}
        </span>
      </div>
      <div className="crumb">
        <Link href={SECTION_PATH[article.s]}>{SECTION_NAME[article.s]}</Link>
        <span>› {article.cat}</span>
      </div>
      <article className="glass pad article">
        <h2>{article.t}</h2>
        <ArticleBody article={article} />
        {article.s === "terms" ? (
          <p style={{ fontSize: 13 }}>
            Last updated: {HELP_CONFIG.effectiveDate}
          </p>
        ) : null}
      </article>
      <div className="glass helpful">
        <span>Was this helpful?</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="mini-btn"
            aria-pressed={vote === "yes"}
            onClick={() => cast("yes")}
          >
            Yes
          </button>
          <button
            type="button"
            className="mini-btn"
            aria-pressed={vote === "no"}
            onClick={() => cast("no")}
          >
            No
          </button>
        </div>
      </div>
      {related.length ? (
        <>
          <div className="group-label">Related</div>
          <nav className="glass list" aria-label="Related articles">
            {related.map((x) => (
              <ArticleRow key={x.id} article={x} />
            ))}
          </nav>
        </>
      ) : null}
    </>
  );
}

export default function ArticleClient({
  article,
  accountEmail,
}: {
  article: HelpArticle;
  accountEmail: string;
}) {
  return (
    <HelpShell accountEmail={accountEmail}>
      <ArticleInner article={article} />
    </HelpShell>
  );
}
