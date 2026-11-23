import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import BrandCard from "@/components/BrandCard";
import type { Brand, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Brand directory: search + category filter over published brands.
 *  Data comes only from Supabase — sign-in is required by RLS, so an
 *  empty result usually means "log in" or "no brands published yet". */
export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireSubscription("/brands");
  const { q, category } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  let brandIdsInCategory: string[] | null = null;
  if (category) {
    const cat = (categories as Category[] | null)?.find((c) => c.slug === category);
    if (cat) {
      const { data: links } = await fetchAllPages((from, to) =>
        supabase
          .from("brand_categories")
          .select("brand_id")
          .eq("category_id", cat.id)
          .order("brand_id", { ascending: true })
          .range(from, to)
      );
      brandIdsInCategory = (links ?? []).map((l) => l.brand_id as string);
    } else {
      brandIdsInCategory = [];
    }
  }

  const { data: brands } = await fetchAllPages((from, to) => {
    let query = supabase
      .from("brands")
      .select("*")
      .eq("status", "published")
      .order("name")
      .order("id");
    if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
    if (brandIdsInCategory) {
      query = query.in(
        "id",
        brandIdsInCategory.length ? brandIdsInCategory : ["00000000-0000-0000-0000-000000000000"]
      );
    }
    return query.range(from, to);
  });

  const list = (brands ?? []) as Brand[];

  // Latest score + category names per brand (small MVP-scale fan-out).
  const scoreByBrand = new Map<string, number>();
  const catsByBrand = new Map<string, string[]>();
  if (list.length) {
    const ids = list.map((b) => b.id);
    const { data: scores } = await fetchAllPages((from, to) =>
      supabase
        .from("brand_scores")
        .select("brand_id, total_score, scored_at")
        .in("brand_id", ids)
        .order("scored_at", { ascending: false })
        .order("brand_id", { ascending: true })
        .range(from, to)
    );
    for (const s of scores ?? []) {
      if (!scoreByBrand.has(s.brand_id as string)) {
        scoreByBrand.set(s.brand_id as string, Number(s.total_score));
      }
    }
    const { data: links } = await fetchAllPages((from, to) =>
      supabase
        .from("brand_categories")
        .select("brand_id, categories(name)")
        .in("brand_id", ids)
        .order("brand_id", { ascending: true })
        .order("category_id", { ascending: true })
        .range(from, to)
    );
    for (const l of (links ?? []) as unknown as {
      brand_id: string;
      categories: { name: string } | null;
    }[]) {
      if (!l.categories) continue;
      const arr = catsByBrand.get(l.brand_id) ?? [];
      arr.push(l.categories.name);
      catsByBrand.set(l.brand_id, arr);
    }
  }

  return (
    <div>
      <h1>Brand directory</h1>
      <form
        method="get"
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}
      >
        <input
          type="search"
          name="q"
          placeholder="Search brands…"
          defaultValue={q ?? ""}
          style={{ flex: "1 1 240px" }}
        />
        <select name="category" defaultValue={category ?? ""}>
          <option value="">All categories</option>
          {((categories ?? []) as Category[]).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit">Search</button>
      </form>

      {list.length === 0 ? (
        <p style={{ color: "#b3a6e0" }}>
          No published brands found. If you are not signed in, brand data is
          protected — please <a href="/login">log in</a>. Researched brands
          will appear here as they are published.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {list.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              score={scoreByBrand.get(brand.id) ?? null}
              categories={catsByBrand.get(brand.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
