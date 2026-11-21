import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* Live search suggestions for Ask UltraVestra.
 * Returns published brand names and category names matching the typed
 * words. Brand data is member-protected by RLS, so a logged-out visitor
 * simply gets an empty list — the search itself still works on submit. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ brands: [], categories: [] });

  const supabase = await createClient();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("id, name").eq("status", "published").ilike("name", like).order("name").limit(8),
    supabase.from("categories").select("slug, name").ilike("name", like).limit(5),
  ]);
  return NextResponse.json({
    brands: (brands ?? []).map((b) => ({ id: b.id as string, name: b.name as string })),
    categories: (categories ?? []).map((c) => ({ slug: c.slug as string, name: c.name as string })),
  });
}
