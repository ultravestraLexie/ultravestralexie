"use client";

import { useState } from "react";
import Link from "next/link";
import { MKT_CSS } from "@/lib/marketplace-css";
import { MKT2_CSS } from "@/lib/marketplace2-css";
import {
  Avatar,
  Field,
  Icon,
  SampleBanner,
  Sheet,
  SheetActions,
  StatsBlock,
  Stepper,
  ToastView,
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  BarList,
  HeaderRow,
  KpiGrid,
  Progress,
  RowOf,
  SectionHead,
  useMarket2Store,
} from "@/components/marketplace2/Mkt2";
import {
  AREAS_LIST,
  CATS,
  COLORS,
  STATUS,
  ago,
  creatorById,
  dashTotals,
  followUps,
  fmtK,
  money,
  myCollabsOf,
  payout,
  rateLabel,
  type MarketState,
} from "@/lib/marketplace";
import {
  acceptCollab2,
  agencyCollabs2,
  bizById2,
  brandCollabs2,
  calcStats,
  counterCollab2,
  creatorById2,
  declineCollab2,
  feeSplitText,
  isAmbassador2,
  oppById2,
  payout2,
  pitchCollab2,
  roiText,
  spendOf2,
  sumStats2,
  tierOf,
  type M2Collab,
  type M2State,
} from "@/lib/marketplace2";

type View = "business" | "agency" | "brand";
type V1Store = ReturnType<typeof useMarketStore>;
type V2Store = ReturnType<typeof useMarket2Store>;

/* The business-side marketplace home (owner order 2026-11-24, the
 * v2 prototype's home pages): a dashboard with the prototype's
 * Business / Agency / Brand views behind a switcher, defaulting to
 * the account's own type. Business view reads the v1 store (the
 * same store as the Campaigns / Creators / Customers tools, so the
 * numbers match); Agency and Brand views read the v2 store. All
 * sample data, on-device only — nothing writes to the database. */

export default function MarketHome({ accountType }: { accountType: string }) {
  const [view, setView] = useState<View>(
    accountType === "agency" ? "agency" : accountType === "brand" ? "brand" : "business"
  );
  return (
    <div className="mkt" style={{ marginTop: 24 }}>
      <style>{MKT_CSS}</style>
      <style>{MKT2_CSS}</style>
      <div className="tabrow" role="group" aria-label="Dashboard view">
        <button type="button" className="chip" aria-pressed={view === "business"} onClick={() => setView("business")}>
          <Icon name="store" /> Business
        </button>
        <button type="button" className="chip" aria-pressed={view === "agency"} onClick={() => setView("agency")}>
          <Icon name="building" /> Agency
        </button>
        <button type="button" className="chip" aria-pressed={view === "brand"} onClick={() => setView("brand")}>
          <Icon name="crown" /> Brand
        </button>
      </div>
      {view === "business" && <BusinessDash />}
      {view === "agency" && <AgencyDash />}
      {view === "brand" && <BrandDash />}
    </div>
  );
}

// ---------------------------------------------------------------------
// BUSINESS VIEW — the local-business dashboard (prototype renderDash)
// ---------------------------------------------------------------------

function BusinessDash() {
  const store = useMarketStore();
  const { state, toast } = store;
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!state) return null;
  const now = Date.now();
  const b = state.businesses.filter((x) => x.id === state.myBiz)[0];
  const mine = myCollabsOf(state);
  const live = mine.filter((c) => c.stats);
  const tot = dashTotals(state);
  const fromCreators = state.customers.filter((k) => creatorById(state, k.source));
  const ltv = fromCreators.reduce((s, k) => s + (k.spend || 0), 0);
  const repeat = fromCreators.filter((k) => k.visits >= 2).length;
  const due = followUps(state, now).length;

  const byCreator = new Map<string, { customers: number; revenue: number; spend: number }>();
  live.forEach((c) => {
    const x = byCreator.get(c.cr) || { customers: 0, revenue: 0, spend: 0 };
    x.customers += c.stats!.customers;
    x.revenue += c.stats!.revenue;
    x.spend += payout(state, c);
    byCreator.set(c.cr, x);
  });
  const top = [...byCreator.entries()].sort((a, b2) => b2[1].customers - a[1].customers);

  const steps: [string, number, string][] = [
    ["Views", tot.views, "#9DB8FF"],
    ["Clicks", tot.clicks, "#B69CFF"],
    ["Leads", tot.leads, "#FF9CC8"],
    ["Customers", tot.customers, "#F5C451"],
  ];

  return (
    <>
      <SampleBanner onReset={store.reset} />
      <div className="row" style={{ marginTop: 4 }}>
        <Avatar label={b.name} id={b.id} />
        <div className="grow">
          <div style={{ font: "700 20px var(--m-display)" }}>{b.name}</div>
          <div className="faint" style={{ fontSize: 13 }}>
            {b.cat} · {b.area}
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Business settings" onClick={() => setSettingsOpen(true)}>
          <Icon name="gear" />
        </button>
      </div>

      <SectionHead title="Creator campaigns, all time" />
      <KpiGrid
        items={[
          [money(tot.revenue), "Revenue tracked"],
          [money(tot.spend), "Paid to creators"],
          [tot.spend ? `${(tot.revenue / tot.spend).toFixed(1)}×` : "—", "Return on spend", "var(--m-cyan)"],
          [String(tot.customers), "New customers"],
          [tot.customers ? money(tot.spend / tot.customers) : "—", "Cost per customer"],
          [fmtK(tot.views), "Views"],
        ]}
      />

      <SectionHead title="From attention to revenue" />
      <div className="glass pad funnel">
        {steps.map(([label, v, color], i) => (
          <div key={label}>
            <div className="fstep">
              <span className="muted">{label}</span>
              <div className="bar2">
                <i
                  style={{
                    width: `${Math.max(3, tot.views ? Math.pow(v / tot.views, 0.35) * 100 : 0)}%`,
                    background: color,
                  }}
                />
              </div>
              <b>{fmtK(v)}</b>
            </div>
            {i > 0 && steps[i - 1][1] > 0 && (
              <div className="faint" style={{ fontSize: 11, margin: "-4px 0 0 96px" }}>
                {Math.round((v / steps[i - 1][1]) * 1000) / 10}% of {steps[i - 1][0].toLowerCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      <SectionHead title="Retention: do they come back?" />
      <div className="glass pad">
        <div style={{ font: "700 30px var(--m-display)", color: "var(--m-gold)" }}>{money(ltv)}</div>
        <div className="muted" style={{ fontSize: 14 }}>
          spent by {fromCreators.length} customers creators brought in. {repeat} of them have come back more than once.
        </div>
        {due > 0 && (
          <Link href="/business/customers" className="btn primary small" style={{ marginTop: 12 }}>
            <Icon name="bolt" /> {due} follow-up{due === 1 ? "" : "s"} due today
          </Link>
        )}
      </div>

      <SectionHead title="Top creators for you" right="By customers brought" />
      <div className="glass list">
        {!top.length && <div className="empty">Results show up here once a creator’s video is live.</div>}
        {top.map(([id, x]) => {
          const cr = creatorById(state, id);
          return (
            <div key={id} className="li" style={{ cursor: "default" }}>
              <Avatar label={cr.handle} id={id} sm round />
              <div className="grow">
                <div className="t">{cr.handle}</div>
                <div className="s">
                  {x.customers} customers · {money(x.revenue)} revenue ·{" "}
                  {x.spend ? `${(x.revenue / x.spend).toFixed(1)}× return` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/business/campaigns" className="btn gold block" style={{ marginTop: 20 }}>
        <Icon name="plus" /> Post a new opportunity
      </Link>
      <p className="note">Results are tracked through each creator’s link and promo code. Numbers here are sample data.</p>

      <BizSettingsSheet state={state} store={store} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastView msg={toast} />
    </>
  );
}

function BizSettingsSheet({
  state,
  store,
  open,
  onClose,
}: {
  state: MarketState;
  store: V1Store;
  open: boolean;
  onClose: () => void;
}) {
  const b = state.businesses.filter((x) => x.id === state.myBiz)[0];
  const [name, setName] = useState(b.name);
  const [cat, setCat] = useState(b.cat);
  const [area, setArea] = useState(b.area);
  const [avg, setAvg] = useState(String(b.avgSale));
  const [rev, setRev] = useState(state.bizSettings.reviewLink);
  const [off, setOff] = useState(state.bizSettings.winbackOffer);
  return (
    <Sheet open={open} onClose={onClose} title="Business settings">
      <Field label="Business name">
        <input className="in" type="text" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <select className="in" value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Area">
        <select className="in" value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS_LIST.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </Field>
      <Field label="Average sale ($)" hint="Used to estimate revenue from promo-code customers.">
        <input className="in" type="number" min={0} inputMode="numeric" value={avg} onChange={(e) => setAvg(e.target.value)} />
      </Field>
      <Field label="Review link" hint="Where happy customers leave a review (Google, Yelp...).">
        <input className="in" type="url" maxLength={200} value={rev} onChange={(e) => setRev(e.target.value)} />
      </Field>
      <Field label="Win-back offer">
        <input className="in" type="text" maxLength={60} value={off} onChange={(e) => setOff(e.target.value)} />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            store.update((d) => {
              const biz = d.businesses.filter((x) => x.id === d.myBiz)[0];
              biz.name = name.trim() || biz.name;
              biz.cat = cat;
              biz.area = area;
              biz.avgSale = Math.max(0, parseFloat(avg) || 0);
              d.bizSettings.reviewLink = rev.trim() || "[YOUR REVIEW LINK]";
              d.bizSettings.winbackOffer = off.trim() || d.bizSettings.winbackOffer;
              d.bizSettings.avgSale = biz.avgSale;
            });
            onClose();
            store.notify("Saved.");
          }}
        >
          Save
        </button>
      </SheetActions>
    </Sheet>
  );
}

// ---------------------------------------------------------------------
// AGENCY VIEW — the agency dashboard (prototype renderAgencyDash)
// ---------------------------------------------------------------------

function AgencyDash() {
  const store = useMarket2Store();
  const { state, toast } = store;
  const [sheet, setSheet] = useState<null | "pitch" | "add" | "settings">(null);
  const [pitchCreator, setPitchCreator] = useState<string | null>(null);
  if (!state) return null;
  const now = Date.now();
  const A = state.agency;
  const ac = agencyCollabs2(state);
  const earned = ac.filter((c) => c.paid).reduce((s, c) => s + payout2(state, c), 0);
  const pipe = ac
    .filter((c) => !c.paid && /accepted|submitted|changes|approved|live/.test(c.status))
    .reduce((s, c) => s + payout2(state, c), 0);
  const active = ac.filter((c) => !c.paid && c.status !== "declined").length;
  const st = sumStats2(ac);

  const order: Record<string, number> = { invited: 0, countered: 0, live: 1, approved: 2, accepted: 3, changes: 3, submitted: 4, applied: 5 };
  const need = ac
    .filter((c) => c.status !== "declined" && !(c.status === "live" && c.paid))
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  const byCreator = new Map<string, { earned: number; customers: number }>();
  ac.forEach((c) => {
    const x = byCreator.get(c.cr) || { earned: 0, customers: 0 };
    if (c.paid) x.earned += payout2(state, c);
    x.customers += (c.stats && c.stats.customers) || 0;
    byCreator.set(c.cr, x);
  });
  const rosterSorted = [...A.roster].sort(
    (a, b) => ((byCreator.get(b) || { earned: 0 }).earned || 0) - ((byCreator.get(a) || { earned: 0 }).earned || 0)
  );

  return (
    <>
      <SampleBanner onReset={store.reset} />
      <HeaderRow
        label={A.name}
        id="agency"
        sub={`Agency · ${A.roster.length} creators · ${A.clients.length} clients`}
        onGear={() => setSheet("settings")}
        gearLabel="Agency settings"
      />
      <SectionHead title="Your agency, all time" />
      <KpiGrid
        items={[
          [money(earned), "Roster earned"],
          [money((earned * A.fee) / 100), "Your commission", "var(--m-cyan)"],
          [money(pipe), "In the pipeline"],
          [String(active), "Active deals"],
          [String(st.customers), "Customers driven"],
          [String(A.roster.length), "Creators"],
        ]}
      />

      <SectionHead title="Needs your attention" right={need.length ? String(need.length) : ""} />
      {!need.length && <div className="glass empty">All quiet. Pitch your roster to new opportunities.</div>}
      {need.map((c) => (
        <AgencyCollabCard key={c.id} state={state} store={store} collab={c} now={now} />
      ))}

      <SectionHead title="Top earners on your roster" />
      <div className="glass list">
        {rosterSorted.map((id) => {
          const cr = creatorById2(state, id);
          const x = byCreator.get(id) || { earned: 0, customers: 0 };
          return (
            <button
              key={id}
              type="button"
              className="li"
              onClick={() => {
                setPitchCreator(id);
                setSheet("pitch");
              }}
            >
              <Avatar label={cr.handle} id={id} sm round />
              <div className="grow">
                <div className="t">{cr.handle}</div>
                <div className="s">
                  {money(x.earned)} earned through you · {x.customers} customers driven
                </div>
              </div>
              <span className="tag t-gold">Pitch</span>
            </button>
          );
        })}
      </div>
      <RowOf>
        <span style={{ marginTop: 18, display: "inline-flex" }}>
          <button type="button" className="btn gold" onClick={() => { setPitchCreator(null); setSheet("pitch"); }}>
            <Icon name="megaphone" /> Pitch your roster
          </button>
        </span>
        <span style={{ marginTop: 18, display: "inline-flex" }}>
          <button type="button" className="btn ghost" onClick={() => setSheet("add")}>
            <Icon name="plus" /> Add a creator
          </button>
        </span>
      </RowOf>

      <PitchSheet state={state} store={store} open={sheet === "pitch"} presetCreator={pitchCreator} onClose={() => setSheet(null)} />
      <AddCreatorSheet state={state} store={store} open={sheet === "add"} onClose={() => setSheet(null)} />
      <AgencySettingsSheet state={state} store={store} open={sheet === "settings"} onClose={() => setSheet(null)} />
      <ToastView msg={toast} />
    </>
  );
}

function AgencyCollabCard({
  state,
  store,
  collab,
  now,
}: {
  state: M2State;
  store: V2Store;
  collab: M2Collab;
  now: number;
}) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmt, setCounterAmt] = useState(String(collab.ask || collab.rate));
  const o = oppById2(state, collab.opp);
  const b = bizById2(state, o.biz);
  const cr = creatorById2(state, collab.cr);
  const amount = (r: number) => (o.model === "flat" ? r * o.videos : r);
  const upd = (fn: (d: M2State) => void) => store.update(fn);

  const checkIn = () => {
    store.notify(`Checked in with ${cr.handle}.`);
    store.demoReply(
      collab.id,
      (draft) => {
        const x = draft.collabs.filter((y) => y.id === collab.id)[0];
        if (x && /accepted|changes/.test(x.status)) {
          const xo = oppById2(draft, x.opp);
          const xcr = creatorById2(draft, x.cr);
          x.status = "submitted";
          x.video = xcr.handle.replace("@", "tiktok.com/@") + " (sample draft)";
          x.caption = `Obsessed with ${bizById2(draft, xo.biz).name}! ${xo.offer} with my code ${x.code} #ad`;
          x.ts = Date.now();
        }
      },
      2500
    );
    setTimeout(() => store.notify(`Demo: ${cr.handle} submitted the video to ${b.name}.`), 2800);
    store.demoReply(
      collab.id,
      (draft) => {
        const x = draft.collabs.filter((y) => y.id === collab.id)[0];
        if (x && x.status === "submitted") {
          const xo = oppById2(draft, x.opp);
          x.status = "live";
          x.post = x.video;
          x.stats = calcStats(creatorById2(draft, x.cr), xo.videos, bizById2(draft, xo.biz).avgSale || 30, x.id);
          x.ts = Date.now();
        }
      },
      5500
    );
    setTimeout(() => store.notify(`Demo: ${b.name} approved it. It’s live and tracking.`), 5800);
    store.demoReply(
      collab.id,
      (draft) => {
        const x = draft.collabs.filter((y) => y.id === collab.id)[0];
        if (x && x.status === "live" && !x.paid) {
          x.paid = true;
          x.paidAt = Date.now();
        }
      },
      9000
    );
    setTimeout(() => store.notify(`Demo: ${b.name} paid. On time.`), 9300);
  };

  return (
    <div className="glass collab">
      <div className="head">
        <Avatar label={cr.handle} id={cr.id} sm round />
        <div className="grow">
          <div className="t">
            {cr.handle} → {b.name}
          </div>
          <div className="s">
            {o.title} · {ago(collab.ts, now)}
          </div>
        </div>
        <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
          <span className={`tag ${STATUS[collab.status][1]}`}>{STATUS[collab.status][0]}</span>
          {collab.paid && <span className="tag t-gold">Paid</span>}
        </div>
      </div>
      <Stepper collab={collab} />
      <div className="next">
        {(collab.status === "invited" || collab.status === "countered") && (
          <>
            <div className="q">
              {collab.status === "invited"
                ? `${b.name} invited ${cr.handle} at ${money(collab.ask || collab.rate)} ${rateLabel(o)}.`
                : `${b.name} countered at ${money(collab.ask || collab.rate)} ${rateLabel(o)}${collab.msg ? `: “${collab.msg}”` : "."}`}
            </div>
            <div className="faint" style={{ fontSize: 12, margin: "-4px 0 10px" }}>
              {feeSplitText(state, amount(collab.ask || collab.rate))}
            </div>
            <RowOf>
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  upd((d) => acceptCollab2(d, collab.id, Date.now()));
                  store.notify(
                    collab.status === "invited"
                      ? `Accepted. ${cr.handle} can start creating.`
                      : `Deal! Saved in Deals for ${cr.handle}.`
                  );
                }}
              >
                {collab.status === "invited" ? `Accept for ${cr.name.split(" ")[0]}` : `Accept ${money(collab.ask || collab.rate)}`}
              </button>
              <button type="button" className="btn ghost small" onClick={() => setCounterOpen(true)}>
                Counter
              </button>
              <button
                type="button"
                className="btn danger small"
                onClick={() => upd((d) => declineCollab2(d, collab.id, Date.now()))}
              >
                Decline
              </button>
            </RowOf>
          </>
        )}
        {collab.status === "applied" && (
          <div className="q">
            Pitched at {money(collab.ask || collab.rate)} {rateLabel(o)}. Waiting on {b.name}.
          </div>
        )}
        {(collab.status === "accepted" || collab.status === "changes") && (
          <>
            <div className="q">
              {collab.status === "changes" ? `Changes requested: “${collab.note || ""}”. ` : ""}
              {cr.handle} is creating. Due in {o.days} days. Code {collab.code}.
            </div>
            <button type="button" className="btn ghost small" onClick={checkIn}>
              <Icon name="msg" /> Check in with {cr.name.split(" ")[0]}
            </button>
          </>
        )}
        {collab.status === "submitted" && <div className="q">In review at {b.name}.</div>}
        {collab.status === "approved" && <div className="q">Approved. {cr.handle} is posting it.</div>}
        {collab.status === "live" && (
          <>
            <div className="q">
              {collab.paid
                ? `Paid ${money(payout2(state, collab))}.`
                : `Live. ${b.name} owes ${money(payout2(state, collab))}, due within 7 days.`}
            </div>
            <StatsBlock stats={collab.stats} code={collab.code} />
            {!collab.paid && (
              <button
                type="button"
                className="btn ghost small"
                style={{ marginTop: 10 }}
                onClick={() => store.notify(`Reminder sent to ${b.name} (demo). Deals keeps the record.`)}
              >
                <Icon name="shield" /> Send payment reminder
              </button>
            )}
          </>
        )}
      </div>
      <Sheet open={counterOpen} onClose={() => setCounterOpen(false)} title="Make a counter offer" sub={`Current: ${money(collab.ask || collab.rate)} ${rateLabel(o)}.`}>
        <Field label={`Your counter (${rateLabel(o)}, $)`}>
          <input className="in" type="number" min={1} inputMode="numeric" value={counterAmt} onChange={(e) => setCounterAmt(e.target.value)} />
        </Field>
        <SheetActions>
          <button type="button" className="btn ghost" onClick={() => setCounterOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const v = Math.round(parseFloat(counterAmt));
              if (!(v > 0)) return;
              upd((d) => counterCollab2(d, collab.id, v, "creator", Date.now()));
              setCounterOpen(false);
              store.notify("Counter sent.");
              store.demoReply(collab.id, (draft) => {
                const x = draft.collabs.filter((y) => y.id === collab.id)[0];
                if (x && x.status === "applied") {
                  x.rate = x.ask || x.rate;
                  x.status = "accepted";
                  x.ts = Date.now();
                }
              });
              setTimeout(() => store.notify(`Demo: ${b.name} accepted ${money(v)}.`), 2900);
            }}
          >
            Send counter
          </button>
        </SheetActions>
      </Sheet>
    </div>
  );
}

function PitchSheet({
  state,
  store,
  open,
  presetCreator,
  onClose,
}: {
  state: M2State;
  store: V2Store;
  open: boolean;
  presetCreator: string | null;
  onClose: () => void;
}) {
  const roster = state.agency.roster.map((id) => creatorById2(state, id));
  const openOpps = state.opps.filter((o) => o.status === "open");
  const [crId, setCrId] = useState(presetCreator || roster[0]?.id || "");
  const [oppId, setOppId] = useState(openOpps[0]?.id || "");
  const [rate, setRate] = useState("");
  const [msg, setMsg] = useState("");
  const cr = crId ? creatorById2(state, crId) : null;
  const o = oppId ? oppById2(state, oppId) : null;
  return (
    <Sheet open={open} onClose={onClose} title="Pitch your roster" sub="Pitch a roster creator to an open opportunity. The pitch carries their Creator Passport.">
      <Field label="Creator">
        <select className="in" value={crId} onChange={(e) => setCrId(e.target.value)}>
          {roster.map((c) => (
            <option key={c.id} value={c.id}>
              {c.handle} — {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Opportunity">
        <select className="in" value={oppId} onChange={(e) => setOppId(e.target.value)}>
          {openOpps.map((x) => (
            <option key={x.id} value={x.id}>
              {bizById2(state, x.biz).name} — {x.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Your ask (${o ? rateLabel(o) : "fee"}, $)`}>
        <input
          className="in"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder={cr ? String(cr.rate) : ""}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
      </Field>
      <Field label="Pitch">
        <textarea
          className="in"
          maxLength={600}
          placeholder={cr ? `${state.agency.name} here, pitching ${cr.handle}: ${fmtK(cr.followers)} followers, ${cr.eng ?? "—"}% engagement.` : ""}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!cr || !o) return;
            const ask = Math.round(parseFloat(rate)) || cr.rate || o.rate;
            store.update((d) => {
              pitchCollab2(d, o.id, cr.id, { ask, msg: msg.trim() || `Pitching ${cr.handle} for ${o.title}.` }, Date.now());
            });
            onClose();
            store.notify(`Pitched ${cr.handle} to ${bizById2(state, o.biz).name}.`);
          }}
        >
          Send pitch
        </button>
      </SheetActions>
    </Sheet>
  );
}

function AddCreatorSheet({
  state,
  store,
  open,
  onClose,
}: {
  state: M2State;
  store: V2Store;
  open: boolean;
  onClose: () => void;
}) {
  const candidates = [...state.creators, ...state.network].filter(
    (c) => state.agency.roster.indexOf(c.id) < 0
  );
  return (
    <Sheet open={open} onClose={onClose} title="Add a creator" sub="Creators you represent. Adding is a sample action on this device.">
      <div className="stack">
        {candidates.slice(0, 12).map((c) => (
          <div key={c.id} className="row">
            <Avatar label={c.handle} id={c.id} sm round />
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{c.handle}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {fmtK(c.followers)} followers · {c.area} · {money(c.rate)} per video
              </div>
            </div>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => {
                store.update((d) => {
                  if (d.agency.roster.indexOf(c.id) < 0) d.agency.roster.push(c.id);
                });
                store.notify(`${c.handle} added to your roster.`);
              }}
            >
              Add
            </button>
          </div>
        ))}
        {!candidates.length && <p>No creators left to add.</p>}
      </div>
      <SheetActions>
        <button type="button" className="btn primary" onClick={onClose}>
          Done
        </button>
      </SheetActions>
    </Sheet>
  );
}

function AgencySettingsSheet({
  state,
  store,
  open,
  onClose,
}: {
  state: M2State;
  store: V2Store;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(state.agency.name);
  const [fee, setFee] = useState(String(state.agency.fee));
  return (
    <Sheet open={open} onClose={onClose} title="Agency settings">
      <Field label="Agency name">
        <input className="in" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Your commission (%)" hint="The share of each roster deal your agency keeps.">
        <input className="in" type="number" min={0} max={100} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value)} />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            store.update((d) => {
              d.agency.name = name.trim() || d.agency.name;
              d.agency.fee = Math.max(0, Math.min(100, Math.round(parseFloat(fee) || 0)));
            });
            onClose();
            store.notify("Saved.");
          }}
        >
          Save
        </button>
      </SheetActions>
    </Sheet>
  );
}

// ---------------------------------------------------------------------
// BRAND VIEW — the brand dashboard (prototype renderBrandDash)
// ---------------------------------------------------------------------

function BrandDash() {
  const store = useMarket2Store();
  const { state, toast } = store;
  const [ambFor, setAmbFor] = useState<string | null>(null);
  if (!state) return null;
  const br = bizById2(state, state.myBrand);
  const all = brandCollabs2(state);
  const live = all.filter((c) => c.stats);
  const st = sumStats2(live);
  const spend = spendOf2(state, all);
  const openOpps = state.opps.filter((o) => o.biz === state.myBrand && o.status === "open");

  const tiers = new Map<string, { n: number; rev: number; spend: number }>();
  live.forEach((c) => {
    const t = tierOf(creatorById2(state, c.cr).followers);
    const x = tiers.get(t) || { n: 0, rev: 0, spend: 0 };
    x.n++;
    x.rev += c.stats!.revenue;
    x.spend += payout2(state, c);
    tiers.set(t, x);
  });
  const tierKeys = ["Nano", "Micro", "Mid"].filter((t) => tiers.has(t));
  const best = [...tierKeys].sort(
    (a, b) => tiers.get(b)!.rev / tiers.get(b)!.spend - tiers.get(a)!.rev / tiers.get(a)!.spend
  );

  const cities = new Map<string, number>();
  live.forEach((c) => {
    const a = creatorById2(state, c.cr).area;
    cities.set(a, (cities.get(a) || 0) + c.stats!.revenue);
  });
  const cityKeys = [...cities.entries()].sort((a, b) => b[1] - a[1]);

  const topPerf = [...live]
    .sort((a, b) => b.stats!.revenue / payout2(state, b) - a.stats!.revenue / payout2(state, a))
    .slice(0, 5);

  return (
    <>
      <SampleBanner onReset={store.reset} />
      <HeaderRow label={br.name} id={br.id} sub={`Brand · ${br.cat} · Nationwide`} />
      <SectionHead title="All campaigns" />
      <KpiGrid
        items={[
          [fmtK(st.views), "Reach"],
          [fmtK(st.customers), "Sales"],
          [money(st.revenue), "Revenue"],
          [money(spend), "Creator fees"],
          [roiText(st.revenue, spend), "Return", "var(--m-cyan)"],
          [String(live.length), "Creators posted"],
        ]}
      />

      {openOpps.map((o) => {
        const cs = all.filter((c) => c.opp === o.id);
        const conf = cs.filter((c) => /accepted|submitted|changes|approved|live/.test(c.status)).length;
        const todo = cs.filter((c) => /applied|submitted/.test(c.status)).length;
        const invites = cs.filter((c) => c.status === "invited").length;
        return (
          <div key={o.id}>
            <SectionHead title="Running now" />
            <div className="glass pad">
              <div style={{ font: "700 17px var(--m-display)" }}>{o.title}</div>
              <div className="faint" style={{ fontSize: 13, margin: "4px 0 10px" }}>
                {conf} of {o.spots} creators confirmed · {invites} invites out
              </div>
              <Progress frac={o.spots ? conf / o.spots : 0} />
              <RowOf>
                <span style={{ marginTop: 12, display: "inline-flex" }}>
                  <Link href="/business/campaigns" className="btn primary small">
                    {todo ? `Review ${todo}` : "Manage"}
                  </Link>
                </span>
                <span style={{ marginTop: 12, display: "inline-flex" }}>
                  <Link href="/business/creators" className="btn ghost small">
                    <Icon name="users" /> Invite creators
                  </Link>
                </span>
              </RowOf>
            </div>
          </div>
        );
      })}

      {tierKeys.length > 0 && (
        <>
          <SectionHead title="Which creators pay off" right="Return per $1" />
          <BarList
            rows={tierKeys.map((t) => {
              const x = tiers.get(t)!;
              return {
                label: t,
                value: x.spend ? x.rev / x.spend : 0,
                text: roiText(x.rev, x.spend),
                sub: `${x.n} creators · ${money(x.rev)} from ${money(x.spend)}`,
                color: t === "Nano" ? "#F5C451" : t === "Micro" ? "#B69CFF" : "#9DB8FF",
              };
            })}
          />
          {best.length > 1 && (
            <div className="glass pad" style={{ marginTop: 10 }}>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--m-text2)", margin: 0 }}>
                <b style={{ color: "var(--m-gold)" }}>
                  {best[0]} creators returned {roiText(tiers.get(best[0])!.rev, tiers.get(best[0])!.spend)}
                </b>{" "}
                for every dollar, versus {roiText(tiers.get(best[best.length - 1])!.rev, tiers.get(best[best.length - 1])!.spend)} for{" "}
                {best[best.length - 1]}.{" "}
                {best[0] === "Nano"
                  ? "Smaller creators with engaged audiences are your best value."
                  : "Lean into this tier for your next campaign."}
              </p>
            </div>
          )}
        </>
      )}

      {cityKeys.length > 0 && (
        <>
          <SectionHead title="Revenue by city" />
          <BarList
            rows={cityKeys.map(([city, rev], i) => ({
              label: city,
              value: rev,
              text: money(rev),
              color: COLORS[i % COLORS.length],
            }))}
          />
        </>
      )}

      <SectionHead title="Top performers" />
      <div className="glass list">
        {topPerf.map((c) => {
          const cr = creatorById2(state, c.cr);
          const amb = isAmbassador2(state, cr.id);
          return (
            <div key={c.id} className="li" style={{ cursor: "default" }}>
              <Avatar label={cr.handle} id={cr.id} sm round />
              <div className="grow">
                <div className="t">{cr.handle}</div>
                <div className="s">
                  {tierOf(cr.followers)} · {cr.area} · {c.stats!.customers} sales · {roiText(c.stats!.revenue, payout2(state, c))} return
                </div>
              </div>
              {amb ? (
                <span className="tag t-gold">Ambassador</span>
              ) : (
                <button type="button" className="btn ghost small" onClick={() => setAmbFor(cr.id)}>
                  Make ambassador
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Link href="/business/campaigns" className="btn gold block" style={{ marginTop: 18 }}>
        <Icon name="plus" /> Launch a campaign
      </Link>
      <p className="note">Sales and revenue come from each creator’s promo code and link. Numbers here are sample data.</p>

      <AmbassadorSheet state={state} store={store} creatorId={ambFor} onClose={() => setAmbFor(null)} />
      <ToastView msg={toast} />
    </>
  );
}

function AmbassadorSheet({
  state,
  store,
  creatorId,
  onClose,
}: {
  state: M2State;
  store: V2Store;
  creatorId: string | null;
  onClose: () => void;
}) {
  const [retainer, setRetainer] = useState("500");
  const [posts, setPosts] = useState("4");
  const [months, setMonths] = useState("6");
  const cr = creatorId ? creatorById2(state, creatorId) : null;
  return (
    <Sheet
      open={!!creatorId}
      onClose={onClose}
      title={cr ? `Make ${cr.handle} an ambassador` : "Make ambassador"}
      sub="Ambassadors post every month on a retainer. Sample action on this device."
    >
      <Field label="Monthly retainer ($)">
        <input className="in" type="number" min={0} inputMode="numeric" value={retainer} onChange={(e) => setRetainer(e.target.value)} />
      </Field>
      <Field label="Posts per month">
        <input className="in" type="number" min={1} inputMode="numeric" value={posts} onChange={(e) => setPosts(e.target.value)} />
      </Field>
      <Field label="Months">
        <input className="in" type="number" min={1} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!cr) return;
            store.update((d) => {
              d.ambassadors.push({
                cr: cr.id,
                retainer: Math.max(0, Math.round(parseFloat(retainer) || 0)),
                posts: Math.max(1, Math.round(parseFloat(posts) || 1)),
                start: Date.now(),
                months: Math.max(1, Math.round(parseFloat(months) || 1)),
              });
            });
            onClose();
            store.notify(`${cr.handle} is now an ambassador.`);
          }}
        >
          Make ambassador
        </button>
      </SheetActions>
    </Sheet>
  );
}
