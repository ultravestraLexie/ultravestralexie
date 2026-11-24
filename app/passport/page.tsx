import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { passportTrackRecord } from "@/lib/galaxy/core";
import { fetchAudienceSnapshots, fetchDeals, fetchProfile } from "@/lib/galaxy/server";
import PassportClient from "./PassportClient";

export const dynamic = "force-dynamic";

/* PASSPORT — Build trust. Verified collaborations are the
 * creator's paid deals (tracked pitch → paid in Ultra Vestra);
 * anything the creator adds by hand is labelled self-reported —
 * the same integrity rule the passport has always kept. The
 * public share page is /p/[slug], visible only when the owner
 * turns it on. */
export default async function PassportPage() {
  await requireSubscription("/passport");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, snapshots, entriesRes, shareRes, catRows] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
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
  ]);

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
  /* The verified block: figures from the creator's own paid deal
   * records only (core.passportTrackRecord) — the platform can
   * attest to these; everything else on the page is labelled
   * self-reported. */
  const trackRecord = passportTrackRecord(deals);
  const memberSince = share?.created_at
    ? new Date(share.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
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
  );
}
