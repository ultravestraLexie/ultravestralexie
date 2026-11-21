import Link from "next/link";
import type { Brand } from "@/lib/types";

export default function BrandCard({
  brand,
  score,
  categories,
}: {
  brand: Brand;
  score?: number | null;
  categories?: string[];
}) {
  return (
    <article
      style={{
        border: "1px solid #3d2a6e", background: "rgba(27,18,61,0.85)",
        borderRadius: 20,
        boxShadow: "0 0 22px rgba(124,58,237,0.18)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>
          <Link href={`/brands/${brand.id}`}>{brand.name}</Link>
        </h3>
        {typeof score === "number" && (
          <span
            title="UltraVestra Opportunity Score"
            style={{
              background: "linear-gradient(92deg, #a855f7, #e879f9)",
              color: "#ffffff",
              fontWeight: 700,
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {Math.round(score)} / 100
          </span>
        )}
      </div>
      {categories && categories.length > 0 && (
        <p style={{ margin: 0, color: "#b3a6e0", fontSize: 13 }}>
          {categories.join(" · ")}
        </p>
      )}
      {brand.description && (
        <p style={{ margin: 0, fontSize: 14 }}>
          {brand.description.slice(0, 160)}
          {brand.description.length > 160 ? "…" : ""}
        </p>
      )}
      {brand.country && (
        <p style={{ margin: 0, color: "#b3a6e0", fontSize: 13 }}>{brand.country}</p>
      )}
    </article>
  );
}
