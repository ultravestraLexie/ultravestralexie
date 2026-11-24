"use client";

import { useState } from "react";
import { HOF, HOF_ORDER, HOF_PLACE, hofInitials, type HofKey } from "@/lib/galaxy/economy";
import { EconWrap, EconHead, Ico, econShare, useEconToast } from "../economy/Econ";

/* The Hall of Fame frame: four category boards with a podium, the
 * 4–7 ranks, and the creator's own strip — the prototype's sample
 * presentation, ported as-is (demo state; see page.tsx). The month
 * in the header is the real current month. */
export default function HallClient() {
  const toast = useEconToast();
  const [current, setCurrent] = useState<HofKey>("consistency");
  const set = HOF[current];
  const month = new Date().toLocaleDateString("en-US", { month: "long" });

  const rows = set.rows.map(([h, m], i) => ({ h, m, rank: i + 1 }));
  const podium = [rows[1], rows[0], rows[2]]; // 2nd, 1st, 3rd — the prototype's order

  const shareYou = async () => {
    const res = await econShare(`My Ultra Vestra Hall of Fame standing: ${set.you} (${set.label}).`);
    if (res === "copied") toast.show("Copied to share");
  };

  return (
    <EconWrap>
      <article className="screen">
        <EconHead title="Creator Hall of Fame" sub={`${month} · ranked on verified activity`} />
        <div className="tabs" aria-label="Hall of Fame categories">
          {HOF_ORDER.map((key) => (
            <button
              className="tab"
              type="button"
              key={key}
              aria-pressed={current === key}
              onClick={() => setCurrent(key)}
            >
              {HOF[key].label}
            </button>
          ))}
        </div>
        <div className="body" style={{ paddingTop: 16 }}>
          <div className="podium" aria-live="polite">
            {podium.map((r) => {
              const p = HOF_PLACE[r.rank];
              return (
                <div className="place" key={r.rank}>
                  {r.rank === 1 ? <Ico name="crown" className="crown" /> : null}
                  <div
                    className="av"
                    aria-hidden="true"
                    style={{
                      width: p.size,
                      height: p.size,
                      borderColor: p.ring,
                      boxShadow: `0 0 16px ${p.glow}`,
                    }}
                  >
                    {hofInitials(r.h)}
                  </div>
                  <div className="h">{r.h}</div>
                  <div className="m">{r.m}</div>
                  <div className="base" style={{ height: p.base, color: p.ring }} aria-label={`Rank ${r.rank}`}>
                    {r.rank}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ padding: "4px 14px" }}>
            {rows.slice(3).map((r) => (
              <div className="rank-row" key={r.rank}>
                <span className="r">{r.rank}</span>
                <span className="avatar" aria-hidden="true">
                  {hofInitials(r.h)}
                </span>
                <span className="h">{r.h}</span>
                <span className="m">{r.m}</span>
              </div>
            ))}
          </div>

          <div className="you">
            <span className="avatar" aria-hidden="true">YOU</span>
            <div className="grow" style={{ fontSize: 13, fontWeight: 600 }}>
              {set.you}
            </div>
            <button className="link-btn" type="button" onClick={shareYou}>
              Share
            </button>
          </div>
        </div>
      </article>
      {toast.el}
    </EconWrap>
  );
}
