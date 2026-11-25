"use client";

import { useEffect, useState } from "react";
import {
  INVITE_MODEL_JOINED,
  INVITE_REWARDS,
  INVITE_STORE_KEY,
  inviteProgress,
  inviteRewardStatus,
} from "@/lib/galaxy/economy";
import { EconWrap, EconHead, Ico, econCopy, econShare, useEconToast } from "../economy/Econ";

/* The Invitation frame. The link is the creator's real public
 * Passport URL (built from the origin, the way PassportClient builds
 * its share link). Joined-count + reward statuses are the
 * prototype's modeled state, persisted on this device only. */
export default function InviteClient({ passportPath }: { passportPath: string | null }) {
  const toast = useEconToast();
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(INVITE_MODEL_JOINED);
  const [link, setLink] = useState<string | null>(null);
  const [makingPublic, setMakingPublic] = useState(false);

  /* "Make your Passport public" works right here (owner order
   * 2026-11-24: "This link need to work") — one tap PATCHes the
   * same share endpoint the Passport itself uses, and the invite
   * link appears in place. No trip to another screen. */
  const makePublic = async () => {
    setMakingPublic(true);
    try {
      const res = await fetch("/api/passport/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: true }),
      });
      const data = (await res.json().catch(() => null)) as {
        slug?: string | null;
        public?: boolean;
      } | null;
      if (res.ok && data && data.public && data.slug) {
        setLink(`${window.location.origin}/p/${data.slug}`);
        toast.show("Your Passport is public — your invite link is ready");
      } else {
        toast.show("That could not be saved. Please try again.");
      }
    } catch {
      toast.show("That could not be saved. Please try again.");
    }
    setMakingPublic(false);
  };

  useEffect(() => {
    if (passportPath) setLink(`${window.location.origin}${passportPath}`);
    try {
      const raw = JSON.parse(localStorage.getItem(INVITE_STORE_KEY) || "null");
      if (raw && typeof raw.joined === "number" && raw.joined >= 0) {
        setJoined(Math.floor(raw.joined));
      } else {
        localStorage.setItem(INVITE_STORE_KEY, JSON.stringify({ joined: INVITE_MODEL_JOINED }));
      }
    } catch {
      /* no storage — the modeled state stands for this session */
    }
  }, [passportPath]);

  const progress = inviteProgress(joined);

  const onCopy = async () => {
    if (!link) return;
    const ok = await econCopy(link);
    if (ok) {
      toast.show("Invite link copied");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.show("Press and hold the link to copy");
    }
  };

  const onShare = async () => {
    if (!link) return;
    const res = await econShare("Find your Creator DNA on Ultra Vestra:", link);
    if (res === "copied") toast.show("Invite link copied");
  };

  return (
    <EconWrap>
      <article className="screen">
        <EconHead title="Invite creators" />
        <div className="body">
          <div>
            <p className="hero-title">Bring your creator friends.</p>
            <p className="hero-sub">You both unlock rewards when they finish their Creator DNA.</p>
          </div>

          <div className="card glow pad stack" style={{ gap: 12 }}>
            <span className="label">Your invite link</span>
            {link ? (
              <>
                <div className="field">
                  <input readOnly value={link} aria-label="Your invite link" />
                  <button className="btn-ghost" type="button" onClick={onCopy}>
                    <Ico name="copy" className="i" />
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <button className="btn" type="button" onClick={onShare}>
                  <Ico name="share" className="i" />
                  Share my DNA card + link
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--e-text2)" }}>
                  Your invite link is your public Passport address. Make your Passport
                  public and your link appears here, ready to share.
                </p>
                <button className="btn" type="button" onClick={makePublic} disabled={makingPublic}>
                  {makingPublic ? "Making public…" : "Make your Passport public"}
                </button>
              </>
            )}
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">How it works</div>
            <div className="card list steps">
              <div className="row">
                <span className="num">1</span>
                <div className="grow">
                  <div className="t">Share your link</div>
                  <div className="s">Put it in your bio or send it to creator friends.</div>
                </div>
              </div>
              <div className="row">
                <span className="num">2</span>
                <div className="grow">
                  <div className="t">They find their Creator DNA</div>
                  <div className="s">An invite counts once they finish the assessment.</div>
                </div>
              </div>
              <div className="row">
                <span className="num">3</span>
                <div className="grow">
                  <div className="t">You both unlock rewards</div>
                  <div className="s">More friends, bigger rewards.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card pad stack">
            <div className="between">
              <div style={{ fontWeight: 600, fontSize: 15 }}>{progress.headline}</div>
              <div style={{ fontSize: 12, color: "var(--e-muted)" }}>{progress.right}</div>
            </div>
            <div className="bar thick" role="img" aria-label={progress.headline}>
              <span style={{ width: progress.pct + "%" }} />
            </div>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label">Rewards</div>
            <div className="card list">
              {INVITE_REWARDS.map((r) => {
                const st = inviteRewardStatus(joined, r.need);
                return (
                  <div className="row" key={r.id}>
                    <div className={`ico ${r.tint}`}>
                      <Ico name={r.icon} />
                    </div>
                    <div className="grow">
                      <div className="t">{r.title}</div>
                      <div className="s">{r.needLabel}</div>
                    </div>
                    {st.state === "unlocked" ? (
                      <span className="status" style={{ color: "var(--e-green)" }}>
                        <Ico name="check" />Unlocked
                      </span>
                    ) : st.state === "todo" ? (
                      <span className="status" style={{ color: "var(--e-blue-soft)" }}>
                        {st.label}
                      </span>
                    ) : (
                      <span className="status" style={{ color: "var(--e-faint)" }}>
                        <Ico name="lock" />Locked
                      </span>
                    )}
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
