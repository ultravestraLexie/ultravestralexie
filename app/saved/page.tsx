import { requireSubscription } from "@/lib/gate";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BrandCard from "@/components/BrandCard";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The signed-in creator's saved brands (saved_brands joined to brands). */
export default async function SavedPage() {
  await requireSubscription("/saved");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1>Saved brands</h1>
        <p style={{ color: "#b3a6e0" }}>
          Please <Link href="/login">log in</Link> to see the brands you have
          saved.
        </p>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("saved_brands")
    .select("brand_id, brands(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const brands = ((rows ?? []) as unknown as { brands: Brand | null }[])
    .map((r) => r.brands)
    .filter(Boolean) as Brand[];

  return (
    <div>
      <h1>Saved brands</h1>
      {brands.length === 0 ? (
        <p style={{ color: "#b3a6e0" }}>
          Nothing saved yet. Browse the <Link href="/brands">directory</Link>{" "}
          and tap &ldquo;Save brand&rdquo; on any brand worth pursuing.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
