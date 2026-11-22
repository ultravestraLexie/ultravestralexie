import { CreateAccountForm } from "@/app/login/login-form";
import { getStripe } from "@/lib/stripe";

/** Post-payment create-account page for pay-first signup.
 *
 *  Stripe sends the visitor here after a successful guest checkout
 *  (success_url carries ?session_id=). The server reads the checkout
 *  session to recover the email the visitor paid with and pre-fills
 *  — and locks — the form to it: the account must be created with
 *  that email so the webhook's parked claim can attach. If the
 *  session can't be read, the form falls back to a normal editable
 *  email field.
 *
 *  Nothing is unlocked by creating an account here: the paid plan
 *  attaches through the shared pay-first helper after sign-up, and
 *  access is granted only by the Stripe webhook. An account created
 *  without a payment behind it lands on the subscription paywall
 *  with nothing unlocked. Public route: it sits outside every gated
 *  prefix. */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const sessionId =
    typeof params?.session_id === "string" ? params.session_id : undefined;

  let paidEmail = "";
  if (sessionId && sessionId.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      paidEmail =
        session.metadata?.signup_email ??
        session.customer_email ??
        session.customer_details?.email ??
        "";
    } catch {
      // Fall through with an editable email field.
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <h1>Create your account</h1>
      <p>Payment received. Create your account with the email you paid with.</p>
      <CreateAccountForm
        initialEmail={paidEmail}
        emailLocked={paidEmail !== ""}
      />
    </div>
  );
}
