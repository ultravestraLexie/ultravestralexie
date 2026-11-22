"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Password recovery request: emails a reset link that lands on the
 *  shared auth callback (which exchanges the code for a recovery
 *  session) and continues to /reset-password.
 *
 *  Uniform response (Phase 1 Build 2d, security battery Item 7): the
 *  page answers identically whether or not the email has an account,
 *  and whether or not the send itself succeeded — the old behavior
 *  showed the raw send error for real accounts and success for
 *  unknown emails, which leaked which emails are registered. A real
 *  send failure is logged to the console for diagnosis, never shown. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`
          : undefined,
    });
    setSubmitting(false);
    if (error) {
      console.error("[forgot-password] reset request failed:", error.message);
    }
    setSent(true);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Forgot password</h1>
      {sent ? (
        <div>
          <p>
            If an account exists for this email, a password reset link
            is on its way. Open it to choose a new password.
          </p>
          <Link href="/login">
            <button>Back to login</button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Sending reset link…" : "Send reset link"}
          </button>
          <p style={{ fontSize: 14 }}>
            Still stuck? <Link href="/support">Contact support</Link>
          </p>
        </form>
      )}
    </div>
  );
}
