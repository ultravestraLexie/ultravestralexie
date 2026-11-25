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
 *  post-payment /welcome page. It never calls supabase.auth.signUp
 *  itself: it posts to POST /api/auth/signup, which creates the
 *  account through the admin API ONLY when a paid claim exists for
 *  the email (no account exists before payment), then this form
 *  signs in with the password. Access itself is still granted only
 *  by the Stripe webhook through the shared attach helper. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/feed";
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
  const [paymentRequired, setPaymentRequired] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPaymentRequired(false);
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setSubmitting(true);

    // The server creates the account only when this email has paid
    // (see app/api/auth/signup/route.ts). Email confirmation is OFF
    // for this project, so a created account can sign in at once.
    let res: Response;
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }
    if (res.status === 403) {
      setSubmitting(false);
      setPaymentRequired(true);
      setError(
        "We could not find a payment for this email. Please complete checkout first."
      );
      return;
    }
    if (res.status === 409) {
      setSubmitting(false);
      setError(
        "An account with this email already exists. Log in instead."
      );
      return;
    }
    if (res.status === 429) {
      setSubmitting(false);
      setError("Too many attempts. Please wait a bit and try again.");
      return;
    }
    if (!res.ok) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) {
      setSubmitting(false);
      setError(
        "Your account was created, but login failed. Please log in."
      );
      return;
    }
    await requestAttach();
    // New accounts go through Get Started — the guided path to a
    // first computed insight — instead of landing cold on the
    // dashboard. Returning logins keep their ?next= target.
    router.push("/get-started");
    router.refresh();
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
      {paymentRequired && (
        <p>
          <Link href="/pricing">See plans and complete checkout</Link>
        </p>
      )}
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating your account…" : "Create your account"}
      </button>
    </form>
  );
}
