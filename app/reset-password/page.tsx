"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Password reset form. Reached through the auth callback with a
 *  recovery session (from the /forgot-password email link); setting
 *  the new password uses that signed-in session. Without a session
 *  the link has expired or was opened in another browser — the form
 *  says so and points back to /forgot-password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user));
      setReady(true);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Reset password</h1>
      {!ready ? (
        <p>Checking your reset link…</p>
      ) : !hasSession ? (
        <div>
          <p>
            This reset link has expired or was opened in a different
            browser. Request a new one to continue.
          </p>
          <Link href="/forgot-password">
            <button>Request a new reset link</button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label>
            New password
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Create a new password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Repeat your new password"
            />
          </label>
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving new password…" : "Save new password"}
          </button>
        </form>
      )}
    </div>
  );
}
