"use client";

import { useState } from "react";
import Link from "next/link";

/* MarketBoard (rebuild Phase 3) — the REAL marketplace listings
 * on /market: opportunities posted by registered businesses into
 * public.market_listings, and the signed-in creator's own
 * applications from public.market_applications. Applying writes
 * a real application the business sees; when a business accepts,
 * a real deal appears on the creator's Deals board. */

export type MarketListing = {
  id: string;
  company: string;
  title: string;
  description: string;
  category: string;
  pay: string | null;
  deliverables: string;
  createdAt: string;
};

export type MyApplication = {
  id: string;
  listingId: string;
  listingTitle: string;
  company: string;
  status: string;
};

function ListingCard({
  l,
  applied,
  onApplied,
}: {
  l: MarketListing;
  applied: boolean;
  onApplied: (a: MyApplication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/market/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: l.id, pitch: pitch.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "The application could not be saved.");
        return;
      }
      onApplied({ id: body.application.id, listingId: l.id, listingTitle: l.title, company: l.company, status: "applied" });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="post">
      <div className="p-head">
        <span>
          <span className="p-name">{l.title}</span>
          <br />
          <span className="p-meta">
            {l.company} · {l.category}
            {l.pay ? ` · Pays ${l.pay}` : ""}
          </span>
        </span>
        <span className="kind">Open</span>
      </div>
      {l.description ? <div className="p-cap">{l.description}</div> : null}
      {l.deliverables ? <div className="p-cap">Deliverables: {l.deliverables}</div> : null}
      <div className="p-actions">
        {applied ? (
          <span className="kind">Applied ✓</span>
        ) : open ? (
          <span style={{ display: "flex", gap: 8, flex: 1 }}>
            <input
              style={{
                flex: 1,
                background: "rgba(255,255,255,.05)",
                border: "1px solid var(--e-line)",
                borderRadius: 10,
                color: "var(--e-text)",
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "inherit",
                minWidth: 0,
              }}
              value={pitch}
              onChange={(e) => setPitch(e.target.value.slice(0, 500))}
              placeholder="Your pitch — why you, in a sentence or two"
              aria-label="Your pitch"
            />
            <button className="cpost" onClick={apply} disabled={busy}>
              {busy ? "Sending…" : "Send application"}
            </button>
          </span>
        ) : (
          <button className="cbtn" onClick={() => setOpen(true)}>
            Apply
          </button>
        )}
      </div>
      {error ? <div className="err">{error}</div> : null}
    </article>
  );
}

export default function MarketBoard({
  listings,
  initialApplications,
}: {
  listings: MarketListing[];
  initialApplications: MyApplication[];
}) {
  const [apps, setApps] = useState<MyApplication[]>(initialApplications);

  return (
    <div style={{ marginTop: 26 }}>
      <div className="label">Live opportunities</div>
      <h3 style={{ fontFamily: "var(--font-display, inherit)", fontSize: 22, margin: "6px 0 4px" }}>
        Posted by businesses, right now
      </h3>
      <p className="sub">
        These are real listings from registered businesses on UltraVestra. Apply here — the
        business sees your application, and an acceptance becomes a real deal on your Deals
        board.
      </p>
      {listings.length === 0 ? (
        <div className="empty">
          No business has posted an opportunity yet. When one does, it appears here the moment
          it is posted.
        </div>
      ) : (
        listings.map((l) => (
          <ListingCard
            key={l.id}
            l={l}
            applied={apps.some((a) => a.listingId === l.id)}
            onApplied={(a) => setApps((prev) => [a, ...prev])}
          />
        ))
      )}
      {apps.length > 0 ? (
        <div style={{ marginTop: 22 }}>
          <div className="label">My applications</div>
          {apps.map((a) => (
            <div className="post" key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span>
                <span className="p-name">{a.listingTitle}</span>
                <br />
                <span className="p-meta">{a.company}</span>
              </span>
              {a.status === "accepted" ? (
                <Link className="cbtn" href="/deals">
                  Accepted — see it in Deals →
                </Link>
              ) : (
                <span className="kind">{a.status === "applied" ? "Applied — waiting" : a.status}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
