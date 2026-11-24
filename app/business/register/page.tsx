import { businessTypeFromParam } from "@/lib/business-registration";
import RegisterForm from "./register-form";

/** Public business registration — Brand & Agency accounts (v1).
 *
 *  Public route: it sits outside every gated prefix in
 *  lib/gate-paths.ts, inside the signed-out public chrome. A
 *  signed-in creator who wanders here can still read it; the form
 *  itself creates a NEW account, and an already-registered email is
 *  refused with a pointer to log in (handled in the form).
 *
 *  A ?type=brand|agency parameter (the landing page's role cards
 *  link here with it) preselects the Step-1 account type; anything
 *  else leaves the current no-preselect behavior. */
export default async function BusinessRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialType = businessTypeFromParam(params.type);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>Register your business</h1>
      <p style={{ color: "#ddd0ff" }}>
        UltraVestra is where creators run their brand partnerships.
        Register your brand or agency — free — so your business is on
        record with the platform. First, tell us which kind of
        account fits you:
      </p>
      <RegisterForm initialType={initialType} />
    </div>
  );
}
