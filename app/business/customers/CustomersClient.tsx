"use client";

import { useState } from "react";
import Link from "next/link";
import { MKT_CSS } from "@/lib/marketplace-css";
import {
  Avatar,
  Field,
  Icon,
  SampleBanner,
  Sheet,
  SheetActions,
  ToastView,
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  AREAS_LIST,
  CATS,
  ago,
  creatorById,
  fillMsg,
  followUps,
  markFollowUpDone,
  money,
  myBizOf,
  myCollabsOf,
  segOf,
  uid,
  when,
  type FollowUp,
  type MarketCustomer,
  type MarketState,
} from "@/lib/marketplace";

/* BUSINESS CUSTOMERS — the prototype's Customers view: the follow-up
 * list generated from the four automations, segment browsing, the
 * Automations editor and business settings (owner order
 * 2026-11-24). Preview only, and the page says so: it runs on this
 * device over labeled sample data, the follow-up messages are
 * templates to copy, and no messages are sent. (The prototype's
 * one-tap Text/Email actions, which hand off to the phone's own
 * apps, are not ported — Copy and Done are the actions here, so the
 * honesty line below is exactly true.) */

const FU_ICON: Record<FollowUp["type"], string> = {
  estimate: "dollar",
  reminder: "cal",
  review: "star",
  winback: "heart",
};
const FU_COLOR: Record<FollowUp["type"], string> = {
  estimate: "#B69CFF",
  reminder: "#3EE6E0",
  review: "#F5C451",
  winback: "#FF9CC8",
};

const SEGS: [string, string][] = [
  ["due", "Follow up today"],
  ["all", "All"],
  ["leads", "New leads"],
  ["upcoming", "Upcoming"],
  ["review", "Needs review"],
  ["lapsed", "Lapsed"],
  ["regulars", "Regulars"],
  ["auto", "Automations"],
];

export default function CustomersClient() {
  const store = useMarketStore();
  const { state, toast } = store;
  const [seg, setSeg] = useState("due");
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!state) return null;
  const now = Date.now();
  const due = followUps(state, now);
  const counts: Record<string, number> = { due: due.length, all: state.customers.length, leads: 0, upcoming: 0, review: 0, lapsed: 0, regulars: 0 };
  state.customers.forEach((k) => {
    segOf(state, k, now).forEach((s) => {
      counts[s] = (counts[s] || 0) + 1;
    });
  });

  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <div className="mkt-col">
        <Link href="/business/home" className="back" style={{ textDecoration: "none" }}>
          <Icon name="back" /> Business home
        </Link>
        <div className="row">
          <div className="grow">
            <h1 className="title">Customers</h1>
            <p className="sub">
              Turn the customers creators bring you into regulars. Follow-ups
              tell you who to contact today.
            </p>
          </div>
          <button
            type="button"
            className="btn ghost small"
            aria-label="Business settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name="gear" /> Settings
          </button>
        </div>
        <SampleBanner onReset={store.reset} />
        <div className="banner" style={{ borderColor: "var(--m-edge2)", background: "var(--m-glass)", color: "var(--m-text2)" }}>
          <div className="grow">
            Preview — runs on this device. Templates only; no messages are sent.
          </div>
        </div>
        <div className="chips" role="group" aria-label="Customer segments">
          {SEGS.map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={seg === id} onClick={() => setSeg(id)}>
              {label}
              {counts[id] != null ? <span className="n">{counts[id]}</span> : null}
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost block" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add a customer or lead
        </button>

        {seg === "auto" ? (
          <Automations state={state} store={store} />
        ) : seg === "due" ? (
          <DueList state={state} store={store} due={due} />
        ) : (
          <CustomerList state={state} seg={seg} onOpen={setDetailId} />
        )}

        {adding ? <AddCustomerSheet state={state} store={store} onClose={() => setAdding(false)} /> : null}
        {settingsOpen ? <BizSettingsSheet state={state} store={store} onClose={() => setSettingsOpen(false)} /> : null}
        {detailId ? (
          <CustomerDetailSheet state={state} store={store} customerId={detailId} onClose={() => setDetailId(null)} />
        ) : null}
        <ToastView msg={toast} />
      </div>
    </div>
  );
}

function copyText(store: ReturnType<typeof useMarketStore>, text: string) {
  const done = () => store.notify("Copied.");
  const fail = () => store.notify("Couldn’t copy.");
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, fail);
  } else {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand("copy");
      done();
    } catch {
      fail();
    }
    t.remove();
  }
}

function DueList({
  state,
  store,
  due,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  due: FollowUp[];
}) {
  const { update, notify } = store;
  return (
    <>
      <div className="section-head">
        <h2>Today’s follow-ups</h2>
        {due.length ? <span className="label">{due.length} to do</span> : null}
      </div>
      <div className="glass">
        {!due.length ? (
          <div className="empty">All caught up. New follow-ups appear here automatically.</div>
        ) : null}
        {due.map((it, i) => {
          const k = it.customer;
          const msg = fillMsg(state, state.automations[it.type].text, k);
          return (
            <div key={it.type + k.id + i} className="fu">
              <div className="row">
                <span className="avatar sm" style={{ background: FU_COLOR[it.type], color: "#0A0F28" }}>
                  <Icon name={FU_ICON[it.type]} />
                </span>
                <div className="grow">
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {it.title}: {k.name}
                  </div>
                  <div className="why">{it.why}</div>
                </div>
              </div>
              <div className="msg">{msg}</div>
              <div className="acts">
                <button type="button" className="btn ghost small" onClick={() => copyText(store, msg)}>
                  <Icon name="copy" /> Copy
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    update((d) => {
                      const fresh = d.customers.filter((x) => x.id === k.id)[0];
                      if (fresh) markFollowUpDone(d, { ...it, customer: fresh }, Date.now());
                    });
                    notify("Done. Nice follow-up!");
                  }}
                >
                  <Icon name="check" /> Done
                </button>
              </div>
              {!k.consent ? (
                <div style={{ fontSize: 12, color: "var(--m-orange)", marginTop: 8 }}>
                  No permission to text or email this customer. Call, or ask in person next visit.
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="note">Only message customers who agreed to hear from you.</p>
    </>
  );
}

function CustomerList({
  state,
  seg,
  onOpen,
}: {
  state: MarketState;
  seg: string;
  onOpen: (id: string) => void;
}) {
  const now = Date.now();
  const list = state.customers.filter((k) => seg === "all" || segOf(state, k, now).indexOf(seg) >= 0);
  if (seg === "upcoming") list.sort((a, b) => (a.nextAppt || 0) - (b.nextAppt || 0));
  else list.sort((a, b) => (b.lastVisit || b.created) - (a.lastVisit || a.created));
  const label = SEGS.filter((s) => s[0] === seg)[0]?.[1] ?? seg;
  return (
    <>
      <div className="section-head">
        <h2>{label}</h2>
        <span className="label">{list.length}</span>
      </div>
      <div className="glass list">
        {!list.length ? <div className="empty">No one here right now.</div> : null}
        {list.map((k) => {
          const src = state.creators.some((c) => c.id === k.source) || k.source === "me" ? creatorById(state, k.source) : undefined;
          const bits: string[] = [];
          if (seg === "upcoming" && k.nextAppt) bits.push(when(k.nextAppt));
          else if (k.lead && !k.lead.won) bits.push(`Lead: ${k.lead.what} (${money(k.lead.amount)})`);
          else
            bits.push(
              `${k.visits} visit${k.visits === 1 ? "" : "s"} · ${money(k.spend)}${k.lastVisit ? ` · last ${ago(k.lastVisit, now)}` : ""}`
            );
          return (
            <button key={k.id} type="button" className="li" onClick={() => onOpen(k.id)}>
              <Avatar label={k.name} id={k.id} round sm />
              <div className="grow">
                <div className="t">{k.name}</div>
                <div className="s">{bits.join(" · ")}</div>
              </div>
              <span className={`tag ${src ? "t-gold" : "t-faint"}`}>{src ? `via ${src.handle}` : k.source}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Automations({
  state,
  store,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
}) {
  const { update, notify } = store;
  const A = state.automations;
  const rows: [keyof typeof A, string, "days" | "hours", string][] = [
    ["estimate", "Follow up on quotes", "days", "days after they ask, if you haven’t replied"],
    ["reminder", "Appointment reminders", "hours", "hours before the appointment"],
    ["review", "Review requests", "days", "days after a visit (window to ask)"],
    ["winback", "Win back lapsed customers", "days", "days without a visit"],
  ];
  return (
    <>
      <div className="section-head">
        <h2>Follow-up automations</h2>
      </div>
      <p className="sub">
        Rules that decide who shows up in “Follow up today.” Edit the wording
        to sound like you. {"{first}"}, {"{business}"}, {"{when}"}, {"{what}"},{" "}
        {"{review}"} and {"{offer}"} fill in automatically.
      </p>
      {rows.map(([key, title, unit, unitLabel]) => {
        const a = A[key];
        return (
          <div key={key} className="glass pad" style={{ marginTop: 10 }}>
            <div className="row">
              <span className="avatar sm" style={{ background: "#B69CFF", color: "#0A0F28" }}>
                <Icon name={FU_ICON[key]} />
              </span>
              <div className="grow" style={{ font: "700 16px var(--m-display)" }}>
                {title}
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={a.on}
                aria-label={title}
                onClick={() => {
                  update((d) => {
                    d.automations[key].on = !d.automations[key].on;
                  });
                  notify(title + (a.on ? " off" : " on"));
                }}
              >
                <span />
              </button>
            </div>
            <label className="row" style={{ marginTop: 12, fontSize: 13, color: "var(--m-text2)" }}>
              <input
                className="in"
                type="number"
                min={1}
                max={unit === "hours" ? 168 : 365}
                inputMode="numeric"
                style={{ width: 110 }}
                value={a[unit] ?? ""}
                onChange={(e) => {
                  const v = Math.round(parseFloat(e.target.value));
                  if (v > 0) {
                    update((d) => {
                      d.automations[key][unit] = v;
                    });
                  }
                }}
              />
              <span>{unitLabel}</span>
            </label>
            <textarea
              className="in"
              maxLength={320}
              aria-label={`${title} message`}
              style={{ marginTop: 10 }}
              value={a.text}
              onChange={(e) => {
                const v = e.target.value;
                update((d) => {
                  d.automations[key].text = v;
                });
              }}
            />
          </div>
        );
      })}
      <p className="note">
        This version suggests who to contact and writes the message. Sending
        automatically by text or email needs a messaging service connected to
        the app, and every customer’s permission.
      </p>
    </>
  );
}

function BizSettingsSheet({
  state,
  store,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  onClose: () => void;
}) {
  const { update, notify } = store;
  const b = myBizOf(state);
  const st = state.bizSettings;
  const [name, setName] = useState(b.name);
  const [cat, setCat] = useState(b.cat);
  const [area, setArea] = useState(b.area);
  const [avg, setAvg] = useState(String(b.avgSale));
  const [rev, setRev] = useState(st.reviewLink);
  const [off, setOff] = useState(st.winbackOffer);
  return (
    <Sheet open onClose={onClose} title="Business settings">
      <Field label="Business name">
        <input className="in" type="text" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <select className="in" value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Area">
        <select className="in" value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS_LIST.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
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
            update((d) => {
              const biz = d.businesses.filter((x) => x.id === d.myBiz)[0];
              if (biz) {
                biz.name = name.trim() || biz.name;
                biz.cat = cat;
                biz.area = area;
                biz.avgSale = Math.max(0, parseFloat(avg) || 0);
              }
              d.bizSettings.reviewLink = rev.trim() || "[YOUR REVIEW LINK]";
              d.bizSettings.winbackOffer = off.trim() || d.bizSettings.winbackOffer;
              d.bizSettings.avgSale = Math.max(0, parseFloat(avg) || 0);
            });
            onClose();
            notify("Saved.");
          }}
        >
          Save
        </button>
      </SheetActions>
    </Sheet>
  );
}

function AddCustomerSheet({
  state,
  store,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  onClose: () => void;
}) {
  const { update, notify } = store;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"visit" | "lead" | "appt">("visit");
  const [spend, setSpend] = useState("");
  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("");
  const [dt, setDt] = useState("");
  const [apptWhat, setApptWhat] = useState("");
  const [consent, setConsent] = useState(false);

  const crIds: Record<string, true> = {};
  myCollabsOf(state).forEach((c) => {
    if (c.stats || /accepted|submitted|approved|live/.test(c.status)) crIds[c.cr] = true;
  });
  const srcOpts: [string, string][] = [
    ...Object.keys(crIds).map((id): [string, string] => [id, `Creator: ${creatorById(state, id).handle}`]),
    ...["Walk-in", "Google", "Instagram", "Referral", "Other"].map((x): [string, string] => [x, x]),
  ];
  const [src, setSrc] = useState("Walk-in");

  return (
    <Sheet open onClose={onClose} title="Add a customer or lead">
      <Field label="Name">
        <input className="in" type="text" maxLength={60} autoComplete="off" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid2">
        <Field label="Phone">
          <input className="in" type="tel" maxLength={25} placeholder="(555) 010-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="in" type="email" maxLength={80} placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="How did they find you?" hint="Tip: ask “which creator sent you?” or check their promo code.">
        <select className="in" value={src} onChange={(e) => setSrc(e.target.value)}>
          {srcOpts.map(([v, l]) => (
            <option key={v + l} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What happened?">
        <select className="in" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="visit">They visited / bought</option>
          <option value="lead">They asked for a quote</option>
          <option value="appt">They booked an appointment</option>
        </select>
      </Field>
      {type === "visit" ? (
        <Field label="Amount spent ($)">
          <input className="in" type="number" min={0} inputMode="decimal" placeholder="Amount spent ($)" value={spend} onChange={(e) => setSpend(e.target.value)} />
        </Field>
      ) : null}
      {type === "lead" ? (
        <div className="grid2">
          <Field label="Quote for">
            <input className="in" type="text" maxLength={60} placeholder="e.g. catering for 30" value={what} onChange={(e) => setWhat(e.target.value)} />
          </Field>
          <Field label="Amount ($)">
            <input className="in" type="number" min={0} inputMode="decimal" placeholder="Quote amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        </div>
      ) : null}
      {type === "appt" ? (
        <div className="grid2">
          <Field label="Appointment">
            <input className="in" type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
          </Field>
          <Field label="For">
            <input className="in" type="text" maxLength={40} placeholder="e.g. haircut, table for 4" value={apptWhat} onChange={(e) => setApptWhat(e.target.value)} />
          </Field>
        </div>
      ) : null}
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        They agreed to receive texts or emails from us
      </label>
      <SheetActions>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (!name.trim()) {
              notify("Add a name.");
              return;
            }
            if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
              notify("Check the email address.");
              return;
            }
            const now = Date.now();
            const k: MarketCustomer = {
              id: uid("k", now),
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim(),
              consent,
              source: src,
              visits: 0,
              spend: 0,
              created: now,
              log: [{ ts: now, t: "Added" }],
            };
            if (type === "visit") {
              k.visits = 1;
              k.spend = Math.max(0, parseFloat(spend) || 0);
              k.lastVisit = now;
            }
            if (type === "lead") {
              if (!what.trim()) {
                notify("What is the quote for?");
                return;
              }
              k.lead = { what: what.trim(), amount: Math.max(0, parseFloat(amount) || 0) };
            }
            if (type === "appt") {
              const t = new Date(dt).getTime();
              if (!(t > now)) {
                notify("Pick a future date and time.");
                return;
              }
              k.nextAppt = t;
              k.apptWhat = apptWhat.trim();
            }
            update((d) => {
              d.customers.push(k);
            });
            onClose();
            notify("Saved.");
          }}
        >
          Save
        </button>
      </SheetActions>
    </Sheet>
  );
}

function CustomerDetailSheet({
  state,
  store,
  customerId,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  customerId: string;
  onClose: () => void;
}) {
  const { update, notify } = store;
  const [sub, setSub] = useState<null | "visit" | "book">(null);
  const [amount, setAmount] = useState("");
  const [dt, setDt] = useState("");
  const [apptWhat, setApptWhat] = useState("");
  const k = state.customers.filter((x) => x.id === customerId)[0];
  if (!k) return null;
  const now = Date.now();
  const srcCr =
    state.creators.some((c) => c.id === k.source) || k.source === "me" ? creatorById(state, k.source) : undefined;

  if (sub === "visit") {
    return (
      <Sheet open onClose={onClose} title={`Log a visit for ${k.name}`}>
        <Field label="Amount spent ($)">
          <input className="in" type="number" min={0} inputMode="decimal" placeholder="Amount spent ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <SheetActions>
          <button type="button" className="btn ghost" onClick={() => setSub(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const v = Math.max(0, parseFloat(amount) || 0);
              update((d) => {
                const f = d.customers.filter((x) => x.id === k.id)[0];
                if (!f) return;
                const t = Date.now();
                f.visits++;
                f.spend += v;
                f.lastVisit = t;
                f.reviewAsked = false;
                if (f.nextAppt && f.nextAppt - t < 6 * 36e5) {
                  f.nextAppt = null;
                  f.reminded = false;
                }
                (f.log = f.log || []).push({ ts: t, t: "Visit" + (amount ? ` · ${money(v)}` : "") });
              });
              onClose();
              notify("Visit logged. A review request will show up in follow-ups.");
            }}
          >
            Save visit
          </button>
        </SheetActions>
      </Sheet>
    );
  }
  if (sub === "book") {
    return (
      <Sheet open onClose={onClose} title={`Book ${k.name}`}>
        <Field label="Date and time">
          <input className="in" type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
        </Field>
        <Field label="For">
          <input className="in" type="text" maxLength={40} placeholder="e.g. haircut" value={apptWhat} onChange={(e) => setApptWhat(e.target.value)} />
        </Field>
        <SheetActions>
          <button type="button" className="btn ghost" onClick={() => setSub(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const t = new Date(dt).getTime();
              if (!(t > Date.now())) {
                notify("Pick a future date and time.");
                return;
              }
              update((d) => {
                const f = d.customers.filter((x) => x.id === k.id)[0];
                if (!f) return;
                f.nextAppt = t;
                f.apptWhat = apptWhat.trim();
                f.reminded = false;
                (f.log = f.log || []).push({ ts: Date.now(), t: "Booked " + when(t) });
              });
              onClose();
              notify("Booked.");
            }}
          >
            Book
          </button>
        </SheetActions>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={k.name}
      sub={`${srcCr ? `Came from ${srcCr.handle}’s video` : `Source: ${k.source}`} · ${k.visits} visit${k.visits === 1 ? "" : "s"} · ${money(k.spend)} spent`}
    >
      <div className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>
        {[k.phone, k.email].filter(Boolean).join(" · ") + (k.consent ? "" : " · no messaging permission")}
      </div>
      {k.lead && !k.lead.won ? (
        <div className="next">
          <div className="q">
            Open quote: {k.lead.what} ({money(k.lead.amount)})
            {k.lead.contacted ? ` · followed up ${ago(k.lead.contacted, now)}` : ""}
          </div>
        </div>
      ) : null}
      {k.nextAppt && k.nextAppt > now ? (
        <div className="next">
          <div className="q">
            Appointment {when(k.nextAppt)}
            {k.apptWhat ? ` · ${k.apptWhat}` : ""}
          </div>
        </div>
      ) : null}
      <div className="row wrap" style={{ marginTop: 14 }}>
        <button type="button" className="btn primary small" onClick={() => setSub("visit")}>
          <Icon name="check" /> Log a visit
        </button>
        {k.lead && !k.lead.won ? (
          <button
            type="button"
            className="btn gold small"
            onClick={() => {
              update((d) => {
                const f = d.customers.filter((x) => x.id === k.id)[0];
                if (!f || !f.lead) return;
                const t = Date.now();
                f.lead.won = true;
                f.visits++;
                f.spend += f.lead.amount;
                f.lastVisit = t;
                (f.log = f.log || []).push({ ts: t, t: "Won " + f.lead.what });
                notify(`Won! ${money(f.lead.amount)} added.`);
              });
            }}
          >
            <Icon name="dollar" /> Quote won
          </button>
        ) : null}
        <button type="button" className="btn ghost small" onClick={() => setSub("book")}>
          <Icon name="cal" /> Book appointment
        </button>
      </div>
      {k.log && k.log.length ? (
        <>
          <div className="label" style={{ marginTop: 18 }}>
            History
          </div>
          {k.log
            .slice(-6)
            .reverse()
            .map((e, i) => (
              <div key={i} className="muted" style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--m-line)" }}>
                {ago(e.ts, now)} · {e.t}
              </div>
            ))}
        </>
      ) : null}
      <SheetActions>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            update((d) => {
              d.customers = d.customers.filter((x) => x.id !== k.id);
            });
            onClose();
            notify("Deleted.");
          }}
        >
          Delete
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </SheetActions>
    </Sheet>
  );
}
