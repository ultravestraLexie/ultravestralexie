"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Email + password auth forms.
 *
 *  LoginForm establishes the session the RLS policies rely on and
 *  honors ?next= (set by the subscription gate) so a visitor who was
 *  bounced from a member page returns there after logging in; only
 *  same-site paths are accepted.
 *
 *  CreateAccountForm is the pay-first sign-up form rendered by the
 *  post-payment /welcome page: the account is created with the email
 *  the visitor paid with, and the paid plan is attached right after
 *  (POST /api/auth/attach) — access itself is still granted only by
 *  the Stripe webhook through the shared attach helper. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

async function requestAttach(): Promise<void> {
  try {
    await fetch("/api/auth/attach", { method: "POST" });
  } catch {
    // Best effort: a failed attach never blocks entering the app;
    // the claim stays unclaimed and a later sign-in retries it.
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setSubmitting(false);
      setError(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email first, then log in."
          : "Email or password is incorrect. Please try again."
      );
      return;
    }
    if (!data.session) {
      setSubmitting(false);
      setError("Login did not create a session. Please try again.");
      return;
    }
    await requestAttach();
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Login to UltraVestra</h1>
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
        <label>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
            placeholder="Your password"
          />
        </label>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
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

export function CreateAccountForm({
  initialEmail = "",
  emailLocked = false,
}: {
  initialEmail?: string;
  emailLocked?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`
            : undefined,
      },
    });
    if (error) {
      setSubmitting(false);
      setError(
        error.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists. Log in instead."
          : error.message
      );
      return;
    }
    if (!data.session) {
      // Email confirmation is on for this project: signUp created
      // the account but no session. The claim attaches when the
      // confirmed user first logs in (callback / attach route).
      setSubmitting(false);
      setConfirmationNeeded(true);
      return;
    }
    await requestAttach();
    router.push("/dashboard");
    router.refresh();
  }

  if (confirmationNeeded) {
    return (
      <div>
        <p>Check your email to confirm your account, then log in.</p>
        <Link href="/login">
          <button>Go to login</button>
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        textAlign: "left",
      }}
    >
      <label>
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          readOnly={emailLocked}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
          placeholder="you@example.com"
        />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
          placeholder="Create a password"
        />
      </label>
      <label>
        Confirm password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
          placeholder="Repeat your password"
        />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating your account…" : "Create your account"}
      </button>
    </form>
  );
}
