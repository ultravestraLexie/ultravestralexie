"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KB,
  PRIVACY_CONTROLS,
  PRIVACY_STORE_KEY,
  articleById,
} from "@/lib/galaxy/help";
import { supportTicketRef, type SupportTicket } from "@/lib/galaxy/core";
import HelpShell, {
  ArticleRow,
  HIcon,
  useHelp,
} from "../helpcenter/HelpUi";

/* The Privacy Center view (prototype layout, real wiring):
 * - Four topic cards into the Privacy Policy articles.
 * - Privacy controls: Public Creator Passport is the REAL server
 *   flag (PATCH /api/passport/share, the same writer the Passport
 *   itself uses). The remaining toggles govern device-local
 *   surfaces (Hall of Fame / Challenges are on-device in this app)
 *   and persist on-device under the prototype's own store key.
 *   Two prototype toggles are NOT ported: "Show earnings on my
 *   Passport" (the public Passport never shows amounts — there is
 *   nothing to toggle) and "Email tips and updates" (the real
 *   notification controls already live in Settings ›
 *   Notifications; email alerts are not live).
 * - Download = GET /api/export, the existing direct download.
 * - Delete = an honest request: the sheet explains the request
 *   goes to the support team, who confirm by email; the policy's
 *   30-day deletion window runs from that confirmation. */

const CARDS = [
  { id: "p-collect", icon: "db", b: "What we collect", s: "Account info, the stats you connect, the deals you add." },
  { id: "p-use", icon: "gear", b: "How we use it", s: "To run your tools, match brands and show your progress." },
  { id: "p-public", icon: "eye", b: "What’s public", s: "Only what you choose. Earnings stay private by default." },
  { id: "p-rights", icon: "shield", b: "Your rights", s: "See, download, fix or delete your data." },
];

function PrivacyInner({
  initialPassportPublic,
  accountEmail,
}: {
  initialPassportPublic: boolean;
  accountEmail: string;
}) {
  const router = useRouter();
  const { toast } = useHelp();
  const [passportPublic, setPassportPublic] = useState(initialPassportPublic);
  const [passportBusy, setPassportBusy] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [sending, setSending] = useState(false);
  const [filedRef, setFiledRef] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRIVACY_STORE_KEY);
      if (raw) setPrefs(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* defaults apply */
    }
  }, []);

  async function togglePassport() {
    const next = !passportPublic;
    setPassportBusy(true);
    try {
      const res = await fetch("/api/passport/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: next }),
      });
      const data = (await res.json().catch(() => null)) as {
        public?: boolean;
      } | null;
      if (res.ok && data) {
        setPassportPublic(Boolean(data.public));
        toast(
          data.public
            ? "Your Passport is public — copy the link to share it."
            : "Your Passport is private again."
        );
        router.refresh();
      } else {
        toast("Share settings could not be saved. Please try again.");
      }
    } catch {
      toast("Share settings could not be saved. Please try again.");
    }
    setPassportBusy(false);
  }

  function toggleLocal(id: string, t: string) {
    setPrefs((prev) => {
      const def = PRIVACY_CONTROLS.find((c) => c.id === id);
      const cur = typeof prev[id] === "boolean" ? prev[id] : def?.on ?? true;
      const next = { ...prev, [id]: !cur };
      try {
        localStorage.setItem(PRIVACY_STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      toast(t + (!cur ? ": on" : ": off"));
      return next;
    });
  }

  async function fileDeletion() {
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "account-access",
          subject: "Account deletion request",
          message:
            "I am requesting permanent deletion of my Ultra Vestra account and data, from Settings › Privacy Center › Delete my account. Please confirm by email.",
          contactEmail: accountEmail,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ticket?: SupportTicket;
        error?: string;
      } | null;
      if (res.ok && data?.ticket) {
        setFiledRef(supportTicketRef(data.ticket));
      } else {
        toast(
          data?.error ??
            "Your request could not be sent. Please try again, or email us from Support."
        );
      }
    } catch {
      toast("Your request could not be sent. Please try again.");
    }
    setSending(false);
  }

  const privacyArticles = KB.filter((a) => a.s === "privacy");

  return (
    <>
      <div className="back-row">
        <Link className="icon-btn" href="/settings" aria-label="Back to Settings">
          <HIcon n="back" />
        </Link>
        <span style={{ font: "700 18px var(--h-display)" }}>Settings</span>
      </div>
      <h2 className="page-title">Privacy Center</h2>
      <p className="page-sub">
        Your data, your rules. See what we collect, what’s public, and change
        it any time.
      </p>

      <div className="cards4">
        {CARDS.map((c) => {
          const a = articleById.get(c.id);
          if (!a) return null;
          return (
            <Link key={c.id} className="glass mini" href={`/settings/article/${c.id}`}>
              <span className="ico">
                <HIcon n={c.icon} />
              </span>
              <b>{c.b}</b>
              <span>{c.s}</span>
            </Link>
          );
        })}
      </div>

      <div className="group-label">Privacy controls</div>
      <div className="glass">
        <div className="toggle-row">
          <div className="grow">
            <div className="t" id="lbl-publicPassport">
              Public Creator Passport
            </div>
            <div className="s">Anyone with your link can see your Passport.</div>
          </div>
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={passportPublic}
            aria-labelledby="lbl-publicPassport"
            disabled={passportBusy}
            onClick={togglePassport}
          >
            <span />
          </button>
        </div>
        {PRIVACY_CONTROLS.map((c) => {
          const on =
            typeof prefs[c.id] === "boolean" ? prefs[c.id] : c.on;
          return (
            <div className="toggle-row" key={c.id}>
              <div className="grow">
                <div className="t" id={`lbl-${c.id}`}>
                  {c.t}
                </div>
                <div className="s">{c.s}</div>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={on}
                aria-labelledby={`lbl-${c.id}`}
                onClick={() => toggleLocal(c.id, c.t)}
              >
                <span />
              </button>
            </div>
          );
        })}
      </div>

      <div className="group-label">Your data</div>
      <div className="glass list">
        <a className="item" href="/api/export">
          <span className="ico">
            <HIcon n="download" />
          </span>
          <span className="grow">
            Download my data
            <span className="sub">Get a copy of everything in your account</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </a>
        <button type="button" className="item danger" onClick={() => setSheet(true)}>
          <span className="ico">
            <HIcon n="trash" />
          </span>
          <span className="grow">
            Delete my account
            <span className="sub" style={{ color: "var(--h-faint)" }}>
              Permanently remove your account and data
            </span>
          </span>
          <HIcon n="chev" cls="chev" />
        </button>
      </div>

      <div className="group-label">Full Privacy Policy</div>
      <nav className="glass list" aria-label="Privacy policy sections">
        {privacyArticles.map((a) => (
          <ArticleRow key={a.id} article={a} />
        ))}
      </nav>

      {sheet ? (
        <div
          className="sheet-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(false);
          }}
        >
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="del-sheet-title">
            {filedRef ? (
              <>
                <h2 id="del-sheet-title">Deletion requested</h2>
                <p>
                  Request received. We read every request and reply by
                  email. Your reference: <b>{filedRef}</b>
                </p>
                <p>
                  Once the team confirms your request by email, your data
                  is permanently deleted within 30 days, except anything
                  we must keep by law.
                </p>
                <div className="actions" style={{ gridTemplateColumns: "1fr" }}>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => setSheet(false)}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="del-sheet-title">Delete your account?</h2>
                <p>
                  There’s no instant self-serve delete: this sends a
                  deletion request to the Ultra Vestra team through
                  Support. They confirm by email, and your Passport,
                  Content DNA, deals and rewards are then permanently
                  removed — your data is deleted within 30 days of the
                  confirmed request, except anything we must keep by law.
                  This can’t be undone.
                </p>
                <label htmlFor="del-confirm">Type DELETE to confirm</label>
                <input
                  id="del-confirm"
                  className="field"
                  autoComplete="off"
                  autoCapitalize="characters"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
                <div style={{ height: 12 }} />
                <div className="actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setSheet(false)}
                  >
                    Keep my account
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={confirmText.trim() !== "DELETE" || sending}
                    onClick={fileDeletion}
                  >
                    {sending ? "Sending…" : "Request deletion"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function PrivacyClient({
  accountEmail,
  initialPassportPublic,
}: {
  accountEmail: string;
  initialPassportPublic: boolean;
}) {
  return (
    <HelpShell accountEmail={accountEmail}>
      <PrivacyInner
        initialPassportPublic={initialPassportPublic}
        accountEmail={accountEmail}
      />
    </HelpShell>
  );
}
