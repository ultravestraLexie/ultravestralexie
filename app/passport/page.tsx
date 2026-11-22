"use client";

import { useEffect, useState } from "react";

// Reputation Passport — the creator's portable proof of track
// record: collaborations, portfolio, performance history,
// testimonials and credentials, all in one place a brand can read.
//
// INTEGRITY RULE (binding): every entry is either
// 'platform_verified' or 'self_reported'. Everything added through
// this page is created 'self_reported' by the API and is labeled
// "Self-reported" everywhere it appears here. This page never
// presents a self-reported entry as verified, and there is no
// control anywhere in this UI that creates or upgrades a
// platform-verified entry — that status is reserved for future
// platform-backed records.
//
// All reads and writes go through /api/passport (session +
// subscription gated, owner-only). This page holds no direct
// database access.

type SectionKey =
  | "collaborations"
  | "portfolio"
  | "performance"
  | "testimonials"
  | "credentials";

type VerificationStatus = "platform_verified" | "self_reported";

type PassportEntry = {
  id: string;
  section: SectionKey;
  payload: Record<string, string>;
  verification_status: VerificationStatus;
  created_at: string;
};

type FieldDef = {
  name: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
  optional?: boolean;
  url?: boolean;
};

const SECTION_ORDER: SectionKey[] = [
  "collaborations",
  "portfolio",
  "performance",
  "testimonials",
  "credentials",
];

const SECTION_META: Record<
  SectionKey,
  { title: string; blurb: string; empty: string; addLabel: string }
> = {
  collaborations: {
    title: "Collaborations",
    blurb: "Brand work you have completed — who, what, when, and what you delivered.",
    empty: "No collaborations yet. Add the first one below.",
    addLabel: "ADD COLLABORATION",
  },
  portfolio: {
    title: "Portfolio",
    blurb: "Your best work, linked where a brand can watch or read it.",
    empty: "No portfolio items yet. Add your strongest piece below.",
    addLabel: "ADD PORTFOLIO ITEM",
  },
  performance: {
    title: "Performance history",
    blurb: "The numbers behind your work — stated plainly, with the period they cover.",
    empty: "No performance entries yet. Add a metric below.",
    addLabel: "ADD PERFORMANCE ENTRY",
  },
  testimonials: {
    title: "Testimonials",
    blurb: "What brands and partners have said about working with you, in their words.",
    empty: "No testimonials yet. Add one below.",
    addLabel: "ADD TESTIMONIAL",
  },
  credentials: {
    title: "Credentials",
    blurb: "Certifications, training and qualifications relevant to your work.",
    empty: "No credentials yet. Add one below.",
    addLabel: "ADD CREDENTIAL",
  },
};

const SECTION_FIELDS: Record<SectionKey, FieldDef[]> = {
  collaborations: [
    { name: "brandName", label: "Brand name", placeholder: "Who did you work with?" },
    {
      name: "campaignDescription",
      label: "Campaign description",
      placeholder: "What was the campaign about?",
      textarea: true,
    },
    {
      name: "dateRange",
      label: "Date range",
      placeholder: "Example: March – May 2026",
    },
    {
      name: "deliverables",
      label: "Deliverables",
      placeholder: "Example: 3 TikTok videos, 1 unboxing, 5 stories",
      textarea: true,
    },
  ],
  portfolio: [
    { name: "title", label: "Title", placeholder: "What is this piece?" },
    {
      name: "link",
      label: "Link",
      placeholder: "https://…",
      url: true,
    },
    {
      name: "platform",
      label: "Platform",
      placeholder: "Example: TikTok, YouTube, Instagram",
    },
    {
      name: "notes",
      label: "Notes (optional)",
      placeholder: "Anything a brand should know about this piece",
      textarea: true,
      optional: true,
    },
  ],
  performance: [
    {
      name: "metricLabel",
      label: "Metric",
      placeholder: "Example: Average views per video",
    },
    { name: "value", label: "Value", placeholder: "Example: 128K" },
    {
      name: "period",
      label: "Period",
      placeholder: "Example: Last 90 days",
    },
    {
      name: "platform",
      label: "Platform",
      placeholder: "Example: TikTok",
    },
  ],
  testimonials: [
    {
      name: "quote",
      label: "Quote",
      placeholder: "What did they say about working with you?",
      textarea: true,
    },
    { name: "authorName", label: "Author name", placeholder: "Who said it?" },
    {
      name: "authorRole",
      label: "Author role / brand",
      placeholder: "Example: Partnerships Manager, BrandCo",
    },
  ],
  credentials: [
    {
      name: "name",
      label: "Credential name",
      placeholder: "Example: Certified UGC Creator",
    },
    { name: "issuer", label: "Issuer", placeholder: "Who issued it?" },
    { name: "date", label: "Date", placeholder: "Example: June 2025" },
  ],
};

function emptyForms(): Record<SectionKey, Record<string, string>> {
  const forms = {} as Record<SectionKey, Record<string, string>>;
  for (const section of SECTION_ORDER) {
    forms[section] = {};
    for (const field of SECTION_FIELDS[section]) {
      forms[section][field.name] = "";
    }
  }
  return forms;
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "platform_verified") {
    return (
      <span className="text-[11px] tracking-widest border rounded-full px-3 py-1 border-emerald-400/40 text-emerald-300">
        PLATFORM VERIFIED
      </span>
    );
  }
  return (
    <span className="text-[11px] tracking-widest border rounded-full px-3 py-1 border-amber-400/40 text-amber-300">
      SELF-REPORTED
    </span>
  );
}

function EntryBody({ entry }: { entry: PassportEntry }) {
  const p = entry.payload;
  switch (entry.section) {
    case "collaborations":
      return (
        <div className="space-y-2 text-sm">
          <div className="text-base font-bold text-gray-100">{p.brandName}</div>
          <p className="text-gray-300">{p.campaignDescription}</p>
          <p>
            <strong className="text-gray-100">Date range:</strong>{" "}
            <span className="text-gray-300">{p.dateRange}</span>
          </p>
          <p>
            <strong className="text-gray-100">Deliverables:</strong>{" "}
            <span className="text-gray-300">{p.deliverables}</span>
          </p>
        </div>
      );
    case "portfolio":
      return (
        <div className="space-y-2 text-sm">
          <div className="text-base font-bold text-gray-100">{p.title}</div>
          <a
            href={p.link}
            target="_blank"
            rel="noreferrer"
            className="block text-cyan-300 underline break-all"
          >
            {p.link}
          </a>
          <p>
            <strong className="text-gray-100">Platform:</strong>{" "}
            <span className="text-gray-300">{p.platform}</span>
          </p>
          {p.notes ? <p className="text-gray-300">{p.notes}</p> : null}
        </div>
      );
    case "performance":
      return (
        <div className="space-y-2 text-sm">
          <div className="text-base font-bold text-gray-100">
            {p.metricLabel}: <span className="text-cyan-300">{p.value}</span>
          </div>
          <p>
            <strong className="text-gray-100">Period:</strong>{" "}
            <span className="text-gray-300">{p.period}</span>
          </p>
          <p>
            <strong className="text-gray-100">Platform:</strong>{" "}
            <span className="text-gray-300">{p.platform}</span>
          </p>
        </div>
      );
    case "testimonials":
      return (
        <div className="space-y-2 text-sm">
          <p className="italic text-gray-200">&ldquo;{p.quote}&rdquo;</p>
          <p className="text-gray-300">
            — {p.authorName}, {p.authorRole}
          </p>
        </div>
      );
    case "credentials":
      return (
        <div className="space-y-2 text-sm">
          <div className="text-base font-bold text-gray-100">{p.name}</div>
          <p>
            <strong className="text-gray-100">Issuer:</strong>{" "}
            <span className="text-gray-300">{p.issuer}</span>
          </p>
          <p>
            <strong className="text-gray-100">Date:</strong>{" "}
            <span className="text-gray-300">{p.date}</span>
          </p>
        </div>
      );
  }
}

export default function PassportPage() {
  const [entries, setEntries] = useState<PassportEntry[]>([]);
  const [forms, setForms] = useState<Record<SectionKey, Record<string, string>>>(
    emptyForms
  );
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/passport");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your passport could not be loaded.");
      }
      setEntries(data.entries ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your passport could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField(section: SectionKey, name: string, value: string) {
    setForms((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));
  }

  function formComplete(section: SectionKey): boolean {
    return SECTION_FIELDS[section]
      .filter((field) => !field.optional)
      .every((field) => (forms[section][field.name] ?? "").trim().length > 0);
  }

  async function addEntry(section: SectionKey) {
    setSavingSection(section);
    setError("");
    try {
      const payload: Record<string, string> = {};
      for (const field of SECTION_FIELDS[section]) {
        payload[field.name] = (forms[section][field.name] ?? "").trim();
      }
      const response = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your entry could not be saved.");
      }
      setEntries((prev) => [data.entry as PassportEntry, ...prev]);
      setForms((prev) => ({ ...prev, [section]: emptyForms()[section] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your entry could not be saved.");
    } finally {
      setSavingSection(null);
    }
  }

  async function deleteEntry(id: string) {
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(
        `/api/passport?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your entry could not be deleted.");
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your entry could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const selfReportedCount = entries.filter(
    (e) => e.verification_status === "self_reported"
  ).length;
  const verifiedCount = entries.length - selfReportedCount;

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / REPUTATION PASSPORT
        </div>

        <div className="inline-block rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] tracking-[.25em] text-fuchsia-300 mb-6">
          ULTRA VESTRA — REPUTATION PASSPORT
        </div>

        <div className="mb-12">
          <div className="text-cyan-400 text-sm mb-3">
            THE PORTABLE PROOF OF YOUR TRACK RECORD
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            YOUR WORK,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              READY TO SHOW.
            </span>
          </h1>

          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Brands ask for proof. Your Passport keeps your collaborations,
            portfolio, performance history, testimonials and credentials in
            one place — built by you, ready to show any brand that asks.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-6 mb-10">
          <div className="text-cyan-400 text-xs tracking-widest mb-4">
            HOW VERIFICATION WORKS HERE
          </div>
          <p className="text-sm text-gray-300 leading-6">
            Everything you add is labeled{" "}
            <strong className="text-amber-300">Self-reported</strong> — your
            word, presented cleanly. An entry is marked{" "}
            <strong className="text-emerald-300">Platform verified</strong>{" "}
            only when UltraVestra itself can check it against platform
            records. Self-reported entries are never upgraded by hand, and
            nothing in your Passport presents them as verified.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            [String(entries.length), "Entries in your passport"],
            [String(verifiedCount), "Platform verified"],
            [String(selfReportedCount), "Self-reported"],
          ].map(([number, label]) => (
            <div
              key={label}
              className="rounded-2xl bg-white/[.04] border border-white/10 p-5"
            >
              <div className="text-3xl font-bold text-cyan-400">{number}</div>
              <div className="text-gray-400 text-sm mt-2">{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl animate-pulse mb-4">◈</div>
            <h3 className="text-xl font-bold">Loading your passport</h3>
            <p className="text-gray-400 mt-2">Gathering your entries...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {SECTION_ORDER.map((section) => {
              const meta = SECTION_META[section];
              const sectionEntries = entries.filter(
                (entry) => entry.section === section
              );
              return (
                <section
                  key={section}
                  className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8"
                >
                  <div className="text-cyan-400 text-xs tracking-widest mb-3">
                    {meta.title.toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{meta.title}</h2>
                  <p className="text-gray-400 text-sm mb-6">{meta.blurb}</p>

                  {sectionEntries.length === 0 ? (
                    <p className="text-gray-500 text-sm mb-8">{meta.empty}</p>
                  ) : (
                    <div className="space-y-3 mb-8">
                      {sectionEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <VerificationBadge
                              status={entry.verification_status}
                            />
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              disabled={deletingId === entry.id}
                              className="text-xs border border-white/20 rounded-lg px-3 py-1.5 text-gray-300 hover:bg-white/5 disabled:opacity-40"
                            >
                              {deletingId === entry.id
                                ? "DELETING..."
                                : "Delete"}
                            </button>
                          </div>
                          <EntryBody entry={entry} />
                          <p className="text-xs text-gray-500 mt-3">
                            {entry.verification_status === "self_reported"
                              ? "Added by you — not verified by UltraVestra."
                              : "Checked by UltraVestra against platform records."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    {SECTION_FIELDS[section].map((field) => (
                      <label
                        key={field.name}
                        className={`text-sm text-gray-300 ${
                          field.textarea ? "md:col-span-2" : ""
                        }`}
                      >
                        {field.label}
                        {field.textarea ? (
                          <textarea
                            value={forms[section][field.name]}
                            onChange={(e) =>
                              setField(section, field.name, e.target.value)
                            }
                            placeholder={field.placeholder}
                            rows={3}
                            className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white resize-y"
                          />
                        ) : (
                          <input
                            type={field.url ? "url" : "text"}
                            value={forms[section][field.name]}
                            onChange={(e) =>
                              setField(section, field.name, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white"
                          />
                        )}
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => addEntry(section)}
                    disabled={
                      savingSection === section || !formComplete(section)
                    }
                    className="mt-6 w-full rounded-xl p-5 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                  >
                    {savingSection === section
                      ? "SAVING..."
                      : `${meta.addLabel} →`}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    New entries are saved as self-reported.
                  </p>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-12">
          Your Passport shows exactly what you entered, labeled for what it
          is. Self-reported entries are your claims, not UltraVestra-verified
          facts — a brand reading your Passport sees the same labels you do.
        </p>
      </div>
    </main>
  );
}
