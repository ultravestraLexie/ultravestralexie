"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Password recovery request: emails a reset link that lands on the
 *  shared auth callback (which exchanges the code for a recovery
 *  session) and continues to /reset-password. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`
          : undefined,
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Forgot password</h1>
      {sent ? (
        <div>
          <p>
            Check your email — we sent you a password reset link. Open
            it to choose a new password.
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
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Sending reset link…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
