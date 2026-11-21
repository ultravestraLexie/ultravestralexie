import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGateState } from "@/lib/gate";

/* Live search suggestions for Ask UltraVestra.
 * Returns published brand names and category names matching the typed
 * words. Member data: the subscription gate applies (middleware also
 * blocks this route) — no session → 401, no active subscription → 403,
 * both with empty lists so the type-ahead simply shows nothing. */
export async function GET(request: Request) {
  const gate = await getGateState();
  if (gate !== "ok") {
    return NextResponse.json(
      { brands: [], categories: [] },
      { status: gate === "login" ? 401 : 403 }
    );
  }

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
