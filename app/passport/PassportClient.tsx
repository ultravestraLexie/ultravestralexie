"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fmtMoneyExact,
  initials,
  platformLabel,
  plural,
  type AudienceSnapshot,
  type GalaxyProfile,
  type PassportTrackRecord,
} from "@/lib/galaxy/core";
import { ProfileSheet } from "@/components/galaxy/ProfileSheet";
import AudiencePanel from "@/components/galaxy/AudiencePanel";
import { Icon, I, Sheet, copyText, toast } from "@/components/galaxy/ui";

/* PASSPORT client — hero, figures, verified + self-reported
 * collaborations, testimonials, and the share-link controls.
 * Self-reported items are written through the existing
 * /api/passport route (which always stores them self_reported);
 * share state goes through /api/passport/share. */

type PaidDeal = { id: string; brandName: string; deliverables: string; paidOn: string | null };
type Collab = { id: string; brand: string; note: string; range: string };
type Testimonial = { id: string; quote: string; author: string };

export default function PassportClient({
  profile,
  paidDeals,
  snapshots,
  collabs,
  testimonials,
  categories,
  initialSlug,
  initialPublic,
  initialShareHistory,
  memberSince,
  trackRecord,
}: {
  profile: GalaxyProfile;
  paidDeals: PaidDeal[];
  snapshots: AudienceSnapshot[];
  collabs: Collab[];
  testimonials: Testimonial[];
  categories: string[];
  initialSlug: string | null;
  initialPublic: boolean;
  initialShareHistory: boolean;
  memberSince: string | null;
  trackRecord: PassportTrackRecord;
}) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [testiOpen, setTestiOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [shareHistory, setShareHistoryState] = useState(initialShareHistory);
  const [shareBusy, setShareBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);

  const brandsPaid = new Set(paidDeals.map((d) => d.brandName)).size;
  const shareUrl =
    slug && typeof window !== "undefined" ? `${window.location.origin}/p/${slug}` : slug ? `/p/${slug}` : null;

  async function copyShare() {
    if (!isPublic) {
      await setPublic(true);
      return;
    }
    if (shareUrl) {
      const ok = await copyText(shareUrl);
      toast(ok ? "Share link copied." : "Copy failed.");
    }
  }

  async function setPublic(next: boolean) {
    setShareBusy(true);
    try {
      const res = await fetch("/api/passport/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: next }),
      });
      const data = (await res.json().catch(() => null)) as { slug?: string | null; public?: boolean } | null;
      if (res.ok && data) {
        setSlug(data.slug ?? null);
        setIsPublic(Boolean(data.public));
        toast(
          data.public
            ? "Your Passport is public — copy the link to share it."
            : "Your Passport is private again."
        );
        router.refresh();
      } else toast("Share settings could not be saved. Please try again.");
    } catch {
      toast("Share settings could not be saved. Please try again.");
    }
    setShareBusy(false);
  }

  async function setShareHistory(next: boolean) {
    setHistoryBusy(true);
    try {
      const res = await fetch("/api/passport/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareHistory: next }),
      });
      const data = (await res.json().catch(() => null)) as { shareHistory?: boolean } | null;
      if (res.ok && data) {
        setShareHistoryState(Boolean(data.shareHistory));
        toast(
          data.shareHistory
            ? "Track record sharing is on — it shows only while your Passport is public."
            : "Track record sharing is off."
        );
        router.refresh();
      } else toast("That setting could not be saved. Please try again.");
    } catch {
      toast("That setting could not be saved. Please try again.");
    }
    setHistoryBusy(false);
  }

  async function delEntry(id: string) {
    try {
      const res = await fetch(`/api/passport?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Removed.");
        router.refresh();
      } else toast("That could not be removed. Please try again.");
    } catch {
      toast("That could not be removed. Please try again.");
    }
  }

  return (
    <div>
      <header style={{ marginBottom: 26 }}>
        <h1 className="gx-h1">Passport</h1>
        <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
          Your track record, ready to show a brand. Work tracked here from pitch to payment is
          marked verified.
        </p>
      </header>

      <section className="gx-panel">
        <div className="gx-pass-hero">
          <div
            aria-hidden="true"
            className="gx-pass-avatar"
            style={{
              borderRadius: "50%",
              padding: 3,
              background: "conic-gradient(from 200deg,#9B5CFF,#4C74FF,#5FD0FF,#9B5CFF)",
              boxShadow: "0 0 34px -6px rgba(130,110,255,.8)",
            }}
          >
            <div
              className="gx-pass-avatar-inner"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "radial-gradient(circle at 35% 30%,#24307A,#090D33)",
              }}
            >
              {initials(profile.name || "Ultra Vestra")}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="gx-pass-name">{profile.name || "Your name"}</h2>
            <p style={{ margin: "6px 0 0", color: "var(--ink-2)" }}>
              {[
                profile.niche ? `${profile.niche} creator` : "Add your niche",
                profile.platforms.length
                  ? `on ${profile.platforms.map(platformLabel).join(", ")}`
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
            {profile.audience ? (
              <p className="gx-muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
                Audience: {profile.audience}
              </p>
            ) : null}
            <p className="gx-muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
              {[
                memberSince ? `Member since ${memberSince}` : "",
                slug ? `Passport: /p/${slug}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="gx-pass-actions">
            <button type="button" className="gx-btn gx-btn-primary" disabled={shareBusy} onClick={() => void copyShare()}>
              <Icon html={I.copy} size={15} /> {isPublic ? "Copy share link" : "Make public & share"}
            </button>
            <button type="button" className="gx-btn" onClick={() => setProfileOpen(true)}>
              Edit profile
            </button>
          </div>
        </div>
        {isPublic ? (
          <p className="gx-sub" style={{ marginTop: 14 }}>
            Public at <span style={{ color: "var(--ink-2)" }}>{shareUrl}</span>{" "}
            <button
              type="button"
              className="gx-btn gx-btn-sm gx-btn-quiet"
              disabled={shareBusy}
              onClick={() => void setPublic(false)}
            >
              Make private
            </button>
          </p>
        ) : (
          <p className="gx-sub" style={{ marginTop: 14 }}>
            Your public Passport is off. Only you can see this page until you share it.
          </p>
        )}
        <div className="gx-figs">
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">{paidDeals.length}</strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Verified collaborations</span>
          </div>
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">{brandsPaid}</strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Brands paid you</span>
          </div>
          <div style={{ padding: "12px 4px" }}>
            <strong className="gx-fig-value">
              {collabs.length + testimonials.length}
            </strong>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Self-reported items</span>
          </div>
        </div>
      </section>

      <section className="gx-panel" aria-labelledby="ver-h" style={{ marginTop: 22 }}>
        <div className="gx-panel-head">
          <h2 id="ver-h">Verified from your deal records</h2>
          <span className="gx-pill gx-pill-ver">
            <Icon html={I.ver} size={13} /> Verified
          </span>
        </div>
        <p className="gx-sub" style={{ marginTop: -6 }}>
          These figures are verified from your deal records on UltraVestra — deals you
          tracked here through to payment. They are not self-reported.
        </p>
        {trackRecord.paidDealCount > 0 ? (
          <div className="gx-figs">
            <div style={{ padding: "12px 4px" }}>
              <strong className="gx-fig-value">{trackRecord.paidDealCount}</strong>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Paid deals</span>
            </div>
            <div style={{ padding: "12px 4px" }}>
              <strong className="gx-fig-value">{fmtMoneyExact(trackRecord.totalCollectedCents)}</strong>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Total collected</span>
            </div>
            <div style={{ padding: "12px 4px" }}>
              <strong className="gx-fig-value">{trackRecord.brandsPaidCount}</strong>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Brands have paid you</span>
            </div>
            {trackRecord.avgDaysToPay != null ? (
              <div style={{ padding: "12px 4px" }}>
                <strong className="gx-fig-value">{trackRecord.avgDaysToPay}</strong>
                <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
                  Avg. days for brands to pay
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="gx-empty">
            <p>
              No paid deals yet. When a deal you track here is marked paid, it becomes a
              verified figure here — paid deals, what you collected, and how fast brands
              paid you.
            </p>
          </div>
        )}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ fontSize: 15 }}>Share my track record</strong>
            <button
              type="button"
              className={`gx-btn gx-btn-sm ${shareHistory ? "gx-btn-primary" : ""}`}
              aria-pressed={shareHistory}
              disabled={historyBusy}
              onClick={() => void setShareHistory(!shareHistory)}
            >
              {shareHistory ? "On" : "Off"}
            </button>
          </div>
          <p className="gx-sub" style={{ margin: "8px 0 0" }}>
            Off by default. When on, your public Passport also shows your paid-deal
            history and audience independence. Nothing is shared unless your Passport
            is public AND this is on.
            {shareHistory && !isPublic
              ? " Right now your Passport is private, so nothing is showing."
              : ""}
          </p>
        </div>
      </section>

      <AudiencePanel snapshots={snapshots} profilePlatforms={profile.platforms} />

      <div className="gx-pass-grid">
        <section className="gx-panel" aria-labelledby="col-h">
          <div className="gx-panel-head">
            <h2 id="col-h">Collaborations</h2>
            <button type="button" className="gx-btn gx-btn-sm" onClick={() => setCollabOpen(true)}>
              <Icon html={I.plus} size={14} /> Add past work
            </button>
          </div>
          {paidDeals.length || collabs.length ? (
            <ul className="gx-list">
              {paidDeals.map((d) => (
                <li key={d.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 14px", padding: "13px 0", alignItems: "start" }}>
                  <div>
                    <strong>{d.brandName}</strong>
                    <small style={{ display: "block", color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
                      {d.deliverables || "Brand partnership"}
                      {d.paidOn
                        ? `, paid ${new Date(d.paidOn + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                        : ""}
                    </small>
                  </div>
                  <span className="gx-pill gx-pill-ver">
                    <Icon html={I.ver} size={13} /> Verified
                  </span>
                </li>
              ))}
              {collabs.map((c) => (
                <li key={c.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 14px", padding: "13px 0", alignItems: "start" }}>
                  <div>
                    <strong>{c.brand}</strong>
                    <small style={{ display: "block", color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
                      {c.note}
                      {c.range ? `, ${c.range}` : ""}
                    </small>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="gx-pill">Self-reported</span>
                    <button
                      type="button"
                      aria-label={`Remove ${c.brand}`}
                      onClick={() => void delEntry(c.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: "transparent", color: "var(--ink-3)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0, boxShadow: "none" }}
                    >
                      <Icon html={I.close} size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="gx-empty">
              <p>Your first paid deal adds a verified collaboration here. You can also add past work yourself.</p>
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "14px 0 0" }}>
            Verified means the deal was tracked in Ultra Vestra from pitch to payment. Anything
            you add yourself is labelled self-reported.
          </p>
        </section>

        <section className="gx-panel" aria-labelledby="tst-h">
          <div className="gx-panel-head">
            <h2 id="tst-h">What brands say</h2>
            <button type="button" className="gx-btn gx-btn-sm" onClick={() => setTestiOpen(true)}>
              <Icon html={I.plus} size={14} /> Add
            </button>
          </div>
          {testimonials.length ? (
            <div>
              {testimonials.map((t) => (
                <blockquote key={t.id} style={{ margin: 0, padding: "14px 0", borderTop: "1px solid var(--line)" }}>
                  <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55 }}>“{t.quote}”</p>
                  <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>
                    <span>{t.author}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="gx-pill">Self-reported</span>
                      <button
                        type="button"
                        aria-label="Remove testimonial"
                        onClick={() => void delEntry(t.id)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: "transparent", color: "var(--ink-3)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0, boxShadow: "none" }}
                      >
                        <Icon html={I.close} size={14} />
                      </button>
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="gx-empty">
              <p>Ask a brand you worked with for two sentences about working with you, then add them here.</p>
            </div>
          )}
        </section>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} categories={categories} />
      <CollabSheet open={collabOpen} onClose={() => setCollabOpen(false)} onSaved={() => router.refresh()} />
      <TestimonialSheet open={testiOpen} onClose={() => setTestiOpen(false)} onSaved={() => router.refresh()} />
    </div>
  );
}

function CollabSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [range, setRange] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!brandName.trim() || !description.trim() || !range.trim() || !deliverables.trim()) {
      toast("Fill in every field — a collaboration needs all four.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "collaborations",
          payload: {
            brandName: brandName.trim(),
            campaignDescription: description.trim(),
            dateRange: range.trim(),
            deliverables: deliverables.trim(),
          },
        }),
      });
      if (res.ok) {
        toast("Past work added — labelled self-reported.");
        router.refresh();
        onSaved();
        onClose();
      } else toast("That could not be saved. Please try again.");
    } catch {
      toast("That could not be saved. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add past work" sub="Work from before Ultra Vestra. It is labelled self-reported — only deals tracked here count as verified.">
      <label className="gx-field">
        <span>Brand</span>
        <input className="gx-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} maxLength={200} />
      </label>
      <label className="gx-field">
        <span>What was the campaign?</span>
        <input className="gx-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="3 UGC ads for a spring launch" />
      </label>
      <div className="gx-row2">
        <label className="gx-field">
          <span>When</span>
          <input className="gx-input" value={range} onChange={(e) => setRange(e.target.value)} maxLength={120} placeholder="Spring 2025" />
        </label>
        <label className="gx-field">
          <span>Deliverables</span>
          <input className="gx-input" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} maxLength={1000} placeholder="3 videos" />
        </label>
      </div>
      <div className="gx-sheet-actions">
        <span className="spacer" />
        <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void submit()}>
          Add past work
        </button>
      </div>
    </Sheet>
  );
}

function TestimonialSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [quote, setQuote] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!quote.trim() || !authorName.trim() || !authorRole.trim()) {
      toast("Add the quote, who said it, and their role.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "testimonials",
          payload: { quote: quote.trim(), authorName: authorName.trim(), authorRole: authorRole.trim() },
        }),
      });
      if (res.ok) {
        toast("Testimonial added — labelled self-reported.");
        router.refresh();
        onSaved();
        onClose();
      } else toast("That could not be saved. Please try again.");
    } catch {
      toast("That could not be saved. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add a testimonial" sub="Two sentences from a brand you worked with.">
      <label className="gx-field">
        <span>What they said</span>
        <textarea className="gx-input" rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={1000} />
      </label>
      <div className="gx-row2">
        <label className="gx-field">
          <span>Their name</span>
          <input className="gx-input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={200} />
        </label>
        <label className="gx-field">
          <span>Their role / brand</span>
          <input className="gx-input" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} maxLength={200} placeholder="Partnerships lead" />
        </label>
      </div>
      <div className="gx-sheet-actions">
        <span className="spacer" />
        <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void submit()}>
          Add testimonial
        </button>
      </div>
    </Sheet>
  );
}
