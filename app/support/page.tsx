import Link from "next/link";

/** Customer support — the visible help path for paying customers
 *  (Phase 1 Build 2d; the Phase Zero audit found none existed).
 *
 *  Support is email, answered by a person. This page promises only
 *  what is true: the address, what to include so the problem can be
 *  found fast, and the self-help paths that already exist in the
 *  product (password reset, plan management on the pricing page).
 *  No response-time promise is made here, so none can be broken. */
export default function SupportPage() {
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
