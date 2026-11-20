"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Save / unsave a brand for the signed-in creator (saved_brands table).
 *  Renders nothing actionable when signed out — RLS will reject writes. */
export default function SaveBrandButton({ brandId }: { brandId: string }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaved(false);
        return;
      }
      const { data } = await supabase
        .from("saved_brands")
        .select("brand_id")
        .eq("user_id", user.id)
        .eq("brand_id", brandId)
        .maybeSingle();
      setSaved(Boolean(data));
    })();
  }, [brandId]);

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      window.location.href = "/login";
      return;
    }
    if (saved) {
      await supabase
        .from("saved_brands")
        .delete()
        .eq("user_id", user.id)
        .eq("brand_id", brandId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_brands")
        .insert({ user_id: user.id, brand_id: brandId });
      setSaved(true);
    }
    setBusy(false);
  }

  return (
    <button onClick={toggle} disabled={busy || saved === null}>
      {saved ? "★ Saved" : "☆ Save brand"}
    </button>
  );
}
