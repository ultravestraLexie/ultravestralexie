import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSupportTickets } from "@/lib/galaxy/server";
import SupportClient from "./SupportClient";

export const dynamic = "force-dynamic";

/* SUPPORT — somewhere to go when something breaks (trust queue
 * #1, owner order 2026-11-23; the page itself dates to Phase 1
 * Build 2d, when the Phase Zero audit found no help path existed).
 *
 * Two audiences, one address:
 *  - Signed in: the support center — a request form that files a
 *    real row in public.support_tickets (answered by email), the
 *    creator's own previous requests with their status, the direct
 *    email fallback, and the self-help paths that already exist.
 *  - Signed out: the original public page below, unchanged — the
 *    address, what to include, password reset, plan help. People
 *    locked out of their account are exactly who need it.
 *
 * No response-time promise is made on either version, so none can
 * be broken. */

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <PublicSupport />;

  const tickets = await fetchSupportTickets(supabase, user.id);

  return (
    <div style={{ maxWidth: 860 }}>
      <section style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 30, margin: "0 0 6px", fontWeight: 800 }}>
          Support
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: 15.5 }}>
          Somewhere to go when something breaks. Send a request here, or
          email us — a person answers.
        </p>
      </section>
      <SupportClient
        accountEmail={user.email ?? ""}
        initialTickets={tickets}
      />
    </div>
  );
}

/** The public help page (Phase 1 Build 2d), kept verbatim for
 *  signed-out visitors: support is email, answered by a person,
 *  and this promises only what is true. */
function PublicSupport() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>Support</h1>
      <p>
        Stuck with billing, your account, or signing in? Email us and a
        person will help:
      </p>
      <p style={{ fontSize: 20 }}>
        <a href="mailto:ultravestraacademy@gmail.com">
          ultravestraacademy@gmail.com
        </a>
      </p>
      <p>So we can find your account fast, include:</p>
      <ul>
        <li>The email you paid or signed up with</li>
        <li>What you were trying to do, and what happened instead</li>
        <li>For a billing question: the plan name and the date of the charge</li>
      </ul>
      <p>Things you can do right now, without waiting:</p>
      <ul>
        <li>
          Forgot your password? <Link href="/forgot-password">Reset it</Link>
        </li>
        <li>
          Change or cancel your plan from the{" "}
          <Link href="/pricing">pricing page</Link> while signed in
        </li>
        <li>
          Paid but your account did not unlock? Sign in once with the
          email you paid with — your plan attaches automatically. If it
          still has not unlocked after a few minutes, email us with the
          email you paid with.
        </li>
      </ul>
      <p>
        <Link href="/login">Back to login</Link>
      </p>
    </div>
  );
}
