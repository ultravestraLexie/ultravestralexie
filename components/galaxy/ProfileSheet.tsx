"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_LABELS } from "@/lib/galaxy/core";
import { Sheet, toast } from "./ui";

/* The profile sheet — opened from the rail foot, the mobile
 * topbar, Today and Passport. Edits the Galaxy-facing fields of
 * the creator's business profile (name, niche, platforms,
 * audience, weekly post goal).
 *
 * SAFETY: /api/business-profile PUT replaces the whole profile
 * row from the request body, so this sheet first GETs the full
 * profile and sends every field back — fields it does not edit
 * (audience size, rates, USP, goals…) round-trip unchanged. */

type FullProfile = Record<string, unknown> & {
  creatorName: string;
  contentCategories: string[];
  platforms: string[];
  audienceDemographics: string;
};

const PLATFORM_KEYS = ["tiktok", "instagram", "youtube", "facebook", "pinterest", "twitch", "x"];

export function ProfileSheet({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
}) {
  const router = useRouter();
  const [full, setFull] = useState<FullProfile | null>(null);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState(5);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [bpRes, postsRes] = await Promise.all([
          fetch("/api/business-profile"),
          fetch("/api/posts"),
        ]);
        const bp = bpRes.ok ? await bpRes.json() : null;
        const p = (bp?.profile ?? null) as FullProfile | null;
        if (cancelled) return;
        setFull(p);
        setName(p?.creatorName ?? "");
        setNiche(p?.contentCategories?.[0] ?? "");
        setPlatforms(p?.platforms ?? []);
        setAudience(p?.audienceDemographics ?? "");
        const posts = postsRes.ok ? await postsRes.json() : null;
        setGoal(typeof posts?.weeklyGoal === "number" ? posts.weeklyGoal : 5);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open ]);

  async function save() {
    setBusy(true);
    try {
      const base: FullProfile =
        full ??
        ({
          platforms: [],
          contentCategories: [],
          audienceSize: null,
          averageViews: null,
          engagementRate: null,
          audienceDemographics: "",
          pastPartnerships: "",
          revenueStreams: [],
          businessObjectives: "",
          creatorName: "",
          businessDescription: "",
          uniqueSellingProposition: "",
          differentiator: "",
          professionalExperience: "",
          businessGoals: [],
        } as FullProfile);
      const rest = { ...base };
      delete (rest as Record<string, unknown>).completeness;
      delete (rest as Record<string, unknown>).identity;
      delete (rest as Record<string, unknown>).intelligence;
      const payload = {
        ...rest,
        creatorName: name.trim(),
        contentCategories: niche ? [niche] : [],
        platforms,
        audienceDemographics: audience,
      };
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("profile");
      const g = Math.min(50, Math.max(1, Math.round(goal) || 5));
      await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyGoal: g }),
      });
      toast("Profile saved.");
      onClose();
      router.refresh();
    } catch {
      toast("Your profile could not be saved. Please try again.");
    }
    setBusy(false);
  }

  const nicheOptions = [...new Set([...categories, ...(niche ? [niche] : [])])];

  return (
    <Sheet open={open} onClose={onClose} title="Your profile" sub="This feeds your greeting, brand fit, pitches and Passport.">
      {!loaded ? (
        <p className="gx-muted">Loading…</p>
      ) : (
        <div>
          <label className="gx-field">
            <span>Your name</span>
            <input className="gx-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Reyes" maxLength={120} />
          </label>
          <div className="gx-field">
            <span>Your niche</span>
            <div className="gx-chips" role="group" aria-label="Niche">
              {nicheOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="gx-chip"
                  aria-pressed={niche === c}
                  onClick={() => setNiche(niche === c ? "" : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="gx-field">
            <span>Platforms</span>
            <div className="gx-checks">
              {PLATFORM_KEYS.map((k) => (
                <label key={k} className="gx-check">
                  <input
                    type="checkbox"
                    checked={platforms.includes(k)}
                    onChange={(e) =>
                      setPlatforms((prev) =>
                        e.target.checked ? [...prev, k] : prev.filter((p) => p !== k)
                      )
                    }
                  />
                  {PLATFORM_LABELS[k] ?? k}
                </label>
              ))}
            </div>
          </div>
          <label className="gx-field">
            <span>Who watches you?</span>
            <input
              className="gx-input"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Women 25 to 34 who want simple skincare that works"
              maxLength={2000}
            />
          </label>
          <label className="gx-field">
            <span>Weekly post goal</span>
            <input
              className="gx-input"
              type="number"
              min={1}
              max={50}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
            />
          </label>
          <div className="gx-sheet-actions">
            <span className="spacer" />
            <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void save()}>
              Save profile
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** The rail/topbar profile button + sheet, self-contained so the
 * server layout can drop it in. */
export function ProfileButton({
  label,
  sub,
  initial,
  categories,
}: {
  label: string;
  sub?: string;
  initial: string;
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: 8,
          border: "1px solid var(--line)",
          borderRadius: 14,
          background: "rgba(255,255,255,.03)",
          cursor: "pointer",
          textAlign: "left",
          boxShadow: "none",
          color: "var(--ink)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            flex: "none",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: 12,
            background: "radial-gradient(circle at 35% 30%, #2A3680, #0C1240)",
            boxShadow: "0 0 0 2px #0A0F2E, 0 0 0 3.5px #7E6BFF",
          }}
        >
          {initial}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
          {sub ? (
            <span style={{ display: "block", color: "var(--ink-3)", fontSize: 12 }}>{sub}</span>
          ) : null}
        </span>
      </button>
      <ProfileSheet open={open} onClose={() => setOpen(false)} categories={categories} />
    </>
  );
}
