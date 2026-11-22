"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Placeholder auth form (Supabase email magic link).
 *  Full onboarding — niche questionnaire, interests, portfolio — is a
 *  later milestone; this only establishes the session the RLS policies
 *  rely on, and creates the profile row on first sign-in.
 *  Honors ?next= (set by the subscription gate) so a visitor who was
 *  bounced from a member page returns there after signing in; only
 *  same-site paths are accepted. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/brands";
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
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
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
            : undefined,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Login to UltraVestra</h1>
      {sent ? (
        <p>
          Check your email — we sent you a sign-in link. After signing in,
          complete your creator profile so UltraVestra can match you to the right
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
      <div
        style={{
          marginTop: 40,
          borderTop: "1px solid #3d2a6e",
          paddingTop: 24,
        }}
      >
        <h2>Create your account</h2>
        <p>
          New to UltraVestra? Choose a plan and pay first — your
          account is created with the email you pay with.
        </p>
        <Link href="/pricing">
          <button>See plans and create your account</button>
        </Link>
      </div>
    </div>
  );
}
