"use client";

import { useState } from "react";
import Link from "next/link";

/** Subscribe button on the pricing page. Signed-out visitors are sent
 *  to log in first; signed-in creators are handed to Stripe Checkout.
 *  The plan unlocks only when the Stripe webhook confirms payment. */
export default function SubscribeButton({
  planSlug,
  planName,
  signedIn,
}: {
  planSlug: string;
  planName: string;
  signedIn: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Link href="/login">
        <button>Log in to choose {planName}</button>
      </Link>
    );
  }

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout could not start. Please try again.");
    } catch {
      setError("Checkout could not start. Please try again.");
    }
    setBusy(false);
  }

  return (
    <span>
      <button onClick={onClick} disabled={busy}>
        {busy ? "Opening checkout…" : `Choose ${planName}`}
      </button>
      {error && (
        <span style={{ display: "block", color: "crimson", marginTop: 8 }}>
          {error}
        </span>
      )}
    </span>
  );
}
