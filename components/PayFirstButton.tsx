"use client";

import { useState } from "react";

/** Pay-first button on the pricing page, shown to signed-out
 *  visitors. UltraVestra accounts are created BY paying: the visitor
 *  enters the email the account will live under, we open a Stripe
 *  Checkout session stamped with that email, and the webhook parks
 *  the paid plan as a claim. The first sign-in with that email then
 *  creates the account and attaches the plan. Mirrors
 *  SubscribeButton's client pattern for the signed-in flow. */
export default function PayFirstButton({
  planSlug,
  planName,
}: {
  planSlug: string;
  planName: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, email }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        data.error === "invalid_email"
          ? "Enter the email your account will use."
          : data.error === "already_subscribed"
            ? "This email already has an UltraVestra plan. Log in with that email to use it — you will not be charged twice."
            : "Checkout could not start. Please try again."
      );
    } catch {
      setError("Checkout could not start. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label={`Email for your ${planName} account`}
        style={{ width: "100%" }}
      />
      <button type="submit" disabled={busy}>
        {busy ? "Opening checkout…" : "Create your account"}
      </button>
      {error && <span style={{ color: "crimson" }}>{error}</span>}
    </form>
  );
}
