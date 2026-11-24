"use client";

import { useState } from "react";
import Link from "next/link";
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
  ToastView,
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  PLATFORMS,
  STATUS,
  acceptCollab,
  ago,
  approveCollab,
  bizById,
  budgetTotal,
  counterCollab,
  creatorById,
  declineCollab,
  fmtK,
  markCollabPaid,
  matchCreator,
  matchOpp,
  money,
  myBizOf,
  oppById,
  payText,
  payout,
  rateLabel,
  requestChanges,
  setCollabStatus,
  demoStats,
  uid,
  type MarketCollab,
  type MarketOpp,
  type MarketState,
  type PayModel,
} from "@/lib/marketplace";

/* BUSINESS CAMPAIGNS — the prototype's Campaigns list, campaign
 * Builder and campaign detail with applicant actions, inside the
 * business area (owner order 2026-11-24). Everything runs on the
 * device-local market store with the prototype's sample data,
 * SAMPLE-labeled; nothing is posted anywhere real and no database
 * table is touched. The "business" whose campaigns these are is
 * the store's sample business (the prototype's myBiz), exactly as
 * in the prototype. */

type View = { kind: "list" } | { kind: "detail"; id: string } | { kind: "new" };

export default function CampaignsClient() {
  const store = useMarketStore();
  const { state, toast } = store;
  const [view, setView] = useState<View>({ kind: "list" });
  const [counterId, setCounterId] = useState<string | null>(null);
  const [changesId, setChangesId] = useState<string | null>(null);

  if (!state) return null;
  const b = myBizOf(state);

  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <div className="mkt-col">
        <Link href="/business/home" className="back" style={{ textDecoration: "none" }}>
          <Icon name="back" /> Business home
        </Link>
        <SampleBanner onReset={store.reset} />
        {view.kind === "list" ? (
          <CampaignList state={state} onOpen={(id) => setView({ kind: "detail", id })} onNew={() => setView({ kind: "new" })} />
        ) : view.kind === "new" ? (
          <Builder state={state} store={store} onBack={() => setView({ kind: "list" })} onPosted={(id) => setView({ kind: "detail", id })} />
        ) : (
          <CampaignDetail
            state={state}
            store={store}
            oppId={view.id}
            onBack={() => setView({ kind: "list" })}
            onCounter={setCounterId}
            onChanges={setChangesId}
          />
        )}
        {counterId ? (
          <CounterSheet state={state} store={store} collabId={counterId} onClose={() => setCounterId(null)} />
        ) : null}
        {changesId ? (
          <ChangesSheet state={state} store={store} collabId={changesId} onClose={() => setChangesId(null)} />
        ) : null}
        <ToastView msg={toast} />
        <span className="sr-only">{b.name}</span>
      </div>
    </div>
  );
}

function CampaignList({
  state,
  onOpen,
  onNew,
}: {
  state: MarketState;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const now = Date.now();
  const mine = state.opps
    .filter((o) => o.biz === state.myBiz)
    .sort((a, b2) => (a.status === "open" ? 0 : 1) - (b2.status === "open" ? 0 : 1) || b2.posted - a.posted);
  return (
    <>
      <h1 className="title">Campaigns</h1>
      <p className="sub">What you need from creators, and everyone working on it.</p>
      <button type="button" className="btn gold block" onClick={onNew}>
        <Icon name="plus" /> Post a new opportunity
      </button>
      <div className="section-head">
        <h2>Your opportunities</h2>
        <span className="label">{mine.length}</span>
      </div>
      <div className="glass list">
        {!mine.length ? (
          <div className="empty">No opportunities yet. Post one and local creators can apply in minutes.</div>
        ) : null}
        {mine.map((o) => {
          const cs = state.collabs.filter((c) => c.opp === o.id);
          const act = cs.filter((c) => /applied|submitted/.test(c.status)).length;
          return (
            <button key={o.id} type="button" className="li" onClick={() => onOpen(o.id)}>
              <div className="grow">
                <div className="t">{o.title}</div>
                <div className="s">
                  {payText(o, true)} · {cs.length} creator{cs.length === 1 ? "" : "s"} · posted {ago(o.posted, now)}
                </div>
              </div>
              {act ? <span className="tag t-orange">{act} to review</span> : null}
              <span className={`tag ${o.status === "open" ? "t-green" : "t-faint"}`}>
                {o.status === "open" ? "Open" : "Closed"}
              </span>
              <Icon name="chev" className="chev" />
            </button>
          );
        })}
      </div>
    </>
  );
}

function CampaignDetail({
  state,
  store,
  oppId,
  onBack,
  onCounter,
  onChanges,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  oppId: string;
  onBack: () => void;
  onCounter: (id: string) => void;
  onChanges: (id: string) => void;
}) {
  const { update } = store;
  const o = oppById(state, oppId);
  if (!o || o.biz !== state.myBiz) {
    return (
      <div className="glass empty">
        That campaign is not here.{" "}
        <button type="button" className="btn ghost small" onClick={onBack}>
          Back to campaigns
        </button>
      </div>
    );
  }
  const cs = state.collabs.filter((c) => c.opp === o.id);
  const groups: [string, MarketCollab[]][] = [
    ["Applications", cs.filter((c) => /applied/.test(c.status))],
    ["Videos to review", cs.filter((c) => c.status === "submitted")],
    ["Waiting on the creator", cs.filter((c) => /invited|countered|accepted|changes|approved/.test(c.status))],
    ["Live results", cs.filter((c) => c.status === "live")],
  ];
  const any = groups.some((g) => g[1].length);
  return (
    <>
      <button type="button" className="back" onClick={onBack}>
        <Icon name="back" /> Campaigns
      </button>
      <h1 className="title">{o.title}</h1>
      <p className="sub">
        {payText(o)} · fans get {o.offer.toLowerCase()}
      </p>
      <div className="row wrap">
        <span className={`tag ${o.status === "open" ? "t-green" : "t-faint"}`}>
          {o.status === "open" ? "Open to applications" : "Closed"}
        </span>
        <button
          type="button"
          className="btn ghost small"
          onClick={() =>
            update((d) => {
              const fresh = oppById(d, o.id);
              fresh.status = fresh.status === "open" ? "closed" : "open";
            })
          }
        >
          {o.status === "open" ? "Close applications" : "Reopen"}
        </button>
        <Link href="/business/creators" className="btn ghost small" style={{ textDecoration: "none" }}>
          <Icon name="users" /> Find creators to invite
        </Link>
      </div>
      {groups.map(([title, list]) =>
        list.length ? (
          <div key={title}>
            <div className="section-head">
              <h2>{title}</h2>
              <span className="label">{list.length}</span>
            </div>
            {list.map((c) => (
              <BizCollabCard key={c.id} state={state} store={store} collab={c} onCounter={onCounter} onChanges={onChanges} />
            ))}
          </div>
        ) : null
      )}
      {!any ? (
        <div className="glass empty" style={{ marginTop: 16 }}>
          No creators yet. Invite some from the Creators tab, or wait for applications.
        </div>
      ) : null}
    </>
  );
}

function BizCollabCard({
  state,
  store,
  collab: c,
  onCounter,
  onChanges,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  collab: MarketCollab;
  onCounter: (id: string) => void;
  onChanges: (id: string) => void;
}) {
  const { update, notify, demoReply } = store;
  const o = oppById(state, c.opp);
  const cr = creatorById(state, c.cr);
  const b = myBizOf(state);
  const m = matchCreator(state, b, cr);
  return (
    <div className="glass collab">
      <div className="head">
        <Avatar label={cr.handle} id={cr.id} round sm />
        <div className="grow">
          <div className="t">
            {cr.handle}
            {cr.isMe ? " (you, demo)" : ""}
          </div>
          <div className="s">
            {fmtK(cr.followers)} followers · {cr.area}
            {cr.eng ? ` · ${cr.eng}% engagement` : ""} · {cr.done} collabs
          </div>
        </div>
        <Ring score={m.score} />
      </div>
      <div className="next">
        {c.status === "applied" ? (
          <>
            {c.msg ? (
              <div className="q" style={{ fontWeight: 500, color: "var(--m-text2)" }}>
                “{c.msg}”
              </div>
            ) : null}
            <div className="q">
              {(c.ask || 0) > o.rate
                ? `Asks ${money(c.ask || 0)} ${rateLabel(o)} (you offered ${money(o.rate)}).`
                : `Accepts your offer of ${money(c.ask || 0)} ${rateLabel(o)}.`}
            </div>
            {c.passport ? (
              <div className="faint" style={{ fontSize: 12, margin: "-4px 0 10px" }}>
                Creator Passport attached.
              </div>
            ) : null}
            <div className="row wrap">
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  update((d) => {
                    acceptCollab(d, c.id, Date.now());
                  });
                  notify(`Accepted. ${cr.handle} can start creating.`);
                }}
              >
                Accept {money(c.ask || 0)}
              </button>
              <button type="button" className="btn ghost small" onClick={() => onCounter(c.id)}>
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
        ) : c.status === "submitted" ? (
          <>
            <div className="q">New video to review</div>
            <div className="faint" style={{ fontSize: 13, lineHeight: 1.5, margin: "-4px 0 10px", whiteSpace: "pre-wrap" }}>
              {"Link: " + (c.video || "—") + (c.caption ? "\nCaption: " + c.caption : "")}
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  update((d) => {
                    approveCollab(d, c.id, Date.now());
                  });
                  notify(`Approved. ${cr.handle} can post it.`);
                  if (c.cr !== "me") {
                    demoReply(c.id, (d) => {
                      const fresh = d.collabs.filter((x) => x.id === c.id)[0];
                      if (fresh && fresh.status === "approved") {
                        setCollabStatus(d, c.id, "live", Date.now(), {
                          post: fresh.video,
                          stats: demoStats(d, fresh),
                        });
                        notify(`Demo: ${cr.handle} posted it. Tracking started.`);
                      }
                    });
                  }
                }}
              >
                <Icon name="check" /> Approve
              </button>
              <button type="button" className="btn ghost small" onClick={() => onChanges(c.id)}>
                Request changes
              </button>
            </div>
          </>
        ) : c.status === "invited" ? (
          <div className="q">
            Invited at {money(c.ask || c.rate)}. Waiting for {cr.handle} to accept.
          </div>
        ) : c.status === "countered" ? (
          <div className="q">
            You countered at {money(c.ask || 0)}. Waiting for {cr.handle}.
          </div>
        ) : c.status === "accepted" ? (
          <div className="q">
            Agreed at {money(payout(state, c))}. {cr.handle} is creating. Code: {c.code}.
          </div>
        ) : c.status === "changes" ? (
          <div className="q">You asked for changes: “{c.note || ""}”</div>
        ) : c.status === "approved" ? (
          <div className="q">Approved. Waiting for {cr.handle} to post it.</div>
        ) : c.status === "live" ? (
          <>
            <div className="q">
              {c.paid
                ? `Paid ${money(payout(state, c))}. Results keep counting.`
                : `Live. You owe ${money(payout(state, c))}${o.model === "perResult" ? " so far" : ""}, due within 7 days.`}
            </div>
            <StatsBlock stats={c.stats} code={c.code} note={c.cr === "me"} />
            {!c.paid ? (
              <button
                type="button"
                className="btn gold small"
                style={{ marginTop: 10 }}
                onClick={() => {
                  update((d) => {
                    markCollabPaid(d, c.id, Date.now());
                  });
                  notify("Marked paid. Thanks for paying on time!");
                }}
              >
                <Icon name="dollar" /> Mark as paid
              </button>
            ) : null}
          </>
        ) : (
          <div className="q">{STATUS[c.status][0]}</div>
        )}
      </div>
    </div>
  );
}

function CounterSheet({
  state,
  store,
  collabId,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  collabId: string;
  onClose: () => void;
}) {
  const { update, notify, demoReply } = store;
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  const [amount, setAmount] = useState(c ? String(c.ask || c.rate) : "");
  if (!c) return null;
  const o = oppById(state, c.opp);
  const cr = creatorById(state, c.cr);
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
              counterCollab(d, c.id, v, "business", Date.now());
            });
            onClose();
            notify(`Counter sent to ${cr.handle}.`);
            if (c.cr !== "me") {
              demoReply(c.id, (d) => {
                const fresh = d.collabs.filter((x) => x.id === c.id)[0];
                if (fresh) {
                  acceptCollab(d, c.id, Date.now());
                  notify(`Demo: ${cr.handle} accepted ${money(fresh.rate)}.`);
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

function ChangesSheet({
  state,
  store,
  collabId,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  collabId: string;
  onClose: () => void;
}) {
  const { update, notify, demoReply } = store;
  const c = state.collabs.filter((x) => x.id === collabId)[0];
  const [note, setNote] = useState("");
  if (!c) return null;
  const cr = creatorById(state, c.cr);
  return (
    <Sheet open onClose={onClose} title="Request changes" sub="Be specific and kind. Creators do their best work with clear notes.">
      <Field label="What should change?">
        <textarea
          className="in"
          maxLength={400}
          placeholder="e.g. Can you show the price on screen and say our address at the end?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!note.trim()) {
              notify("Add a note.");
              return;
            }
            update((d) => {
              requestChanges(d, c.id, note.trim(), Date.now());
            });
            onClose();
            notify("Notes sent.");
            if (c.cr !== "me") {
              demoReply(
                c.id,
                (d) => {
                  setCollabStatus(d, c.id, "submitted", Date.now());
                  notify(`Demo: ${cr.handle} sent a new version.`);
                },
                3500
              );
            }
          }}
        >
          Send notes
        </button>
      </SheetActions>
    </Sheet>
  );
}

// ---------------------------------------------------------------------
// Builder — the prototype's campaign builder with live preview
// ---------------------------------------------------------------------

interface Draft {
  title: string;
  videos: number;
  platforms: string[];
  goal: string;
  model: PayModel;
  rate: number;
  per: number;
  unit: string;
  product: string;
  offer: string;
  minF: number;
  local: number;
  days: number;
  spots: number;
  rights: string;
  brief: string;
}

function Builder({
  state,
  store,
  onBack,
  onPosted,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  onBack: () => void;
  onPosted: (id: string) => void;
}) {
  const { update, notify } = store;
  const b = myBizOf(state);
  const [d, setD] = useState<Draft>({
    title: "",
    videos: 2,
    platforms: ["TikTok", "Instagram Reels"],
    goal: "Foot traffic",
    model: "flat",
    rate: 120,
    per: 10,
    unit: "customer",
    product: "",
    offer: "15% off your first visit",
    minF: 0,
    local: 5,
    days: 10,
    spots: 3,
    rights: "Organic posts only",
    brief: "",
  });
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const previewOpp: MarketOpp = {
    id: "preview",
    biz: state.myBiz,
    title: d.title.trim() || "Your opportunity title",
    videos: d.videos,
    platforms: d.platforms,
    goal: d.goal,
    model: d.model,
    rate: d.rate,
    per: d.per,
    unit: d.unit,
    product: d.product,
    offer: d.offer.trim() || "a special offer",
    minF: d.minF,
    local: d.local,
    days: d.days,
    spots: d.spots,
    rights: d.rights,
    brief: d.brief,
    status: "open",
    posted: Date.now(),
  };
  const sampleCreator = {
    id: "sample",
    handle: "@sample",
    name: "Sample",
    niches: [b.cat, "Lifestyle"],
    area: b.area,
    followers: 2000,
    eng: null,
    views: null,
    done: 0,
    onTime: 100,
    rate: 0,
    platforms: PLATFORMS,
  };
  const pm = matchOpp(state, previewOpp, sampleCreator);
  const total = budgetTotal(d);
  const nearby = state.creators.filter(
    (c) => c.followers >= d.minF && (d.local === 0 || c.area === b.area || d.local >= 10)
  ).length;

  return (
    <>
      <button type="button" className="back" onClick={onBack}>
        <Icon name="back" /> Campaigns
      </button>
      <h1 className="title">Post an opportunity</h1>
      <p className="sub">Tell local creators what you need. You’ll see exactly how it looks to them.</p>
      <div className="glass pad">
        <Field label="What do you need?">
          <input className="in" type="text" maxLength={70} placeholder="e.g. 3 videos of our new menu" value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <div className="grid2">
          <Field label="Videos per creator">
            <select className="in" value={d.videos} onChange={(e) => set({ videos: +e.target.value })}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} video{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How many creators">
            <select className="in" value={d.spots} onChange={(e) => set({ spots: +e.target.value })}>
              {[1, 2, 3, 4, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} creator{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="field">
          <span>Where</span>
          <div className="chips wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                className="chip"
                aria-pressed={d.platforms.includes(p)}
                onClick={() =>
                  set({
                    platforms: d.platforms.includes(p)
                      ? d.platforms.length > 1
                        ? d.platforms.filter((x) => x !== p)
                        : d.platforms
                      : [...d.platforms, p],
                  })
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <Field label="Your goal">
          <select className="in" value={d.goal} onChange={(e) => set({ goal: e.target.value })}>
            {["Foot traffic", "Bookings", "Online sales", "Leads"].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How you’ll pay" hint="Paying per customer means you only pay more when it works.">
          <select className="in" value={d.model} onChange={(e) => set({ model: e.target.value as PayModel })}>
            <option value="flat">Flat fee per video</option>
            <option value="perResult">Base fee + bonus per customer</option>
            <option value="productFee">Fee + free product or service</option>
          </select>
        </Field>
        <Field label={d.model === "flat" ? "Fee per video ($)" : d.model === "perResult" ? "Base fee per creator ($)" : "Fee per creator ($)"}>
          <input className="in" type="number" min={1} inputMode="numeric" value={d.rate || ""} onChange={(e) => set({ rate: Math.round(parseFloat(e.target.value) || 0) })} />
        </Field>
        {d.model === "perResult" ? (
          <div className="grid2">
            <Field label="Bonus per customer ($)">
              <input className="in" type="number" min={1} inputMode="numeric" value={d.per || ""} onChange={(e) => set({ per: Math.round(parseFloat(e.target.value) || 0) })} />
            </Field>
            <Field label="Counted as">
              <input className="in" type="text" maxLength={20} value={d.unit} onChange={(e) => set({ unit: e.target.value })} />
            </Field>
          </div>
        ) : null}
        {d.model === "productFee" ? (
          <Field label="Free product or service">
            <input className="in" type="text" maxLength={50} placeholder="e.g. $100 gift card" value={d.product} onChange={(e) => set({ product: e.target.value })} />
          </Field>
        ) : null}
        <Field label="What their fans get" hint="Each creator gets a personal promo code, so you know exactly who brought each customer.">
          <input className="in" type="text" maxLength={50} value={d.offer} onChange={(e) => set({ offer: e.target.value })} />
        </Field>
        <div className="grid2">
          <Field label="Creator size">
            <select className="in" value={d.minF} onChange={(e) => set({ minF: +e.target.value })}>
              <option value={0}>Any size (recommended for local)</option>
              <option value={1000}>1K+ followers</option>
              <option value={5000}>5K+ followers</option>
              <option value={10000}>10K+ followers</option>
            </select>
          </Field>
          <Field label="Location">
            <select className="in" value={d.local} onChange={(e) => set({ local: +e.target.value })}>
              <option value={5}>Within 5 miles</option>
              <option value={10}>Within 10 miles</option>
              <option value={25}>Within 25 miles</option>
              <option value={0}>Anywhere</option>
            </select>
          </Field>
        </div>
        <div className="grid2">
          <Field label="Deadline">
            <select className="in" value={d.days} onChange={(e) => set({ days: +e.target.value })}>
              {[3, 5, 7, 10, 14, 21, 30].map((n) => (
                <option key={n} value={n}>
                  {n} days
                </option>
              ))}
            </select>
          </Field>
          <Field label="Usage rights">
            <select className="in" value={d.rights} onChange={(e) => set({ rights: e.target.value })}>
              {["Organic posts only", "Can run as ads for 30 days", "Can run as ads for 90 days"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Brief">
          <textarea className="in" maxLength={600} placeholder="What should creators show or say? When can they film?" value={d.brief} onChange={(e) => set({ brief: e.target.value })} />
        </Field>
      </div>

      <div className="section-head">
        <h2>How creators will see it</h2>
      </div>
      <div className="glass opp" style={{ cursor: "default" }} aria-hidden="true">
        <div className="row">
          <Avatar label={b.name} id={b.id} />
          <div className="grow">
            <div className="biz">{b.name}</div>
            <div className="meta">
              {b.cat} · {b.area} · {b.dist} mi
            </div>
          </div>
          <Ring score={pm.score} />
        </div>
        <h3>{previewOpp.title}</h3>
        <div className="pay">{payText(previewOpp)}</div>
        <div className="tags">
          {d.minF === 0 ? (
            <span className="tag t-gold">Any size welcome</span>
          ) : (
            <span className="tag t-faint">{fmtK(d.minF)}+ followers</span>
          )}
          <span className="tag t-purple">Fans get {(d.offer.trim() || "a special offer").toLowerCase()}</span>
          <span className="tag t-faint">
            {d.days} days · {d.spots} spot{d.spots === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="glass pad" style={{ marginTop: 10 }}>
        <div className="label">Your budget</div>
        <div style={{ font: "700 24px var(--m-display)", color: "var(--m-gold)", marginTop: 6 }}>
          {money(total)}
          {d.model === "perResult" ? ` + ${money(d.per)} per ${d.unit.trim() || "customer"}` : d.model === "productFee" ? ` + ${d.product || "product"} each` : ""}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          {nearby} creators on Vestra match your size and location filters. You only pay for work you approve.
        </div>
      </div>
      <button
        type="button"
        className="btn gold block"
        style={{ marginTop: 14 }}
        onClick={() => {
          if (d.title.trim().length < 4) {
            notify("Say what you need in the title.");
            return;
          }
          if (!(d.rate > 0)) {
            notify("Add a fee.");
            return;
          }
          if (d.model === "productFee" && !d.product.trim()) {
            notify("Add the free product or service.");
            return;
          }
          const now = Date.now();
          const o: MarketOpp = {
            ...previewOpp,
            id: uid("o", now),
            title: d.title.trim(),
            brief: d.brief.trim() || `Show what makes ${b.name} special.`,
            offer: d.offer.trim() || "a special offer",
            unit: d.unit.trim() || "customer",
            posted: now,
          };
          update((draft) => {
            draft.opps.push(o);
          });
          notify("Posted! Local creators can apply now.");
          onPosted(o.id);
        }}
      >
        <Icon name="megaphone" /> Post opportunity
      </button>
      <span className="sr-only">{bizById(state, state.myBiz).name}</span>
    </>
  );
}
