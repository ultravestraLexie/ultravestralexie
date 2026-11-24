"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUDIENCE_METHODOLOGY,
  audiencePlatformLabel,
  audiencePlatformOptions,
  audienceStandings,
  audienceSummary,
  dependencyVerdict,
  fmtDate,
  onePercentMove,
  todayKey,
  type AudienceSnapshot,
} from "@/lib/galaxy/core";
import { Icon, I, toast } from "@/components/galaxy/ui";

/* AUDIENCE INDEPENDENCE CENTER (System #6) — Passport panel.
 * Every number here is creator-entered (public.audience_snapshots
 * via /api/audience): there are no platform connections, and the
 * header says so. The math (standings, dependency share with the
 * email list EXCLUDED, owned share with it included, growth,
 * engagement trend, the 1%-move next step) lives in core.ts and
 * runs only on the creator's real snapshots — no snapshots, no
 * figures, just the empty state and the log form. */

const fmtCount = (n: number) => n.toLocaleString("en-US");
const fmtSigned = (n: number) => (n > 0 ? `+${fmtCount(n)}` : fmtCount(n));
const fmtPct = (n: number) => `${Number(n.toFixed(2))}%`;

export default function AudiencePanel({
  snapshots,
  profilePlatforms,
}: {
  snapshots: AudienceSnapshot[];
  profilePlatforms: string[];
}) {
  const router = useRouter();
  const standings = audienceStandings(snapshots);
  const summary = audienceSummary(snapshots);
  const options = audiencePlatformOptions(profilePlatforms);
  const history = [...snapshots]
    .sort(
      (a, b) =>
        b.capturedOn.localeCompare(a.capturedOn) ||
        b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, 8);

  const [platform, setPlatform] = useState(options[0] ?? "tiktok");
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  const [date, setDate] = useState(todayKey());
  const [busy, setBusy] = useState(false);

  async function submit() {
    const count = Number(followers);
    if (followers.trim() === "" || !Number.isInteger(count) || count < 0) {
      toast("Enter the follower count as a whole number, 0 or more.");
      return;
    }
    let engagementPct: number | null = null;
    if (engagement.trim() !== "") {
      const e = Number(engagement);
      if (!Number.isFinite(e) || e < 0 || e > 100) {
        toast("Engagement is a percentage between 0 and 100 — or leave it blank.");
        return;
      }
      engagementPct = e;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast("Pick the date these numbers are as of.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          followers: count,
          engagementPct,
          capturedOn: date,
        }),
      });
      if (res.ok) {
        toast("Audience entry added.");
        setFollowers("");
        setEngagement("");
        router.refresh();
      } else toast("That entry could not be saved. Please try again.");
    } catch {
      toast("That entry could not be saved. Please try again.");
    }
    setBusy(false);
  }

  async function del(id: string) {
    try {
      const res = await fetch(`/api/audience?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Entry removed.");
        router.refresh();
      } else toast("That entry could not be removed. Please try again.");
    } catch {
      toast("That entry could not be removed. Please try again.");
    }
  }

  const biggestLabel = summary.biggestPlatform
    ? audiencePlatformLabel(summary.biggestPlatform)
    : null;

  return (
    <section className="gx-panel" aria-labelledby="aud-h" style={{ marginTop: 22 }}>
      <div className="gx-panel-head">
        <h2 id="aud-h">Audience independence</h2>
      </div>
      <p className="gx-sub" style={{ marginTop: -6 }}>
        Your numbers, entered by you — nothing is pulled from the platforms.
        Log them as they change and this page reads back your growth, your
        platform dependency, and the audience you actually own.
      </p>

      {snapshots.length === 0 ? (
        <div className="gx-empty">
          <p>
            No audience numbers yet. Add your first counts below — one entry
            per platform, plus your email list — and your standings,
            dependency read and growth appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="gx-adv-block">
            <div className="gx-adv-label">Where your audience lives</div>
            {standings.map((s) => {
              const owned = s.platform === "email";
              return (
                <div
                  key={s.platform}
                  className={owned ? "gx-aud-row gx-aud-owned" : "gx-aud-row"}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong>{audiencePlatformLabel(s.platform)}</strong>
                    {owned ? (
                      <span className="gx-pill gx-pill-good" style={{ marginLeft: 8 }}>
                        Owned
                      </span>
                    ) : null}
                    <small
                      style={{
                        display: "block",
                        color: "var(--ink-3)",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      {[
                        s.engagementPct != null
                          ? `${fmtPct(s.engagementPct)} engagement${
                              s.engagementTrend
                                ? ` · ${s.engagementTrend === "flat" ? "flat" : s.engagementTrend === "up" ? "rising" : "falling"}`
                                : ""
                            }`
                          : null,
                        `as of ${fmtDate(s.capturedOn)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 16 }}>{fmtCount(s.followers)}</strong>
                    {s.growthSinceLast != null ? (
                      <small
                        className={
                          s.growthSinceLast > 0
                            ? "gx-aud-up"
                            : s.growthSinceLast < 0
                              ? "gx-aud-down"
                              : undefined
                        }
                        style={{
                          display: "block",
                          fontSize: 13,
                          marginTop: 2,
                          color:
                            s.growthSinceLast === 0 ? "var(--ink-3)" : undefined,
                        }}
                      >
                        {s.growthSinceLast === 0
                          ? "No change since last entry"
                          : `${fmtSigned(s.growthSinceLast)} since last entry`}
                      </small>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {summary.totalReach != null ? (
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "10px 0 0" }}>
                Total reach {fmtCount(summary.totalReach)}
                {summary.platformReach != null
                  ? ` — ${fmtCount(summary.platformReach)} on platforms, ${fmtCount(summary.emailFollowers ?? 0)} on your own list`
                  : ""}
                .
              </p>
            ) : null}
          </div>

          <div className="gx-adv-block">
            <div className="gx-adv-label">Platform dependency</div>
            {summary.biggestPlatform && summary.dependencyPct != null ? (
              <>
                <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55 }}>
                  <strong>{biggestLabel}</strong> carries{" "}
                  <strong>{summary.dependencyPct}%</strong> of your platform
                  reach. {dependencyVerdict(summary.dependencyPct)}.
                </p>
                {summary.dependencyPct >= 70 && summary.secondPlatform ? (
                  <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                    {audiencePlatformLabel(summary.secondPlatform)} is your
                    hedge — it is only {summary.secondPct}% today.
                  </p>
                ) : null}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                No platform audience logged yet — dependency can only be read
                once a platform is tracked.
              </p>
            )}
          </div>

          <div className="gx-adv-block">
            <div className="gx-adv-label">The audience you own</div>
            {summary.emailFollowers != null && summary.emailFollowers > 0 ? (
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55 }}>
                Your list: <strong>{fmtCount(summary.emailFollowers)} people</strong>
                {summary.ownedPct != null
                  ? ` — ${summary.ownedPct}% of your audience is yours no matter what the algorithms do.`
                  : "."}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55 }}>
                Your list is the gap:{" "}
                {summary.emailFollowers === 0
                  ? "it sits at 0"
                  : "no email list is tracked yet"}
                , so everyone who follows you is reachable only through a
                platform.
              </p>
            )}
            {summary.ownedPct != null &&
            summary.ownedPct < 10 &&
            summary.biggestPlatform &&
            summary.biggestFollowers ? (
              <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                Moving just 1% of your {biggestLabel} audience to your list
                adds ~{fmtCount(onePercentMove(summary.biggestFollowers))}{" "}
                subscribers you own.
              </p>
            ) : null}
          </div>

          <p className="gx-sub" style={{ margin: "14px 0 0" }}>
            {AUDIENCE_METHODOLOGY}
          </p>
        </>
      )}

      <div className="gx-adv-block">
        <div className="gx-adv-label">Log your numbers</div>
        <div className="gx-aud-form">
          <label className="gx-field">
            <span>Platform</span>
            <select
              className="gx-input"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {options.map((p) => (
                <option key={p} value={p}>
                  {audiencePlatformLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="gx-field">
            <span>Followers / subscribers</span>
            <input
              className="gx-input"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="12000"
            />
          </label>
          <label className="gx-field">
            <span>Engagement % (optional)</span>
            <input
              className="gx-input"
              type="number"
              min={0}
              max={100}
              step="0.1"
              inputMode="decimal"
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              placeholder="4.2"
            />
          </label>
          <label className="gx-field">
            <span>As of</span>
            <input
              className="gx-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="gx-btn gx-btn-primary"
            disabled={busy}
            onClick={() => void submit()}
          >
            <Icon html={I.plus} size={15} /> Add entry
          </button>
        </div>
      </div>

      {history.length ? (
        <div className="gx-adv-block">
          <div className="gx-adv-label">Recent entries</div>
          <ul className="gx-list">
            {history.map((s) => (
              <li
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: "4px 14px",
                  padding: "10px 0",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 14.5 }}>
                  <strong>{audiencePlatformLabel(s.platform)}</strong>
                  <span style={{ color: "var(--ink-2)" }}>
                    {" "}· {fmtCount(s.followers)}
                    {s.engagementPct != null ? ` · ${fmtPct(s.engagementPct)}` : ""} ·{" "}
                    {fmtDate(s.capturedOn)}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${audiencePlatformLabel(s.platform)} entry from ${fmtDate(s.capturedOn)}`}
                  onClick={() => void del(s.id)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: 0,
                    background: "transparent",
                    color: "var(--ink-3)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    boxShadow: "none",
                  }}
                >
                  <Icon html={I.close} size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
