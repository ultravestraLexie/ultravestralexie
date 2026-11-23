import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import {
  fetchDeals,
  fetchExpenses,
  fetchIncome,
  fetchProfile,
} from "@/lib/galaxy/server";
import MoneyClient from "./MoneyClient";

export const dynamic = "force-dynamic";

/* MONEY — Protect money. Owed / overdue / received all read from
 * the creator's deals (nothing is entered twice); payouts are
 * revenue_entries recorded as paid and not linked to a deal;
 * expenses are creator_expenses. */
export default async function MoneyPage() {
  await requireSubscription("/money");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, income, expenses] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
    fetchIncome(supabase, user.id),
    fetchExpenses(supabase, user.id),
  ]);

  return <MoneyClient profile={profile} deals={deals} income={income} expenses={expenses} />;
}
