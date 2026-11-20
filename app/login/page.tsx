"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Placeholder auth page (Supabase email magic link).
 *  Full onboarding — niche questionnaire, interests, portfolio — is a
 *  later milestone; this only establishes the session the RLS policies
 *  rely on, and creates the profile row on first sign-in. */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=/brands`
            : undefined,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Log in to Ultra Vestra</h1>
      {sent ? (
        <p>
          Check your email — we sent you a sign-in link. After signing in,
          complete your creator profile so Ultra Vestra can match you to the right
          brands.
        </p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
              placeholder="you@example.com"
            />
          </label>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <button type="submit">Send sign-in link</button>
        </form>
      )}
    </div>
  );
}
