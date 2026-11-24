import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { articleById } from "@/lib/galaxy/help";
import ArticleClient from "./ArticleClient";

export const dynamic = "force-dynamic";

/* ARTICLE — one Help Center / Privacy Center / Terms article
 * behind Settings (Support & About package, 2026-11-24). The
 * corpus lives in lib/galaxy/help; unknown ids 404. */

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = articleById.get(id);
  if (!article) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ArticleClient article={article} accountEmail={user.email ?? ""} />
  );
}
