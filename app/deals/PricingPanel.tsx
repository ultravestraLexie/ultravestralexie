"use client";

import { useMemo, useState } from "react";
import {
  averagePaidFeeCents,
  computeQuote,
  counterOfferText,
  dealProfitability,
  fmtMoney,
  fmtMoneyExact,
  negotiationPrep,
  plural,
  quoteLines,
  stageOf,
  type GalaxyDeal,
  type GalaxyProfile,
  type PricingInputs,
} from "@/lib/galaxy/core";
import { copyText, toast } from "@/components/galaxy/ui";

/* PRICING INTELLIGENCE (System #4) — know what to charge, from
 * the creator's own figures and their own deal history only.
 * There is no market-rate data behind any of this and none is
 * implied: the per-1k price and the target hourly rate are the
 * creator's, the uplift percentages are editable examples
 * labelled as such, and the history anchors are computed from
 * their real paid deals. All state is local — nothing persists. */

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const dollarsToCents = (s: string): number => Math.round(num(s) * 100);

export default function PricingPanel({
  profile,
  deals,
}: {
  profile: GalaxyProfile;
  deals: GalaxyDeal[];
}) {
  /* Rate calculator inputs (raw strings; parsed on use). */
  const [views, setViews] = useState("");
  const [per1k, setPer1k] = useState("");
  const [videos, setVideos] = useState("");
  const [hours, setHours] = useState("");
  const [hourly, setHourly] = useState("");
  const [usageMonths, setUsageMonths] = useState("");
  const [usagePct, setUsagePct] = useState("25");
  const [exclMonths, setExclMonths] = useState("");
  const [exclPct, setExclPct] = useState("30");

  /* Profitability inputs. */
  const [profDealId, setProfDealId] = useState("");
  const [profFee, setProfFee] = useState("");
  const [profHours, setProfHours] = useState("");
  const [profCosts, setProfCosts] = useState("");

  /* Negotiation prep. */
  const [brandName, setBrandName] = useState("");

  const inputs: PricingInputs = useMemo(
    () => ({
      avgViews: num(views),
      pricePer1kCents: dollarsToCents(per1k),
      videos: num(videos),
      hours: num(hours),
      hourlyRateCents: dollarsToCents(hourly),
      usageMonths: num(usageMonths),
      usageUpliftPct: num(usagePct),
      exclusivityMonths: num(exclMonths),
      exclusivityUpliftPct: num(exclPct),
    }),
    [views, per1k, videos, hours, hourly, usageMonths, usagePct, exclMonths, exclPct]
  );
  const quote = useMemo(() => computeQuote(inputs), [inputs]);
  const lines = useMemo(() => quoteLines(inputs, quote), [inputs, quote]);

  const avgFee = useMemo(() => averagePaidFeeCents(deals), [deals]);
  const prep = useMemo(() => negotiationPrep(deals), [deals]);

  const openDeals = deals.filter((d) => d.stage !== "lost");
  const profDeal = openDeals.find((d) => d.id === profDealId) ?? null;
  const profFeeCents =
    profFee.trim() !== ""
      ? dollarsToCents(profFee)
      : (profDeal?.amountCents ?? profDeal?.receivedCents ?? 0);
  const prof = dealProfitability({
    feeCents: profFeeCents,
    hours: num(profHours),
    hourlyRateCents: dollarsToCents(hourly),
    costsCents: dollarsToCents(profCosts),
  });

  const counter = counterOfferText(profile, inputs, quote, brandName.trim() || undefined);

  async function copyCounter() {
    if (await copyText(counter)) toast("Counter-offer copied.");
    else toast("Copy failed — select the text and copy it manually.");
  }

  return (
    <section className="gx-panel" style={{ marginTop: 22 }} aria-labelledby="pricing-h">
      <div className="gx-panel-head">
        <h2 id="pricing-h">Pricing intelligence</h2>
        {avgFee != null ? (
          <span className="gx-muted">
            Your paid deals average {fmtMoney(avgFee)} · {plural(prep.paidDealCount, "paid deal")}
          </span>
        ) : null}
      </div>
      <p className="gx-sub" style={{ marginBottom: 6 }}>
        Know what to charge before a brand names a number. Every figure here comes from
        your own inputs and your own deal history — there is no market-rate table behind
        this, and none is invented. Change any assumption and the quote rebuilds.
      </p>

      <div className="gx-price-grid" style={{ marginTop: 10 }}>
        <div>
          <p style={{ fontWeight: 600, margin: "0 0 10px" }}>Rate calculator</p>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Average views per video</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={views} onChange={(e) => setViews(e.target.value)} />
            </label>
            <label className="gx-field">
              <span>Your price per 1,000 views ($)</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={per1k} onChange={(e) => setPer1k(e.target.value)} />
            </label>
          </div>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Videos in the package</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={videos} onChange={(e) => setVideos(e.target.value)} />
            </label>
            <label className="gx-field">
              <span>Hours the package takes</span>
              <input className="gx-input" type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            </label>
          </div>
          <label className="gx-field">
            <span>Your target hourly rate ($)</span>
            <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={hourly} onChange={(e) => setHourly(e.target.value)} />
          </label>

          <p style={{ fontWeight: 600, margin: "18px 0 10px" }}>Usage rights</p>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Months of paid usage</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={usageMonths} onChange={(e) => setUsageMonths(e.target.value)} />
            </label>
            <label className="gx-field">
              <span>Uplift per month (%)</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" value={usagePct} onChange={(e) => setUsagePct(e.target.value)} />
              <small className="gx-muted" style={{ fontSize: 12.5 }}>
                Example — set yours. 25% is a starting guess, not a market rate.
              </small>
            </label>
          </div>

          <p style={{ fontWeight: 600, margin: "18px 0 10px" }}>Exclusivity</p>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Months of category exclusivity</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={exclMonths} onChange={(e) => setExclMonths(e.target.value)} />
            </label>
            <label className="gx-field">
              <span>Uplift per month (%)</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" value={exclPct} onChange={(e) => setExclPct(e.target.value)} />
              <small className="gx-muted" style={{ fontSize: 12.5 }}>
                Example — set yours. 30% is a starting guess, not a market rate.
              </small>
            </label>
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 600, margin: "0 0 10px" }}>Your quote</p>
          {quote.baseCents === 0 ? (
            <div className="gx-empty">
              <p>
                Add your average views and per-1,000 price, or your hours and target
                rate, and your quote builds here — line by line, with the arithmetic
                shown.
              </p>
            </div>
          ) : (
            <>
              <p style={{ margin: "0 0 4px" }}>
                {quote.baseSource === "views" ? (
                  <>
                    Your view price (<strong>{fmtMoneyExact(quote.viewPriceCents)}</strong>)
                    beats your time floor ({fmtMoneyExact(quote.timeFloorCents)}), so the
                    quote starts from your views.
                  </>
                ) : quote.baseSource === "time" ? (
                  <>
                    Your time floor (<strong>{fmtMoneyExact(quote.timeFloorCents)}</strong>)
                    beats your view price ({fmtMoneyExact(quote.viewPriceCents)}), so the
                    quote starts from your time — your reach never underprices your hours.
                  </>
                ) : (
                  <>Your view price and your time floor land on the same number.</>
                )}
              </p>
              <ul className="gx-list">
                {lines.map((l) => (
                  <li key={l.id} className="gx-quote-li">
                    <span>{l.label}</span>
                    <strong className="gx-fc-amount">{fmtMoneyExact(l.cents)}</strong>
                    <span className="gx-quote-detail">{l.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="gx-quote-total">
                <span>Quote total</span>
                <strong>{fmtMoneyExact(quote.totalCents)}</strong>
              </div>
              <p className="gx-sub" style={{ marginTop: 10 }}>
                How this is figured: the base is the higher of the two prices above.
                Usage and exclusivity are added on top of the base — never folded into
                it — so if a brand drops the rights, the content price still stands.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="gx-price-grid">
        <div>
          <p style={{ fontWeight: 600, margin: "0 0 10px" }}>Deal profitability</p>
          <label className="gx-field">
            <span>One of your deals</span>
            <select className="gx-input" value={profDealId} onChange={(e) => setProfDealId(e.target.value)}>
              <option value="">Enter a fee manually…</option>
              {openDeals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brandName} — {stageOf(d.stage).label}
                  {d.amountCents ? ` — ${fmtMoney(d.amountCents)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="gx-row2">
            <label className="gx-field">
              <span>Fee ($)</span>
              <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" placeholder={profDeal?.amountCents ? String(profDeal.amountCents / 100) : "0"} value={profFee} onChange={(e) => setProfFee(e.target.value)} />
            </label>
            <label className="gx-field">
              <span>Hours it took / will take</span>
              <input className="gx-input" type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" value={profHours} onChange={(e) => setProfHours(e.target.value)} />
            </label>
          </div>
          <label className="gx-field">
            <span>Direct costs ($)</span>
            <input className="gx-input" type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={profCosts} onChange={(e) => setProfCosts(e.target.value)} />
          </label>
          {profFeeCents === 0 ? (
            <div className="gx-empty">
              <p>Pick one of your deals or enter a fee to see what it really pays you.</p>
            </div>
          ) : prof.verdict === "unknown" ? (
            <p style={{ margin: 0 }}>
              This deal leaves <strong>{fmtMoneyExact(prof.profitCents)}</strong> after
              direct costs — but add the hours it takes to see what it pays you per hour
              against your target rate.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 6px" }}>
                This deal pays you{" "}
                <strong>{fmtMoneyExact(prof.effectiveHourlyCents ?? 0)}/hr</strong> —{" "}
                {prof.verdict === "above" ? (
                  <>
                    above your {fmtMoneyExact(dollarsToCents(hourly))} target. After your
                    time at that rate and your costs, it leaves{" "}
                    <strong>{fmtMoneyExact(prof.profitCents)}</strong>.
                  </>
                ) : prof.verdict === "at" ? (
                  <>
                    right at your {fmtMoneyExact(dollarsToCents(hourly))} target. After
                    your time at that rate and your costs, it leaves{" "}
                    <strong>{fmtMoneyExact(prof.profitCents)}</strong>.
                  </>
                ) : (
                  <>
                    below your {fmtMoneyExact(dollarsToCents(hourly))} target. The fee
                    would need to be <strong>{fmtMoneyExact(prof.feeNeededCents ?? 0)}</strong>{" "}
                    to hit your target; as it stands it leaves{" "}
                    <strong>{fmtMoneyExact(prof.profitCents)}</strong> after your time and
                    costs.
                  </>
                )}
              </p>
            </>
          )}
        </div>

        <div>
          <p style={{ fontWeight: 600, margin: "0 0 10px" }}>Negotiation prep</p>
          <ul className="gx-list">
            {prep.avgPaidFeeCents != null ? (
              <li className="gx-gap-row">
                <p>
                  <strong>Your anchor:</strong>{" "}
                  <span className="gx-muted">
                    your paid deals average {fmtMoney(prep.avgPaidFeeCents)} across{" "}
                    {plural(prep.paidDealCount, "paid deal")}. When a brand opens low,
                    that is the number your history backs.
                  </span>
                </p>
              </li>
            ) : (
              <li className="gx-gap-row">
                <p>
                  <strong>Your anchor:</strong>{" "}
                  <span className="gx-muted">
                    no paid deals yet, so lean on your time floor — price the hours
                    first, and let views raise the quote, never drop it below your floor.
                  </span>
                </p>
              </li>
            )}
            <li className="gx-gap-row">
              <p>
                <strong>Walk-away floor:</strong>{" "}
                <span className="gx-muted">
                  {quote.timeFloorCents > 0 ? (
                    <>
                      {fmtMoneyExact(quote.timeFloorCents)} for the package above (
                      {plural(inputs.hours, "hour")} × {fmtMoneyExact(inputs.hourlyRateCents)}/hr).
                      Below that, the package pays you less than your target rate.
                    </>
                  ) : (
                    <>set your hours and target hourly rate in the calculator and your floor appears here.</>
                  )}
                </span>
              </p>
            </li>
            <li className="gx-gap-row">
              <p>
                <strong>Payment speed:</strong>{" "}
                <span className="gx-muted">
                  {prep.fastestDaysToPay != null ? (
                    <>
                      your fastest payment landed {plural(prep.fastestDaysToPay, "day")}{" "}
                      after the invoice was sent
                      {prep.avgDaysToPay != null
                        ? `, and across ${plural(prep.timedDeals, "timed payment")} brands have typically paid in ${plural(prep.avgDaysToPay, "day")}`
                        : ""}
                      . Use that when you agree payment terms.
                    </>
                  ) : (
                    <>once a paid deal carries both an invoice date and a payment date, your real payment speeds show up here.</>
                  )}
                </span>
              </p>
            </li>
          </ul>

          <label className="gx-field" style={{ marginTop: 14 }}>
            <span>Brand (optional, for the counter-offer)</span>
            <input className="gx-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" />
          </label>
          {quote.totalCents > 0 ? (
            <>
              <pre className="gx-counter">{counter}</pre>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" className="gx-btn gx-btn-sm" onClick={() => void copyCounter()}>
                  Copy counter-offer
                </button>
              </div>
            </>
          ) : (
            <div className="gx-empty">
              <p>Build a quote above and a ready-to-send counter-offer appears here with your real figures in it.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
