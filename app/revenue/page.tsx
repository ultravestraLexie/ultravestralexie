import { redirect } from "next/navigation";

/* Galaxy redesign (2026-11-23): this surface moved to Money,
 * which itself moved into Me (five-section navigation, owner
 * order 2026-11-23) — so the redirect lands on /me.
 * next.config.mjs redirects here first; this stub keeps the
 * route honest if the config ever changes. The engine behind
 * the old page is untouched and still reachable via its API. */
export default function MovedPage() {
  redirect("/me");
}
