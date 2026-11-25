"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* Business listings (rebuild Phase 3) — the business side of the
 * real marketplace: post an opportunity into
 * public.market_listings, read the creator applications it
 * receives from public.market_applications, and decide them.
 * Accepting runs the database function that creates the
 * creator's deal; the result shows here immediately. */

export type BizApplication = {
  id: string;
  creatorName: string;
  pitch: string;
  status: string;
  createdAt: string;
};

export type BizListing = {
  id: string;
  title: string;
  category: string;
  pay: string | null;
  status: string;
  applications: BizApplication[];
};

const CATEGORIES = ["UGC video", "Review", "Unboxing", "Tutorial", "Livestream", "Photo set", "Other"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.05)",
  border: "1px solid var(--e-line)",
  borderRadius: 10,
  color: "var(--e-text)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  marginBottom: 10,
};

export default function BusinessListings({ initial }: { initial: BizListing[] }) {
  const router = useRouter();
  const [listings, setListings] = useState<BizListing[]>(initial);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pay, setPay] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState("");

  async function create() {
    if (busy || !title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const dollars = pay.trim() ? Number(pay) : undefined;
      if (dollars !== undefined && (Number.isNaN(dollars) || dollars < 0)) {
        setError("Pay must be a number of dollars, or blank.");
        return;
      }
      const res = await fetch("/api/market/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          compensationDollars: dollars,
          deliverables: deliverables.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.listing) {
        setError(body?.error ?? "The listing could not be saved.");
        return;
      }
      setListings((prev) => [
        {
          id: body.listing.id,
          title: title.trim(),
          category,
          pay: dollars !== undefined ? `$${dollars.toLocaleString("en-US")}` : null,
          status: "open",
          applications: [],
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      setPay("");
      setDeliverables("");
    } finally {
      setBusy(false);
    }
  }

  async function decide(listingId: string, app: BizApplication, decision: "accept" | "decline") {
    setDeciding(app.id);
    try {
      const res = await fetch("/api/market/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id, decision }),
      });
      if (!res.ok) return;
      setListings((prev) =>
        prev.map((l) =>
          l.id !== listingId
            ? l
            : {
                ...l,
                applications: l.applications.map((a) =>
                  a.id === app.id ? { ...a, status: decision === "accept" ? "accepted" : "declined" } : a
                ),
              }
        )
      );
      if (decision === "accept") router.refresh();
    } finally {
      setDeciding("");
    }
  }

  async function toggleStatus(l: BizListing) {
    const next = l.status === "open" ? "closed" : "open";
    const res = await fetch("/api/market/listings/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: l.id, status: next }),
    });
    if (!res.ok) return;
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: next } : x)));
  }

  return (
    <div>
      <div className="composer">
        <div className="label">Post an opportunity</div>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} placeholder="Title — e.g. UGC video for our new serum" aria-label="Listing title" />
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          placeholder="The brief — what the creator makes, where it posts, any must-haves."
          aria-label="Listing description"
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select style={{ ...inputStyle, width: "auto", flex: "1 1 160px" }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input style={{ ...inputStyle, width: "auto", flex: "1 1 140px" }} value={pay} onChange={(e) => setPay(e.target.value)} placeholder="Pay in $ (optional)" inputMode="decimal" aria-label="Pay in dollars" />
        </div>
        <input style={inputStyle} value={deliverables} onChange={(e) => setDeliverables(e.target.value.slice(0, 500))} placeholder="Deliverables — e.g. 1 TikTok video, 30–60s" aria-label="Deliverables" />
        {error ? <div className="err">{error}</div> : null}
        <div className="composer-row">
          <span className="count">Goes live on the Market immediately</span>
          <button className="postbtn" onClick={create} disabled={busy || !title.trim()}>
            {busy ? "Posting…" : "Post opportunity"}
          </button>
        </div>
      </div>

      <div className="label" style={{ marginTop: 8 }}>Your listings</div>
      {listings.length === 0 ? (
        <div className="empty">Nothing posted yet. Your first opportunity can be live in under a minute.</div>
      ) : (
        listings.map((l) => (
          <article className="post" key={l.id}>
            <div className="p-head">
              <span>
                <span className="p-name">{l.title}</span>
                <br />
                <span className="p-meta">
                  {l.category}
                  {l.pay ? ` · Pays ${l.pay}` : ""} · {l.applications.length} application{l.applications.length === 1 ? "" : "s"}
                </span>
              </span>
              <button className="follow" onClick={() => toggleStatus(l)}>
                {l.status === "open" ? "Open — tap to close" : "Closed — tap to reopen"}
              </button>
            </div>
            {l.applications.map((a) => (
              <div className="comment" key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <span>
                  <span className="who">{a.creatorName}</span>
                  {a.pitch || "Applied without a pitch."}
                </span>
                {a.status === "applied" ? (
                  <span style={{ display: "flex", gap: 8 }}>
                    <button className="cpost" onClick={() => decide(l.id, a, "accept")} disabled={deciding === a.id}>
                      Accept
                    </button>
                    <button className="cbtn" onClick={() => decide(l.id, a, "decline")} disabled={deciding === a.id}>
                      Decline
                    </button>
                  </span>
                ) : (
                  <span className="kind">{a.status === "accepted" ? "Accepted — deal created" : "Declined"}</span>
                )}
              </div>
            ))}
          </article>
        ))
      )}
    </div>
  );
}
