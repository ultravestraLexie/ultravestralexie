import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchDeals, fetchIncome } from "@/lib/galaxy/server";
import { buildGrowthEngine } from "@/lib/galaxy/engine";
import { fmtMoney } from "@/lib/galaxy/core";
import { ENG_CSS } from "@/lib/engine-css";

export const dynamic = "force-dynamic";

/* RETENTION (Growth Engine stage 6) — keep customers coming back.
 * Follow-ups are computed from the creator's paid deals (a customer
 * whose last payment is 30+ days old with no active deal), the
 * repeat rate is real, and referrals run through the creator's
 * Invite link. Honest by design: nothing here is sent
 * automatically — the creator chooses who to pitch. */
export default async function RetentionPage() {
  await requireSubscription("/retention");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [deals, income] = await Promise.all([
    fetchDeals(supabase, user.id),
    fetchIncome(supabase, user.id),
  ]);
  const engine = buildGrowthEngine({
    deals,
    income,
    publishedPosts: 0,
    postsThisWeek: 0,
    scriptCount: 0,
    savedCount: 0,
    directoryCount: 0,
    neglectedCount: 0,
  });

  return (
    <div className="eng">
      <style>{ENG_CSS}</style>
      <div className="wrap">
        <div className="label">Growth Engine · Stage 6</div>
        <h2 className="eng-title">Retention</h2>
        <p className="sub">
          Repeat customers, referrals and recurring revenue. Past customers convert best —
          this page watches your paid deals and tells you who to follow up with, and when.
        </p>

        <div className="kpis">
          <div className="kpi">
            <div className="v">
              {engine.repeatRatePct === null ? "—" : `${engine.repeatRatePct}%`}
            </div>
            <div className="k">Repeat customers</div>
          </div>
          <div className="kpi">
            <div className="v">{engine.followUps.length}</div>
            <div className="k">Follow-ups due</div>
          </div>
          <div className="kpi">
            <div className="v">{engine.customers.length}</div>
            <div className="k">Customers to keep</div>
          </div>
        </div>

        <h3 className="eng-h">Follow-ups due</h3>
        {engine.followUps.length === 0 ? (
          <div className="empty">
            Nobody is due a follow-up. When a customer&apos;s last payment passes 30 days
            with no active deal, they appear here — pitch them the next collaboration
            before someone else does.
          </div>
        ) : (
          engine.followUps.map((c) => (
            <div className="row" key={c.brandName}>
              <div className="grow">
                <div className="t">{c.brandName}</div>
                <div className="s">
                  Last paid {c.daysSincePaid} days ago · {fmtMoney(c.totalPaidCents)} across{" "}
                  {c.deals} deal{c.deals === 1 ? "" : "s"}
                </div>
              </div>
              <span className="badge b-due">Follow-up due</span>
              <Link className="cta" href="/deals">
                Pitch again
              </Link>
            </div>
          ))
        )}

        <h3 className="eng-h">Referrals</h3>
        <div className="card">
          <div className="t" style={{ fontWeight: 600, fontSize: 15 }}>
            Happy customers bring the next ones
          </div>
          <p className="sub" style={{ margin: "6px 0 12px" }}>
            Your Invite link is your public Passport address — share it with customers and
            creator friends, and you both unlock rewards when they join.
          </p>
          <Link className="cta" href="/me/invite">
            Get my invite link →
          </Link>
        </div>

        <p className="note">
          Follow-ups are worked out from your paid deals. Nothing is sent automatically —
          you choose who to pitch, every time.
        </p>
      </div>
    </div>
  );
}
