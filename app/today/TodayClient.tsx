"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ACTIVE_STAGES,
  CAP_LABEL,
  EMPTY_ANSWERS,
  LOOP_ACCENT,
  LOOP_SEVERITY_LABEL,
  LOOP_SEVERITY_TONE,
  QUESTIONS,
  STAGES,
  firstMoveTitle,
  fmtMoney,
  isOverdue,
  loopClearCount,
  loopNextMove,
  plural,
  reminderText as mkReminder,
  shortMoney,
  stageOf,
  type AdvisorReport,
  type GalaxyBrand,
  type GalaxyDeal,
  type GalaxyProfile,
  type Insight,
  type LoopStep,
  type LoopStepId,
} from "@/lib/galaxy/core";
import { DealSheet } from "@/components/galaxy/DealSheet";
import { useDealSync } from "@/components/galaxy/useDealSync";
import { PitchSheet } from "@/components/galaxy/PitchSheet";
import { ProfileSheet } from "@/components/galaxy/ProfileSheet";
import { Icon, I, copyText, toast } from "@/components/galaxy/ui";

const KIND_ICON: Record<Insight["kind"], string> = {
  overdue:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.6v4M8 11.2v.2" stroke-linecap="round"/></svg>',
  risk:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M8 2l6.5 11.5h-13z"/><path d="M8 6.5v3.2M8 11.6v.2" stroke-linecap="round"/></svg>',
  followup:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.4 1.6"/></svg>',
  pitch:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8l-5.3 2.9 1.1-6-4.4-4.2 6-.8z"/></svg>',
  rhythm:
    '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l1.5 5.5L15 8l-5.5 1.5L8 15l-1.5-5.5L1 8l5.5-1.5z"/></svg>',
  studio:
    '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.2v9.6L12.6 8z"/></svg>',
};
const KIND_CLASS: Record<Insight["kind"], string> = {
  overdue: "rgba(255,92,122,.12)|#FF8CA3",
  risk: "rgba(245,184,74,.12)|#F5B84A",
  followup: "rgba(76,116,255,.14)|#8FA6FF",
  pitch: "rgba(155,92,255,.15)|#CDB4FF",
  rhythm: "rgba(15,163,154,.15)|#7FE3D6",
  studio: "rgba(76,116,255,.14)|#8FA6FF",
};

function hash(s: string): number {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Props = {
  greeting: string;
  firstName: string;
  summary: string;
  profile: GalaxyProfile;
  deals: GalaxyDeal[];
  insights: Insight[];
  advisor: AdvisorReport;
  loop: LoopStep[];
  pitchBrands: GalaxyBrand[];
  paidCount: number;
  paidThisMonthCents: number;
  savedCount: number;
  scriptCount: number;
  postsThisWeek: number;
  weekDays: { key: string; label: string; full: string; on: boolean; today: boolean }[];
  categories: string[];
};

export default function TodayClient(p: Props) {
  const router = useRouter();
  const [ask, setAsk] = useState("all");
  const [loopOpen, setLoopOpen] = useState<LoopStepId | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);
  const [pitchId, setPitchId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  /* Deal writes made through the sheet are applied over the
   * server props as they land (see useDealSync), so the orbit,
   * legend and steps move on the same render; the server-computed
   * insights and summary still arrive via the refresh backstop. */
  const { deals, applyDeal } = useDealSync(p.deals);

  const deal = deals.find((d) => d.id === dealId) ?? null;
  const pitchBrand = p.pitchBrands.find((b) => b.id === pitchId) ?? null;
  const list = ask === "all" ? p.insights.slice(0, 7) : p.insights.filter((x) => x.kind === ask);
  const isNew = deals.length === 0;

  const steps = useMemo(
    () => [
      { t: "Tell us your niche", done: Boolean(p.profile.niche), cta: "Add niche", act: "profile" as const },
      { t: "Save 3 brands that fit", done: p.savedCount >= 3, cta: "Find brands", act: "go" as const, to: "/brands" },
      { t: "Send your first pitch", done: deals.length > 0, cta: "Write pitch", act: "go" as const, to: "/brands" },
      { t: "Add what a deal is worth", done: deals.some((d) => (d.amountCents ?? 0) > 0), cta: "Open Deals", act: "go" as const, to: "/deals" },
      { t: "Check a script in the Video Lab", done: p.scriptCount > 0, cta: "Open lab", act: "go" as const, to: "/studio" },
    ],
    [p, deals]
  );
  const stepsDone = steps.filter((s) => s.done).length;
  const showSteps = stepsDone < steps.length;

  async function logPost() {
    const platform = (p.profile.platforms[0] ?? "other").toLowerCase();
    const allowed = ["tiktok", "instagram", "facebook", "trybe", "other"];
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: allowed.includes(platform) ? platform : "other",
          postedDate: new Date().toISOString().slice(0, 10),
          state: "published",
        }),
      });
      if (res.ok) {
        toast("Post logged for today.");
        router.refresh();
      } else toast("The post could not be logged. Please try again.");
    } catch {
      toast("The post could not be logged. Please try again.");
    }
  }

  async function onAction(a: Insight) {
    if (a.act === "open-deal" || a.act === "followup") {
      if (a.dealId) setDealId(a.dealId);
    } else if (a.act === "reminder") {
      const d = deals.find((x) => x.id === a.dealId);
      if (d) {
        const ok = await copyText(mkReminder(p.profile, d));
        toast(ok ? "Reminder copied — paste it anywhere." : "Copy failed.");
      }
    } else if (a.act === "pitch") {
      if (a.brandId) setPitchId(a.brandId);
    } else if (a.act === "logpost") {
      void logPost();
    } else if (a.act === "go" && a.to) {
      router.push(a.to);
    }
  }

  const orbit = (
    <svg
      viewBox="0 0 400 400"
      role="group"
      aria-label="Deal orbit. Each dot is a deal. Deals move toward the center as they get closer to paid."
      className="gx-orbit-svg"
    >
      <defs>
        <radialGradient id="coreGlow">
          <stop offset="0" stopColor="#FFF8E2" />
          <stop offset=".72" stopColor="#F1DFA8" />
          <stop offset=".9" stopColor="#C6A6FF" stopOpacity=".9" />
          <stop offset="1" stopColor="#9B7BFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreHalo">
          <stop offset="0" stopColor="#E8D3FF" stopOpacity=".55" />
          <stop offset="1" stopColor="#6B7CFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbitHaze">
          <stop offset="0" stopColor="#5A6CFF" stopOpacity=".2" />
          <stop offset=".7" stopColor="#5A6CFF" stopOpacity=".05" />
          <stop offset="1" stopColor="#5A6CFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="199" fill="url(#orbitHaze)" />
      {ACTIVE_STAGES.map((sid) => {
        const r = [178, 148, 118, 90, 64][ACTIVE_STAGES.indexOf(sid)];
        return <circle key={sid} cx="200" cy="200" r={r} fill="none" stroke="rgba(150,170,255,.16)" strokeWidth="1" />;
      })}
      {ACTIVE_STAGES.map((sid, i) => {
        const ds = deals.filter((d) => d.stage === sid);
        if (!ds.length) return null;
        const r = [178, 148, 118, 90, 64][i];
        const dur = [280, 220, 175, 135, 100][i];
        const base = hash(sid) % 360;
        const color = stageOf(sid).color;
        return (
          <g key={sid} className="gx-orbit-spin" style={{ ["--dur" as string]: `${dur}s` }}>
            {ds.map((d, j) => {
              const a = ((base + (j * 360) / ds.length) * Math.PI) / 180;
              const x = 200 + r * Math.cos(a);
              const y = 200 + r * Math.sin(a);
              const rad = Math.max(5, Math.min(12, 4 + Math.sqrt((d.amountCents ?? 0) / 100) / 6));
              const late = isOverdue(d);
              const label = `${d.brandName}, ${stageOf(sid).label.toLowerCase()}, ${d.amountCents ? fmtMoney(d.amountCents) : "value not set"}${late ? ", overdue" : ""}`;
              return (
                <g
                  key={d.id}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                  style={{ cursor: "pointer", outline: "none" }}
                  onClick={() => setDealId(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDealId(d.id);
                    }
                  }}
                >
                  <title>{label}</title>
                  <circle cx={x} cy={y} r={rad + 8} fill={color} opacity={0.2} />
                  {late ? (
                    <circle cx={x} cy={y} r={rad + 4.5} fill="none" stroke="#FF5C7A" strokeWidth="2" strokeDasharray="3 3" />
                  ) : null}
                  <circle cx={x} cy={y} r={rad} fill={color} stroke="#0A0F2E" strokeWidth="2" />
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx="200" cy="200" r={33 + Math.min(10, p.paidThisMonthCents / 100 / 300) + 30} fill="url(#coreHalo)" />
      <circle cx="200" cy="200" r={33 + Math.min(10, p.paidThisMonthCents / 100 / 300)} fill="url(#coreGlow)" />
      <text x="200" y="200" textAnchor="middle" style={{ font: "600 13px var(--display)", fill: "#1A1446" }}>
        {shortMoney(p.paidThisMonthCents)}
      </text>
      <text x="200" y="213" textAnchor="middle" style={{ font: "600 8.5px var(--body)", fill: "#3B2E7A" }}>
        this month
      </text>
    </svg>
  );

  const legend = (
    <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, maxWidth: 440 }} aria-label="Pipeline by stage">
      {STAGES.slice(0, 5).map((st) => {
        const ds = deals.filter((d) => d.stage === st.id);
        const late = st.id === "invoiced" ? deals.filter((d) => isOverdue(d)).length : 0;
        return (
          <li key={st.id} className="gx-legend-li">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: st.color, boxShadow: `0 0 10px ${st.color}` }} />
            <span>
              {st.label}
              {late ? (
                <span style={{ color: "#FFB6C4", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                  <Icon html={I.alert} size={13} />
                  {late} overdue
                </span>
              ) : null}
            </span>
            <span style={{ color: "var(--ink-3)", fontSize: 13.5 }}>{plural(ds.length, "deal")}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>
              {fmtMoney(ds.reduce((t, d) => t + (d.amountCents ?? 0), 0))}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const stepsPanel = showSteps ? (
    <section className="gx-panel" aria-labelledby="start-h">
      <div className="gx-panel-head">
        <h2 id="start-h">Your first day</h2>
        <span className="gx-muted">
          {stepsDone} of {steps.length} done
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={stepsDone}
        style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.07)", overflow: "hidden", marginTop: 12 }}
      >
        <i style={{ display: "block", height: "100%", width: `${(stepsDone / steps.length) * 100}%`, borderRadius: 99, background: "linear-gradient(90deg, var(--gx-accent), var(--gx-accent-2))" }} />
      </div>
      <ol style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
        {steps.map((s, i) => (
          <li
            key={s.t}
            className="gx-step-li"
            style={{
              borderTop: i === 0 ? "none" : "1px solid var(--line)",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                font: "600 11.5px var(--display)",
                border: "1px solid var(--line-2)",
                color: "var(--ink-2)",
                ...(s.done
                  ? { background: "var(--good)", borderColor: "transparent", color: "#05301C" }
                  : {}),
              }}
            >
              {s.done ? <Icon html={I.check} size={13} /> : i + 1}
            </span>
            <span style={s.done ? { color: "var(--ink-3)", textDecoration: "line-through" } : undefined}>{s.t}</span>
            {s.done ? (
              <span className="gx-sr">Done</span>
            ) : s.act === "profile" ? (
              <button type="button" className="gx-btn gx-btn-sm" onClick={() => setProfileOpen(true)}>
                {s.cta}
              </button>
            ) : (
              <Link href={s.to ?? "/today"} className="gx-btn gx-btn-sm" style={{ textDecoration: "none" }}>
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  ) : null;

  /* Creator Business Advisor (System #5): diagnostics only — the
   * actions live in "What needs you" below; this panel reads the
   * business and points at the list's first move. Every figure
   * comes from the advisor report computed in core.ts. */
  const adv = p.advisor;
  const firstMove = firstMoveTitle(p.insights);
  const conc = adv.concentration;
  const concFlagged = Boolean(
    conc && conc.paidDealCount >= 2 && conc.topSharePct >= 60
  );
  const week = adv.weekAhead;
  const advisorPanel = (
    <section className="gx-panel" aria-labelledby="advisor-h">
      <div className="gx-panel-head">
        <h2 id="advisor-h">Your business advisor</h2>
        <span className="gx-muted">Read from your own deals, money and brands</span>
      </div>
      <div className="gx-adv-block">
        <div className="gx-adv-label">Today&rsquo;s first move</div>
        <div style={{ fontWeight: 600, lineHeight: 1.35 }}>
          {firstMove ?? EMPTY_ANSWERS.all}
        </div>
        {firstMove ? (
          <p className="gx-sub">It is the top action in &ldquo;What needs you&rdquo; below.</p>
        ) : null}
      </div>
      <div className="gx-adv-block">
        <div className="gx-adv-label">Income health</div>
        {conc ? (
          <div>
            {concFlagged ? (
              <p style={{ margin: "0 0 6px", lineHeight: 1.45 }}>
                <span className="gx-pill gx-pill-warn">
                  One brand is {conc.topSharePct}% of your deal income — if they
                  pause, the month breaks
                </span>
              </p>
            ) : null}
            <p style={{ margin: 0, lineHeight: 1.45 }}>
              {conc.topBrandName} is your top payer at {conc.topSharePct}% of paid
              deal income. {plural(conc.payingBrands, "paying brand")} · income in{" "}
              {conc.monthsWithIncome} of the last 6 months.
            </p>
            <p className="gx-sub">Figured from your paid deals.</p>
          </div>
        ) : (
          <p style={{ margin: 0, lineHeight: 1.45 }}>
            No income pattern to read yet. Once paid deals land, this shows where
            your deal money comes from — and whether one brand carries it.
          </p>
        )}
      </div>
      {adv.neglectedCount > 0 ? (
        <div className="gx-adv-block">
          <div className="gx-adv-label">Neglected opportunities</div>
          <div>
            {adv.neglected.map((b) => (
              <div key={b.id} className="gx-adv-row">
                <div>
                  <div style={{ fontWeight: 600, lineHeight: 1.35 }}>{b.name}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginTop: 2 }}>
                    Saved by you, accepting now
                    {b.rate != null
                      ? ` · ${b.rate}% commission, ${CAP_LABEL[b.cap].toLowerCase()}`
                      : ` · commission ${CAP_LABEL[b.cap].toLowerCase()}`}
                  </div>
                </div>
                <button
                  type="button"
                  className="gx-btn gx-btn-sm"
                  onClick={() => setPitchId(b.id)}
                >
                  Write pitch
                </button>
              </div>
            ))}
          </div>
          {adv.neglectedCount > adv.neglected.length ? (
            <p className="gx-sub">
              Plus {plural(adv.neglectedCount - adv.neglected.length, "more saved brand")}{" "}
              waiting in Brands.
            </p>
          ) : null}
        </div>
      ) : null}
      {week ? (
        <div className="gx-adv-block">
          <div className="gx-adv-label">The week ahead</div>
          <p style={{ margin: 0, lineHeight: 1.45 }}>
            {week.covered
              ? `${week.label} is covered — ${fmtMoney(week.expectedCents)} expected against your ${fmtMoney(adv.baselineCents)} average month.`
              : `${week.label} looks ${fmtMoney(week.gapCents)} light against your ${fmtMoney(adv.baselineCents)} average month.`}
            {!week.covered && week.dealsToClose
              ? ` About ${plural(week.dealsToClose, "average deal")} at your usual size would close it.`
              : ""}
          </p>
        </div>
      ) : null}
    </section>
  );

  const weekPanel = (
    <section className="gx-panel" aria-labelledby="week-h">
      <div className="gx-panel-head">
        <h2 id="week-h">Posting rhythm</h2>
        <span className="gx-muted">Goal {p.profile.weeklyGoal || 5} a week</span>
      </div>
      <div style={{ font: "500 26px/1.1 var(--display)" }}>
        {p.postsThisWeek} of {p.profile.weeklyGoal || 5}
      </div>
      <p className="gx-sub">videos posted in the last 7 days</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, margin: "16px 0 14px", textAlign: "center" }}>
        {p.weekDays.map((d) => (
          <div key={d.key}>
            <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, display: "block", margin: "0 auto 4px", color: d.on ? "#FFE7A3" : "rgba(150,170,255,.25)", filter: d.on ? "drop-shadow(0 0 6px rgba(255,220,140,.7))" : undefined }} aria-hidden="true">
              <path fill="currentColor" d="M12 2.5l2.2 6.6 6.8.4-5.3 4.2 1.8 6.6L12 16.5l-5.5 3.8 1.8-6.6L3 9.5l6.8-.4z" />
            </svg>
            <span style={{ fontSize: 11.5, color: d.today ? "var(--ink)" : "var(--ink-3)", fontWeight: d.today ? 600 : 400 }} aria-hidden="true">
              {d.label}
            </span>
            <span className="gx-sr">
              {d.full}: {d.on ? "posted" : "no post"}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="gx-btn gx-btn-sm" onClick={() => void logPost()}>
        <Icon html={I.plus} size={14} /> Log a post today
      </button>
    </section>
  );

  /* The Creator Loop — the product's spine, V2 per the owner's
   * reference design (2026-11-23): a severity model (critical /
   * action / attention / clear), a loop-health bar, a "Your next
   * move" card naming the single most urgent step, and expandable
   * stage rows whose item buttons and CTAs navigate to the real
   * surface (Deals board, Brands, the brand dossier, Passport,
   * Money). Order on screen never changes — it is a cycle, not a
   * ranking; only the next-move card ranks. */
  const LOOP_TILE: Record<LoopStepId, string> = {
    find: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16.6 16.6"/></svg>',
    negotiate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5h12.5l-3-3"/><path d="M20 15.5H7.5l3 3"/></svg>',
    protect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 2.8v5.4c0 4.6-3 7.7-7 9.3-4-1.6-7-4.7-7-9.3V5.8z"/><path d="M9.2 12l2 2 3.6-3.8"/></svg>',
    collect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v1"/><path d="M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5H19a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16.6" cy="15" r="1.15" fill="currentColor" stroke="none"/></svg>',
    grow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v16h16"/><path d="M7.5 15.5l3.5-4 3 2.5 4.5-5.5"/><path d="M15.8 8.4h2.9v2.9"/></svg>',
  };
  const nextMove = loopNextMove(p.loop);
  const clearCount = loopClearCount(p.loop);
  const severityPill = (status: LoopStep["status"]) => (
    <span
      className="gx-pill"
      style={{
        color: LOOP_SEVERITY_TONE[status],
        background: `${LOOP_SEVERITY_TONE[status]}24`,
        boxShadow: `inset 0 0 0 1px ${LOOP_SEVERITY_TONE[status]}55`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: LOOP_SEVERITY_TONE[status],
        }}
      />
      {LOOP_SEVERITY_LABEL[status]}
    </span>
  );
  const loopPanel = (
    <section className="gx-panel" aria-labelledby="loop-h" style={{ marginBottom: 20 }}>
      <div className="gx-panel-head">
        <h2 id="loop-h">Your creator loop</h2>
        <span
          className="gx-muted"
          style={{ letterSpacing: "0.14em", fontSize: 11.5, fontWeight: 600 }}
        >
          YOUR BUSINESS. ONE CONNECTED SYSTEM.
        </span>
      </div>

      {/* Loop health: one segment per stage, coloured by severity */}
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          <span>Loop health</span>
          <strong style={{ color: "var(--ink)", fontWeight: 600 }}>
            {clearCount} of 5 stages clear
          </strong>
        </div>
        <div
          role="img"
          aria-label={p.loop
            .map((s) => `${s.label}: ${LOOP_SEVERITY_LABEL[s.status]}`)
            .join(", ")}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 4,
            marginTop: 8,
          }}
        >
          {p.loop.map((s) => (
            <span
              key={s.id}
              style={{ height: 6, borderRadius: 99, background: LOOP_SEVERITY_TONE[s.status] }}
            />
          ))}
        </div>
      </div>

      {/* Your next move: the single most urgent stage */}
      {nextMove ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            background: `${LOOP_SEVERITY_TONE[nextMove.status]}14`,
            border: `1px solid ${LOOP_SEVERITY_TONE[nextMove.status]}59`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 600, color: "var(--ink-3)" }}>
              YOUR NEXT MOVE
            </span>
            {severityPill(nextMove.status)}
          </div>
          <p
            style={{
              margin: "12px 0 0",
              font: "600 12px var(--display)",
              letterSpacing: "0.16em",
              color: LOOP_ACCENT[nextMove.id],
            }}
          >
            {String(p.loop.findIndex((s) => s.id === nextMove.id) + 1).padStart(2, "0")} ·{" "}
            {nextMove.label}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 650, lineHeight: 1.3 }}>
            {nextMove.headline}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--ink-2)" }}>
            {nextMove.detail}
          </p>
          <Link
            href={nextMove.ctaHref}
            className="gx-btn"
            style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: 14 }}
          >
            {nextMove.ctaLabel}
          </Link>
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            background: `${LOOP_SEVERITY_TONE.clear}12`,
            border: `1px solid ${LOOP_SEVERITY_TONE.clear}55`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, letterSpacing: "0.14em", fontWeight: 600, color: "var(--ink-3)" }}>
              YOUR NEXT MOVE
            </span>
            {severityPill("clear")}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 19, fontWeight: 650, lineHeight: 1.3 }}>
            Every stage is clear
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--ink-2)" }}>
            Your loop is running clean. Line up the next brand.
          </p>
          <Link
            href="/brands"
            className="gx-btn"
            style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: 14 }}
          >
            Find opportunities
          </Link>
        </div>
      )}

      {/* The five stages, expandable */}
      <ol style={{ listStyle: "none", margin: "18px 0 0", padding: 0 }}>
        {p.loop.map((s, i) => {
          const isOpen = loopOpen === s.id;
          const tone = LOOP_SEVERITY_TONE[s.status];
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`loop-panel-${s.id}`}
                aria-label={`${s.label}: ${s.headline}`}
                onClick={() => setLoopOpen(isOpen ? null : s.id)}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  width: "100%",
                  padding: "6px 0",
                  cursor: "pointer",
                  borderRadius: 14,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    flex: "none",
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    display: "grid",
                    placeItems: "center",
                    color: LOOP_ACCENT[s.id],
                    background: `${LOOP_ACCENT[s.id]}22`,
                    boxShadow: isOpen
                      ? `inset 0 0 0 1.5px ${LOOP_ACCENT[s.id]}`
                      : `inset 0 0 0 1px ${LOOP_ACCENT[s.id]}45`,
                  }}
                >
                  <Icon html={LOOP_TILE[s.id]} size={23} />
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: tone,
                      boxShadow: "0 0 0 2px rgba(8, 9, 20, 0.85)",
                    }}
                  />
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      font: "600 12px var(--display)",
                      letterSpacing: "0.16em",
                      color: "var(--ink-2)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} · {s.label}
                  </span>
                  <span style={{ fontWeight: 600, lineHeight: 1.35 }}>{s.headline}</span>
                  <span style={{ alignSelf: "flex-start", marginTop: 2 }}>
                    {severityPill(s.status)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "none",
                    color: "var(--ink-3)",
                    fontSize: 20,
                    lineHeight: 1,
                    transform: isOpen ? "rotate(90deg)" : undefined,
                    transition: "transform .2s",
                  }}
                >
                  ›
                </span>
              </button>
              {isOpen && (
                <div
                  id={`loop-panel-${s.id}`}
                  style={{
                    margin: "6px 0 4px",
                    padding: 14,
                    borderRadius: 14,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--ink-2)" }}>
                    {s.detail}
                  </p>
                  {s.items.length > 0 && (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "12px 0 0",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {s.items.map((it) => (
                        <li
                          key={it.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 12,
                            background: "rgba(255,255,255,.04)",
                          }}
                        >
                          {it.done ? (
                            <span
                              aria-hidden="true"
                              style={{ flex: "none", color: LOOP_SEVERITY_TONE.clear, display: "grid", placeItems: "center" }}
                            >
                              <Icon
                                html='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
                                size={15}
                              />
                            </span>
                          ) : (
                            <span
                              aria-hidden="true"
                              style={{
                                flex: "none",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: LOOP_SEVERITY_TONE[it.tone],
                              }}
                            />
                          )}
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{it.title}</span>
                            {it.meta ? (
                              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{it.meta}</span>
                            ) : null}
                          </span>
                          {it.actionLabel && (
                            <Link
                              href={it.href}
                              className="gx-btn gx-btn-sm"
                              style={{ textDecoration: "none", flex: "none" }}
                            >
                              {it.actionLabel}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={s.ctaHref}
                    className="gx-btn"
                    style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: 14 }}
                  >
                    {s.ctaLabel}
                  </Link>
                </div>
              )}
              {i < p.loop.length - 1 ? (
                <div aria-hidden="true" style={{ paddingLeft: 21, color: "var(--ink-3)", fontSize: 13, lineHeight: 1.2 }}>
                  ↓
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div
        style={{
          borderTop: "1px solid var(--line)",
          marginTop: 14,
          paddingTop: 14,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            color: "var(--ink-2)",
          }}
        >
          <Icon
            html='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 3v4h-4"/></svg>'
            size={17}
          />
          <span style={{ font: "600 12.5px var(--display)", letterSpacing: "0.16em" }}>
            GROW → FIND AGAIN
          </span>
        </div>
        <p style={{ margin: "6px 0 2px", fontSize: 13, color: "var(--ink-3)" }}>
          {clearCount === 5
            ? "Loop closed. Every stage is clear."
            : `Clear ${plural(5 - clearCount, "more stage")} to close the loop.`}
        </p>
      </div>
    </section>
  );

  return (
    <div>
      <section aria-labelledby="hello" className="gx-hero">
        <div className="gx-hero-text">
          <h1 id="hello" className="gx-hero-h1">
            {p.firstName ? `${p.greeting}, ${p.firstName}.` : "Welcome to Ultra Vestra."}
          </h1>
          <p className="gx-hero-sub" style={{ color: "var(--ink-2)", margin: "16px 0 0", maxWidth: "40ch" }}>{p.summary}</p>
          <div style={{ marginTop: 18 }}>{legend}</div>
        </div>
        <div>{orbit}</div>
      </section>

      {loopPanel}

      <p style={{ margin: "-4px 0 18px", fontSize: 13.5, color: "var(--ink-3)" }}>
        Something broken?{" "}
        <Link href="/support" style={{ color: "var(--gx-accent)", fontWeight: 600 }}>
          Get help →
        </Link>
      </p>

      <div className="gx-today-grid">
        <div style={{ display: "grid", gap: 20 }}>
          {isNew ? stepsPanel : null}
          {advisorPanel}
          <section className="gx-panel" aria-labelledby="next-h">
            <div className="gx-panel-head">
              <h2 id="next-h">What needs you</h2>
              <span className="gx-muted">From your own deals, money and brands</span>
            </div>
            <div className="gx-chips gx-ask-chips" role="group" aria-label="Ask Ultra Vestra" style={{ margin: "2px 0 6px" }}>
              {QUESTIONS.map((q) => (
                <button key={q.id} type="button" className="gx-chip" aria-pressed={ask === q.id} onClick={() => setAsk(q.id)}>
                  {q.q}
                </button>
              ))}
            </div>
            {list.length ? (
              <ul className="gx-list">
                {list.map((a, i) => {
                  const [bg, fg] = (KIND_CLASS[a.kind] ?? "").split("|");
                  return (
                    <li key={i} className="gx-action-li">
                      <span style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: bg, color: fg }}>
                        <Icon html={KIND_ICON[a.kind]} size={16} />
                      </span>
                      <div>
                        {a.dealId ? (
                          <button
                            type="button"
                            onClick={() => setDealId(a.dealId!)}
                            style={{ fontWeight: 600, lineHeight: 1.35, background: "none", border: 0, padding: 0, textAlign: "left", cursor: "pointer", color: "var(--ink)", boxShadow: "none" }}
                          >
                            {a.title}
                          </button>
                        ) : (
                          <div style={{ fontWeight: 600, lineHeight: 1.35 }}>{a.title}</div>
                        )}
                        <div style={{ color: "var(--ink-3)", fontSize: 13.5, marginTop: 2 }}>{a.why}</div>
                      </div>
                      <button
                        type="button"
                        className={`gx-btn gx-btn-sm ${a.kind === "overdue" ? "gx-btn-primary" : ""}`}
                        onClick={() => void onAction(a)}
                      >
                        {a.cta}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="gx-empty">
                <p>{EMPTY_ANSWERS[ask]}</p>
              </div>
            )}
          </section>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          {isNew ? null : stepsPanel}
          {weekPanel}
        </div>
      </div>

      <DealSheet
        deal={deal}
        profile={p.profile}
        open={Boolean(deal)}
        onClose={() => setDealId(null)}
        onChanged={(updated) => {
          applyDeal(updated);
          router.refresh();
        }}
      />
      <PitchSheet
        brand={pitchBrand}
        profile={p.profile}
        paidCount={p.paidCount}
        open={Boolean(pitchBrand)}
        onClose={() => setPitchId(null)}
        onSent={(created) => {
          if (created) applyDeal(created);
          router.refresh();
        }}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} categories={p.categories} />
    </div>
  );
}
