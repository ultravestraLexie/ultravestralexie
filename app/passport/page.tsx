import { redirect } from "next/navigation";

/* Five-section navigation (owner order 2026-11-23): Passport
 * moved into Me — it is the #passport half of /me.
 * next.config.mjs redirects here first; this stub keeps the
 * route honest if the config ever changes. PassportClient still
 * lives in this folder and is rendered, unchanged, by
 * app/me/page.tsx. The public share page /p/[slug] is a
 * different route and is untouched. */
export default function MovedPage() {
  redirect("/me");
}
