"use client";

import { useEffect, useState } from "react";

// Social Connections — the creator's platform links, in their real
// state.
//
// HONESTY RULE (binding): Phase 1 has no OAuth and no platform
// approval, so NOTHING on this page is a data connection. Saving a
// handle or a profile link puts the platform in the 'link_only'
// state, and the page calls it exactly that — "Link added — not a
// data connection". The per-platform copy states the real blocker
// (TikTok developer approval, Meta app review, no public Trybe
// creator API) instead of implying a sync exists. Statuses come
// from the caller's own rows via /api/connections; the API refuses
// to let a client set 'connected' or 'pending_approval'.

type Connection = {
  platform: string;
  handle: string | null;
  profileUrl: string | null;
  status: string;
};

const PLATFORM_COPY: Record<
  string,
  { label: string; note: string }
> = {
  tiktok: {
    label: "TikTok",
    note: "Automatic connection pending TikTok developer approval. Add your profile link so it's ready.",
  },
  instagram: {
    label: "Instagram",
    note: "Automatic connection pending Meta app review. Add your profile link so it's ready.",
  },
  facebook: {
    label: "Facebook / Meta",
    note: "Automatic connection pending Meta app review. Add your profile link so it's ready.",
  },
  trybe: {
    label: "Trybe",
    note: "Trybe (jointrybe.com, Trybe Tech Inc) does not offer a public creator API today. Add your profile link; enter Trybe earnings in Revenue.",
  },
};

const STATUS_LABEL: Record<string, string> = {
  not_connected: "Not linked",
  link_only: "Link added — not a data connection",
  pending_approval: "Connection pending platform approval",
  connected: "Connected",
};

const inputClass =
  "mt-2 w-full bg-[#080b14] border border-white/10 rounded-xl p-4 text-white";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { handle: string; profileUrl: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyPlatform, setBusyPlatform] = useState<string | null>(null);

  async function load() {
    try {
      const response = await fetch("/api/connections");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your connections could not be loaded.");
      }
      const rows = (data.connections ?? []) as Connection[];
      setConnections(rows);
      setDrafts(
        Object.fromEntries(
          rows.map((row) => [
            row.platform,
            { handle: row.handle ?? "", profileUrl: row.profileUrl ?? "" },
          ])
        )
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your connections could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(platform: string) {
    const draft = drafts[platform] ?? { handle: "", profileUrl: "" };
    setBusyPlatform(platform);
    setError("");
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          handle: draft.handle.trim(),
          profileUrl: draft.profileUrl.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your connection could not be saved.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your connection could not be saved."
      );
    } finally {
      setBusyPlatform(null);
    }
  }

  async function remove(platform: string) {
    setBusyPlatform(platform);
    setError("");
    try {
      const response = await fetch(
        `/api/connections?platform=${encodeURIComponent(platform)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Your connection could not be removed.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your connection could not be removed."
      );
    } finally {
      setBusyPlatform(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <div className="text-xs tracking-[.35em] text-cyan-400 mb-6">
          ULTRA VESTRA / CREATOR GROWTH CENTER / CONNECTIONS
        </div>

        <div className="mb-10">
          <div className="text-cyan-400 text-sm mb-3">CONNECT YOUR PLATFORMS</div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            YOUR
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500">
              CONNECTIONS.
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-5 text-lg">
            Where your audience lives — and the real state of each
            connection, stated plainly.
          </p>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/[.05] p-6 mb-10">
          <div className="text-amber-300 text-xs tracking-widest mb-2">
            THE HONEST STATE OF CONNECTIONS TODAY
          </div>
          <p className="text-sm text-gray-300 leading-6">
            No platform is data-connected yet. TikTok and Meta each require
            their own developer approval before any account can sync, and
            Trybe offers no public creator API. What you can do today is save
            your profile link for each platform so everything is ready the
            moment a real connection opens.{" "}
            <strong className="text-gray-100">
              A saved link syncs nothing and verifies nothing
            </strong>{" "}
            — and this page will never call it a connection.
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
            <h3 className="text-xl font-bold">Loading your connections</h3>
            <p className="text-gray-400 mt-2">Gathering your platforms...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {connections.map((connection) => {
              const copy = PLATFORM_COPY[connection.platform];
              const draft = drafts[connection.platform] ?? {
                handle: "",
                profileUrl: "",
              };
              const linked = connection.status !== "not_connected";
              return (
                <section
                  key={connection.platform}
                  className="rounded-3xl border border-white/10 bg-[#111827] p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold">{copy.label}</h2>
                    <span
                      className={`text-[11px] tracking-widest border rounded-full px-3 py-1 ${
                        connection.status === "connected"
                          ? "border-emerald-400/40 text-emerald-300"
                          : linked
                            ? "border-cyan-400/40 text-cyan-300"
                            : "border-white/20 text-gray-400"
                      }`}
                    >
                      {(STATUS_LABEL[connection.status] ?? connection.status).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-3 leading-6">{copy.note}</p>

                  <label className="text-sm text-gray-300 block mt-5">
                    Handle
                    <input
                      type="text"
                      value={draft.handle}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [connection.platform]: {
                            ...draft,
                            handle: e.target.value,
                          },
                        }))
                      }
                      placeholder="@yourhandle"
                      maxLength={100}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm text-gray-300 block mt-4">
                    Profile link
                    <input
                      type="text"
                      value={draft.profileUrl}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [connection.platform]: {
                            ...draft,
                            profileUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://…"
                      maxLength={1000}
                      className={inputClass}
                    />
                  </label>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => save(connection.platform)}
                      disabled={busyPlatform === connection.platform}
                      className="rounded-xl px-5 py-3 font-bold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 transition"
                    >
                      {busyPlatform === connection.platform ? "Saving..." : "Save link"}
                    </button>
                    {linked && (
                      <button
                        onClick={() => remove(connection.platform)}
                        disabled={busyPlatform === connection.platform}
                        className="rounded-xl border border-red-400/40 text-red-300 px-5 py-3 hover:bg-red-400/10 disabled:opacity-40 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
