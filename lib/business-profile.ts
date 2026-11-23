// Creator Business Profile — the creator's own persistent business
// facts, entered once and read across the platform (Campaign Match
// prefill, the Advisor's completeness rule). One row per creator in
// public.creator_business_profiles.
//
// HONESTY RULES (binding):
// - Every value here is creator-entered. Nothing is synced, scraped
//   or inferred, and the UI says so — these are the creator's own
//   stated numbers, not platform-verified metrics.
// - Completeness counts a field as filled only when it carries a
//   real value (non-empty array / non-null number / non-blank
//   text). Defaults never count.

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
};

export const PROFILE_FIELD_COUNT = 9;

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
  return { filled, total: PROFILE_FIELD_COUNT };
}
