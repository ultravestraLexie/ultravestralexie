import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivacyClient from "./PrivacyClient";

export const dynamic = "force-dynamic";

/* PRIVACY CENTER — behind Settings (Support & About package,
 * 2026-11-24). The Public Passport toggle reflects the REAL flag
 * (public.profiles.passport_public, read here server-side; writes
 * go through the existing PATCH /api/passport/share). "Download
 * my data" is the existing GET /api/export. There is no self-serve
 * account deletion in the app, so "Delete my account" files a real
 * deletion request through the existing support flow — the sheet
 * says exactly that before anything is sent. */

export default async function PrivacyCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("passport_public")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <PrivacyClient
      accountEmail={user.email ?? ""}
      initialPassportPublic={
        (profile as { passport_public: boolean } | null)?.passport_public ??
        false
      }
    />
  );
}
