"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HelpShell, { HIcon, HlpStyle, useHelp } from "./helpcenter/HelpUi";
import { HELP_CONFIG } from "@/lib/galaxy/help";

/* Support & About on the Settings root (the owner's Help Center
 * prototype, integrated 2026-11-24). The hero search hands the
 * query to the Help Center; "Report a problem" routes to the
 * EXISTING /support flow (support_tickets) — no second system.
 * Every panel that already lived on /settings (account, billing,
 * security, preferences, notifications, data, support, feedback)
 * is untouched and stays below/above these groups. */

function SupportTopInner() {
  const router = useRouter();
  const { openChat } = useHelp();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query ? `/settings/help?q=${encodeURIComponent(query)}` : "/settings/help"
    );
  }

  return (
    <>
      <section className="glass hero">
        <h2>How can we help?</h2>
        <p>
          Search the Help Center, or ask Vestra Help. It answers from our
          Help Center, Privacy Center and Terms.
        </p>
        <form className="search" role="search" onSubmit={onSearch}>
          <HIcon n="search" />
          <label className="sr-only" htmlFor="root-q">
            Search the Help Center
          </label>
          <input
            id="root-q"
            type="search"
            placeholder="Search: invites, earnings, delete account…"
            autoComplete="off"
            maxLength={120}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <button
          type="button"
          className="btn primary block"
          style={{ marginTop: 12 }}
          onClick={() => openChat()}
        >
          <HIcon n="chat" />
          Ask Vestra Help
        </button>
      </section>

      <div className="group-label">Support &amp; About</div>
      <nav className="glass list" aria-label="Support and about">
        <Link className="item" href="/settings/help">
          <span className="ico">
            <HIcon n="headset" />
          </span>
          <span className="grow">
            Help Center
            <span className="sub">Answers to common questions</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </Link>
        <Link className="item" href="/settings/privacy">
          <span className="ico">
            <HIcon n="lock" />
          </span>
          <span className="grow">
            Privacy Center
            <span className="sub">Your data, your controls</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </Link>
        <Link className="item" href="/settings/terms">
          <span className="ico">
            <HIcon n="info" />
          </span>
          <span className="grow">
            Terms and Policies
            <span className="sub">The rules that protect everyone</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </Link>
      </nav>

      <div className="group-label">Safety</div>
      <nav className="glass list" aria-label="Safety">
        <Link className="item" href="/settings/article/scams">
          <span
            className="ico"
            style={{ background: "rgba(74,222,128,.12)", color: "var(--h-green)" }}
          >
            <HIcon n="shield" />
          </span>
          <span className="grow">
            Stay safe from scams
            <span className="sub">What we will never ask you for</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </Link>
        <Link className="item" href="/support">
          <span
            className="ico"
            style={{ background: "rgba(245,158,66,.14)", color: "var(--h-orange)" }}
          >
            <HIcon n="flag" />
          </span>
          <span className="grow">
            Report a problem
            <span className="sub">A brand, a deal, a bug or a person</span>
          </span>
          <HIcon n="chev" cls="chev" />
        </Link>
      </nav>
    </>
  );
}

export function SettingsSupportTop({ accountEmail }: { accountEmail: string }) {
  return (
    <HelpShell accountEmail={accountEmail}>
      <SupportTopInner />
    </HelpShell>
  );
}

/* Login group (prototype): Switch account and Log out, both wired
 * to the app's real sign-out. There is no multi-account switcher —
 * switching signs out to the login screen, and the sheet says so
 * before it happens. The foot/version lines close the page, as in
 * the prototype. */
export function SettingsLoginGroup() {
  const router = useRouter();
  const [sheet, setSheet] = useState<"switch" | "logout" | null>(null);
  const [busy, setBusy] = useState(false);

  async function signOut(to: string) {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setSheet(null);
    router.push(to);
    router.refresh();
  }

  return (
    <div className="hlp">
      <HlpStyle />
      <div className="group-label">Login</div>
      <div className="glass list">
        <button type="button" className="item" onClick={() => setSheet("switch")}>
          <span className="ico">
            <HIcon n="swap" />
          </span>
          <span className="grow">Switch account</span>
        </button>
        <button type="button" className="item danger" onClick={() => setSheet("logout")}>
          <span className="ico">
            <HIcon n="logout" />
          </span>
          <span className="grow">Log out</span>
        </button>
      </div>

      <div className="foot">ULTRA VESTRA · CREATE. GROW. BUILD.</div>
      <div className="ver">Version {HELP_CONFIG.version}</div>

      {sheet ? (
        <div
          className="sheet-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(null);
          }}
        >
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="login-sheet-title">
            {sheet === "logout" ? (
              <>
                <h2 id="login-sheet-title">Log out of Ultra Vestra?</h2>
                <p>You can sign back in any time with your email.</p>
                <div className="actions">
                  <button type="button" className="btn ghost" onClick={() => setSheet(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy}
                    onClick={() => signOut("/")}
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="login-sheet-title">Switch account</h2>
                <p>
                  You’ll be signed out of this account and taken to sign in
                  with another one.
                </p>
                <div className="actions">
                  <button type="button" className="btn ghost" onClick={() => setSheet(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy}
                    onClick={() => signOut("/login")}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
