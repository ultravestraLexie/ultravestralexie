"use client";

import { useState } from "react";

/* Settings preferences (Build 9b) — every control here writes to a
 * real store the platform already reads: the weekly post goal goes
 * through PATCH /api/posts (the same save the Posting Tracker uses;
 * the Tracker, the Advisor and the home all read it), and the
 * creator username goes through PATCH /api/growth-center (the same
 * save the Growth Center uses). No decorative toggles. */

const inputStyle: React.CSSProperties = {
  background: "rgba(13,2,33,0.7)",
  border: "1px solid #4c1d95",
  borderRadius: 12,
  color: "#ffffff",
  padding: "10px 14px",
  fontSize: 15,
  width: 180,
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

export default function SettingsPrefs({
  initialGoal,
  initialUsername,
}: {
  initialGoal: number;
  initialUsername: string;
}) {
  const [goal, setGoal] = useState(String(initialGoal));
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalMsg, setGoalMsg] = useState("");
  const [goalErr, setGoalErr] = useState("");

  const [username, setUsername] = useState(initialUsername);
  const [userBusy, setUserBusy] = useState(false);
  const [userMsg, setUserMsg] = useState("");
  const [userErr, setUserErr] = useState("");

  async function saveGoal() {
    const value = Number(goal);
    if (!Number.isInteger(value) || value < 1 || value > 50) {
      setGoalErr("Weekly goal must be a whole number from 1 to 50.");
      setGoalMsg("");
      return;
    }
    setGoalBusy(true);
    setGoalErr("");
    setGoalMsg("");
    try {
      const response = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyGoal: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your goal could not be saved.");
      setGoalMsg("Saved — your Posting Tracker, Advisor and home now use this goal.");
    } catch (e) {
      setGoalErr(e instanceof Error ? e.message : "Your goal could not be saved.");
    } finally {
      setGoalBusy(false);
    }
  }

  async function saveUsername() {
    setUserBusy(true);
    setUserErr("");
    setUserMsg("");
    try {
      const response = await fetch("/api/growth-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your username could not be saved.");
      setUserMsg("Saved — your creator name inside the app.");
    } catch (e) {
      setUserErr(e instanceof Error ? e.message : "Your username could not be saved.");
    } finally {
      setUserBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <p style={{ margin: "0 0 4px" }}>
          <strong>Weekly post goal</strong>
        </p>
        <p style={{ margin: "0 0 10px", color: "#ddd0ff", fontSize: 14 }}>
          How many posts you aim to publish each week. Your Posting Tracker,
          Advisor and home measure your pace against it.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={inputStyle}
            type="number"
            min={1}
            max={50}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            aria-label="Weekly post goal"
          />
          <button style={buttonStyle} onClick={saveGoal} disabled={goalBusy}>
            {goalBusy ? "Saving…" : "Save goal"}
          </button>
        </div>
        {goalMsg && <p style={{ margin: "8px 0 0", color: "#4ade80", fontSize: 14, fontWeight: 700 }}>{goalMsg}</p>}
        {goalErr && <p style={{ margin: "8px 0 0", color: "#fda4af", fontSize: 14, fontWeight: 700 }}>{goalErr}</p>}
      </div>
      <div>
        <p style={{ margin: "0 0 4px" }}>
          <strong>Creator username</strong>
        </p>
        <p style={{ margin: "0 0 10px", color: "#ddd0ff", fontSize: 14 }}>
          3–24 characters: lowercase letters, numbers and underscores. Leave
          blank to clear it. This name is used inside the app only.
          Your public Passport address is set in the Passport section of your Me page.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={inputStyle}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            aria-label="Creator username"
          />
          <button style={buttonStyle} onClick={saveUsername} disabled={userBusy}>
            {userBusy ? "Saving…" : "Save username"}
          </button>
        </div>
        {userMsg && <p style={{ margin: "8px 0 0", color: "#4ade80", fontSize: 14, fontWeight: 700 }}>{userMsg}</p>}
        {userErr && <p style={{ margin: "8px 0 0", color: "#fda4af", fontSize: 14, fontWeight: 700 }}>{userErr}</p>}
      </div>
    </div>
  );
}
