import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isBusinessAccountType,
  type BusinessAccountType,
} from "@/lib/business-registration";

/** Self-guard for the business sub-routes (campaigns / creators /
 *  customers), mirroring /business/home exactly: business routes
 *  are deliberately NOT in the subscription gate's GATED_PREFIXES
 *  because business accounts hold no subscription.
 *    - no session          → /login?next=<this route>
 *    - creator account     → /today (their app)
 *    - brand / agency      → the account type is returned */
export async function requireBusinessAccount(
  nextPath: string
): Promise<BusinessAccountType> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const accountType = (profile as { account_type?: string } | null)
    ?.account_type;
  if (!isBusinessAccountType(accountType)) {
    redirect("/today");
  }
  return accountType;
}
