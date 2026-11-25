import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { passportTrackRecord, todayKey } from "@/lib/galaxy/core";
import {
  fetchAudienceSnapshots,
  fetchDeals,
  fetchExpenses,
  fetchIncome,
  fetchProfile,
} from "@/lib/galaxy/server";
import MoneyClient from "../money/MoneyClient";
import PassportClient from "../passport/PassportClient";

export const dynamic = "force-dynamic";

/* ME — Understand your growth (owner's five, 2026-11-23). One
 * page, two halves: Money first (income, ledger, waiting-on —
 * read from the creator's deals, nothing entered twice), then
 * Passport (track record, public address, audience snapshots).
 * Both halves are the existing Money and Passport clients,
 * composed unchanged with the same props their own pages passed;
 * this page only performs the union of the two server loads
 * (profile + deals are fetched once and shared). The old /money
 * and /passport routes redirect here; the public share page
 * /p/[slug] is untouched. */
export default async function MePage() {
  await requireSubscription("/me");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, income, expenses, snapshots, entriesRes, shareRes, catRows, postCountRes, followRows, appRows] =
    await Promise.all([
      fetchProfile(supabase, user.id),
      fetchDeals(supabase, user.id),
      fetchIncome(supabase, user.id),
      fetchExpenses(supabase, user.id),
      fetchAudienceSnapshots(supabase, user.id),
      supabase
        .from("passport_entries")
        .select("id, section, payload, verification_status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("passport_slug, passport_public, passport_share_history, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("categories").select("name").order("name"),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("follows")
        .select("follower_id, followee_id")
        .or(`follower_id.eq.${user.id},followee_id.eq.${user.id}`),
      supabase
        .from("market_applications")
        .select("id, status")
        .eq("creator_user_id", user.id),
    ]);

  /* UNIVERSE STRIP (rebuild Phase 4) — the creator's whole
   * universe at a glance, every number from the real tables the
   * other destinations write: posts + follows (Feed), marketplace
   * applications (Market), and the deal pipeline (Deals). */
  const universeFollows = (followRows.data ?? []) as { follower_id: string; followee_id: string }[];
  const universeApps = (appRows.data ?? []) as { status: string }[];
  const pipelineDeals = deals.filter((d) => d.stage !== "paid" && d.stage !== "lost");
  const pipelineCents = pipelineDeals.reduce((s, d) => s + (d.amountCents ?? 0), 0);
  const universeStats: { label: string; value: string; href: string }[] = [
    { label: "Posts", value: String(postCountRes.count ?? 0), href: `/creator/${user.id}` },
    {
      label: "Followers",
      value: String(universeFollows.filter((f) => f.followee_id === user.id).length),
      href: "/feed",
    },
    {
      label: "Applications",
      value: `${universeApps.length} · ${universeApps.filter((a) => a.status === "accepted").length} accepted`,
      href: "/market",
    },
    {
      label: "Deals in pipeline",
      value: `${pipelineDeals.length} · $${(pipelineCents / 100).toLocaleString("en-US", { maximumFractionDigits: pipelineCents % 100 ? 2 : 0 })}`,
      href: "/deals",
    },
  ];

  /* Passport half — the same shaping app/passport/page.tsx did:
   * verified collaborations are the creator's paid deals;
   * anything added by hand stays labelled self-reported. */
  type Entry = {
    id: string;
    section: string;
    payload: Record<string, string>;
    verification_status: string;
    created_at: string;
  };
  const entries = (entriesRes.data ?? []) as Entry[];
  const collabs = entries
    .filter((e) => e.section === "collaborations")
    .map((e) => ({
      id: e.id,
      brand: e.payload.brandName ?? "",
      note: [e.payload.campaignDescription, e.payload.deliverables]
        .filter(Boolean)
        .join(" — "),
      range: e.payload.dateRange ?? "",
    }));
  const testimonials = entries
    .filter((e) => e.section === "testimonials")
    .map((e) => ({
      id: e.id,
      quote: e.payload.quote ?? "",
      author: [e.payload.authorName, e.payload.authorRole].filter(Boolean).join(", "),
    }));
  const paidDeals = deals
    .filter((d) => d.stage === "paid")
    .sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? ""))
    .map((d) => ({
      id: d.id,
      brandName: d.brandName,
      deliverables: d.deliverables,
      paidOn: d.paidOn,
    }));
  const share = shareRes.data as {
    passport_slug: string | null;
    passport_public: boolean;
    passport_share_history: boolean;
    created_at: string | null;
  } | null;
  const categories = ((catRows.data ?? []) as unknown as { name: string }[]).map((c) => c.name);
  const trackRecord = passportTrackRecord(deals);
  const memberSince = share?.created_at
    ? new Date(share.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <header style={{ marginBottom: 26 }}>
        <h1 className="gx-h1">Me</h1>
        <p style={{ margin: "10px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
          Understand your growth — your income, audience and track record in one place.
        </p>
      </header>

      <section aria-label="Your universe" style={{ marginBottom: 34 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {universeStats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              style={{
                display: "block",
                padding: "16px 18px",
                borderRadius: 16,
                border: "1px solid var(--line, rgba(130,150,255,.16))",
                background: "rgba(255,255,255,.03)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>{s.label} →</div>
            </Link>
          ))}
        </div>
      </section>

      <section id="money" aria-label="Money" style={{ scrollMarginTop: 24 }}>
        <MoneyClient
          profile={profile}
          deals={deals}
          income={income}
          expenses={expenses}
          today={todayKey()}
        />
      </section>

      <section
        id="passport"
        aria-label="Passport"
        style={{ scrollMarginTop: 24, marginTop: 56 }}
      >
        <PassportClient
          profile={profile}
          paidDeals={paidDeals}
          snapshots={snapshots}
          collabs={collabs}
          testimonials={testimonials}
          categories={categories}
          initialSlug={share?.passport_slug ?? null}
          initialPublic={share?.passport_public ?? false}
          initialShareHistory={share?.passport_share_history ?? false}
          memberSince={memberSince}
          trackRecord={trackRecord}
        />
      </section>

      {/* CREATOR ECONOMY — the growth layer the owner ordered into
       * Me (2026-11-24): six frames from his Creator Economy
       * prototype, each on its own sub-route (the /studio/dna
       * pattern). Two frames were NOT added: the Passport (this
       * page's own second half already is it) and the Creator DNA
       * card (already shipped in Studio). Nothing above this
       * section changed. */}
      <section aria-label="Creator Economy" style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Creator Economy</h2>
        <p style={{ margin: "8px 0 0", color: "var(--ink-2)", maxWidth: "60ch" }}>
          Your growth layer — levels, challenges, invites and the
          What If simulator.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {[
            {
              href: "/me/levels",
              title: "Your next level",
              detail: "Bronze to Diamond — from campaigns completed and money collected.",
              orb: "radial-gradient(circle at 32% 30%, #ffe9a8, #f5c451 55%, #8a5a12)",
            },
            {
              href: "/me/challenges",
              title: "Challenges",
              detail: "This week's posting challenge and the friends race.",
              orb: "radial-gradient(circle at 32% 30%, #d8c8ff, #b69cff 55%, #4c1d95)",
            },
            {
              href: "/me/hall",
              title: "Hall of Fame",
              detail: "This month's creator rankings, on verified activity.",
              orb: "radial-gradient(circle at 32% 30%, #fef3c7, #f59e42 55%, #7c2d12)",
            },
            {
              href: "/me/invite",
              title: "Invite creators",
              detail: "Bring your creator friends — you both unlock rewards.",
              orb: "radial-gradient(circle at 32% 30%, #a7f3d0, #4ade80 55%, #14532d)",
            },
            {
              href: "/me/whatif",
              title: "Vestra What If",
              detail: "Compare the path you're on with the one you're considering.",
              orb: "radial-gradient(circle at 32% 30%, #c4b5fd, #8b5cf6 55%, #312e81)",
            },
            {
              href: "/me/opportunities",
              title: "Local gigs profile",
              detail: "Your handle, niches, area and rate — it powers the Local opportunities section on Brands.",
              orb: "radial-gradient(circle at 32% 30%, #fde68a, #f5c451 55%, #92600a)",
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="gx-panel" style={{ display: "block" }}>
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c.orb,
                  boxShadow: "0 0 14px rgba(167,139,250,.35)",
                  marginBottom: 10,
                }}
              />
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{c.title}</p>
              <p className="gx-sub" style={{ margin: "4px 0 0" }}>
                {c.detail}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  marginTop: 10,
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "var(--violet-2, #b794ff)",
                }}
              >
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
