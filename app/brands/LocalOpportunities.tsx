"use client";

import { useMemo, useState } from "react";
import { MKT_CSS } from "@/lib/marketplace-css";
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
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  CATS,
  STATUS,
  acceptCollab,
  ago,
  applyToOpp,
  bizById,
  collabOf,
  counterCollab,
  creatorById,
  declineCollab,
  fmtK,
  matchOpp,
  money,
  oppById,
  payText,
  payout,
  postCollab,
  potentialOf,
  rateLabel,
  setCollabStatus,
  submitCollab,
  type MarketCollab,
  type MarketOpp,
  type MarketState,
} from "@/lib/marketplace";

/* LOCAL OPPORTUNITIES — the creator side of the owner's local-gigs
 * feature, inside the Brands page below the directory (2026-11-24).
 * The prototype's Discover feed, opportunity detail, apply/counter
 * flow and My collabs status machine, ported faithfully onto the
 * device-local store (lib/marketplace.ts). Sample data is the
 * prototype's seed, labeled SAMPLE by the banner. NOTHING here
 * writes to creator_deals or any database table — Deals and Money
 * stay real-data only.
 *
 * Two prototype lines changed for honesty in this app: the detail
 * page's protection list no longer claims the agreement is "saved
 * in Deals" or that results "build your Passport" — sample collabs
 * do neither; the terms and results live with the collab, on this
 * device, and the copy says exactly that. */

type SheetState =
  | { kind: "apply"; oppId: string }
  | { kind: "counter"; collabId: string }
  | { kind: "submit"; collabId: string }
  | { kind: "post"; collabId: string }
  | null;

export default function LocalOpportunities() {
  const store = useMarketStore();
  const { state, notify, toast } = store;
  const [tab, setTab] = useState<"discover" | "collabs">("discover");
  const [oppId, setOppId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [fit, setFit] = useState(false);
  const [sort, setSort] = useState("match");
  const [sheet, setSheet] = useState<SheetState>(null);

  if (!state) return null;
  const myCollabCount = state.collabs.filter(
    (c) => c.cr === "me" && /invited|countered|accepted|changes|approved/.test(c.status)
  ).length;

  return (
    <section aria-label="Local opportunities" style={{ marginTop: 56 }}>
      <div className="mkt">
        <style>{MKT_CSS}</style>
        <SampleBanner onReset={store.reset} />
        <h2 className="title" style={{ fontSize: 24 }}>
          Local opportunities
        </h2>
        <p className="sub">
          Local businesses looking for creators like you. Small audiences
          welcome.
        </p>
        <div className="chips" role="group" aria-label="Local opportunities views">
          <button
            type="button"
            className="chip"
            aria-pressed={tab === "discover" && !oppId}
            onClick={() => {
              setTab("discover");
              setOppId(null);
            }}
          >
            Discover
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={tab === "collabs"}
            onClick={() => {
              setTab("collabs");
              setOppId(null);
            }}
          >
            My collabs
            {myCollabCount ? <span className="n">{myCollabCount}</span> : null}
          </button>
        </div>

        {oppId ? (
          <OppDetail
            state={state}
            oppId={oppId}
            onBack={() => setOppId(null)}
            onApply={(id) => setSheet({ kind: "apply", oppId: id })}
            onOpenCollabs={() => {
              setOppId(null);
              setTab("collabs");
            }}
          />
        ) : tab === "discover" ? (
          <Discover
            state={state}
            filter={filter}
            setFilter={setFilter}
            fit={fit}
            setFit={setFit}
            sort={sort}
            setSort={setSort}
            onOpen={setOppId}
          />
        ) : (
          <MyCollabs
            state={state}
            store={store}
            setSheet={setSheet}
            onDiscover={() => setTab("discover")}
          />
        )}

        <Sheets state={state} store={store} sheet={sheet} setSheet={setSheet} />
        <ToastView msg={toast} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Discover
// ---------------------------------------------------------------------

function Discover({
  state,
  filter,
  setFilter,
  fit,
  setFit,
  sort,
  setSort,
  onOpen,
}: {
  state: MarketState;
  filter: string;
  setFilter: (v: string) => void;
  fit: boolean;
  setFit: (v: boolean) => void;
  sort: string;
  setSort: (v: string) => void;
  onOpen: (id: string) => void;
}) {
  const me = creatorById(state, "me");
  const open = state.opps.filter((o) => o.status === "open" && o.biz);
  const list = useMemo(() => {
    const rows = open
      .filter((o) => filter === "All" || bizById(state, o.biz).cat === filter)
      .map((o) => ({ o, m: matchOpp(state, o, me) }))
      .filter((x) => !fit || !x.m.warn);
    rows.sort((a, b) => {
      if (sort === "pay") return potentialOf(b.o) - potentialOf(a.o);
      if (sort === "dist") return bizById(state, a.o.biz).dist - bizById(state, b.o.biz).dist;
      if (sort === "new") return b.o.posted - a.o.posted;
      return b.m.score - a.m.score;
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, filter, fit, sort]);

  return (
    <>
      <div className="chips" role="group" aria-label="Filter by category" style={{ marginTop: 12 }}>
        {["All", ...CATS].map((c) => {
          const n = c === "All" ? open.length : open.filter((o) => bizById(state, o.biz).cat === c).length;
          if (!n && c !== "All") return null;
          return (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
              <span className="n">{n}</span>
            </button>
          );
        })}
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
        {!list.length ? (
          <div className="glass empty">No opportunities match these filters right now.</div>
        ) : null}
        {list.map(({ o, m }) => {
          const b = bizById(state, o.biz);
          const c = collabOf(state, o.id, "me");
          return (
            <button key={o.id} type="button" className="glass opp" onClick={() => onOpen(o.id)}>
              <div className="row">
                <Avatar label={b.name} id={b.id} />
                <div className="grow">
                  <div className="biz">{b.name}</div>
                  <div className="meta">
                    {b.cat} · {b.area} · {b.dist} mi
                  </div>
                </div>
                <Ring score={m.score} />
              </div>
              <h3>{o.title}</h3>
              <div className="pay">{payText(o)}</div>
              <div className="tags">
                {c ? <span className={`tag ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span> : null}
                {o.minF === 0 ? (
                  <span className="tag t-gold">Any size welcome</span>
                ) : (
                  <span className={`tag ${m.warn ? "t-orange" : "t-faint"}`}>{fmtK(o.minF)}+ followers</span>
                )}
                <span className="tag t-purple">Fans get {o.offer.toLowerCase()}</span>
                <span className="tag t-faint">
                  {o.days} days · {o.spots} spot{o.spots === 1 ? "" : "s"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// Opportunity detail
// ---------------------------------------------------------------------

function OppDetail({
  state,
  oppId,
  onBack,
  onApply,
  onOpenCollabs,
}: {
  state: MarketState;
  oppId: string;
  onBack: () => void;
  onApply: (id: string) => void;
  onOpenCollabs: () => void;
}) {
  const o = oppById(state, oppId);
  if (!o) return null;
  const b = bizById(state, o.biz);
  const me = creatorById(state, "me");
  const m = matchOpp(state, o, me);
  const c = collabOf(state, o.id, "me");
  const rows: [string, string][] = [
    ["Deliverables", `${o.videos} video${o.videos > 1 ? "s" : ""} for ${o.platforms.join(", ")}`],
    ["Goal", o.goal],
    ["Your fans get", `${o.offer} with your personal code`],
    ["Usage", o.rights],
    ["Deadline", `${o.days} days after you’re accepted`],
    ["Spots", `${o.spots} creator${o.spots === 1 ? "" : "s"}`],
  ];
  const trust: [string, string][] = [
    [`${b.rating.toFixed(1)}★`, "Creator rating"],
    [String(b.done), "Collabs done"],
    [`${b.onTime}%`, "Paid on time"],
  ];
  const protection: [string, string, string][] = [
    ["link", "Your own tracking link and promo code", "Every view, click and customer you bring is counted and credited to you."],
    ["shield", "The terms are saved with the collab", "Rate, deliverables and due date are recorded with the collaboration, right here on this device."],
    ["star", "Results build your track record", "Approved collabs and the customers you brought are counted here in My collabs."],
  ];
  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" className="back" onClick={onBack}>
        <Icon name="back" /> Opportunities
      </button>
      <div className="row" style={{ marginTop: 6 }}>
        <Avatar label={b.name} id={b.id} />
        <div className="grow">
          <div style={{ fontWeight: 700 }}>{b.name}</div>
          <div className="faint" style={{ fontSize: 13 }}>
            {b.cat} · {b.area} · {b.dist} mi
          </div>
        </div>
      </div>
      <h3 className="title">{o.title}</h3>
      <div className="glass pad">
        <div className="label">You earn</div>
        <div style={{ font: "700 24px var(--m-display)", color: "var(--m-gold)", marginTop: 6 }}>
          {payText(o)}
        </div>
        {o.model === "perResult" ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Every {o.unit} from your code adds {money(o.per || 0)}. 10 would make it {money(o.rate + (o.per || 0) * 10)}.
          </div>
        ) : null}
        {o.model === "productFee" ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Plus {o.product} to keep.
          </div>
        ) : null}
        <div className="grid3" style={{ marginTop: 14 }}>
          {trust.map(([v, l]) => (
            <div key={l} className="glass" style={{ padding: 10, textAlign: "center", borderRadius: 14 }}>
              <b style={{ display: "block", font: "700 16px var(--m-display)" }}>{v}</b>
              <span className="faint" style={{ fontSize: 11 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h2>Why you match</h2>
        <span className="label">{m.score}% match</span>
      </div>
      <div className="glass list">
        {m.reasons.map((r) => (
          <div key={r} className="li" style={{ cursor: "default" }}>
            <span style={{ color: "var(--m-green)" }}>
              <Icon name="check" />
            </span>
            <div className="t" style={{ fontSize: 14 }}>{r}</div>
          </div>
        ))}
        {m.warn ? (
          <div className="li" style={{ cursor: "default" }}>
            <span className="tag t-orange">Heads up</span>
            <div className="t" style={{ fontSize: 14 }}>
              {m.warn}. You can still apply with a strong pitch.
            </div>
          </div>
        ) : null}
      </div>

      <div className="section-head">
        <h2>The brief</h2>
      </div>
      <div className="glass pad">
        <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.6, color: "var(--m-text2)" }}>{o.brief}</p>
        {rows.map(([k, v]) => (
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

      <div className="section-head">
        <h2>How you’re protected</h2>
      </div>
      <div className="glass list">
        {protection.map(([ic, t, s]) => (
          <div key={t} className="li" style={{ cursor: "default" }}>
            <span style={{ color: "var(--m-cyan)" }}>
              <Icon name={ic} />
            </span>
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
            <div className="glass empty">
              You’re in: {STATUS[c.status][0].toLowerCase()}. Track it in My collabs.
            </div>
            <button type="button" className="btn primary block" style={{ marginTop: 10 }} onClick={onOpenCollabs}>
              Open My collabs
            </button>
          </>
        ) : (
          <button type="button" className="btn gold block" onClick={() => onApply(o.id)}>
            <Icon name="arrow" /> Apply for this opportunity
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// My collabs (creator side)
// ---------------------------------------------------------------------

function MyCollabs({
  state,
  store,
  setSheet,
  onDiscover,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  setSheet: (s: SheetState) => void;
  onDiscover: () => void;
}) {
  const { update, notify } = store;
  const now = Date.now();
  const mine = state.collabs.filter((c) => c.cr === "me");
  const earned = mine.filter((c) => c.paid).reduce((s, c) => s + payout(state, c), 0);
  const pending = mine
    .filter((c) => !c.paid && /approved|live/.test(c.status))
    .reduce((s, c) => s + payout(state, c), 0);
  const brought = mine.reduce((s, c) => s + ((c.stats && c.stats.customers) || 0), 0);
  const active = mine
    .filter((c) => c.status !== "declined" && !(c.status === "live" && c.paid))
    .sort((a, b) => b.ts - a.ts);
  const done = mine.filter((c) => c.status === "live" && c.paid);
  const dec = mine.filter((c) => c.status === "declined");

  const card = (c: MarketCollab) => {
    const o = oppById(state, c.opp);
    const b = bizById(state, o.biz);
    return (
      <div key={c.id} className="glass collab">
        <div className="head">
          <Avatar label={b.name} id={b.id} sm />
          <div className="grow">
            <div className="t">{o.title}</div>
            <div className="s">
              {b.name} ·{" "}
              {c.status === "live" || c.status === "approved" || c.status === "accepted"
                ? money(payout(state, c)) + (o.model === "perResult" ? " so far" : "")
                : payText(o, true)}{" "}
              · {ago(c.ts, now)}
            </div>
          </div>
          <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
            <span className={`tag ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
            {c.paid ? <span className="tag t-gold">Paid</span> : null}
          </div>
        </div>
        {c.status !== "declined" ? <Stepper collab={c} /> : null}
        <div className="next">{nextBlock(c, o, b.name)}</div>
      </div>
    );
  };

  const nextBlock = (c: MarketCollab, o: MarketOpp, bizName: string) => {
    switch (c.status) {
      case "invited":
        return (
          <>
            <div className="q">
              {bizName} invited you at {money(c.ask || c.rate)} {rateLabel(o)}. Want it?
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  update((d) => {
                    acceptCollab(d, c.id, Date.now());
                  });
                  notify("Accepted! Create your video.");
                }}
              >
                Accept
              </button>
              <button
                type="button"
                className="btn danger small"
                onClick={() => update((d) => void declineCollab(d, c.id, Date.now()))}
              >
                Decline
              </button>
            </div>
          </>
        );
      case "applied":
        return (
          <div className="q">
            Waiting for {bizName} to reply. You asked {money(c.ask || c.rate)} {rateLabel(o)}.
          </div>
        );
      case "countered":
        return (
          <>
            <div className="q">
              {bizName} countered with {money(c.ask || c.rate)} {rateLabel(o)}.
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  update((d) => {
                    acceptCollab(d, c.id, Date.now());
                  });
                  notify("Deal agreed!");
                }}
              >
                Accept {money(c.ask || c.rate)}
              </button>
              <button type="button" className="btn ghost small" onClick={() => setSheet({ kind: "counter", collabId: c.id })}>
                Counter
              </button>
              <button
                type="button"
                className="btn danger small"
                onClick={() => update((d) => void declineCollab(d, c.id, Date.now()))}
              >
                Decline
              </button>
            </div>
          </>
        );
      case "accepted":
      case "changes":
        return (
          <>
            <div className="q">
              {c.status === "changes"
                ? `Changes requested: “${c.note || "Please revise."}”`
                : `Create your video. Your fans get ${o.offer.toLowerCase()} with code ${c.code}.`}
            </div>
            <button type="button" className="btn gold small" onClick={() => setSheet({ kind: "submit", collabId: c.id })}>
              <Icon name="video" /> {c.status === "changes" ? "Submit new version" : "Submit my video"}
            </button>
          </>
        );
      case "submitted":
        return <div className="q">In review at {bizName}. You’ll hear back soon.</div>;
      case "approved":
        return (
          <>
            <div className="q">Approved! Post it, then add the link so your results start counting.</div>
            <button type="button" className="btn gold small" onClick={() => setSheet({ kind: "post", collabId: c.id })}>
              <Icon name="check" /> I posted it
            </button>
          </>
        );
      case "live":
        return (
          <>
            <div className="q">
              {c.paid
                ? `Paid ${money(payout(state, c))}. These results are on your track record.`
                : `Live and tracking. Payment of ${money(payout(state, c))} is due within 7 days.`}
            </div>
            <StatsBlock stats={c.stats} code={c.code} note />
          </>
        );
      case "declined":
        return <div className="q">This one didn’t work out. Plenty more in Discover.</div>;
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div className="kpis">
        {[
          [money(earned), "Earned"],
          [money(pending), "On the way"],
          [String(brought), "Customers you brought"],
        ].map(([v, l]) => (
          <div key={l} className="glass kpi">
            <b>{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="section-head">
        <h2>In progress</h2>
        {active.length ? <span className="label">{active.length}</span> : null}
      </div>
      {!active.length ? (
        <div className="glass empty">
          Nothing in progress. Find your next opportunity.
          <div style={{ height: 10 }} />
          <button type="button" className="btn primary small" onClick={onDiscover}>
            Discover opportunities
          </button>
        </div>
      ) : null}
      {active.map(card)}
      {done.length ? (
        <>
          <div className="section-head">
            <h2>Completed</h2>
            <span className="label">{done.length}</span>
          </div>
          {done.map(card)}
        </>
      ) : null}
      {dec.length ? (
        <>
          <div className="section-head">
            <h2>Declined</h2>
          </div>
          {dec.map(card)}
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Sheets — apply / counter / submit / post (creator side)
// ---------------------------------------------------------------------

function Sheets({
  state,
  store,
  sheet,
  setSheet,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  sheet: SheetState;
  setSheet: (s: SheetState) => void;
}) {
  const { update, notify, demoReply } = store;
  const close = () => setSheet(null);

  if (sheet?.kind === "apply") {
    const o = oppById(state, sheet.oppId);
    if (o) return <ApplySheet state={state} opp={o} store={store} onClose={close} />;
    return null;
  }
  if (sheet?.kind === "counter") {
    const c = state.collabs.filter((x) => x.id === sheet.collabId)[0];
    if (c) return <CounterSheet state={state} collab={c} store={store} onClose={close} />;
    return null;
  }
  if (sheet?.kind === "submit") {
    const c = state.collabs.filter((x) => x.id === sheet.collabId)[0];
    if (!c) return null;
    const o = oppById(state, c.opp);
    const b = bizById(state, o.biz);
    return (
      <SubmitSheet
        defaultCaption={`Found my new favorite spot 🙌 ${o.offer} with my code ${c.code} at ${b.name}.`}
        onClose={close}
        onSubmit={(video, caption) => {
          update((d) => {
            submitCollab(d, c.id, { video, caption }, Date.now());
          });
          close();
          if (o.biz === state.myBiz) {
            notify("Submitted! It is waiting in the business preview for " + b.name + ".");
          } else {
            notify("Submitted to " + b.name + ".");
            demoReply(c.id, (d) => {
              setCollabStatus(d, c.id, "approved", Date.now());
              notify("Demo: " + b.name + " approved your video. Post it!");
            });
          }
        }}
      />
    );
  }
  if (sheet?.kind === "post") {
    const c = state.collabs.filter((x) => x.id === sheet.collabId)[0];
    if (!c) return null;
    const o = oppById(state, c.opp);
    const b = bizById(state, o.biz);
    return (
      <PostSheet
        onClose={close}
        onSubmit={(link) => {
          update((d) => {
            postCollab(d, c.id, link, Date.now());
          });
          close();
          if (o.biz === state.myBiz) {
            notify("Live! It is tracking in the business preview.");
          } else {
            notify("Live! Results are tracking.");
            demoReply(
              c.id,
              (d) => {
                const fresh = d.collabs.filter((x) => x.id === c.id)[0];
                if (fresh) {
                  fresh.paid = true;
                  fresh.paidAt = Date.now();
                  notify("Demo: " + b.name + " paid you " + money(payout(d, fresh)) + ". On time.");
                }
              },
              3500
            );
          }
        }}
      />
    );
  }
  return null;
}

function ApplySheet({
  state,
  opp: o,
  store,
  onClose,
}: {
  state: MarketState;
  opp: MarketOpp;
  store: ReturnType<typeof useMarketStore>;
  onClose: () => void;
}) {
  const { update, notify, demoReply } = store;
  const b = bizById(state, o.biz);
  const me = creatorById(state, "me");
  const [pitch, setPitch] = useState(
    `Hi ${b.name}! I’m ${me.handle}, a ${me.niches[0].toLowerCase()} creator in ${me.area}. My audience is local and engaged, and I’d love to show them ${o.title.toLowerCase()}. I can deliver within ${o.days} days.`
  );
  const [mode, setMode] = useState<"accept" | "counter">("accept");
  const [ask, setAsk] = useState(String(Math.max(o.rate, me.rate)));
  const [passport, setPassport] = useState(true);

  return (
    <Sheet open onClose={onClose} title={`Apply to ${b.name}`} sub="A short, specific pitch wins. Say why your audience will love them.">
      <Field label="Your pitch">
        <textarea className="in" maxLength={600} value={pitch} onChange={(e) => setPitch(e.target.value)} />
      </Field>
      <label className="check">
        <input type="radio" name="mkt-rate" checked={mode === "accept"} onChange={() => setMode("accept")} />
        Accept their offer: {payText(o, true)}
      </label>
      <label className="check">
        <input type="radio" name="mkt-rate" checked={mode === "counter"} onChange={() => setMode("counter")} />
        Propose my own rate
      </label>
      <Field label={`Your rate (${rateLabel(o)}, $)`} hint="Tip: creators who explain their rate with results get more yeses.">
        <input
          className="in"
          type="number"
          min={0}
          max={100000}
          inputMode="numeric"
          disabled={mode === "accept"}
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
        />
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
            const rate = mode === "counter" ? Math.round(parseFloat(ask)) : o.rate;
            if (!(rate > 0)) {
              notify("Enter your rate.");
              return;
            }
            let createdId = "";
            update((d) => {
              const c = applyToOpp(d, o.id, { ask: rate, msg: pitch.trim(), passport }, Date.now());
              createdId = c.id;
            });
            onClose();
            if (o.biz === state.myBiz) {
              notify("Sent! It is waiting in the business preview for " + b.name + ".");
            } else {
              notify("Application sent to " + b.name + ".");
              demoReply(createdId, (d) => {
                const fresh = d.collabs.filter((x) => x.id === createdId)[0];
                if (fresh) {
                  acceptCollab(d, createdId, Date.now());
                  notify("Demo: " + b.name + " accepted at " + money(fresh.rate) + ". Time to create!");
                }
              });
            }
          }}
        >
          Send application
        </button>
      </SheetActions>
    </Sheet>
  );
}

function CounterSheet({
  state,
  collab: c,
  store,
  onClose,
}: {
  state: MarketState;
  collab: MarketCollab;
  store: ReturnType<typeof useMarketStore>;
  onClose: () => void;
}) {
  const { update, notify, demoReply } = store;
  const o = oppById(state, c.opp);
  const b = bizById(state, o.biz);
  const [amount, setAmount] = useState(String(c.ask || c.rate));
  return (
    <Sheet open onClose={onClose} title="Make a counter offer" sub={`Current: ${money(c.ask || c.rate)} ${rateLabel(o)}.`}>
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
            if (!(v > 0)) {
              notify("Enter an amount.");
              return;
            }
            update((d) => {
              counterCollab(d, c.id, v, "creator", Date.now());
            });
            onClose();
            notify("Counter sent.");
            if (o.biz !== state.myBiz) {
              demoReply(c.id, (d) => {
                const fresh = d.collabs.filter((x) => x.id === c.id)[0];
                if (fresh) {
                  acceptCollab(d, c.id, Date.now());
                  notify("Demo: " + b.name + " accepted " + money(fresh.rate) + ".");
                }
              });
            }
          }}
        >
          Send counter
        </button>
      </SheetActions>
    </Sheet>
  );
}

function SubmitSheet({
  defaultCaption,
  onClose,
  onSubmit,
}: {
  defaultCaption: string;
  onClose: () => void;
  onSubmit: (video: string, caption: string) => void;
}) {
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState(defaultCaption);
  const [disc, setDisc] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet open onClose={onClose} title="Submit your video" sub="The business reviews it before you post. Share a private link or draft.">
      <Field label="Video link" hint="A Google Drive, Dropbox or private post link works.">
        <input className="in" type="url" maxLength={300} placeholder="Link to your video or draft" value={link} onChange={(e) => setLink(e.target.value)} />
      </Field>
      <Field label="Caption">
        <textarea className="in" maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Your caption" />
      </Field>
      <label className="check">
        <input type="checkbox" checked={disc} onChange={(e) => setDisc(e.target.checked)} />
        I’ll label it as a paid partnership (#ad), as the law and platforms require
      </label>
      {err ? <p style={{ color: "var(--m-red)" }}>{err}</p> : null}
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!link.trim()) {
              setErr("Add a link to your video.");
              return;
            }
            if (!disc) {
              setErr("Paid partnerships need to be labeled.");
              return;
            }
            onSubmit(link.trim(), caption.trim());
          }}
        >
          Submit for review
        </button>
      </SheetActions>
    </Sheet>
  );
}

function PostSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (link: string) => void;
}) {
  const [link, setLink] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet open onClose={onClose} title="Add your live post" sub="Tracking starts as soon as you add the link.">
      <Field label="Post link">
        <input className="in" type="url" maxLength={300} placeholder="Link to the live post" value={link} onChange={(e) => setLink(e.target.value)} />
      </Field>
      {err ? <p style={{ color: "var(--m-red)" }}>{err}</p> : null}
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn gold"
          onClick={() => {
            if (!link.trim()) {
              setErr("Add the post link.");
              return;
            }
            onSubmit(link.trim());
          }}
        >
          Start tracking
        </button>
      </SheetActions>
    </Sheet>
  );
}
