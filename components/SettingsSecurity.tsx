"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* Settings — Security controls (trust queue #3). Both controls
 * act on the signed-in session itself, through the browser
 * Supabase client — the same client the reset-password page uses
 * for updateUser and SignOutButton uses for signOut:
 *  - Change password: supabase.auth.updateUser({ password }) on
 *    the current session. The minimum length matches the signup
 *    rule exactly (PASSWORD_MIN_LENGTH in
 *    app/api/auth/signup/route.ts — Supabase's 6-character floor,
 *    unchanged since the legacy client signUp).
 *  - Sign out everywhere: signOut({ scope: "global" }) revokes
 *    every session for this account, this one included, then the
 *    page sends the creator to /login.
 * Nothing here enrolls or claims any extra sign-in factor —
 * the app has none, so the panel does not claim it. */

/** Matches PASSWORD_MIN_LENGTH in app/api/auth/signup/route.ts. */
const PASSWORD_MIN_LENGTH = 6;

const inputStyle: React.CSSProperties = {
  background: "rgba(13,2,33,0.7)",
  border: "1px solid #4c1d95",
  borderRadius: 12,
  color: "#ffffff",
  padding: "10px 14px",
  fontSize: 15,
  width: 260,
  maxWidth: "100%",
};
const buttonStyle: React.CSSProperties = {
  background: "linear-gradient(92deg, #a855f7, #d946ef)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  border: "none",
  borderRadius: 999,
  padding: "10px 20px",
  cursor: "pointer",
};
const quietButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#f0abfc",
  fontWeight: 700,
  fontSize: 14,
  border: "1px solid #7e22ce",
  borderRadius: 999,
  padding: "10px 20px",
  cursor: "pointer",
};

export default function SettingsSecurity() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [signBusy, setSignBusy] = useState(false);
  const [signErr, setSignErr] = useState("");

  async function changePassword() {
    setPwMsg("");
    setPwErr("");
    if (password.length < PASSWORD_MIN_LENGTH) {
      setPwErr(
        `Your new password needs at least ${PASSWORD_MIN_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirm) {
      setPwErr("The two passwords do not match. Please try again.");
      return;
    }
    setPwBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPwBusy(false);
    if (error) {
      setPwErr(error.message || "Your password could not be changed. Please try again.");
      return;
    }
    setPassword("");
    setConfirm("");
    setPwMsg("Password changed. Use the new password next time you sign in.");
  }

  async function signOutEverywhere() {
    setSignErr("");
    setSignBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      setSignBusy(false);
      setSignErr("Sign out did not finish. Please try again.");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700 }}>
          Change password
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            style={buttonStyle}
            disabled={pwBusy}
            onClick={() => void changePassword()}
          >
            {pwBusy ? "Changing…" : "Change password"}
          </button>
        </div>
        {pwMsg ? (
          <p role="status" style={{ margin: "10px 0 0", color: "#86efac", fontSize: 14.5 }}>
            {pwMsg}
          </p>
        ) : null}
        {pwErr ? (
          <p role="alert" style={{ margin: "10px 0 0", color: "#fca5a5", fontSize: 14.5 }}>
            {pwErr}
          </p>
        ) : null}
      </div>

      <div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>
          Sign out everywhere
        </p>
        <p style={{ margin: "0 0 10px", color: "#ddd0ff", fontSize: 14.5 }}>
          Ends every session, including this one.
        </p>
        <button
          type="button"
          style={quietButtonStyle}
          disabled={signBusy}
          onClick={() => void signOutEverywhere()}
        >
          {signBusy ? "Signing out…" : "Sign out everywhere"}
        </button>
        {signErr ? (
          <p role="alert" style={{ margin: "10px 0 0", color: "#fca5a5", fontSize: 14.5 }}>
            {signErr}
          </p>
        ) : null}
      </div>
    </div>
  );
}
