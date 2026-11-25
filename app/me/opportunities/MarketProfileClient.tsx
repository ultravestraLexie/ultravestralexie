"use client";

import { useState } from "react";
import Link from "next/link";
import { MKT_CSS } from "@/lib/marketplace-css";
import {
  Avatar,
  Field,
  SampleBanner,
  ToastView,
  useMarketStore,
} from "@/components/marketplace/Mkt";
import {
  AREAS_LIST,
  NICHES,
  PLATFORMS,
  fmtK,
} from "@/lib/marketplace";

/* The prototype's Profile view, ported: name, handle, area,
 * followers, niche chips, platform chips and usual rate, saved to
 * the device-local market store. The prototype's line "In the app
 * it comes from your Creator Passport" is kept in substance: this
 * profile is what the Local opportunities matching reads. */

export default function MarketProfileClient({ embedded }: { embedded?: boolean } = {}) {
  const store = useMarketStore();
  const { state, update, notify, toast } = store;
  const [draft, setDraft] = useState<null | {
    name: string;
    handle: string;
    area: string;
    followers: string;
    rate: string;
    niches: string[];
    platforms: string[];
  }>(null);

  if (!state) return null;
  const me = state.me;
  const d =
    draft ??
    {
      name: me.name,
      handle: me.handle,
      area: me.area,
      followers: String(me.followers),
      rate: String(me.rate),
      niches: [...me.niches],
      platforms: [...me.platforms],
    };
  const set = (patch: Partial<typeof d>) => setDraft({ ...d, ...patch });
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const card = (
        <div className="glass pad">
          <div className="row">
            <Avatar label={d.handle} id="me" round />
            <div className="grow">
              <div style={{ font: "700 18px var(--m-display)" }}>{d.name}</div>
              <div className="faint" style={{ fontSize: 13 }}>
                {d.handle} · {fmtK(Math.max(0, Math.round(parseFloat(d.followers) || 0)))} followers · {d.area}
              </div>
            </div>
          </div>
          <Field label="Name">
            <input className="in" type="text" maxLength={40} value={d.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Handle">
            <input className="in" type="text" maxLength={30} value={d.handle} onChange={(e) => set({ handle: e.target.value })} />
          </Field>
          <Field label="Your area">
            <select className="in" value={d.area} onChange={(e) => set({ area: e.target.value })}>
              {AREAS_LIST.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Followers (all platforms)"
            hint="Small is fine. A local creator with 2,000 followers can be worth more to a local shop than a celebrity."
          >
            <input className="in" type="number" min={0} inputMode="numeric" value={d.followers} onChange={(e) => set({ followers: e.target.value })} />
          </Field>
          <div className="field">
            <span>What you create</span>
            <div className="chips wrap">
              {NICHES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="chip"
                  aria-pressed={d.niches.includes(n)}
                  onClick={() => set({ niches: toggle(d.niches, n) })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Where you post</span>
            <div className="chips wrap">
              {PLATFORMS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="chip"
                  aria-pressed={d.platforms.includes(n)}
                  onClick={() => set({ platforms: toggle(d.platforms, n) })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Field label="Your usual rate per video ($)">
            <input className="in" type="number" min={0} inputMode="numeric" value={d.rate} onChange={(e) => set({ rate: e.target.value })} />
          </Field>
          <button
            type="button"
            className="btn primary block"
            style={{ marginTop: 18 }}
            onClick={() => {
              if (!d.niches.length) {
                notify("Pick at least one thing you create.");
                return;
              }
              let h = d.handle.trim();
              if (h && h.charAt(0) !== "@") h = "@" + h;
              const next = {
                name: d.name.trim() || "You",
                handle: h || "@yourhandle",
                niches: d.niches,
                area: d.area,
                followers: Math.max(0, Math.round(parseFloat(d.followers) || 0)),
                platforms: d.platforms.length ? d.platforms : [PLATFORMS[0]],
                rate: Math.max(0, Math.round(parseFloat(d.rate) || 0)),
              };
              update((draftState) => {
                draftState.me = next;
              });
              setDraft(null);
              notify("Saved. Your matches just updated.");
            }}
          >
            Save profile
          </button>
        </div>
  );

  if (embedded)
    return (
      <>
        {card}
        <ToastView msg={toast} />
      </>
    );

  return (
    <div className="mkt">
      <style>{MKT_CSS}</style>
      <div className="mkt-col">
        <Link href="/me" className="back" style={{ textDecoration: "none" }}>
          ← Me
        </Link>
        <h1 className="title">Local gigs profile</h1>
        <p className="sub">
          This is how we match you with businesses in Local opportunities.
          In the app it comes from your Creator Passport.
        </p>
        <SampleBanner onReset={store.reset} />
        {card}
        <ToastView msg={toast} />
      </div>
    </div>
  );
}
