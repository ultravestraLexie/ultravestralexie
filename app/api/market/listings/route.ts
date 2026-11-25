import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Marketplace listings (rebuild Phase 3) — a registered business
 * posts a real opportunity to public.market_listings. Creators
 * across the platform see it on /market and apply; nothing here
 * is sample data. The caller must own a business_profiles row —
 * the table's foreign key and RLS agree. */

const ListingSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  category: z.string().trim().min(1).max(40).default("UGC"),
  compensationDollars: z.number().min(0).max(1000000).optional(),
  deliverables: z.string().trim().max(500).default(""),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: biz } = await supabase
    .from("business_profiles")
    .select("user_id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!biz) {
    return NextResponse.json(
      { error: "Only a registered business can post an opportunity." },
      { status: 403 }
    );
  }

  const parsed = ListingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the listing details and try again." }, { status: 400 });
  }
  const d = parsed.data;

  const { data, error } = await supabase
    .from("market_listings")
    .insert({
      business_user_id: user.id,
      company_name: (biz as { company_name?: string }).company_name ?? "",
      title: d.title,
      description: d.description,
      category: d.category,
      compensation_cents:
        d.compensationDollars === undefined ? null : Math.round(d.compensationDollars * 100),
      deliverables: d.deliverables,
    })
    .select("id, title, status, created_at")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "The listing could not be saved. Try again." }, { status: 500 });
  }
  return NextResponse.json({ listing: data });
}
