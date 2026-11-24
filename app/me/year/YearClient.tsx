"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtMoney } from "@/lib/galaxy/core";
import { loadPipelineState } from "@/lib/galaxy/pipeline";
import type { YearReview } from "@/lib/galaxy/economy";
import { EconWrap, EconStars, Ico } from "../economy/Econ";

/* The Year in Review story card. Deal facts arrive from the server
 * (real paid deals only); the "pieces of content published" count is
 * read on the device from the Studio pipeline — the creator's own
 * posting tracker — so it is 0 until they mark videos posted. */
export default function YearClient({
  review,
  passportPath,
}: {
  review: YearReview;
  passportPath: string | null;
}) {
  const [published, setPublished] = useState(0);

  useEffect(() => {
    const state = loadPipelineState();
    const n = state.items.filter(
      (i) => i.status === "posted" && i.postedDate && i.postedDate.startsWith(String(review.year))
    ).length;
    setPublished(n);
  }, [review.year]);

  const empty = review.dealsCompleted === 0;
  const milestones: { title: string; when: string | null }[] = [
    { title: "First brand deal", when: review.firstDealMonth },
    { title: "First $500 earned", when: review.first500Month },
    { title: "First 5 brand partners", when: review.fiveBrandsMonth },
  ];

  return (
    <EconWrap>
      <article className="screen story">
        <EconStars
          points={[
            ["82%", "15%"],
            ["64%", "10%", "lg p"],
            ["91%", "28%"],
            ["8%", "21%"],
          ]}
        />
        <div className="orb lift" style={{ left: 150, top: -40 }} aria-hidden="true" />
        <div className="story-head lift">
          <div className="brand">
            <span className="uv" aria-hidden="true">UV</span>
            <span className="wordmark">ULTRA VESTRA</span>
          </div>
          <span className="tag">YEAR IN REVIEW</span>
        </div>

        <div className="lift" style={{ paddingTop: 6 }}>
          <div className="kicker">MY CREATOR YEAR</div>
          <div className="year">{review.year}</div>
          <p className="lede" style={{ marginTop: 6 }}>
            The year I turned content into a business.
          </p>
        </div>

        <div className="grid2 lift">
          <div className="stat">
            <b>{review.dealsCompleted}</b>
            <span>Deals completed</span>
          </div>
          <div className="stat">
            <b>{review.brandsWorkedWith}</b>
            <span>Brands worked with</span>
          </div>
          <div className="stat">
            <b>{published}</b>
            <span>Pieces of content published</span>
          </div>
          <div className="stat">
            <b>{fmtMoney(review.earnedCents)}</b>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Earned{" "}
              <span className="verified">
                <Ico name="check" />Verified
              </span>
            </span>
          </div>
        </div>

        <div className="achievement lift">
          <div className="ico">
            <Ico name="trophy" className="i" />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--e-gold)", fontWeight: 700 }}>
              BIGGEST ACHIEVEMENT
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginTop: 3 }}>
              {review.biggestDeal
                ? `Biggest deal collected — ${fmtMoney(review.biggestDeal.cents)} with ${review.biggestDeal.brandName}`
                : "Your first achievement lands here — it arrives with your first paid deal."}
            </div>
          </div>
        </div>

        <div className="lift">
          <div className="label" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
            Growth milestones
          </div>
          <div className="grid3">
            {milestones.map((m) => (
              <div className="mini" key={m.title}>
                <b>{m.title}</b>
                <span>{m.when ?? "Not yet"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lift" style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {empty ? (
            <span style={{ fontSize: 12, color: "var(--e-muted)", textAlign: "center" }}>
              These numbers fill in as your deals get paid — this page is already yours.
            </span>
          ) : passportPath ? (
            <span style={{ fontSize: 12, color: "var(--e-muted)" }}>
              Get yours ·{" "}
              <Link href={passportPath} style={{ wordBreak: "break-all" }}>
                {passportPath}
              </Link>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--e-muted)" }}>
              Get yours · <Link href="/me/invite">Invite creators</Link>
            </span>
          )}
          <p className="tagline">CREATE. GROW. BUILD.</p>
        </div>
      </article>
    </EconWrap>
  );
}
