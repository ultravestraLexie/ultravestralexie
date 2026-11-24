"use client";

import { fmtMoney } from "@/lib/galaxy/core";
import {
  LEVEL_TIERS,
  type LevelFacts,
  type LevelState,
  type Milestone,
} from "@/lib/galaxy/economy";
import { EconWrap, EconHead, Ico, econShare, useEconToast } from "../economy/Econ";

const CIRC = 376.99; // 2π × 60, the prototype's ring circumference
const TIER_COLORS: Record<string, string> = {
  bronze: "#D69A6B",
  silver: "#C5CCE0",
  gold: "#F5C451",
  diamond: "#9EE7FF",
};

/* The Next Level frame: progress ring toward the next tier, the
 * four-step tier track, and the milestone list. All values arrive
 * computed from the creator's real deals (see page.tsx). */
export default function LevelsClient({
  facts,
  state,
  milestones,
  nextText,
  passportPath,
}: {
  facts: LevelFacts;
  state: LevelState;
  milestones: Milestone[];
  nextText: string | null;
  passportPath: string | null;
}) {
  const toast = useEconToast();
  const tierColor = TIER_COLORS[state.tier.id];
  const dash = (state.progress * CIRC).toFixed(2);

  const shareLevel = async () => {
    const url = passportPath ? `${window.location.origin}${passportPath}` : undefined;
    const res = await econShare(
      `I'm ${state.tier.name} on Ultra Vestra — ${facts.campaigns} campaigns, ${fmtMoney(facts.collectedCents)} collected.`,
      url
    );
    if (res === "copied") toast.show("Copied to share");
  };

  return (
    <EconWrap>
      <article className="screen">
        <EconHead
          title="Your next level"
          right={
            <button className="icon-btn primary" type="button" aria-label="Share my level" onClick={shareLevel}>
              <Ico name="share" />
            </button>
          }
        />
        <div className="body">
          <div className="card level-card">
            <div className="fx" aria-hidden="true">
              <div className="orb gold" style={{ left: "calc(50% - 100px)", top: -30 }} />
            </div>
            <div className="ring lift">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                role="img"
                aria-label={
                  state.next
                    ? `${state.percent} percent of the way to ${state.next.name}`
                    : `${state.tier.name} — top level reached`
                }
              >
                <circle cx="70" cy="70" r="60" fill="none" stroke="#18214D" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={tierColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRC}`}
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div className="ring-center">
                <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--e-muted)", fontWeight: 700 }}>
                  LEVEL {state.tierIndex + 1}
                </div>
                <div style={{ font: "700 30px/1 var(--e-display)", color: tierColor }}>
                  {state.tier.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--e-text2)" }}>
                  {state.next ? `${state.percent}% to ${state.next.name}` : "Top level"}
                </div>
              </div>
            </div>
            <p
              className="lift"
              style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--e-text2)", textAlign: "center", maxWidth: 290 }}
            >
              {nextText ?? "You hold the top level. Every new paid deal adds to your track record."}
            </p>
            <div className="tiers lift">
              {LEVEL_TIERS.map((t, i) => {
                const done = i < state.tierIndex;
                const current = i === state.tierIndex;
                return (
                  <div
                    className="tier-step"
                    key={t.id}
                    style={current ? { color: TIER_COLORS[t.id], fontWeight: 700 } : undefined}
                  >
                    <span
                      className="dot"
                      style={
                        done
                          ? { background: TIER_COLORS[t.id] }
                          : current
                            ? {
                                background: "var(--e-bg)",
                                border: `3px solid ${TIER_COLORS[t.id]}`,
                                boxShadow: `0 0 12px ${TIER_COLORS[t.id]}99`,
                              }
                            : { background: "var(--e-surface)", border: "2px solid var(--e-line3)", color: "var(--e-diamond)" }
                      }
                    >
                      {done ? (
                        <Ico name="check" />
                      ) : !current ? (
                        <Ico name="lock" />
                      ) : null}
                    </span>
                    {t.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">Milestones</div>
            <div className="card list">
              {milestones.map((m) => (
                <div className="row" key={m.id}>
                  {m.status === "done" ? (
                    <div className="ico green">
                      <Ico name="check" />
                    </div>
                  ) : (
                    <div className="ico blue">
                      <Ico name={m.icon} />
                    </div>
                  )}
                  {m.status === "progress" ? (
                    <>
                      <div className="grow stack" style={{ gap: 6 }}>
                        <div className="t">{m.title}</div>
                        <div
                          className="bar"
                          role="img"
                          aria-label={`${m.current} of ${m.target}`}
                        >
                          <span style={{ width: `${Math.round(((m.current ?? 0) / (m.target ?? 1)) * 100)}%` }} />
                        </div>
                      </div>
                      <span className="status" style={{ color: "var(--e-text2)", minWidth: 44, justifyContent: "flex-end" }}>
                        {m.format === "money"
                          ? `${fmtMoney(m.current ?? 0)} / ${fmtMoney(m.target ?? 0)}`
                          : `${m.current} / ${m.target}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="grow">
                        <div className="t">{m.title}</div>
                        <div className="s">{m.sub}</div>
                      </div>
                      {m.status === "done" ? (
                        <button className="link-btn" type="button" onClick={shareLevel}>
                          Share
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="note" style={{ textAlign: "center" }}>
            Levels come from your paid deals in Ultra Vestra — campaigns completed and money
            collected. Nothing here counts followers or views.
          </p>
        </div>
      </article>
      {toast.el}
    </EconWrap>
  );
}
