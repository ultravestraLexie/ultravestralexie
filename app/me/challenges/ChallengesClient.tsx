"use client";

import { useEffect, useState } from "react";
import {
  CHALLENGE_FRIENDS,
  CHALLENGE_WEEK,
  CHALLENGES_STORE_KEY,
  MORE_CHALLENGES,
  weekEndsIn,
} from "@/lib/galaxy/economy";
import { EconWrap, EconHead, Ico, econShare, useEconToast } from "../economy/Econ";

/* The Challenges frame, as the prototype models it: this week's
 * posting challenge, the friends race, and the joinable list. The
 * people shown are the prototype's sample presentation (device-local
 * demo state — the app has no friends data); the only state the
 * creator changes here is which challenges they joined, kept on
 * this device. The countdown is real: it runs to the weekly reset. */
export default function ChallengesClient() {
  const toast = useEconToast();
  const [joined, setJoined] = useState<string[]>([]);
  const [endsIn, setEndsIn] = useState("");

  useEffect(() => {
    setEndsIn(weekEndsIn(new Date()));
    try {
      const raw = JSON.parse(localStorage.getItem(CHALLENGES_STORE_KEY) || "null");
      if (raw && Array.isArray(raw.joined)) {
        setJoined(raw.joined.filter((x: unknown) => typeof x === "string"));
      }
    } catch {
      /* no saved joins on this device */
    }
  }, []);

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const on = !prev.includes(id);
      const next = on ? [...prev, id] : prev.filter((x) => x !== id);
      try {
        localStorage.setItem(CHALLENGES_STORE_KEY, JSON.stringify({ joined: next }));
      } catch {
        /* storage unavailable — the join lives in this session */
      }
      if (on) toast.show("Challenge joined");
      return next;
    });
  };

  const invite = async () => {
    const res = await econShare("Join me in this week's posting challenge on Ultra Vestra.");
    if (res === "copied") toast.show("Invite copied");
  };

  const days = Array.from({ length: 7 }, (_, i) => i);

  return (
    <EconWrap>
      <article className="screen">
        <EconHead
          title="Challenges"
          right={
            <span className="chip">
              <Ico name="clock" />
              {endsIn || "Ends soon"}
            </span>
          }
        />
        <div className="body">
          <div className="card glow pad stack">
            <span className="pill-week">THIS WEEK</span>
            <div>
              <div style={{ font: "700 20px/1.2 var(--e-display)" }}>{CHALLENGE_WEEK.title}</div>
              <div style={{ fontSize: 13, color: "var(--e-muted)", marginTop: 4 }}>
                {CHALLENGE_WEEK.sub}
              </div>
            </div>
            <div
              className="days"
              role="img"
              aria-label={`Day ${CHALLENGE_WEEK.daysDone} of 7 complete`}
            >
              {days.map((i) =>
                i < CHALLENGE_WEEK.daysDone ? (
                  <span className="day done" key={i}>
                    <Ico name="check" />
                  </span>
                ) : i === CHALLENGE_WEEK.todayIndex ? (
                  <span className="day today" key={i}>
                    {i + 1}
                  </span>
                ) : (
                  <span className="day" key={i}>
                    {i + 1}
                  </span>
                )
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--e-muted)" }}>{CHALLENGE_WEEK.meta}</div>
            <button className="btn" type="button" onClick={invite}>
              <Ico name="user-plus" className="i" />
              Invite a friend to compete
            </button>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">Your friends this week</div>
            <div className="card" style={{ padding: "6px 14px" }}>
              {CHALLENGE_FRIENDS.map((f) => (
                <div className="race" key={f.name}>
                  <span
                    className="avatar"
                    style={{ background: f.avatarBg, color: f.avatarColor }}
                    aria-hidden="true"
                  >
                    {f.initials}
                  </span>
                  <span
                    className="name"
                    style={f.you ? { color: "var(--e-blue-soft)", fontWeight: 700 } : undefined}
                  >
                    {f.name}
                  </span>
                  <div className="bar" role="img" aria-label={`${f.done} of ${f.total} days`}>
                    <span
                      style={{
                        width: `${Math.round((f.done / f.total) * 100)}%`,
                        background: f.barColor,
                      }}
                    />
                  </div>
                  <span className="n">
                    {f.done}/{f.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">More challenges</div>
            <div className="card list">
              {MORE_CHALLENGES.map((c) => {
                const on = joined.includes(c.id);
                return (
                  <div className="row" key={c.id}>
                    <div className="grow">
                      <div className="t">{c.title}</div>
                      <div className="s">{c.sub}</div>
                    </div>
                    <button
                      className="btn-ghost"
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleJoin(c.id)}
                    >
                      {on ? "Joined" : "Join"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </article>
      {toast.el}
    </EconWrap>
  );
}
