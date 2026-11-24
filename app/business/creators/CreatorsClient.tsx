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
  ToastView,
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  acceptCollab,
  collabOf,
  creatorById,
  fmtK,
  inviteCreator,
  matchCreator,
  money,
  myBizOf,
  oppById,
  rateLabel,
  setCollabStatus,
  demoStats,
  type MarketCreator,
  type MarketState,
} from "@/lib/marketplace";

/* BUSINESS CREATORS — the prototype's creator directory (cards with
 * handle, niches, area, followers, engagement, avg views, collabs
 * done, on-time, usual rate) with Invite, inside the business area
 * (owner order 2026-11-24). An invite creates an "invited" collab
 * in the device-local store — the same store the creator side
 * reads — over the prototype's seed creators, SAMPLE-labeled. */

export default function CreatorsClient() {
  const store = useMarketStore();
  const { state, toast } = store;
  const [bfilter, setBfilter] = useState("Match");
  const [inviteId, setInviteId] = useState<string | null>(null);

  if (!state) return null;
  const b = myBizOf(state);
  const filters = ["Match", "Local", b.cat, "Under 5K", "Most collabs"];
  let pool = [...state.creators, creatorById(state, "me")].map((c) => ({
    c,
    m: matchCreator(state, b, c),
  }));
  if (bfilter === "Local") pool = pool.filter((x) => x.c.area === b.area);
  if (bfilter === b.cat) pool = pool.filter((x) => x.c.niches.indexOf(b.cat) >= 0);
  if (bfilter === "Under 5K") pool = pool.filter((x) => x.c.followers < 5000);
  pool.sort((a, z) => (bfilter === "Most collabs" ? z.c.done - a.c.done : z.m.score - a.m.score));

  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <div className="mkt-col">
        <Link href="/business/home" className="back" style={{ textDecoration: "none" }}>
          <Icon name="back" /> Business home
        </Link>
        <h1 className="title">Find creators</h1>
        <p className="sub">
          Local creators who fit {b.name}. Big followings are optional. Real
          local fans matter more.
        </p>
        <SampleBanner onReset={store.reset} />
        <div className="chips" role="group" aria-label="Filter creators">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              className="chip"
              aria-pressed={bfilter === f}
              onClick={() => setBfilter(f)}
            >
              {f === "Match" ? "Best match" : f === b.cat ? `${b.cat} creators` : f}
            </button>
          ))}
        </div>
        <div className="stack" style={{ marginTop: 14 }}>
          {!pool.length ? (
            <div className="glass empty">No creators match this filter yet.</div>
          ) : null}
          {pool.map(({ c, m }) => (
            <div key={c.id} className="glass collab">
              <div className="head">
                <Avatar label={c.handle} id={c.id} round />
                <div className="grow">
                  <div className="t">
                    {c.handle}
                    {c.isMe ? " (you, demo)" : ""}
                  </div>
                  <div className="s">
                    {c.niches.join(", ")} · {c.area}
                    {c.area === b.area ? " (local)" : ""}
                  </div>
                </div>
                <Ring score={m.score} />
              </div>
              <div className="stats4" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {[
                  [fmtK(c.followers), "Followers"],
                  [c.views ? fmtK(c.views) : "—", "Avg views"],
                  [c.eng ? `${c.eng}%` : "—", "Engagement"],
                  [String(c.done), "Collabs"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <b>{v}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                {m.reasons.slice(0, 3).map((r) => (
                  <span key={r} className="tag t-cyan">
                    {r}
                  </span>
                ))}
                {c.onTime >= 98 && c.done ? <span className="tag t-green">Always on time</span> : null}
                <span className="tag t-gold">Usually {money(c.rate)}/video</span>
              </div>
              <button
                type="button"
                className="btn primary small"
                style={{ marginTop: 12 }}
                onClick={() => setInviteId(c.id)}
              >
                <Icon name="plus" /> Invite to a campaign
              </button>
            </div>
          ))}
        </div>
        {inviteId ? (
          <InviteSheet state={state} store={store} creatorId={inviteId} onClose={() => setInviteId(null)} />
        ) : null}
        <ToastView msg={toast} />
      </div>
    </div>
  );
}

function InviteSheet({
  state,
  store,
  creatorId,
  onClose,
}: {
  state: MarketState;
  store: ReturnType<typeof useMarketStore>;
  creatorId: string;
  onClose: () => void;
}) {
  const { update, notify, demoReply } = store;
  const cr: MarketCreator = creatorById(state, creatorId);
  const open = state.opps.filter(
    (o) => o.biz === state.myBiz && o.status === "open" && !collabOf(state, o.id, cr.id)
  );
  const [which, setWhich] = useState(open[0]?.id ?? "");
  const [amt, setAmt] = useState(open[0] ? String(open[0].rate) : "");
  const [note, setNote] = useState(
    `Hi ${cr.handle}! We love your content and think our customers would love you too. Want to work together?`
  );
  const selected = which ? oppById(state, which) : undefined;

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Invite ${cr.handle}`}
      sub={open.length ? "Pick a campaign and your offer." : "You don’t have an open campaign they’re not already in."}
    >
      {!open.length ? (
        <SheetActions>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <Link href="/business/campaigns" className="btn gold" style={{ textDecoration: "none" }}>
            Post one
          </Link>
        </SheetActions>
      ) : (
        <>
          <Field label="Campaign">
            <select
              className="in"
              value={which}
              onChange={(e) => {
                setWhich(e.target.value);
                const o = oppById(state, e.target.value);
                if (o) setAmt(String(o.rate));
              }}
            >
              {open.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`Your offer (${selected ? rateLabel(selected) : "fee"}, $)`}
            hint={`${cr.handle} usually charges ${money(cr.rate)} per video.`}
          >
            <input className="in" type="number" min={1} inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} />
          </Field>
          <Field label="Message">
            <textarea className="in" maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <SheetActions>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                if (!selected) return;
                const v = Math.round(parseFloat(amt));
                if (!(v > 0)) {
                  notify("Enter an offer.");
                  return;
                }
                let createdId = "";
                update((d) => {
                  const c = inviteCreator(d, selected.id, cr.id, { rate: v, msg: note.trim() }, Date.now());
                  createdId = c.id;
                });
                onClose();
                if (cr.isMe) {
                  notify("Invite sent! It is waiting in Local opportunities on the creator side.");
                } else {
                  notify(`Invite sent to ${cr.handle}.`);
                  demoReply(createdId, (d) => {
                    const fresh = d.collabs.filter((x) => x.id === createdId)[0];
                    if (fresh) {
                      acceptCollab(d, createdId, Date.now());
                      notify(`Demo: ${cr.handle} accepted your invite.`);
                    }
                  });
                  demoReply(
                    createdId,
                    (d) => {
                      const fresh = d.collabs.filter((x) => x.id === createdId)[0];
                      if (fresh && fresh.status === "accepted") {
                        const o = oppById(d, fresh.opp);
                        setCollabStatus(d, createdId, "submitted", Date.now(), {
                          video: cr.handle.replace("@", "tiktok.com/@") + " (sample draft)",
                          caption: `My new favorite spot! ${o.offer} with code ${fresh.code}.`,
                        });
                        notify(`Demo: ${cr.handle} submitted a video for review.`);
                      }
                    },
                    7000
                  );
                }
              }}
            >
              Send invite
            </button>
          </SheetActions>
        </>
      )}
    </Sheet>
  );
}
