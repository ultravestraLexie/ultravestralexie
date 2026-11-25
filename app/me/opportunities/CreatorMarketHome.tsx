"use client";

import { useState } from "react";
import Link from "next/link";
import { MKT_CSS } from "@/lib/marketplace-css";
import { MKT2_CSS } from "@/lib/marketplace2-css";
import {
  Avatar,
  Field,
  Icon,
  Ring,
  SampleBanner,
  Sheet,
  SheetActions,
  StatsBlock,
  Stepper,
  ToastView,
} from "@/components/marketplace/Mkt";
import { KpiGrid, RowOf, SectionHead, useMarket2Store } from "@/components/marketplace2/Mkt2";
import {
  CATS,
  STATUS,
  ago,
  fmtK,
  money,
  payText,
  potentialOf,
  rateLabel,
} from "@/lib/marketplace";
import {
  acceptCollab2,
  applyToOpp2,
  bizById2,
  collabOf2,
  counterCollab2,
  creatorById2,
  declineCollab2,
  locText2,
  matchOpp2,
  oppById2,
  payout2,
  postCollab2,
  submitCollab2,
  type M2Collab,
  type M2Opp,
  type M2State,
} from "@/lib/marketplace2";
import MarketProfileClient from "./MarketProfileClient";

type Store = ReturnType<typeof useMarket2Store>;
type Tab = "discover" | "collabs" | "profile";

/* The creator's opportunities home (owner order 2026-11-24, the v2
 * prototype): Discover (business opportunities with match rings),
 * opportunity detail + apply, My collabs, and the gig Profile —
 * the prototype's three creator tabs as an in-page tab row over the
 * device-local v2 store. Sample data only; nothing here writes to
 * the database. */

export default function CreatorMarketHome() {
  const store = useMarket2Store();
  const { state, toast } = store;
  const [tab, setTab] = useState<Tab>("discover");
  const [oppId, setOppId] = useState<string | null>(null);

  const activeCount = state
    ? state.collabs.filter(
        (c) => c.cr === "me" && /invited|countered|accepted|changes|approved/.test(c.status)
      ).length
    : 0;

  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <style>{MKT2_CSS}</style>
      <div className="mkt-col">
        <Link href="/me" className="back" style={{ textDecoration: "none" }}>
          ← Me
        </Link>
        {state ? (
          <>
            <SampleBanner onReset={store.reset} />
            <div className="tabrow" role="group" aria-label="Market sections">
              <button type="button" className="chip" aria-pressed={tab === "discover"} onClick={() => { setTab("discover"); setOppId(null); }}>
                <Icon name="search" /> Discover
              </button>
              <button type="button" className="chip" aria-pressed={tab === "collabs"} onClick={() => setTab("collabs")}>
                <Icon name="video" /> My collabs
                {activeCount ? <span className="n">{activeCount}</span> : null}
              </button>
              <button type="button" className="chip" aria-pressed={tab === "profile"} onClick={() => setTab("profile")}>
                <Icon name="user" /> Profile
              </button>
            </div>
            {tab === "discover" &&
              (oppId ? (
                <OppDetail state={state} store={store} oppId={oppId} onBack={() => setOppId(null)} goCollabs={() => setTab("collabs")} />
              ) : (
                <Discover state={state} onOpen={(id) => setOppId(id)} />
              ))}
            {tab === "collabs" && <MyCollabs state={state} store={store} goDiscover={() => { setTab("discover"); setOppId(null); }} />}
            {tab === "profile" && (
              <>
                <h1 className="title">Your match profile</h1>
                <p className="sub">
                  This is how we match you with businesses. In the app it comes from your Creator Passport.
                </p>
                <MarketProfileClient embedded />
              </>
            )}
          </>
        ) : null}
        <ToastView msg={toast} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DISCOVER
// ---------------------------------------------------------------------

function Discover({ state, onOpen }: { state: M2State; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const [fit, setFit] = useState(false);
  const [sort, setSort] = useState("match");
  const me = creatorById2(state, "me");
  const open = state.opps.filter((o) => o.status === "open" && o.biz);
  const cats = ["All", ...CATS].filter(
    (c) => c === "All" || open.some((o) => bizById2(state, o.biz).cat === c)
  );
  const countFor = (c: string) =>
    c === "All" ? open.length : open.filter((o) => bizById2(state, o.biz).cat === c).length;

  const list = open
    .filter((o) => filter === "All" || bizById2(state, o.biz).cat === filter)
    .map((o) => ({ o, m: matchOpp2(state, o, me) }))
    .filter((x) => !fit || !x.m.warn)
    .sort((a, b) => {
      if (sort === "pay") return potentialOf(b.o) - potentialOf(a.o);
      if (sort === "dist") return bizById2(state, a.o.biz).dist - bizById2(state, b.o.biz).dist;
      if (sort === "new") return b.o.posted - a.o.posted;
      return b.m.score - a.m.score;
    });

  return (
    <>
      <h1 className="title">Business opportunities</h1>
      <p className="sub">Local businesses looking for creators like you. Small audiences welcome.</p>
      <div className="chips" role="group" aria-label="Filter by category">
        {cats.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
            {c}
            <span className="n">{countFor(c)}</span>
          </button>
        ))}
      </div>
      <div className="row wrap" style={{ marginTop: 10 }}>
        <button type="button" className="chip" aria-pressed={fit} onClick={() => setFit(!fit)}>
          Fits my audience size
        </button>
        <select
          className="in"
          aria-label="Sort opportunities"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ width: "auto", minHeight: 40, borderRadius: 999, fontSize: 13, marginLeft: "auto" }}
        >
          <option value="match">Best match</option>
          <option value="pay">Highest pay</option>
          <option value="dist">Closest</option>
          <option value="new">Newest</option>
        </select>
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {!list.length && <div className="glass empty">No opportunities match these filters right now.</div>}
        {list.map(({ o, m }) => (
          <OppCard key={o.id} state={state} opp={o} score={m.score} warn={m.warn} onOpen={onOpen} />
        ))}
      </div>
    </>
  );
}

function OppCard({
  state,
  opp,
  score,
  warn,
  onOpen,
}: {
  state: M2State;
  opp: M2Opp;
  score: number;
  warn: string | null;
  onOpen: (id: string) => void;
}) {
  const b = bizById2(state, opp.biz);
  const c = collabOf2(state, opp.id, "me");
  return (
    <button type="button" className="glass opp" onClick={() => onOpen(opp.id)}>
      <div className="row">
        <Avatar label={b.name} id={b.id} />
        <div className="grow">
          <div className="biz">{b.name}</div>
          <div className="meta">{locText2(b)}</div>
        </div>
        <Ring score={score} />
      </div>
      <h3>{opp.title}</h3>
      <div className="pay">{payText(opp)}</div>
      <div className="tags">
        {c && <span className={`tag ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>}
        {opp.minF === 0 ? (
          <span className="tag t-gold">Any size welcome</span>
        ) : (
          <span className={`tag ${warn ? "t-orange" : "t-faint"}`}>{fmtK(opp.minF)}+ followers</span>
        )}
        <span className="tag t-purple">Fans get {opp.offer.toLowerCase()}</span>
        <span className="tag t-faint">
          {opp.days} days · {opp.spots} spot{opp.spots === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------
// OPPORTUNITY DETAIL + APPLY
// ---------------------------------------------------------------------

function OppDetail({
  state,
  store,
  oppId,
  onBack,
  goCollabs,
}: {
  state: M2State;
  store: Store;
  oppId: string;
  onBack: () => void;
  goCollabs: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const o = oppById2(state, oppId);
  if (!o) return null;
  const b = bizById2(state, o.biz);
  const me = creatorById2(state, "me");
  const m = matchOpp2(state, o, me);
  const c = collabOf2(state, o.id, "me");
  const briefRows: [string, string][] = [
    ["Deliverables", `${o.videos} video${o.videos > 1 ? "s" : ""} for ${o.platforms.join(", ")}`],
    ["Goal", o.goal],
    ["Your fans get", `${o.offer} with your personal code`],
    ["Usage", o.rights],
    ["Deadline", `${o.days} days after you’re accepted`],
    ["Spots", `${o.spots} creator${o.spots === 1 ? "" : "s"}`],
  ];
  const protection: [string, string, string][] = [
    ["link", "Your own tracking link and promo code", "Every view, click and customer you bring is counted and credited to you."],
    ["shield", "The agreement is saved in Deals", "Rate, deliverables and due date are recorded. You get reminders if payment is late."],
    ["star", "Results build your Passport", "Approved collabs and the customers you brought show on your Creator Passport."],
  ];
  return (
    <>
      <button type="button" className="back" onClick={onBack}>
        <Icon name="back" /> Opportunities
      </button>
      <div className="row" style={{ marginTop: 6 }}>
        <Avatar label={b.name} id={b.id} />
        <div className="grow">
          <div className="biz" style={{ fontWeight: 700 }}>{b.name}</div>
          <div className="faint" style={{ fontSize: 13 }}>{locText2(b)}</div>
        </div>
      </div>
      <h1 className="title">{o.title}</h1>
      <div className="glass pad">
        <div className="label">You earn</div>
        <div style={{ font: "700 24px var(--m-display)", color: "var(--m-gold)", marginTop: 6 }}>{payText(o)}</div>
        {o.model === "perResult" && (
          <div className="muted" style={{ fontSize: 13 }}>
            Every {o.unit} from your code adds {money(o.per || 0)}. 10 would make it {money(o.rate + (o.per || 0) * 10)}.
          </div>
        )}
        {o.model === "productFee" && (
          <div className="muted" style={{ fontSize: 13 }}>Plus {o.product} to keep.</div>
        )}
        <div className="grid3" style={{ marginTop: 14 }}>
          {[
            [`${b.rating.toFixed(1)}★`, "Creator rating"],
            [String(b.done), "Collabs done"],
            [`${b.onTime}%`, "Paid on time"],
          ].map(([v, l]) => (
            <div key={l} className="glass" style={{ padding: 10, textAlign: "center", borderRadius: 14 }}>
              <b style={{ display: "block", font: "700 16px var(--m-display)" }}>{v}</b>
              <span className="faint" style={{ fontSize: 11 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <SectionHead title="Why you match" right={`${m.score}% match`} />
      <div className="glass list">
        {m.reasons.map((r) => (
          <div key={r} className="li" style={{ cursor: "default" }}>
            <Icon name="check" className="i" />
            <div className="t" style={{ fontSize: 14 }}>{r}</div>
          </div>
        ))}
        {m.warn && (
          <div className="li" style={{ cursor: "default" }}>
            <span className="tag t-orange">Heads up</span>
            <div className="t" style={{ fontSize: 14 }}>{m.warn}. You can still apply with a strong pitch.</div>
          </div>
        )}
      </div>

      <SectionHead title="The brief" />
      <div className="glass pad">
        <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.6, color: "var(--m-text2)" }}>{o.brief}</p>
        {briefRows.map(([k, v]) => (
          <div
            key={k}
            className="row"
            style={{ justifyContent: "space-between", padding: "9px 0", borderTop: "1px solid var(--m-line)", fontSize: 14, alignItems: "flex-start" }}
          >
            <span className="faint">{k}</span>
            <span style={{ textAlign: "right", fontWeight: 600, maxWidth: "65%" }}>{v}</span>
          </div>
        ))}
      </div>

      <SectionHead title="How you’re protected" />
      <div className="glass list">
        {protection.map(([ic, t, s]) => (
          <div key={t} className="li" style={{ cursor: "default" }}>
            <Icon name={ic} className="i" />
            <div className="grow">
              <div className="t" style={{ fontSize: 14 }}>{t}</div>
              <div className="s">{s}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {c ? (
          <>
            <div className="glass empty">You’re in: {STATUS[c.status][0].toLowerCase()}. Track it in My collabs.</div>
            <button type="button" className="btn primary block" style={{ marginTop: 10 }} onClick={goCollabs}>
              Open My collabs
            </button>
          </>
        ) : (
          <button type="button" className="btn gold block" onClick={() => setApplying(true)}>
            <Icon name="arrow" /> Apply for this opportunity
          </button>
        )}
      </div>

      <ApplySheet state={state} store={store} opp={o} open={applying} onClose={() => setApplying(false)} goCollabs={goCollabs} />
    </>
  );
}

function ApplySheet({
  state,
  store,
  opp,
  open,
  onClose,
  goCollabs,
}: {
  state: M2State;
  store: Store;
  opp: M2Opp;
  open: boolean;
  onClose: () => void;
  goCollabs: () => void;
}) {
  const b = bizById2(state, opp.biz);
  const me = creatorById2(state, "me");
  const [pitch, setPitch] = useState(
    `Hi ${b.name}! I’m ${me.handle}, a ${me.niches[0].toLowerCase()} creator in ${me.area}. My audience is local and engaged, and I’d love to show them ${opp.title.toLowerCase()}. I can deliver within ${opp.days} days.`
  );
  const [own, setOwn] = useState(false);
  const [ask, setAsk] = useState(String(Math.max(opp.rate, me.rate)));
  const [passport, setPassport] = useState(true);
  return (
    <Sheet open={open} onClose={onClose} title={`Apply to ${b.name}`} sub="A short, specific pitch wins. Say why your audience will love them.">
      <Field label="Your pitch">
        <textarea className="in" maxLength={600} value={pitch} onChange={(e) => setPitch(e.target.value)} />
      </Field>
      <label className="check">
        <input type="radio" name="rate" checked={!own} onChange={() => setOwn(false)} />
        Accept their offer: {payText(opp, true)}
      </label>
      <label className="check">
        <input type="radio" name="rate" checked={own} onChange={() => setOwn(true)} />
        Propose my own rate
      </label>
      <Field label={`Your rate (${rateLabel(opp)}, $)`} hint="Tip: creators who explain their rate with results get more yeses.">
        <input className="in" type="number" min={0} max={100000} inputMode="numeric" disabled={!own} value={ask} onChange={(e) => setAsk(e.target.value)} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={passport} onChange={(e) => setPassport(e.target.checked)} />
        Attach my Creator Passport (portfolio, audience, past results)
      </label>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            const rate = own ? Math.round(parseFloat(ask)) : opp.rate;
            if (!(rate > 0)) {
              store.notify("Enter your rate.");
              return;
            }
            let created: M2Collab | null = null;
            store.update((draft) => {
              created = applyToOpp2(draft, opp.id, { ask: rate, msg: pitch.trim(), passport }, Date.now());
            });
            onClose();
            if (opp.biz === state.myBiz || opp.biz === state.myBrand) {
              store.notify(`Sent! Switch to ${opp.biz === state.myBrand ? "Brand" : "Business"} view to answer it as ${b.name}.`);
            } else {
              store.notify(`Application sent to ${b.name}.`);
              if (created) {
                const cid = (created as M2Collab).id;
                store.demoReply(cid, (draft) => {
                  const x = draft.collabs.filter((y) => y.id === cid)[0];
                  if (x && x.status === "applied") {
                    x.rate = x.ask || x.rate;
                    x.status = "accepted";
                    x.ts = Date.now();
                  }
                });
                setTimeout(() => store.notify(`Demo: ${b.name} accepted at ${money(rate)}. Time to create!`), 2900);
              }
            }
            goCollabs();
          }}
        >
          Send application
        </button>
      </SheetActions>
    </Sheet>
  );
}

// ---------------------------------------------------------------------
// MY COLLABS
// ---------------------------------------------------------------------

function MyCollabs({ state, store, goDiscover }: { state: M2State; store: Store; goDiscover: () => void }) {
  const now = Date.now();
  const mine = state.collabs.filter((c) => c.cr === "me");
  const earned = mine.filter((c) => c.paid).reduce((s, c) => s + payout2(state, c), 0);
  const pending = mine
    .filter((c) => !c.paid && /approved|live/.test(c.status))
    .reduce((s, c) => s + payout2(state, c), 0);
  const brought = mine.reduce((s, c) => s + ((c.stats && c.stats.customers) || 0), 0);
  const active = mine
    .filter((c) => c.status !== "declined" && !(c.status === "live" && c.paid))
    .sort((a, b2) => b2.ts - a.ts);
  const done = mine.filter((c) => c.status === "live" && c.paid);
  const dec = mine.filter((c) => c.status === "declined");
  return (
    <>
      <h1 className="title">My collabs</h1>
      <p className="sub">Everything you’re working on, from pitch to payday.</p>
      <KpiGrid
        items={[
          [money(earned), "Earned"],
          [money(pending), "On the way"],
          [String(brought), "Customers you brought"],
        ]}
      />
      <SectionHead title="In progress" right={active.length ? String(active.length) : ""} />
      {!active.length && (
        <div className="glass empty">
          Nothing in progress. Find your next opportunity.
          <div style={{ height: 10 }} />
          <button type="button" className="btn primary small" onClick={goDiscover}>
            Discover opportunities
          </button>
        </div>
      )}
      {active.map((c) => (
        <CreatorCollabCard key={c.id} state={state} store={store} collab={c} now={now} />
      ))}
      {done.length > 0 && (
        <>
          <SectionHead title="Completed" right={String(done.length)} />
          {done.map((c) => (
            <CreatorCollabCard key={c.id} state={state} store={store} collab={c} now={now} />
          ))}
        </>
      )}
      {dec.length > 0 && (
        <>
          <SectionHead title="Declined" />
          {dec.map((c) => (
            <CreatorCollabCard key={c.id} state={state} store={store} collab={c} now={now} />
          ))}
        </>
      )}
    </>
  );
}

function CreatorCollabCard({
  state,
  store,
  collab,
  now,
}: {
  state: M2State;
  store: Store;
  collab: M2Collab;
  now: number;
}) {
  const [sheet, setSheet] = useState<null | "counter" | "submit" | "post">(null);
  const o = oppById2(state, collab.opp);
  const b = bizById2(state, o.biz);
  const you = o.biz === state.myBiz || o.biz === state.myBrand;
  const upd = (fn: (draft: M2State) => void) => store.update(fn);
  const demoAccept = (delay?: number) =>
    store.demoReply(
      collab.id,
      (draft) => {
        const x = draft.collabs.filter((y) => y.id === collab.id)[0];
        if (x && (x.status === "applied" || x.status === "countered")) {
          x.rate = x.ask || x.rate;
          x.status = "accepted";
          x.ts = Date.now();
        }
      },
      delay
    );

  return (
    <div className="glass collab">
      <div className="head">
        <Avatar label={b.name} id={b.id} sm />
        <div className="grow">
          <div className="t">{o.title}</div>
          <div className="s">
            {b.name} ·{" "}
            {collab.status === "live" || collab.status === "approved" || collab.status === "accepted"
              ? money(payout2(state, collab)) + (o.model === "perResult" ? " so far" : "")
              : payText(o, true)}{" "}
            · {ago(collab.ts, now)}
          </div>
        </div>
        <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
          <span className={`tag ${STATUS[collab.status][1]}`}>{STATUS[collab.status][0]}</span>
          {collab.paid && <span className="tag t-gold">Paid</span>}
        </div>
      </div>
      {collab.status !== "declined" && <Stepper collab={collab} />}
      <div className="next">
        {collab.status === "invited" && (
          <>
            <div className="q">
              {b.name} invited you at {money(collab.ask || collab.rate)} {rateLabel(o)}. Want it?
            </div>
            <RowOf>
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  upd((d) => acceptCollab2(d, collab.id, Date.now()));
                  store.notify("Accepted! Create your video.");
                }}
              >
                Accept
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
            Waiting for {b.name} to reply. You asked {money(collab.ask || collab.rate)} {rateLabel(o)}.
          </div>
        )}
        {collab.status === "countered" && (
          <>
            <div className="q">
              {b.name} countered with {money(collab.ask || collab.rate)} {rateLabel(o)}.
            </div>
            <RowOf>
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  upd((d) => acceptCollab2(d, collab.id, Date.now()));
                  store.notify("Deal! It’s saved in Deals.");
                }}
              >
                Accept {money(collab.ask || collab.rate)}
              </button>
              <button type="button" className="btn ghost small" onClick={() => setSheet("counter")}>
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
        {(collab.status === "accepted" || collab.status === "changes") && (
          <>
            <div className="q">
              {collab.status === "changes"
                ? `Changes requested: “${collab.note || "Please revise."}”`
                : `Create your video. Your fans get ${o.offer.toLowerCase()} with code ${collab.code}.`}
            </div>
            <button type="button" className="btn gold small" onClick={() => setSheet("submit")}>
              <Icon name="video" /> {collab.status === "changes" ? "Submit new version" : "Submit my video"}
            </button>
          </>
        )}
        {collab.status === "submitted" && <div className="q">In review at {b.name}. You’ll hear back soon.</div>}
        {collab.status === "approved" && (
          <>
            <div className="q">Approved! Post it, then add the link so your results start counting.</div>
            <button type="button" className="btn gold small" onClick={() => setSheet("post")}>
              <Icon name="check" /> I posted it
            </button>
          </>
        )}
        {collab.status === "live" && (
          <>
            <div className="q">
              {collab.paid
                ? `Paid ${money(payout2(state, collab))}. These results are on your Passport.`
                : `Live and tracking. Payment of ${money(payout2(state, collab))} is due within 7 days.`}
            </div>
            <StatsBlock stats={collab.stats} code={collab.code} note />
          </>
        )}
        {collab.status === "declined" && <div className="q">This one didn’t work out. Plenty more in Discover.</div>}
      </div>

      <CounterSheet
        state={state}
        collab={collab}
        open={sheet === "counter"}
        onClose={() => setSheet(null)}
        onSend={(v) => {
          upd((d) => counterCollab2(d, collab.id, v, "creator", Date.now()));
          setSheet(null);
          store.notify("Counter sent.");
          if (!you) demoAccept();
          if (!you) setTimeout(() => store.notify(`Demo: ${b.name} accepted your counter.`), 2900);
        }}
      />
      <SubmitSheet
        state={state}
        collab={collab}
        open={sheet === "submit"}
        onClose={() => setSheet(null)}
        onSend={(video, caption) => {
          upd((d) => submitCollab2(d, collab.id, { video, caption }, Date.now()));
          setSheet(null);
          if (you) {
            store.notify("Submitted! Switch to Business view to review it.");
          } else {
            store.notify(`Submitted to ${b.name}.`);
            store.demoReply(collab.id, (draft) => {
              const x = draft.collabs.filter((y) => y.id === collab.id)[0];
              if (x && x.status === "submitted") {
                x.status = "approved";
                x.ts = Date.now();
              }
            });
            setTimeout(() => store.notify(`Demo: ${b.name} approved your video. Post it!`), 2900);
          }
        }}
      />
      <PostSheet
        collab={collab}
        open={sheet === "post"}
        onClose={() => setSheet(null)}
        onSend={(post) => {
          upd((d) => postCollab2(d, collab.id, post, Date.now()));
          setSheet(null);
          if (you) {
            store.notify("Live! Switch to Business view to see results and pay.");
          } else {
            store.notify("Live! Results are tracking.");
            store.demoReply(
              collab.id,
              (draft) => {
                const x = draft.collabs.filter((y) => y.id === collab.id)[0];
                if (x && x.status === "live" && !x.paid) {
                  x.paid = true;
                  x.paidAt = Date.now();
                }
              },
              3500
            );
            setTimeout(() => store.notify(`Demo: ${b.name} paid you. On time.`), 3800);
          }
        }}
      />
    </div>
  );
}

function CounterSheet({
  state,
  collab,
  open,
  onClose,
  onSend,
}: {
  state: M2State;
  collab: M2Collab;
  open: boolean;
  onClose: () => void;
  onSend: (v: number) => void;
}) {
  const o = oppById2(state, collab.opp);
  const [amount, setAmount] = useState(String(collab.ask || collab.rate));
  return (
    <Sheet open={open} onClose={onClose} title="Make a counter offer" sub={`Current: ${money(collab.ask || collab.rate)} ${rateLabel(o)}.`}>
      <Field label={`Your counter (${rateLabel(o)}, $)`}>
        <input className="in" type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            const v = Math.round(parseFloat(amount));
            if (!(v > 0)) return;
            onSend(v);
          }}
        >
          Send counter
        </button>
      </SheetActions>
    </Sheet>
  );
}

function SubmitSheet({
  state,
  collab,
  open,
  onClose,
  onSend,
}: {
  state: M2State;
  collab: M2Collab;
  open: boolean;
  onClose: () => void;
  onSend: (video: string, caption: string) => void;
}) {
  const o = oppById2(state, collab.opp);
  const b = bizById2(state, o.biz);
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState(
    `Found my new favorite spot 🙌 ${o.offer} with my code ${collab.code} at ${b.name}.`
  );
  const [disc, setDisc] = useState(true);
  return (
    <Sheet open={open} onClose={onClose} title="Submit your video" sub={`${b.name} reviews it before you post. Share a private link or draft.`}>
      <Field label="Video link" hint="A Google Drive, Dropbox or private post link works.">
        <input className="in" type="url" maxLength={300} placeholder="Link to your video or draft" value={link} onChange={(e) => setLink(e.target.value)} />
      </Field>
      <Field label="Caption">
        <textarea className="in" maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={disc} onChange={(e) => setDisc(e.target.checked)} />
        I’ll label it as a paid partnership (#ad), as the law and platforms require
      </label>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!link.trim()) return;
            if (!disc) return;
            onSend(link.trim(), caption.trim());
          }}
        >
          Submit for review
        </button>
      </SheetActions>
    </Sheet>
  );
}

function PostSheet({
  collab,
  open,
  onClose,
  onSend,
}: {
  collab: M2Collab;
  open: boolean;
  onClose: () => void;
  onSend: (post: string) => void;
}) {
  const [link, setLink] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Add your live post" sub="Tracking starts as soon as you add the link.">
      <Field label="Post link">
        <input className="in" type="url" maxLength={300} placeholder="Link to the live post" value={link} onChange={(e) => setLink(e.target.value)} />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!link.trim()) return;
            onSend(link.trim());
          }}
        >
          Start tracking
        </button>
      </SheetActions>
    </Sheet>
  );
}
