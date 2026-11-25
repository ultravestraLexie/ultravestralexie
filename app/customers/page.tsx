import Link from "next/link";
import { requireSubscription } from "@/lib/gate";
import { createClient } from "@/lib/supabase/server";
import { fetchDeals } from "@/lib/galaxy/server";
import { engineCustomers } from "@/lib/galaxy/engine";
import { fmtMoney } from "@/lib/galaxy/core";
import { ENG_CSS } from "@/lib/engine-css";

export const dynamic = "force-dynamic";

/* CUSTOMERS (Growth Engine stage 4) — the creator's real customer
 * list, derived from their own paid deals: a brand becomes a
 * customer when a deal is paid. No separate customer database, no
 * sample rows — if nobody has paid yet, this page says so. */
export default async function CustomersPage() {
  await requireSubscription("/customers");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const deals = await fetchDeals(supabase, user.id);
  const customers = engineCustomers(deals);
  const totalPaid = customers.reduce((t, c) => t + c.totalPaidCents, 0);
  const repeats = customers.filter((c) => c.repeat).length;

  return (
    <div className="eng">
      <style>{ENG_CSS}</style>
      <div className="wrap">
        <div className="label">Growth Engine · Stage 4</div>
        <h2 className="eng-title">Customers</h2>
        <p className="sub">
          Brands that have paid you are your customers. This list is built from your paid
          deals — the same records behind your Money — so it is always current.
        </p>

        <div className="kpis">
          <div className="kpi">
            <div className="v">{customers.length}</div>
            <div className="k">Paying customers</div>
          </div>
          <div className="kpi">
            <div className="v">{fmtMoney(totalPaid)}</div>
            <div className="k">Collected from customers</div>
          </div>
          <div className="kpi">
            <div className="v">{repeats}</div>
            <div className="k">Repeat customers</div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="empty">
            No customers yet. Your first paid deal creates your first customer — pitch a
            brand from the directory and close it in Deals.
            <div style={{ marginTop: 12 }}>
              <Link className="cta" href="/brands">
                Find a brand →
              </Link>
            </div>
          </div>
        ) : (
          customers.map((c) => (
            <div className="row" key={c.brandName}>
              <div className="grow">
                <div className="t">{c.brandName}</div>
                <div className="s">
                  {c.deals} paid deal{c.deals === 1 ? "" : "s"} · {fmtMoney(c.totalPaidCents)} total
                  {c.lastPaidOn ? ` · last paid ${c.lastPaidOn}` : ""}
                </div>
              </div>
              {c.repeat ? <span className="badge b-repeat">Repeat</span> : null}
              {c.activeNow ? <span className="badge b-active">Active now</span> : null}
              {c.followUpDue ? <span className="badge b-due">Follow-up due</span> : null}
              <Link className="cta" href="/deals">
                Pitch again
              </Link>
            </div>
          ))
        )}
        <p className="note">
          A follow-up is due when a customer last paid 30 or more days ago and has no
          active deal. Retention keeps them coming back.
        </p>
      </div>
    </div>
  );
}
