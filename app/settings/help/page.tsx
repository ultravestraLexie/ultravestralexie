import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HelpCenterClient from "./HelpCenterClient";

export const dynamic = "force-dynamic";

/* HELP CENTER — searchable articles behind Settings (Support &
 * About package, 2026-11-24). Content and matching live in
 * lib/galaxy/help; this page only gates and mounts. */

export default async function HelpCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={null}>
      <HelpCenterClient accountEmail={user.email ?? ""} />
    </Suspense>
  );
}
