import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";
import {
  identityCompleteness,
  profileCompleteness,
  rowToProfile,
  type BusinessProfileRow,
} from "@/lib/business-profile";

export const runtime = "nodejs";

// Creator Business Profile — owner-only read/write of the
// caller's public.creator_business_profiles row (one per creator).
//
// ISOLATION (binding): session client (RLS own-row policies apply)
// and every query scoped to the caller's user_id in code. The
// caller's id comes from the session — never from the request.
//
// HONESTY RULE (binding): every value is creator-entered. This
// route stores exactly what the creator typed — nothing is
// synced, scraped, inferred or "verified" here, and the UI labels
// the numbers as the creator's own stated figures.
//
// Gate pattern identical to the other member API routes: 401 / 403
// here AND via the middleware (lib/gate-paths.ts).

const ProfileSchema = z.object({
  platforms: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  contentCategories: z
    .array(z.string().trim().min(1).max(60))
    .max(12)
    .default([]),
  audienceSize: z.number().int().min(0).max(2_000_000_000).nullable().default(null),
  averageViews: z.number().int().min(0).max(2_000_000_000).nullable().default(null),
  engagementRate: z.number().min(0).max(100).nullable().default(null),
  audienceDemographics: z.string().max(2000).default(""),
  pastPartnerships: z.string().max(2000).default(""),
  revenueStreams: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  businessObjectives: z.string().max(2000).default(""),
  // Identity layer + goals (Build 8) — optional on the wire so
  // older clients keep saving; the page always sends them.
  creatorName: z.string().max(120).default(""),
  businessDescription: z.string().max(2000).default(""),
  uniqueSellingProposition: z.string().max(2000).default(""),
  differentiator: z.string().max(2000).default(""),
  professionalExperience: z.string().max(2000).default(""),
  businessGoals: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
});

const PROFILE_COLUMNS =
  "platforms, content_categories, audience_size, average_views, engagement_rate, audience_demographics, past_partnerships, revenue_streams, business_objectives, creator_name, business_description, unique_selling_proposition, differentiator, professional_experience, business_goals";

async function requireOwner() {
  const gate = await getGateState();
  if (gate !== "ok") {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            gate === "login"
              ? "Please log in to manage your business profile."
              : "An active subscription is required to manage your business profile.",
        },
        { status: gate === "login" ? 401 : 403 }
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Please log in to manage your business profile." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function GET() {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  const { data, error } = await owner.supabase
    .from("creator_business_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", owner.userId)
    .maybeSingle();

  if (error) {
    console.error("Business profile load error:", error);
    return Response.json(
      { error: "Your business profile could not be loaded. Please try again." },
      { status: 500 }
    );
  }

  const profile = data ? rowToProfile(data as BusinessProfileRow) : null;
  return Response.json({
    success: true,
    profile,
    completeness: profileCompleteness(profile),
    identity: identityCompleteness(profile),
  });
}

export async function PUT(request: Request) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please check your business profile details." },
      { status: 400 }
    );
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your business profile details." },
      { status: 400 }
    );
  }

  const p = parsed.data;
  const { data, error } = await owner.supabase
    .from("creator_business_profiles")
    .upsert(
      {
        user_id: owner.userId,
        platforms: p.platforms,
        content_categories: p.contentCategories,
        audience_size: p.audienceSize,
        average_views: p.averageViews,
        engagement_rate: p.engagementRate,
        audience_demographics: p.audienceDemographics.trim(),
        past_partnerships: p.pastPartnerships.trim(),
        revenue_streams: p.revenueStreams,
        business_objectives: p.businessObjectives.trim(),
        creator_name: p.creatorName.trim(),
        business_description: p.businessDescription.trim(),
        unique_selling_proposition: p.uniqueSellingProposition.trim(),
        differentiator: p.differentiator.trim(),
        professional_experience: p.professionalExperience.trim(),
        business_goals: p.businessGoals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    console.error("Business profile save error:", error);
    return Response.json(
      { error: "Your business profile could not be saved. Please try again." },
      { status: 500 }
    );
  }

  const profile = rowToProfile(data as BusinessProfileRow);
  return Response.json({
    success: true,
    profile,
    completeness: profileCompleteness(profile),
    identity: identityCompleteness(profile),
  });
}
