"use client";

import { useEffect, useState } from "react";

// Creator Growth Map — the creator's own planning workspace, the
// platform's "Apply + Grow" function: objectives they set,
// experiments they run, and content gaps they noticed, in one place.
//
// HONESTY RULE (binding): everything on this page is the creator's
// own plan, entered by the creator through these forms. It is NOT
// platform analytics, not a platform measurement, and not something
// UltraVestra detected — the copy says exactly that wherever it
// matters. The summary strip counts the creator's own rows and is
// labeled "Your plan at a glance" for the same reason.
//
// Experiments are how a Creator Lab top improvement becomes action:
// one change, a hypothesis, and a measure. The form says so.
//
// All reads and writes go through /api/growth-map (session +
// subscription gated, owner-only). This page holds no direct
// database access.

type Kind = "objective" | "experiment" | "gap";

type GrowthItem = {
  id: string;
  kind: Kind;
  payload: Record<string, string>;
  status: string;
  progress_percent: number | null;
  created_at: string;
  updated_at: string;
};

type FieldDef = {
  name: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
  optional?: boolean;
};

const OBJECTIVE_FIELDS: FieldDef[] = [
  { name: "title", label: "Objective", placeholder: "What are you working toward?" },
  {
    name: "metric",
    label: "Metric",
    placeholder: "Example: TikTok followers",
  },
  {
    name: "target",
    label: "Target",
    placeholder: "Example: 10,000 by March",
  },
  {
    name: "targetDate",
    label: "Target date (optional)",
    placeholder: "Example: March 31, 2026",
    optional: true,
  },
];

const EXPERIMENT_FIELDS: FieldDef[] = [
  {
    name: "title",
    label: "The change",
    placeholder: "What will you change? Example: Show the product in the first 2 seconds",
  },
  {
    name: "hypothesis",
    label: "Hypothesis",
    placeholder: "What do you expect to happen, and why?",
    textarea: true,
  },
  {
    name: "measure",
    label: "Measure",
    placeholder: "What will you watch? Example: Click-through rate over the next 5 videos",
  },
];

const GAP_FIELDS: FieldDef[] = [
  {
    name: "title",
    label: "Content gap",
    placeholder: "What is missing from your content?",
  },
  {
    name: "note",
    label: "What you noticed",
    placeholder: "What is missing, and the evidence you saw for it — a comment, a question viewers keep asking, a video you never made",
    textarea: true,
  },
];

const STATUS_STYLES: Record<string, string> = {
  active: "border-cyan-400/40 text-cyan-300",
  achieved: "border-emerald-400/40 text-emerald-300",
  archived: "border-white/20 text-gray-400",
  planned: "border-violet-400/40 text-violet-300",
  running: "border-fuchsia-400/40 text-fuchsia-300",
  done: "border-emerald-400/40 text-emerald-300",
  open: "border-amber-400/40 text-amber-300",
  addressed: "border-emerald-400/40 text-emerald-300",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${
        STATUS_STYLES[status] ?? "border-white/20 text-gray-300"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function SectionShell({
  label,
  title,
  blurb,
  helper,
  children,
}: {
  label: string;
  title: string;
  blurb: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8">
      <div className="text-cyan-400 text-xs tracking-widest mb-3">{label}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-2">{blurb}</p>
      {helper ? (
        <p className="text-sm text-cyan-300/80 mb-6">{helper}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

function AddForm({
  fields,
  values,
  onChange,
  onSubmit,
  saving,
  submitLabel,
}: {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  const complete = fields
    .filter((field) => !field.optional)
    .every((field) => (values[field.name] ?? "").trim().length > 0);
  return (
    <div>
      <div className="grid md:grid-cols-2 gap-5">
        {fields.map((field) => (
          <label
            key={field.name}
            className={`text-sm text-gray-300 ${
              field.textarea ? "md:col-span-2" : ""
            }`}
          >
            {field.label}
            {field.textarea ? (
              <textarea
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white resize-y"
              />
            ) : (
              <input
                type="text"
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
              />
            )}
          </label>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={saving || !complete}
        className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
      >
        {saving ? "SAVING..." : `${submitLabel} →`}
      </button>
    </div>
  );
}

function SmallButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs border border-white/20 rounded-lg px-3 py-1.5 text-gray-300 hover:bg-white/5 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ObjectiveCard({
  item,
  busy,
  onPatch,
  onDelete,
}: {
  item: GrowthItem;
  busy: boolean;
  onPatch: (id: string, fields: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const p = item.payload;
  const [draft, setDraft] = useState<number>(item.progress_percent ?? 0);
  const percent = item.progress_percent ?? 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusPill status={item.status} />
        <SmallButton onClick={() => onDelete(item.id)} disabled={busy}>
          Delete
        </SmallButton>
      </div>
      <div className="text-base font-bold text-gray-100">{p.title}</div>
      <p className="text-sm text-gray-300 mt-2">
        <strong className="text-gray-100">{p.metric}:</strong> {p.target}
        {p.targetDate ? (
          <>
            {" "}
            · <span className="text-gray-400">by {p.targetDate}</span>
          </>
        ) : null}
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="text-xs tracking-widest text-gray-400">
            YOUR PROGRESS
          </span>
          <span className="text-sm font-bold text-cyan-300">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[.06] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${percent}%`,
              background: "linear-gradient(92deg, #22d3ee, #a855f7, #d946ef)",
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Set by you — your own read of where this stands, not a platform
          measurement.
        </p>
      </div>

      {item.status !== "archived" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            className="flex-1 min-w-[140px] accent-cyan-400"
            aria-label="Set progress percent"
          />
          <span className="text-sm text-gray-300 w-12">{draft}%</span>
          <SmallButton
            onClick={() => onPatch(item.id, { progressPercent: draft })}
            disabled={busy || draft === percent}
          >
            Save progress
          </SmallButton>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {item.status === "active" && (
          <>
            <SmallButton
              onClick={() =>
                onPatch(item.id, { status: "achieved", progressPercent: 100 })
              }
              disabled={busy}
            >
              Mark achieved
            </SmallButton>
            <SmallButton
              onClick={() => onPatch(item.id, { status: "archived" })}
              disabled={busy}
            >
              Archive
            </SmallButton>
          </>
        )}
        {item.status === "achieved" && (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "active" })}
            disabled={busy}
          >
            Reactivate
          </SmallButton>
        )}
        {item.status === "archived" && (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "active" })}
            disabled={busy}
          >
            Restore
          </SmallButton>
        )}
      </div>
    </div>
  );
}

function ExperimentCard({
  item,
  busy,
  onPatch,
  onDelete,
}: {
  item: GrowthItem;
  busy: boolean;
  onPatch: (id: string, fields: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const p = item.payload;
  const [resultDraft, setResultDraft] = useState<string>(p.result ?? "");
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusPill status={item.status} />
        <SmallButton onClick={() => onDelete(item.id)} disabled={busy}>
          Delete
        </SmallButton>
      </div>
      <div className="text-base font-bold text-gray-100">{p.title}</div>
      <div className="space-y-2 text-sm mt-2">
        <p>
          <strong className="text-gray-100">Hypothesis:</strong>{" "}
          <span className="text-gray-300">{p.hypothesis}</span>
        </p>
        <p>
          <strong className="text-gray-100">Measure:</strong>{" "}
          <span className="text-gray-300">{p.measure}</span>
        </p>
        {p.result ? (
          <p>
            <strong className="text-gray-100">Result:</strong>{" "}
            <span className="text-gray-300">{p.result}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.status === "planned" && (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "running" })}
            disabled={busy}
          >
            Start experiment
          </SmallButton>
        )}
        {item.status === "running" && (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "done" })}
            disabled={busy}
          >
            Mark done
          </SmallButton>
        )}
        {item.status === "done" && (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "running" })}
            disabled={busy}
          >
            Reopen
          </SmallButton>
        )}
      </div>

      <label className="block text-sm text-gray-300 mt-4">
        Result — what actually happened
        <textarea
          value={resultDraft}
          onChange={(e) => setResultDraft(e.target.value)}
          placeholder="Fill this in when the experiment is done: what you saw, in your words"
          rows={2}
          className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white resize-y"
        />
      </label>
      <div className="mt-3">
        <SmallButton
          onClick={() => onPatch(item.id, { result: resultDraft.trim() })}
          disabled={busy || resultDraft.trim() === (p.result ?? "")}
        >
          Save result
        </SmallButton>
      </div>
    </div>
  );
}

function GapCard({
  item,
  busy,
  onPatch,
  onDelete,
}: {
  item: GrowthItem;
  busy: boolean;
  onPatch: (id: string, fields: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const p = item.payload;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <StatusPill status={item.status} />
        <SmallButton onClick={() => onDelete(item.id)} disabled={busy}>
          Delete
        </SmallButton>
      </div>
      <div className="text-base font-bold text-gray-100">{p.title}</div>
      <p className="text-sm text-gray-300 mt-2">{p.note}</p>
      <div className="mt-4">
        {item.status === "open" ? (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "addressed" })}
            disabled={busy}
          >
            Mark addressed
          </SmallButton>
        ) : (
          <SmallButton
            onClick={() => onPatch(item.id, { status: "open" })}
            disabled={busy}
          >
            Reopen
          </SmallButton>
        )}
      </div>
    </div>
  );
}

function emptyForm(fields: FieldDef[]): Record<string, string> {
  const form: Record<string, string> = {};
  for (const field of fields) form[field.name] = "";
  return form;
}

export default function GrowthMapPage() {
  const [items, setItems] = useState<GrowthItem[]>([]);
  const [objectiveForm, setObjectiveForm] = useState(() =>
    emptyForm(OBJECTIVE_FIELDS)
  );
  const [experimentForm, setExperimentForm] = useState(() =>
    emptyForm(EXPERIMENT_FIELDS)
  );
  const [gapForm, setGapForm] = useState(() => emptyForm(GAP_FIELDS));
  const [loading, setLoading] = useState(true);
  const [savingKind, setSavingKind] = useState<Kind | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/growth-map");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your growth map could not be loaded.");
      }
      setItems(data.items ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your growth map could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(
    kind: Kind,
    fields: FieldDef[],
    values: Record<string, string>
  ) {
    setSavingKind(kind);
    setError("");
    try {
      const payload: Record<string, string> = {};
      for (const field of fields) {
        payload[field.name] = (values[field.name] ?? "").trim();
      }
      const response = await fetch("/api/growth-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your item could not be saved.");
      }
      setItems((prev) => [data.item as GrowthItem, ...prev]);
      if (kind === "objective") setObjectiveForm(emptyForm(OBJECTIVE_FIELDS));
      if (kind === "experiment") setExperimentForm(emptyForm(EXPERIMENT_FIELDS));
      if (kind === "gap") setGapForm(emptyForm(GAP_FIELDS));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your item could not be saved.");
    } finally {
      setSavingKind(null);
    }
  }

  async function patchItem(id: string, fields: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/growth-map", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your item could not be updated.");
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? (data.item as GrowthItem) : item))
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your item could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/growth-map?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your item could not be deleted.");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your item could not be deleted."
      );
    } finally {
      setBusyId(null);
    }
  }

  const objectives = items.filter((i) => i.kind === "objective");
  const experiments = items.filter((i) => i.kind === "experiment");
  const gaps = items.filter((i) => i.kind === "gap");

  // The summary strip counts the creator's own rows — nothing else.
  const summary: Array<[string, string]> = [
    [
      String(objectives.filter((o) => o.status === "active").length),
      "Objectives active",
    ],
    [
      String(objectives.filter((o) => o.status === "achieved").length),
      "Objectives achieved",
    ],
    [
      String(experiments.filter((e) => e.status === "planned").length),
      "Experiments planned",
    ],
    [
      String(experiments.filter((e) => e.status === "running").length),
      "Experiments running",
    ],
    [
      String(experiments.filter((e) => e.status === "done").length),
      "Experiments done",
    ],
  ];

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH MAP
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — CREATOR GROWTH MAP
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            APPLY THE INSIGHT. GROW ON PURPOSE.
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            YOUR PLAN,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              WORKING FOR YOU.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Advice fades. A plan stays. Set your objectives, turn what you
            learn into experiments, note the gaps you spot in your own
            content — and watch your own progress, in your own words.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            YOUR PLAN, IN YOUR WORDS
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Everything on this page is written by you: your objectives, your
            experiments, your read of your own progress. This is your
            planning workspace —{" "}
            <strong className="text-gray-100">not platform analytics</strong>.
            UltraVestra does not measure these numbers, detect these gaps,
            or grade these results; it keeps them in one place so your plan
            survives between videos.
          </p>
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            YOUR PLAN AT A GLANCE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.map(([number, label]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
              >
                <div className="text-3xl font-bold text-cyan-400">{number}</div>
                <div className="text-gray-400 text-sm mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your growth map</h3>
            <p className="text-gray-400 mt-2">Gathering your plan...</p>
          </div>
        ) : (
          <div className="space-y-10">
            <SectionShell
              label="OBJECTIVES"
              title="Objectives"
              blurb="The outcomes you are working toward. Set the metric and the target in your own terms, then keep the progress bar honest as you go."
            >
              {objectives.length === 0 ? (
                <p className="text-gray-500 text-sm mb-8">
                  No objectives yet. Set your first one below.
                </p>
              ) : (
                <div className="space-y-3 mb-8">
                  {objectives.map((item) => (
                    <ObjectiveCard
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onPatch={patchItem}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              )}
              <AddForm
                fields={OBJECTIVE_FIELDS}
                values={objectiveForm}
                onChange={(name, value) =>
                  setObjectiveForm((prev) => ({ ...prev, [name]: value }))
                }
                onSubmit={() =>
                  addItem("objective", OBJECTIVE_FIELDS, objectiveForm)
                }
                saving={savingKind === "objective"}
                submitLabel="ADD OBJECTIVE"
              />
            </SectionShell>

            <SectionShell
              label="EXPERIMENTS"
              title="Experiments"
              blurb="One change at a time, tested on purpose. An experiment is how a Creator Lab top improvement becomes action instead of advice."
              helper="Turn one change into a test: what you'll change, what you expect, what you'll measure."
            >
              {experiments.length === 0 ? (
                <p className="text-gray-500 text-sm mb-8">
                  No experiments yet. Turn your next change into a test below.
                </p>
              ) : (
                <div className="space-y-3 mb-8">
                  {experiments.map((item) => (
                    <ExperimentCard
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onPatch={patchItem}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              )}
              <AddForm
                fields={EXPERIMENT_FIELDS}
                values={experimentForm}
                onChange={(name, value) =>
                  setExperimentForm((prev) => ({ ...prev, [name]: value }))
                }
                onSubmit={() =>
                  addItem("experiment", EXPERIMENT_FIELDS, experimentForm)
                }
                saving={savingKind === "experiment"}
                submitLabel="ADD EXPERIMENT"
              />
            </SectionShell>

            <SectionShell
              label="CONTENT GAPS"
              title="Content gaps"
              blurb="What is missing from your content — the video you never made, the question viewers keep asking, the topic you keep skipping. These are gaps you noticed in your own work; UltraVestra did not detect them."
            >
              {gaps.length === 0 ? (
                <p className="text-gray-500 text-sm mb-8">
                  No content gaps noted yet. Add the first one below.
                </p>
              ) : (
                <div className="space-y-3 mb-8">
                  {gaps.map((item) => (
                    <GapCard
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onPatch={patchItem}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              )}
              <AddForm
                fields={GAP_FIELDS}
                values={gapForm}
                onChange={(name, value) =>
                  setGapForm((prev) => ({ ...prev, [name]: value }))
                }
                onSubmit={() => addItem("gap", GAP_FIELDS, gapForm)}
                saving={savingKind === "gap"}
                submitLabel="ADD CONTENT GAP"
              />
            </SectionShell>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-12">
          Your Growth Map holds your plan exactly as you wrote it — your
          objectives, your experiments, your progress. The counts above are
          counted from your own entries, and nothing here is a platform
          measurement or a promise of results.
        </p>
      </div>
    </main>
  );
}
