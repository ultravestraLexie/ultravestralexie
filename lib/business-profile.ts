// Creator Business Profile — the creator's own persistent business
// facts, entered once and read across the platform (Campaign Match
// prefill, the Advisor's completeness rule, the AI Advisor's
// evidence). One row per creator in
// public.creator_business_profiles.
//
// V2 (Build 8, the owner's 10-point profile spec): the profile is
// a business-intelligence record, not a questionnaire — the nine
// original fields plus a creator identity layer (name, business
// description, USP, differentiator, professional experience) and
// a multi-select business-goals list, so UltraVestra can tell one
// creator's business from another's.
//
// HONESTY RULES (binding):
// - Every value here is creator-entered. Nothing is synced, scraped
//   or inferred, and the UI says so — these are the creator's own
//   stated facts, not platform-verified metrics.
// - Completeness counts a field as filled only when it carries a
//   real value (non-empty array / non-null number / non-blank
//   text). Defaults never count.
//
// COMPLETENESS MODEL: the ESSENTIAL set (the original nine fields
// + business goals = 10) drives profileCompleteness — the number
// the Advisor rule, the dashboard and the page's main bar use.
// The five IDENTITY fields are tracked separately by
// identityCompleteness: recommended, never blocking.

export type BusinessProfile = {
  platforms: string[];
  contentCategories: string[];
  audienceSize: number | null;
  averageViews: number | null;
  engagementRate: number | null;
  audienceDemographics: string;
  pastPartnerships: string;
  revenueStreams: string[];
  businessObjectives: string;
  // Identity layer (Build 8)
  creatorName: string;
  businessDescription: string;
  uniqueSellingProposition: string;
  differentiator: string;
  professionalExperience: string;
  businessGoals: string[];
};

export type BusinessProfileRow = {
  platforms: string[] | null;
  content_categories: string[] | null;
  audience_size: number | null;
  average_views: number | null;
  engagement_rate: number | string | null;
  audience_demographics: string | null;
  past_partnerships: string | null;
  revenue_streams: string[] | null;
  business_objectives: string | null;
  creator_name: string | null;
  business_description: string | null;
  unique_selling_proposition: string | null;
  differentiator: string | null;
  professional_experience: string | null;
  business_goals: string[] | null;
};

/** Essential fields: the original nine + business goals. */
export const PROFILE_FIELD_COUNT = 10;
/** Identity fields (recommended, tracked separately). */
export const IDENTITY_FIELD_COUNT = 5;

export function rowToProfile(row: BusinessProfileRow): BusinessProfile {
  return {
    platforms: row.platforms ?? [],
    contentCategories: row.content_categories ?? [],
    audienceSize: row.audience_size ?? null,
    averageViews: row.average_views ?? null,
    engagementRate:
      row.engagement_rate === null || row.engagement_rate === undefined
        ? null
        : Number(row.engagement_rate),
    audienceDemographics: row.audience_demographics ?? "",
    pastPartnerships: row.past_partnerships ?? "",
    revenueStreams: row.revenue_streams ?? [],
    businessObjectives: row.business_objectives ?? "",
    creatorName: row.creator_name ?? "",
    businessDescription: row.business_description ?? "",
    uniqueSellingProposition: row.unique_selling_proposition ?? "",
    differentiator: row.differentiator ?? "",
    professionalExperience: row.professional_experience ?? "",
    businessGoals: row.business_goals ?? [],
  };
}

export function profileCompleteness(
  profile: BusinessProfile | null
): { filled: number; total: number } {
  if (!profile) return { filled: 0, total: PROFILE_FIELD_COUNT };
  let filled = 0;
  if (profile.platforms.length > 0) filled += 1;
  if (profile.contentCategories.length > 0) filled += 1;
  if (profile.audienceSize !== null) filled += 1;
  if (profile.averageViews !== null) filled += 1;
  if (profile.engagementRate !== null) filled += 1;
  if (profile.audienceDemographics.trim() !== "") filled += 1;
  if (profile.pastPartnerships.trim() !== "") filled += 1;
  if (profile.revenueStreams.length > 0) filled += 1;
  if (profile.businessObjectives.trim() !== "") filled += 1;
  if (profile.businessGoals.length > 0) filled += 1;
  return { filled, total: PROFILE_FIELD_COUNT };
}

export function identityCompleteness(
  profile: BusinessProfile | null
): { filled: number; total: number } {
  if (!profile) return { filled: 0, total: IDENTITY_FIELD_COUNT };
  let filled = 0;
  if (profile.creatorName.trim() !== "") filled += 1;
  if (profile.businessDescription.trim() !== "") filled += 1;
  if (profile.uniqueSellingProposition.trim() !== "") filled += 1;
  if (profile.differentiator.trim() !== "") filled += 1;
  if (profile.professionalExperience.trim() !== "") filled += 1;
  return { filled, total: IDENTITY_FIELD_COUNT };
}

/** Display band for a count — the same bands Campaign Match and
 *  the profile page use (<1k / 1-10k / 10-50k / 50-250k / 250k-1M /
 *  >1M). */
export function bandForCount(n: number): string {
  if (n < 1000) return "<1k";
  if (n < 10000) return "1-10k";
  if (n < 50000) return "10-50k";
  if (n < 250000) return "50-250k";
  if (n < 1000000) return "250k-1M";
  return ">1M";
}

/* Build 10 (P2) — the profile intelligence panel + continuous
 * learning. Every line is computed from the creator's own saved
 * profile; nothing is synced, scraped or invented. Audience growth
 * is stated honestly: no history snapshots exist yet, so no trend
 * is claimed — the panel says so instead of fabricating a delta. */
export function profileIntelligence(
  profile: BusinessProfile | null,
  updatedAt: string | null
): { label: string; line: string }[] {
  if (!profile) return [];
  const anyFilled =
    profileCompleteness(profile).filled > 0 ||
    identityCompleteness(profile).filled > 0;
  if (!anyFilled) return [];
  const entries: { label: string; line: string }[] = [];

  if (updatedAt) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000)
    );
    entries.push({
      label: "PROFILE FRESHNESS",
      line:
        days > 30
          ? `Last updated ${days} days ago. Audiences and rates move fast — refresh your numbers so your matches stay accurate.`
          : days === 0
            ? "Updated today. Your matches and advice are working from current numbers."
            : `Updated ${days} ${days === 1 ? "day" : "days"} ago — current enough that your matches stay accurate.`,
    });
  }

  if (profile.audienceSize !== null) {
    entries.push({
      label: "MATCHING BAND",
      line: `Campaign Match searches the ${bandForCount(profile.audienceSize)} follower band${
        profile.platforms.length
          ? ` on ${profile.platforms.join(" and ")}`
          : ""
      }. Keep your audience size honest — the band is where your briefs compete.`,
    });
  }

  if (profile.revenueStreams.length > 0) {
    entries.push({
      label: "LEAD MONETIZATION",
      line: `Your profile leads with ${profile.revenueStreams[0]} — partnership tools see that stream first when they read your business.`,
    });
  }

  if (profile.businessGoals.length > 0) {
    entries.push({
      label: "GOAL FOCUS",
      line: `Working toward: ${profile.businessGoals.slice(0, 2).join(" · ")} — your Advisor brief is written with these goals in view.`,
    });
  }

  entries.push({
    label: "AUDIENCE GROWTH",
    line: "Growth tracking starts once your profile has 30 days of history. UltraVestra does not invent a trend before it has the data.",
  });

  return entries;
}
