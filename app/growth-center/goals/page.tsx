"use client";

import { useEffect, useState } from "react";

// Creator Goals — the creator's own targets, with progress that
// traces to exactly one named source.
//
// HONESTY RULES (binding):
// - Videos and earnings goals are measured from the creator's own
//   records (published posts; RECORDED earnings) and say so:
//   "From your records". Estimated earnings never count — the
//   goals API never reads the estimates table.
// - Followers, views, and custom goals cannot be measured yet —
//   no platform sync exists — so their progress is a figure the
//   creator entered, and the page says so on every such goal:
//   "Entered by you — connects when platform sync arrives."
// - A completed goal enters the achievement history with the date
//   the records (or the entered figure) first reached the target.
//   Completion is stamped by the server, never claimed by hand.

type GoalType = "videos" | "earnings" | "followers" | "views" | "custom";
type GoalSource = "records" | "creator_entered";

type Goal = {
  id: string;
  goal_type: GoalType;
  target_value: number;
  unit: string;
  period: "monthly" | "total";
  manual_current: number | null;
  completed_at: string | null;
  created_at: string;
  progress: {
    current: number;
    target: number;
    pct: number;
    milestones: { pct: number; reached: boolean }[];
    source: GoalSource;
    complete: boolean;
  };
};

const TYPE_OPTIONS: { value: GoalType; label: string; defaultUnit: string }[] = [
  { value: "videos", label: "Videos published", defaultUnit: "posts" },
  { value: "earnings", label: "Earnings (recorded)", defaultUnit: "USD" },
  { value: "followers", label: "Followers", defaultUnit: "followers" },
  { value: "views", label: "Views", defaultUnit: "views" },
  { value: "custom", label: "Custom", defaultUnit: "" },
];

const TYPE_LABEL = new Map(TYPE_OPTIONS.map((t) => [t.value, t.label]));

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function sourceLabel(goal: Goal): string {
  return goal.progress.source === "records"
    ? "From your records"
    : "Entered by you — connects when platform sync arrives";
}

export default function CreatorGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formType, setFormType] = useState<GoalType>("videos");
  const [formTarget, setFormTarget] = useState("");
  const [formUnit, setFormUnit] = useState("posts");
  const [formPeriod, setFormPeriod] = useState<"monthly" | "total">("monthly");
  const [formManual, setFormManual] = useState("");
  const [saving, setSaving] = useState(false);

  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  async function load() {
    try {
      const response = await fetch("/api/goals");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your goals could not be loaded.");
      }
      setGoals(data.goals ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your goals could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const active = goals.filter((g) => !g.completed_at);
  const achieved = goals.filter((g) => g.completed_at);
  const manualType =
    formType === "followers" || formType === "views" || formType === "custom";

  function onTypeChange(value: GoalType) {
    setFormType(value);
    const opt = TYPE_OPTIONS.find((t) => t.value === value);
    setFormUnit(opt?.defaultUnit ?? "");
  }

  async function addGoal() {
    const target = Number(formTarget);
    if (!Number.isFinite(target) || target <= 0) {
      setError("Target must be a number above zero.");
      return;
    }
    const manual = formManual.trim() === "" ? null : Number(formManual);
    if (manual !== null && (!Number.isFinite(manual) || manual < 0)) {
      setError("Your current figure must be zero or above.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType: formType,
          targetValue: target,
          unit: formUnit.trim(),
          period: formPeriod,
          manualCurrent: manualType ? manual : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your goal could not be saved.");
      }
      setFormTarget("");
      setFormManual("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your goal could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveManual(goal: Goal) {
    const value = Number(manualInputs[goal.id] ?? goal.manual_current ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      setError("Your figure must be zero or above.");
      return;
    }
    setBusyId(goal.id);
    setError("");
    try {
      const response = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goal.id, manualCurrent: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your progress could not be saved.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your progress could not be saved.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteGoal(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your goal could not be deleted.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your goal could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / CREATOR GOALS
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">WHAT AM I AIMING AT?</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            CREATOR
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              GOALS.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Set a target. Watch real progress — counted from your
            records where records exist, and labeled as your own
            entered figure where they do not.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            READ THIS FIRST — WHERE PROGRESS COMES FROM
          </div>
          <p className="text-sm text-gray-300 leading-6">
            <strong className="text-gray-100">Videos</strong> goals count your
            published posts. <strong className="text-gray-100">Earnings</strong>{" "}
            goals count your <em>recorded</em> earnings only — estimated
            platform earnings never move a goal.{" "}
            <strong className="text-gray-100">Followers, views, and custom</strong>{" "}
            goals use a figure you enter, because no platform connection
            measures them yet; every such goal is labeled "Entered by you"
            until sync arrives.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your goals</h3>
            <p className="text-gray-400 mt-2">Gathering your targets...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Active goals</h2>
              {active.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No active goals yet. Set your first target below.
                </p>
              ) : (
                active.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-xl">
                          {TYPE_LABEL.get(goal.goal_type)} — {fmt(goal.progress.target)}{" "}
                          {goal.unit}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {goal.period === "monthly" ? "Each month" : "All time"} ·{" "}
                          {sourceLabel(goal)}
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {goal.progress.pct}%
                      </div>
                    </div>

                    <div className="relative mt-5">
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
                          style={{ width: `${goal.progress.pct}%` }}
                        />
                      </div>
                      <div className="relative h-5 mt-1">
                        {goal.progress.milestones.map((m) => (
                          <span
                            key={m.pct}
                            className={`absolute -translate-x-1/2 text-[10px] font-bold ${
                              m.reached ? "text-fuchsia-300" : "text-gray-600"
                            }`}
                            style={{ left: `${m.pct}%` }}
                          >
                            {m.reached ? "▼" : "▽"} {m.pct}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-gray-300 text-sm mt-2">
                      {fmt(goal.progress.current)} of {fmt(goal.progress.target)}{" "}
                      {goal.unit}
                      {goal.progress.source === "records"
                        ? " — counted from your records."
                        : " — the figure you entered."}
                    </div>

                    <div className="flex flex-wrap items-end gap-3 mt-5">
                      {goal.progress.source === "creator_entered" && (
                        <>
                          <label className="text-xs text-gray-400">
                            Update your current figure
                            <input
                              type="number"
                              min={0}
                              value={
                                manualInputs[goal.id] ??
                                (goal.manual_current !== null
                                  ? String(goal.manual_current)
                                  : "")
                              }
                              onChange={(e) =>
                                setManualInputs((prev) => ({
                                  ...prev,
                                  [goal.id]: e.target.value,
                                }))
                              }
                              className="ml-2 bg-[#080b14] border border-white/10 rounded-lg px-3 py-2 text-white w-32"
                            />
                          </label>
                          <button
                            onClick={() => saveManual(goal)}
                            disabled={busyId === goal.id}
                            className="rounded-lg border border-cyan-300/40 text-cyan-200 px-4 py-2 text-sm hover:bg-cyan-300/10 disabled:opacity-40 transition"
                          >
                            Save progress
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        disabled={busyId === goal.id}
                        className="rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                      >
                        Delete goal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">NEW GOAL</div>
                <h2 className="text-2xl font-bold mb-5">Set a target</h2>
                <label className="text-sm text-gray-300 block">
                  Goal type
                  <select
                    value={formType}
                    onChange={(e) => onTypeChange(e.target.value as GoalType)}
                    className={inputClass}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Target
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder={formType === "earnings" ? "Example: 2000" : "Example: 30"}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Unit
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    maxLength={30}
                    placeholder="posts, USD, followers…"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm text-gray-300 block mt-4">
                  Period
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as "monthly" | "total")}
                    className={inputClass}
                  >
                    <option value="monthly">Each month</option>
                    <option value="total">All time</option>
                  </select>
                </label>
                {manualType && (
                  <label className="text-sm text-gray-300 block mt-4">
                    Your current figure (entered by you)
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formManual}
                      onChange={(e) => setFormManual(e.target.value)}
                      placeholder="Where you are today"
                      className={inputClass}
                    />
                  </label>
                )}
                <button
                  onClick={addGoal}
                  disabled={saving}
                  className="mt-6 w-full rounded-xl p-4 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {saving ? "Saving..." : "Create goal"}
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
                <div className="text-cyan-400 text-xs tracking-widest mb-3">
                  ACHIEVEMENT HISTORY
                </div>
                <h2 className="text-2xl font-bold mb-5">Goals you reached</h2>
                {achieved.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Nothing here yet — honestly. A goal lands here only
                    when its progress actually reaches the target.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {achieved.map((goal) => (
                      <div
                        key={goal.id}
                        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[.05] px-5 py-4"
                      >
                        <div className="font-bold">
                          ✓ {TYPE_LABEL.get(goal.goal_type)} —{" "}
                          {fmt(goal.target_value)} {goal.unit}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Reached{" "}
                          {goal.completed_at
                            ? formatDateTime(goal.completed_at)
                            : ""}{" "}
                          · {sourceLabel(goal)}
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          disabled={busyId === goal.id}
                          className="mt-3 rounded-lg border border-red-400/40 text-red-300 px-4 py-2 text-sm hover:bg-red-400/10 disabled:opacity-40 transition"
                        >
                          Remove from history
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
