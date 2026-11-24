"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

/* Shared shell for the Creator Economy frames in Me (Year in Review,
 * Invite, Next Level, Challenges, Hall of Fame, What If). The CSS is
 * the prototype's stylesheet, scoped under .econ with --e- prefixed
 * variables so nothing leaks into (or is leaked into) the app; the
 * prototype's page chrome (gallery, phone frames, its own tab bar)
 * is not ported — the app's navigation stands. */

export const ECON_CSS = `
.econ{--e-bg:#070B1F;--e-surface:#10173A;--e-surface2:#18214D;--e-line:#26306A;--e-line2:#1E2754;--e-line3:#3A4580;--e-text:#F2F4FF;--e-text2:#D5DAF5;--e-muted:#A3ACD6;--e-faint:#8E98C8;--e-blue:#4C7DFF;--e-blue-soft:#9DB8FF;--e-blue-btn:#3563E9;--e-purple:#B69CFF;--e-gold:#F5C451;--e-diamond:#9EE7FF;--e-green:#4ADE80;--e-orange:#F59E42;--e-bronze:#D69A6B;--e-silver:#C5CCE0;--e-display:'Space Grotesk',system-ui,sans-serif;--e-body:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:dark;max-width:430px;margin:0 auto;border-radius:28px;border:1px solid var(--e-line);background:radial-gradient(600px 300px at 85% -5%,rgba(76,125,255,.18),transparent 60%),var(--e-bg);color:var(--e-text);font:16px/1.5 var(--e-body);overflow:hidden;overflow-x:clip;-webkit-font-smoothing:antialiased}
.econ *{box-sizing:border-box;min-width:0}
.econ button{font-family:var(--e-body);cursor:pointer}
.econ a{color:var(--e-blue-soft)}
.econ :focus-visible{outline:2px solid var(--e-blue-soft);outline-offset:2px;border-radius:10px}
.econ svg.i{width:20px;height:20px;flex-shrink:0}
.econ .fx{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit}
.econ .orb{position:absolute;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(76,125,255,.38) 0%,rgba(7,11,31,0) 68%)}
.econ .orb.gold{width:200px;height:200px;background:radial-gradient(circle,rgba(245,196,81,.22) 0%,rgba(16,23,58,0) 70%)}
.econ .star{position:absolute;width:2px;height:2px;border-radius:50%;background:#C9D7FF;opacity:.7}
.econ .star.lg{width:3px;height:3px;opacity:.55}
.econ .star.p{background:var(--e-purple)}
.econ .lift{position:relative}
.econ .screen{position:relative;display:flex;flex-direction:column}
.econ .story{padding:28px 24px;gap:16px}
.econ .story-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.econ .brand{display:flex;align-items:center;gap:10px}
.econ .uv{width:34px;height:34px;border-radius:50%;border:2px solid var(--e-purple);display:grid;place-items:center;font:700 13px var(--e-display);color:var(--e-text);box-shadow:0 0 14px rgba(182,156,255,.45);flex-shrink:0}
.econ .wordmark{font:700 15px var(--e-display);letter-spacing:2px}
.econ .tag{padding:5px 10px;border-radius:999px;border:1px solid var(--e-blue);font-size:10px;font-weight:600;letter-spacing:1.5px;white-space:nowrap}
.econ .kicker{font-size:11px;letter-spacing:3px;color:var(--e-muted);font-weight:600}
.econ .lede{font-size:15px;line-height:1.45;color:var(--e-text2);max-width:300px;margin:0}
.econ .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.econ .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.econ .stat{background:var(--e-surface);border:1px solid var(--e-line);border-radius:16px;padding:14px 16px}
.econ .stat b{display:block;font:700 36px/1 var(--e-display)}
.econ .stat span{display:block;font-size:12px;color:var(--e-muted);margin-top:8px}
.econ .caption{font-size:11px;color:var(--e-faint);text-align:center;margin:0}
.econ .tagline{text-align:center;font-size:11px;letter-spacing:3px;color:var(--e-faint);font-weight:600;margin:0}
.econ .year{font:700 72px/1 var(--e-display);color:var(--e-blue);letter-spacing:-1px}
.econ .verified{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.45);color:var(--e-green);font-size:10px;font-weight:700}
.econ .verified svg{width:10px;height:10px}
.econ .achievement{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:var(--e-surface);border:1px solid rgba(245,196,81,.5)}
.econ .achievement .ico{background:rgba(245,196,81,.12);color:var(--e-gold);width:44px;height:44px}
.econ .mini{padding:10px;border-radius:12px;background:var(--e-surface);border:1px solid var(--e-line)}
.econ .mini b{display:block;font-size:12px;font-weight:600;line-height:1.25}
.econ .mini span{display:block;font-size:11px;color:var(--e-faint);margin-top:4px}
.econ .topbar{display:flex;align-items:center;gap:12px;padding:16px 20px 0}
.econ .icon-btn{width:44px;height:44px;flex-shrink:0;border-radius:12px;background:var(--e-surface);border:1px solid var(--e-line);color:var(--e-text);display:grid;place-items:center;padding:0;text-decoration:none}
.econ .icon-btn.primary{background:var(--e-blue-btn);border-color:var(--e-blue-btn);color:#fff}
.econ .screen-title{flex:1;min-width:0;font:700 20px var(--e-display);margin:0}
.econ .screen-sub{font-size:12px;color:var(--e-muted);margin-top:2px}
.econ .chip{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;background:var(--e-surface);border:1px solid var(--e-line);font-size:12px;color:var(--e-text2);white-space:nowrap}
.econ .chip svg{width:13px;height:13px}
.econ .body{display:flex;flex-direction:column;gap:14px;padding:20px}
.econ .hero-title{font:700 28px/1.15 var(--e-display);margin:0}
.econ .hero-sub{font-size:14px;color:var(--e-muted);margin:8px 0 0;line-height:1.5}
.econ .card{background:var(--e-surface);border:1px solid var(--e-line);border-radius:18px}
.econ .card.glow{border-color:var(--e-blue);box-shadow:0 0 24px rgba(76,125,255,.2)}
.econ .pad{padding:16px}
.econ .stack{display:flex;flex-direction:column;gap:10px}
.econ .label{font-size:11px;letter-spacing:1.5px;color:var(--e-muted);font-weight:600;text-transform:uppercase}
.econ .field{display:flex;gap:8px}
.econ .field input{flex:1;min-width:0;height:44px;padding:0 12px;border-radius:12px;background:var(--e-bg);border:1px solid var(--e-line);color:var(--e-text);font:14px var(--e-body)}
.econ .btn{width:100%;height:48px;border-radius:14px;background:var(--e-blue-btn);border:none;color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px}
.econ .btn:hover{background:#2D55D0}
.econ .btn-ghost{height:44px;padding:0 16px;border-radius:12px;background:var(--e-surface2);border:1px solid var(--e-line3);color:var(--e-text);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.econ .btn-ghost[aria-pressed="true"]{background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.5);color:var(--e-green)}
.econ .link-btn{background:none;border:none;color:var(--e-blue-soft);font-size:12px;font-weight:600;padding:12px 0 12px 8px;min-height:44px}
.econ .list{display:flex;flex-direction:column}
.econ .row{display:flex;align-items:center;gap:12px;padding:11px 14px}
.econ .row + .row{border-top:1px solid var(--e-line2)}
.econ .grow{flex:1;min-width:0}
.econ .t{font-size:14px;font-weight:600}
.econ .s{font-size:12px;color:var(--e-faint);margin-top:2px}
.econ .ico{width:36px;height:36px;flex-shrink:0;border-radius:50%;display:grid;place-items:center}
.econ .ico svg{width:17px;height:17px}
.econ .ico.purple{background:rgba(182,156,255,.15);color:var(--e-purple)}
.econ .ico.blue{background:rgba(76,125,255,.15);color:var(--e-blue)}
.econ .ico.cyan{background:rgba(158,231,255,.12);color:var(--e-diamond)}
.econ .ico.gold{background:rgba(245,196,81,.12);color:var(--e-gold)}
.econ .ico.green{background:rgba(74,222,128,.12);color:var(--e-green)}
.econ .ico.orange{background:rgba(245,158,66,.14);color:var(--e-orange)}
.econ .status{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;white-space:nowrap}
.econ .status svg{width:14px;height:14px}
.econ .bar{height:6px;border-radius:999px;background:var(--e-surface2);overflow:hidden}
.econ .bar.thick{height:8px}
.econ .bar > span{display:block;height:100%;border-radius:999px;background:var(--e-blue)}
.econ .between{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.econ .steps .num{width:36px;height:36px;flex-shrink:0;border-radius:12px;background:var(--e-surface2);display:grid;place-items:center;font:700 15px var(--e-display);color:var(--e-blue-soft)}
.econ .level-card{padding:18px;display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;overflow:hidden}
.econ .ring{width:140px;height:140px;position:relative}
.econ .ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.econ .tiers{width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));position:relative}
.econ .tiers::before{content:"";position:absolute;left:12.5%;right:12.5%;top:11px;height:2px;background:var(--e-line)}
.econ .tier-step{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;z-index:1;font-size:11px;color:var(--e-muted)}
.econ .dot{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:var(--e-bg)}
.econ .dot svg{width:12px;height:12px}
.econ .days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;padding-top:4px}
.econ .day{width:36px;height:36px;justify-self:center;border-radius:50%;display:grid;place-items:center;font-size:12px;color:var(--e-faint);border:1px solid var(--e-line3)}
.econ .day.done{background:var(--e-blue-btn);border-color:var(--e-blue-btn);color:#fff}
.econ .day.done svg{width:14px;height:14px}
.econ .day.today{border:2px solid var(--e-blue);color:var(--e-text);font-weight:700;box-shadow:0 0 12px rgba(76,125,255,.5)}
.econ .pill-week{align-self:flex-start;padding:4px 10px;border-radius:999px;background:rgba(182,156,255,.15);color:var(--e-purple);font-size:10px;font-weight:700;letter-spacing:1.5px}
.econ .race{display:flex;align-items:center;gap:12px;height:44px}
.econ .avatar{width:30px;height:30px;flex-shrink:0;border-radius:50%;background:var(--e-surface2);display:grid;place-items:center;font-size:10px;font-weight:700;color:var(--e-text2)}
.econ .race .name{width:96px;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.econ .race .bar{flex:1}
.econ .race .n{width:28px;text-align:right;font-size:12px;font-weight:600}
.econ .tabs{display:flex;gap:8px;overflow-x:auto;padding:16px 20px 0;scrollbar-width:none}
.econ .tabs::-webkit-scrollbar{display:none}
.econ .tab{flex-shrink:0;height:44px;padding:0 16px;border-radius:999px;background:var(--e-surface);border:1px solid var(--e-line);color:var(--e-text2);font-size:13px;font-weight:600;white-space:nowrap}
.econ .tab[aria-pressed="true"]{background:var(--e-blue-btn);border-color:var(--e-blue-btn);color:#fff}
.econ .podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end}
.econ .place{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.econ .place .crown{width:24px;height:22px;color:var(--e-gold)}
.econ .place .av{border-radius:50%;border:2px solid;background:var(--e-surface2);display:grid;place-items:center;font:700 15px var(--e-display)}
.econ .place .h{font-size:12px;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.econ .place .m{font-size:11px;color:var(--e-muted);text-align:center;line-height:1.3;min-height:28px}
.econ .place .base{width:100%;border-radius:12px 12px 0 0;background:var(--e-surface);border:1px solid var(--e-line);border-bottom:none;display:flex;justify-content:center;padding-top:8px;font:700 22px var(--e-display)}
.econ .rank-row{display:flex;align-items:center;gap:12px;height:46px}
.econ .rank-row .r{width:20px;font:700 14px var(--e-display);color:var(--e-faint)}
.econ .rank-row .h{flex:1;min-width:0;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.econ .rank-row .m{font-size:12px;color:var(--e-muted);white-space:nowrap}
.econ .you{display:flex;align-items:center;gap:12px;padding:0 14px;min-height:56px;border-radius:16px;background:var(--e-surface);border:1px solid var(--e-blue);box-shadow:0 0 20px rgba(76,125,255,.2)}
.econ .you .avatar{background:#1C3170;color:var(--e-blue-soft)}
.econ .wi-q{font:700 22px/1.2 var(--e-display);margin:0}
.econ .wi-field + .wi-field{margin-top:12px}
.econ .wi-field label{font-size:13px;color:var(--e-text2)}
.econ .wi-field output{font:700 14px var(--e-display);color:var(--e-text);white-space:nowrap}
.econ .wi-field input[type="range"]{width:100%;height:32px;margin:2px 0 0;accent-color:var(--e-purple);background:transparent}
.econ .legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--e-muted)}
.econ .legend i{display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
.econ .path-card{padding:14px;border-radius:16px;background:var(--e-surface);border:1px solid var(--e-line);min-width:0}
.econ .path-card.what{border-color:var(--e-purple);box-shadow:0 0 20px rgba(182,156,255,.18)}
.econ .path-card .k{font-size:11px;letter-spacing:1px;color:var(--e-muted);font-weight:600;text-transform:uppercase}
.econ .path-card b{display:block;font:700 22px var(--e-display);margin-top:6px;overflow-wrap:anywhere}
.econ .path-card span{display:block;font-size:12px;color:var(--e-faint);margin-top:2px}
.econ .diff{padding:14px 16px;border-radius:16px;background:rgba(182,156,255,.1);border:1px solid rgba(182,156,255,.4)}
.econ .diff b{font:700 22px var(--e-display);color:var(--e-purple)}
.econ .diff.neg{background:rgba(245,158,66,.1);border-color:rgba(245,158,66,.45)}
.econ .diff.neg b{color:var(--e-orange)}
.econ .outcomes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.econ .outcome{padding:10px;border-radius:12px;background:var(--e-surface);border:1px solid var(--e-line);min-width:0}
.econ .outcome.mid{border-color:var(--e-purple)}
.econ .outcome .k{font-size:10px;color:var(--e-muted);font-weight:700;letter-spacing:1px;text-transform:uppercase}
.econ .outcome b{display:block;font:700 15px var(--e-display);margin-top:4px;overflow-wrap:anywhere}
.econ .outcome span{display:block;font-size:11px;color:var(--e-faint);margin-top:2px;line-height:1.3}
.econ .note{font-size:11px;color:var(--e-faint);line-height:1.5;margin:0}
.econ .x-btn{width:44px;height:44px;flex-shrink:0;border-radius:12px;background:transparent;border:1px solid var(--e-line);color:var(--e-muted);display:grid;place-items:center;padding:0}
.econ .x-btn svg{width:16px;height:16px}
.econ .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:var(--e-surface2);border:1px solid var(--e-line3);color:var(--e-text);padding:12px 18px;border-radius:12px;font:600 14px var(--e-body);transition:opacity .2s,transform .2s;pointer-events:none;z-index:60}
.econ .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

/* ---------- icons (the prototype's sprite, transcribed) ---------- */

const PATHS: Record<string, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  share: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </g>
  ),
  copy: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    </g>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />,
  lock: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </g>
  ),
  star: <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />,
  trophy: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3" />
      <path d="M17 6h3v1a3 3 0 0 1-3 3" />
    </g>
  ),
  gift: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <path d="M12 8v13" />
      <path d="M12 8c-2-3-6-3-6-.5S10 8 12 8zm0 0c2-3 6-3 6-.5S14 8 12 8z" />
    </g>
  ),
  diamond: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l3 6-9 12L3 9z" />
      <path d="M3 9h18" />
      <path d="m9 3 3 6 3-6" />
    </g>
  ),
  tag: (
    <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </g>
  ),
  users: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.8c1.8.7 3 2.4 3.5 5.2" />
    </g>
  ),
  "user-plus": (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </g>
  ),
  clock: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  ),
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  route: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 18h8" />
      <path d="M6 16v-4a6 6 0 0 1 6-6h4" />
    </g>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
};

export function Ico({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className ?? "i"} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ---------- toast / copy / share (the prototype's behaviours) ---------- */

export function useEconToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1800);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const el = <div className={`toast${msg ? " show" : ""}`} role="status" aria-live="polite">{msg ?? ""}</div>;
  return { show, el };
}

export async function econCopy(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error("no clipboard");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** The prototype's share: the phone's share sheet when available,
 *  otherwise copy the link/text. */
export async function econShare(text: string, url?: string): Promise<"shared" | "copied" | "failed"> {
  const data: ShareData = { title: "Ultra Vestra", text };
  if (url && /^https?:\/\//.test(url)) data.url = url;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch {
      /* dismissed or unavailable — fall through to copy */
    }
  }
  const ok = await econCopy(url ? text + " " + url : text);
  return ok ? "copied" : "failed";
}

/* ---------- shared frame furniture ---------- */

export function EconHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="topbar">
      <Link className="icon-btn" href="/me" aria-label="Back to Me">
        <Ico name="back" />
      </Link>
      {sub ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="screen-title" style={{ flex: "none" }}>{title}</h3>
          <div className="screen-sub">{sub}</div>
        </div>
      ) : (
        <h3 className="screen-title">{title}</h3>
      )}
      {right}
    </div>
  );
}

export function EconStars({ points }: { points: [string, string?, string?][] }) {
  return (
    <div className="fx" aria-hidden="true">
      {points.map(([left, top, cls], i) => (
        <span key={i} className={`star${cls ? " " + cls : ""}`} style={{ left, top }} />
      ))}
    </div>
  );
}

export function EconWrap({ children }: { children: ReactNode }) {
  return (
    <div className="econ">
      <style>{ECON_CSS}</style>
      {children}
    </div>
  );
}
