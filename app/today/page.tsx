import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import {
  computeInsights,
  daysAgo,
  fmtMoney,
  matchesToPitch,
  overdueCents,
  owedCents,
  paidInMonth,
  plural,
  todayKey,
  monthKeyOf,
  addDaysKey,
} from "@/lib/galaxy/core";
import {
  fetchDeals,
  fetchDirectory,
  fetchIncome,
  fetchPosts,
  fetchProfile,
  fetchProtections,
  fetchSavedBrandIds,
  fetchScriptCount,
} from "@/lib/galaxy/server";
import TodayClient from "./TodayClient";

export const dynamic = "force-dynamic";

/* TODAY — Creator Intelligence. Everything on this page is
 * computed from the creator's own records (deals, posts, saved
 * brands, profile, directory) by the pure intelligence layer in
 * lib/galaxy/core — no invented numbers, honest empty states. */
export default async function TodayPage() {
  await requireSubscription("/today");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, deals, posts, savedIds, scriptCount, income, protections] = await Promise.all([
    fetchProfile(supabase, user.id),
    fetchDeals(supabase, user.id),
    fetchPosts(supabase, user.id),
    fetchSavedBrandIds(supabase, user.id),
    fetchScriptCount(supabase, user.id),
    fetchIncome(supabase, user.id),
    fetchProtections(supabase, user.id),
  ]);
  const brands = await fetchDirectory(supabase, savedIds);
  const { data: catRows } = await supabase.from("categories").select("name").order("name");
  const categories = ((catRows ?? []) as { name: string }[]).map((c) => c.name);

  const now = new Date();
  const publishedDates = posts.filter((p) => p.state === "published").map((p) => p.date);
  const postsThisWeek = publishedDates.filter((d) => {
    const a = daysAgo(d, now);
    return a >= 0 && a <= 6;
  }).length;

  const input = { deals, brands, profile, postsThisWeek, scriptCount, protectionByDeal: protections, now };
  const insights = computeInsights(input);
  const pitchBrands = matchesToPitch(input, 3);
  const paidCount = deals.filter((d) => d.stage === "paid").length;

  const urgent = insights.filter((x) =>
    ["overdue", "risk", "followup"].includes(x.kind)
  ).length;
  const od = overdueCents(deals, now);
  const comingIn = owedCents(deals) - od;
  let summary: string;
  if (!profile.name && deals.length === 0) {
    summary = "Start with the steps below. Your first pitch can go out today.";
  } else {
    summary = urgent
      ? `${plural(urgent, "thing")} ${urgent === 1 ? "needs" : "need"} you today.`
      : "Nothing urgent today.";
    if (od > 0) summary += ` ${fmtMoney(od)} is overdue.`;
    if (comingIn > 0) summary += ` ${fmtMoney(comingIn)} more is on its way.`;
  }

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.name.split(" ")[0] ?? "";

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysKey(-(6 - i), now);
    return {
      key,
      label: new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" }),
      full: new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }),
      on: publishedDates.includes(key),
      today: key === todayKey(now),
    };
  });

  return (
    <TodayClient
      greeting={greeting}
      firstName={firstName}
      summary={summary}
      profile={profile}
      deals={deals}
      insights={insights}
      pitchBrands={pitchBrands}
      paidCount={paidCount}
      paidThisMonthCents={paidInMonth(deals, income, monthKeyOf(todayKey(now)))}
      savedCount={savedIds.size}
      scriptCount={scriptCount}
      postsThisWeek={postsThisWeek}
      weekDays={weekDays}
      categories={categories}
    />
  );
}
