import Link from "next/link";

/** Post-payment landing for pay-first signup. Stripe sends the
 *  visitor here after a successful checkout; nothing is unlocked by
 *  this page — the webhook has parked the paid plan as a claim keyed
 *  by the checkout email, and the account is created when the visitor
 *  signs in with that same email (the auth callback attaches the
 *  claim). Public route: it sits outside every gated prefix. */
export default function WelcomePage() {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <h1>Payment received</h1>
      <p>
        Sign in with the email you paid with to create your account.
        Your plan attaches automatically the moment you sign in.
      </p>
      <Link href="/login">
        <button>Sign in to create your account</button>
      </Link>
    </div>
  );
}
