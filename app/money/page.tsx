import { redirect } from "next/navigation";

/* Five-section navigation (owner order 2026-11-23): Money moved
 * into Me — it is the #money half of /me. next.config.mjs
 * redirects here first; this stub keeps the route honest if the
 * config ever changes. MoneyClient still lives in this folder
 * and is rendered, unchanged, by app/me/page.tsx. */
export default function MovedPage() {
  redirect("/me");
}
