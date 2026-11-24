"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HELP_SUGGEST,
  SECTION_NAME,
  answerFor,
  articleById,
  fillTokens,
  sensitiveFinds,
  type HelpArticle,
} from "@/lib/galaxy/help";
import { supportTicketRef, type SupportTicket } from "@/lib/galaxy/core";

/* Shared shell for the Support & About package (the owner's
 * "Ultra Vestra Help Center" prototype ported behind Settings,
 * 2026-11-24): the prototype's stylesheet scoped under .hlp with
 * --h- prefixed variables, its icon set, the floating Ask button
 * and the Ask Vestra Help chat. The chat answers ONLY from the
 * ported corpus (lib/galaxy/help) via the prototype's own local
 * matching — no external AI. Its "Talk to a person" handoff files
 * a REAL support request through the existing /api/support flow
 * (support_tickets), never a mailto and never a second system. */

export const HELP_CSS = `
.hlp{--h-page:#04060F;--h-glass:rgba(14,20,52,.78);--h-glass2:rgba(24,33,77,.75);--h-edge:rgba(130,150,255,.18);--h-edge2:rgba(130,150,255,.34);--h-line:rgba(130,150,255,.12);--h-text:#F2F4FF;--h-text2:#D5DAF5;--h-muted:#A3ACD6;--h-faint:#8E98C8;--h-blue:#4C7DFF;--h-blue-soft:#9DB8FF;--h-blue-btn:#3563E9;--h-purple:#B69CFF;--h-gold:#F5C451;--h-orange:#F59E42;--h-green:#4ADE80;--h-red:#FF8A8A;--h-display:'Space Grotesk',system-ui,sans-serif;--h-body:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:dark;max-width:640px;margin:0 auto;color:var(--h-text);font:16px/1.5 var(--h-body);-webkit-font-smoothing:antialiased}
.hlp *{box-sizing:border-box;min-width:0}
.hlp button{font-family:var(--h-body);color:inherit}
.hlp a{color:var(--h-blue-soft)}
.hlp :focus-visible{outline:2px solid var(--h-purple);outline-offset:1px}
.hlp svg.i{width:20px;height:20px;flex-shrink:0}
.hlp .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.hlp .glass{background:var(--h-glass);border:1px solid var(--h-edge);border-radius:20px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.hlp .pad{padding:18px}
.hlp .group-label{font-size:13px;font-weight:600;color:var(--h-faint);margin:26px 6px 10px}
.hlp .list{display:flex;flex-direction:column;overflow:hidden}
.hlp .item{display:flex;align-items:center;gap:14px;width:100%;min-height:58px;padding:12px 16px;background:none;border:none;text-align:left;cursor:pointer;text-decoration:none;color:var(--h-text);font-size:16px;font-weight:600}
.hlp .item + .item{border-top:1px solid var(--h-line)}
.hlp .item:hover{background:rgba(130,150,255,.06)}
.hlp .item .ico{width:36px;height:36px;flex-shrink:0;border-radius:12px;display:grid;place-items:center;background:rgba(130,150,255,.12);color:var(--h-blue-soft)}
.hlp .item .ico svg{width:19px;height:19px}
.hlp .item .grow{flex:1;min-width:0}
.hlp .item .sub{display:block;font-size:12px;font-weight:500;color:var(--h-faint);margin-top:2px}
.hlp .item .chev{color:var(--h-faint);width:18px;height:18px}
.hlp .item.danger{color:var(--h-red)}
.hlp .item.danger .ico{background:rgba(255,138,138,.12);color:var(--h-red)}
.hlp .hero{padding:22px 18px;position:relative;overflow:hidden}
.hlp .hero::after{content:"";position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(182,156,255,.35),transparent 70%);pointer-events:none}
.hlp .hero h2{font:700 26px/1.15 var(--h-display);margin:0 0 6px;position:relative}
.hlp .hero p{margin:0;color:var(--h-muted);font-size:14px;line-height:1.5;position:relative}
.hlp .search{position:relative;margin-top:16px}
.hlp .search > svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--h-faint);width:18px;height:18px;pointer-events:none}
.hlp .search input{width:100%;height:50px;border-radius:16px;border:1px solid var(--h-edge2);background:rgba(4,6,15,.55);padding:0 14px 0 42px;font-size:15px;color:var(--h-text);font-family:var(--h-body)}
.hlp .search input::placeholder{color:var(--h-faint)}
.hlp .search input:focus{outline:2px solid var(--h-purple);outline-offset:1px}
.hlp .btn{min-height:48px;border-radius:14px;border:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:15px;cursor:pointer;padding:0 18px;text-decoration:none}
.hlp .btn.primary{background:var(--h-blue-btn);color:#fff}
.hlp .btn.primary:hover{background:#2D55D0}
.hlp .btn.ghost{background:var(--h-glass2);border:1px solid var(--h-edge2);color:var(--h-text)}
.hlp .btn.danger{background:#B4232F;color:#fff}
.hlp .btn.block{width:100%}
.hlp .btn:disabled{opacity:.45;cursor:not-allowed}
.hlp .chips{display:flex;flex-wrap:wrap;gap:8px}
.hlp .chip{min-height:40px;padding:8px 14px;border-radius:999px;background:var(--h-glass2);border:1px solid var(--h-edge);font-size:13px;font-weight:600;color:var(--h-text2);cursor:pointer;text-align:left}
.hlp .chip:hover{border-color:var(--h-purple);color:var(--h-text)}
.hlp .page-title{font:700 30px/1.1 var(--h-display);margin:6px 2px 6px}
.hlp .page-sub{color:var(--h-muted);font-size:14px;line-height:1.5;margin:0 2px 4px}
.hlp .cat-head{display:flex;align-items:center;gap:10px;margin:22px 6px 10px;font:700 15px var(--h-display)}
.hlp .cat-head .count{font:600 12px var(--h-body);color:var(--h-faint)}
.hlp .art-row{font-size:15px;font-weight:500}
.hlp .empty{padding:18px;color:var(--h-muted);font-size:14px;text-align:center}
.hlp .crumb{font-size:12px;color:var(--h-faint);margin:4px 2px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.hlp .crumb a{color:var(--h-blue-soft);font-size:12px;font-weight:600;text-decoration:none}
.hlp .article h2{font:700 28px/1.15 var(--h-display);margin:0 0 14px}
.hlp .article p{font-size:16px;line-height:1.65;color:var(--h-text2);margin:0 0 14px}
.hlp .article ul{margin:0 0 14px;padding-left:20px;color:var(--h-text2);font-size:16px;line-height:1.6}
.hlp .article li{margin-bottom:6px}
.hlp .helpful{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:8px;padding:14px 16px}
.hlp .helpful span{font-weight:600;font-size:14px}
.hlp .cards4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
.hlp .mini{padding:14px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:8px;min-height:112px;text-decoration:none;color:var(--h-text)}
.hlp .mini:hover{border-color:var(--h-edge2)}
.hlp .mini .ico{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(182,156,255,.15);color:var(--h-purple)}
.hlp .mini .ico svg{width:18px;height:18px}
.hlp .mini b{font-size:14px}
.hlp .mini span{font-size:12px;color:var(--h-muted);line-height:1.4}
.hlp .toggle-row{display:flex;align-items:center;gap:14px;padding:14px 16px}
.hlp .toggle-row + .toggle-row{border-top:1px solid var(--h-line)}
.hlp .toggle-row .grow{flex:1;min-width:0}
.hlp .toggle-row .t{font-size:15px;font-weight:600}
.hlp .toggle-row .s{font-size:12px;color:var(--h-faint);margin-top:3px;line-height:1.4}
.hlp .switch{width:52px;height:32px;flex-shrink:0;border-radius:999px;border:1px solid var(--h-edge2);background:rgba(130,150,255,.14);position:relative;cursor:pointer;padding:0;transition:background .2s}
.hlp .switch span{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#C9D0F0;transition:transform .2s,background .2s}
.hlp .switch[aria-checked="true"]{background:var(--h-blue-btn);border-color:var(--h-blue-btn)}
.hlp .switch[aria-checked="true"] span{transform:translateX(20px);background:#fff}
.hlp .foot{text-align:center;font-size:11px;letter-spacing:3px;color:var(--h-faint);margin-top:28px;font-weight:600}
.hlp .ver{text-align:center;font-size:12px;color:var(--h-faint);margin-top:6px}
.hlp .back-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.hlp .icon-btn{width:44px;height:44px;flex-shrink:0;border-radius:14px;background:var(--h-glass);border:1px solid var(--h-edge);display:grid;place-items:center;cursor:pointer;padding:0;color:var(--h-text);text-decoration:none}
.hlp .icon-btn:hover{border-color:var(--h-edge2)}
.hlp .fab{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:20;display:inline-flex;align-items:center;gap:8px;min-height:56px;padding:0 20px 0 16px;border-radius:999px;border:none;cursor:pointer;background:linear-gradient(135deg,#6E4DFF,var(--h-blue-btn));color:#fff;font-weight:700;font-size:15px;box-shadow:0 10px 34px rgba(76,125,255,.45),0 0 0 1px rgba(255,255,255,.12) inset}
.hlp .fab svg{width:22px;height:22px}
.hlp .chat{position:fixed;z-index:35;inset:0;display:flex;flex-direction:column;background:#070B1F}
@media (min-width:700px){.hlp .chat{inset:auto 20px 20px auto;width:400px;height:min(680px,calc(100vh - 40px));border-radius:24px;border:1px solid var(--h-edge2);box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden}}
.hlp .chat-head{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top)) 16px 14px;background:linear-gradient(135deg,rgba(110,77,255,.35),rgba(53,99,233,.25));border-bottom:1px solid var(--h-edge)}
.hlp .chat-head .who{flex:1;min-width:0}
.hlp .chat-head b{display:block;font:700 17px var(--h-display)}
.hlp .chat-head small{display:flex;align-items:center;gap:6px;color:var(--h-text2);font-size:12px;margin-top:2px}
.hlp .chat-head small i{width:8px;height:8px;border-radius:50%;background:var(--h-green);display:inline-block}
.hlp .uv{width:34px;height:34px;flex-shrink:0;border-radius:50%;border:2px solid var(--h-purple);display:grid;place-items:center;font:700 13px var(--h-display);box-shadow:0 0 16px rgba(182,156,255,.45)}
.hlp .shield{display:flex;align-items:center;gap:8px;margin:12px 14px 0;padding:10px 12px;border-radius:12px;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);font-size:12px;color:var(--h-text2);line-height:1.4}
.hlp .shield svg{width:18px;height:18px;color:var(--h-green);flex-shrink:0}
.hlp .msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.hlp .msg{max-width:88%;padding:12px 14px;border-radius:18px;font-size:15px;line-height:1.5}
.hlp .msg.bot{align-self:flex-start;background:var(--h-glass2);border:1px solid var(--h-edge);border-bottom-left-radius:6px}
.hlp .msg.me{align-self:flex-end;background:var(--h-blue-btn);color:#fff;border-bottom-right-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere}
.hlp .msg.warn{align-self:flex-start;background:rgba(245,158,66,.1);border:1px solid rgba(245,158,66,.45);border-bottom-left-radius:6px}
.hlp .msg.warn b{color:var(--h-orange)}
.hlp .msg b.title{display:block;font:700 15px var(--h-display);margin-bottom:6px}
.hlp .msg p{margin:0 0 8px}
.hlp .msg p:last-child{margin-bottom:0}
.hlp .msg ul{margin:0 0 8px;padding-left:18px}
.hlp .msg .src{display:inline-flex;align-items:center;gap:6px;margin-top:8px;min-height:36px;padding:0 12px;border-radius:10px;background:rgba(4,6,15,.5);border:1px solid var(--h-edge);font-size:12px;font-weight:600;color:var(--h-blue-soft);cursor:pointer;text-decoration:none}
.hlp .msg .src svg{width:14px;height:14px}
.hlp .msg .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.hlp .mini-btn{min-height:36px;padding:0 12px;border-radius:10px;background:rgba(4,6,15,.45);border:1px solid var(--h-edge2);font-size:13px;font-weight:600;cursor:pointer;color:var(--h-text)}
.hlp .mini-btn:hover{border-color:var(--h-purple)}
.hlp .mini-btn[aria-pressed="true"]{border-color:var(--h-green);color:var(--h-green)}
.hlp .typing{display:inline-flex;gap:4px;align-items:center;height:20px}
.hlp .typing i{width:7px;height:7px;border-radius:50%;background:var(--h-muted);animation:hlp-bounce 1s infinite ease-in-out}
.hlp .typing i:nth-child(2){animation-delay:.15s}
.hlp .typing i:nth-child(3){animation-delay:.3s}
@keyframes hlp-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}
.hlp .suggest{padding:0 14px 10px}
.hlp .composer{padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid var(--h-edge);background:rgba(10,15,40,.95)}
.hlp .compose-box{display:flex;align-items:flex-end;gap:8px;border:1px solid var(--h-edge2);border-radius:18px;padding:6px 6px 6px 14px;background:rgba(4,6,15,.6)}
.hlp .compose-box:focus-within{border-color:var(--h-purple)}
.hlp .compose-box textarea{flex:1;min-width:0;resize:none;border:none;background:transparent;font-size:15px;line-height:1.4;padding:9px 0;max-height:110px;outline:none;color:var(--h-text);font-family:var(--h-body)}
.hlp .compose-box textarea::placeholder{color:var(--h-faint)}
.hlp .send{width:44px;height:44px;border-radius:14px;border:none;background:var(--h-blue-btn);color:#fff;display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.hlp .send:disabled{opacity:.4;cursor:not-allowed}
.hlp .compose-meta{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--h-faint);margin:6px 4px 0}
.hlp .handoff label{display:block;font-size:12px;color:var(--h-text2);margin:8px 0 4px}
.hlp .field{width:100%;min-height:42px;border-radius:12px;border:1px solid var(--h-edge2);background:rgba(4,6,15,.6);padding:10px 12px;font-size:14px;color:var(--h-text);font-family:var(--h-body)}
.hlp .field:focus{outline:2px solid var(--h-purple);outline-offset:1px}
.hlp textarea.field{min-height:80px;resize:vertical}
.hlp .sheet-backdrop{position:fixed;inset:0;z-index:40;background:rgba(2,3,10,.65);display:flex;align-items:flex-end;justify-content:center}
.hlp .sheet{width:min(520px,100%);margin:0 10px calc(10px + env(safe-area-inset-bottom));padding:22px 18px 18px;border-radius:24px;background:rgba(14,20,52,.98);border:1px solid var(--h-edge2)}
.hlp .sheet h2{font:700 21px var(--h-display);margin:0 0 8px}
.hlp .sheet p{margin:0 0 14px;color:var(--h-muted);font-size:14px;line-height:1.5}
.hlp .sheet .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
.hlp .sheet label{display:block;font-size:13px;color:var(--h-text2);margin-bottom:6px}
.hlp .toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);opacity:0;background:rgba(24,33,77,.97);border:1px solid var(--h-edge2);padding:12px 18px;border-radius:14px;font-size:14px;font-weight:600;transition:opacity .2s,transform .2s;pointer-events:none;z-index:60;max-width:90vw;text-align:center;color:var(--h-text)}
.hlp .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media (prefers-reduced-motion: reduce){.hlp *, .hlp *::before, .hlp *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}}
`;

export function HlpStyle() {
  return <style>{HELP_CSS}</style>;
}

// ================= Icons (the prototype's set) =================
const PATHS: Record<string, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  chev: <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  headset: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" /></g>,
  lock: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></g>,
  info: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5h.01" /></g>,
  swap: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h12l-3-3" /><path d="M17 17H5l3 3" /></g>,
  logout: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4" /><path d="M6 12h10" /></g>,
  shield: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></g>,
  flag: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></g>,
  search: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></g>,
  chat: <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  send: <path d="M4 12 20 4l-6 16-3-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  book: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M8 7h7" /></g>,
  eye: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>,
  db: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></g>,
  gear: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></g>,
  download: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></g>,
  trash: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></g>,
  doc: <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></g>,
};

export function HIcon({ n, cls }: { n: string; cls?: string }) {
  return (
    <svg className={cls ?? "i"} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[n]}
    </svg>
  );
}

// ================= Article body / row =================
export function ArticleBody({
  article,
  limit,
}: {
  article: HelpArticle;
  limit?: number;
}) {
  const items = limit ? article.b.slice(0, limit) : article.b;
  return (
    <>
      {items.map((x, i) =>
        Array.isArray(x) ? (
          <ul key={i}>
            {x.map((li, j) => (
              <li key={j}>{fillTokens(li)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{fillTokens(x)}</p>
        )
      )}
    </>
  );
}

export function ArticleRow({
  article,
  sub,
  icon,
}: {
  article: HelpArticle;
  sub?: string;
  icon?: string;
}) {
  return (
    <Link className="item art-row" href={`/settings/article/${article.id}`}>
      {icon ? (
        <span className="ico">
          <HIcon n={icon} />
        </span>
      ) : null}
      <span className="grow">
        {article.t}
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
      <HIcon n="chev" cls="chev" />
    </Link>
  );
}

// ================= Shell context =================
interface HelpCtxValue {
  openChat: (prefill?: string) => void;
  toast: (msg: string) => void;
}

const HelpCtx = createContext<HelpCtxValue>({
  openChat: () => {},
  toast: () => {},
});

export const useHelp = () => useContext(HelpCtx);

// ================= Chat =================
type Msg =
  | { id: number; role: "me"; text: string }
  | { id: number; role: "bot" | "warn"; node: ReactNode }
  | { id: number; role: "typing" }
  | { id: number; role: "handoff"; prefill: string };

let msgSeq = 0;
const nextId = () => ++msgSeq;

function HandoffForm({
  prefill,
  accountEmail,
  onFiled,
  toast,
}: {
  prefill: string;
  accountEmail: string;
  onFiled: (ticket: SupportTicket) => void;
  toast: (m: string) => void;
}) {
  const [email, setEmail] = useState(accountEmail);
  const [body, setBody] = useState(prefill);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast("Please enter a valid email.");
      return;
    }
    if (!body.trim()) {
      toast("Tell us what’s going on.");
      return;
    }
    const risky = sensitiveFinds(body);
    if (risky.length) {
      toast("Please remove " + risky.join(" and ") + " first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "other",
          subject: "Message from Vestra Help",
          message: body.trim(),
          contactEmail: email.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ticket?: SupportTicket;
        error?: string;
      } | null;
      if (res.ok && data?.ticket) {
        setDone(true);
        onFiled(data.ticket);
      } else {
        toast(data?.error ?? "Your request could not be sent. Please try again.");
      }
    } catch {
      toast("Your request could not be sent. Please try again.");
    }
    setBusy(false);
  }

  if (done) return <p>Sent — we’ll reply by email.</p>;
  return (
    <div className="handoff">
      <p>
        Send a message to the Ultra Vestra team. We usually reply within{" "}
        {fillTokens("{RESPONSE_TIME}")}.
      </p>
      <label htmlFor="hf-email">Your email</label>
      <input
        id="hf-email"
        className="field"
        type="email"
        autoComplete="email"
        maxLength={120}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="hf-msg">What’s going on?</label>
      <textarea
        id="hf-msg"
        className="field"
        maxLength={1000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="row">
        <button type="button" className="mini-btn" onClick={send} disabled={busy}>
          {busy ? "Sending…" : "Send to the team"}
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--h-faint)", marginTop: 8 }}>
        Don’t include passwords, codes or card numbers.
      </p>
    </div>
  );
}

function ArticleAnswer({
  article,
  onNotHelpful,
  onClose,
}: {
  article: HelpArticle;
  onNotHelpful: () => void;
  onClose: () => void;
}) {
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  const { toast } = useHelp();
  return (
    <>
      <b className="title">{article.t}</b>
      <ArticleBody article={article} limit={2} />
      <Link
        className="src"
        href={`/settings/article/${article.id}`}
        onClick={onClose}
      >
        <HIcon n="book" />
        From {SECTION_NAME[article.s]} › {article.cat} · Read more
      </Link>
      <div className="row">
        <button
          type="button"
          className="mini-btn"
          aria-pressed={vote === "yes"}
          onClick={() => {
            setVote("yes");
            toast("Glad that helped!");
          }}
        >
          Helpful
        </button>
        <button
          type="button"
          className="mini-btn"
          aria-pressed={vote === "no"}
          onClick={() => {
            setVote("no");
            onNotHelpful();
          }}
        >
          Not quite
        </button>
      </div>
    </>
  );
}

function ChatPanel({
  accountEmail,
  onClose,
  toast,
  initialInput = "",
}: {
  accountEmail: string;
  onClose: () => void;
  toast: (m: string) => void;
  initialInput?: string;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: nextId(),
      role: "bot",
      node: (
        <>
          <p>
            Hi! I’m Vestra Help. I answer from the Ultra Vestra Help Center,
            Privacy Center and Terms, so you get real answers, not guesses.
          </p>
          <p>What can I help you with?</p>
        </>
      ),
    },
  ]);
  const [suggest, setSuggest] = useState<string[]>(HELP_SUGGEST.slice(0, 4));
  const [input, setInput] = useState(initialInput);
  const [busy, setBusy] = useState(false);
  const sentTimes = useRef<number[]>([]);
  const msgsRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      const el = msgsRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const append = useCallback(
    (m: Msg) => {
      setMsgs((prev) => [...prev, m]);
      scrollDown();
    },
    [scrollDown]
  );

  const withTyping = useCallback(
    (cb: () => void) => {
      setBusy(true);
      const tid = nextId();
      setMsgs((prev) => [...prev, { id: tid, role: "typing" }]);
      scrollDown();
      setTimeout(
        () => {
          setMsgs((prev) => prev.filter((m) => m.id !== tid));
          setBusy(false);
          cb();
          scrollDown();
        },
        550 + Math.random() * 350
      );
    },
    [scrollDown]
  );

  const startHandoff = useCallback(
    (prefill: string) => {
      append({ id: nextId(), role: "handoff", prefill });
    },
    [append]
  );

  const ask = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      setInput("");
      setSuggest([]);

      // Rate limit (the prototype's): 6 messages per 20 seconds.
      const now = Date.now();
      sentTimes.current = sentTimes.current.filter((t) => now - t < 20000);
      if (sentTimes.current.length >= 6) {
        append({
          id: nextId(),
          role: "warn",
          node: (
            <>
              <b>Slow down a little. </b>
              You’re sending messages very quickly. Try again in a few
              seconds.
            </>
          ),
        });
        return;
      }
      sentTimes.current.push(now);

      const ans = answerFor(q);
      if (ans.kind === "sensitive") {
        append({ id: nextId(), role: "me", text: "[Hidden for your safety]" });
        withTyping(() => {
          append({
            id: nextId(),
            role: "warn",
            node: (
              <>
                <b>I removed that message. </b>
                It looked like it had {ans.found.join(" and ")}. Ultra Vestra
                will never ask for those, here or anywhere. If someone else
                asked, it’s a scam.
              </>
            ),
          });
          const neverAsk = articleById.get("never-ask");
          if (neverAsk) {
            append({
              id: nextId(),
              role: "bot",
              node: (
                <ArticleAnswer
                  article={neverAsk}
                  onClose={onClose}
                  onNotHelpful={() => startHandoff(neverAsk.t)}
                />
              ),
            });
            const scams = articleById.get("scams");
            setSuggest(scams ? [scams.t] : HELP_SUGGEST.slice(0, 3));
          }
        });
        return;
      }

      append({ id: nextId(), role: "me", text: q });
      withTyping(() => {
        if (ans.kind === "smalltalk") {
          append({ id: nextId(), role: "bot", node: <p>{ans.text}</p> });
          setSuggest(HELP_SUGGEST.slice(0, 4));
          return;
        }
        if (ans.kind === "human") {
          startHandoff("");
          return;
        }
        if (ans.kind === "article") {
          append({
            id: nextId(),
            role: "bot",
            node: (
              <ArticleAnswer
                article={ans.article}
                onClose={onClose}
                onNotHelpful={() => {
                  withTyping(() => {
                    append({
                      id: nextId(),
                      role: "bot",
                      node: (
                        <>
                          <p>
                            Sorry about that. Try asking another way, or I can
                            connect you with a person.
                          </p>
                          <div className="row">
                            <button
                              type="button"
                              className="mini-btn"
                              onClick={() => startHandoff(ans.article.t)}
                            >
                              Talk to a person
                            </button>
                          </div>
                        </>
                      ),
                    });
                  });
                }}
              />
            ),
          });
          setSuggest(
            ans.related.length
              ? ans.related.map((r) => r.t)
              : HELP_SUGGEST.slice(2, 5)
          );
          return;
        }
        // fallback — honest, never a guess
        append({
          id: nextId(),
          role: "bot",
          node: (
            <>
              <p>
                I couldn’t find that in the Help Center, Privacy Center or
                Terms, so I won’t guess.
              </p>
              <p>
                You can try different words, browse the Help Center, or ask a
                person.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => startHandoff(q)}
                >
                  Talk to a person
                </button>
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => {
                    onClose();
                    router.push("/settings/help");
                  }}
                >
                  Browse Help Center
                </button>
              </div>
            </>
          ),
        });
        setSuggest(HELP_SUGGEST.slice(0, 3));
      });
    },
    [append, busy, onClose, router, startHandoff, withTyping]
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <section className="chat" role="dialog" aria-modal="true" aria-labelledby="hlp-chat-name">
      <div className="chat-head">
        <span className="uv" aria-hidden="true">UV</span>
        <div className="who">
          <b id="hlp-chat-name">Vestra Help</b>
          <small>
            <i aria-hidden="true" />
            Answers from our Help Center, instantly
          </small>
        </div>
        <button type="button" className="icon-btn" aria-label="Close chat" onClick={onClose}>
          <HIcon n="x" />
        </button>
      </div>
      <div className="shield">
        <HIcon n="shield" />
        <span>
          We will never ask for your password, codes or card number. Don’t
          share them here.
        </span>
      </div>
      <div className="msgs" ref={msgsRef} aria-live="polite">
        {msgs.map((m) => {
          if (m.role === "typing")
            return (
              <div key={m.id} className="msg bot">
                <span className="typing" aria-label="Vestra Help is typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            );
          if (m.role === "me")
            return (
              <div key={m.id} className="msg me">
                {m.text}
              </div>
            );
          if (m.role === "handoff")
            return (
              <div key={m.id} className="msg bot">
                <HandoffForm
                  prefill={m.prefill}
                  accountEmail={accountEmail}
                  toast={toast}
                  onFiled={(ticket) => {
                    append({
                      id: nextId(),
                      role: "bot",
                      node: (
                        <>
                          <p>
                            Request received. We read every request and reply
                            by email.
                          </p>
                          <p>
                            Your reference: <b>{supportTicketRef(ticket)}</b>
                          </p>
                        </>
                      ),
                    });
                  }}
                />
              </div>
            );
          return (
            <div key={m.id} className={`msg ${m.role}`}>
              {m.node}
            </div>
          );
        })}
      </div>
      {suggest.length ? (
        <div className="suggest chips">
          {suggest.map((q) => (
            <button key={q} type="button" className="chip" onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
      ) : null}
      <form className="composer" onSubmit={onSubmit}>
        <div className="compose-box">
          <label className="sr-only" htmlFor="hlp-chat-input">
            Your question
          </label>
          <textarea
            id="hlp-chat-input"
            rows={1}
            maxLength={500}
            placeholder="Ask a question…"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
          />
          <button
            type="submit"
            className="send"
            aria-label="Send"
            disabled={!input.trim() || busy}
          >
            <HIcon n="send" />
          </button>
        </div>
        <div className="compose-meta">
          <span>This chat isn’t saved.</span>
          <span>{input.length}/500</span>
        </div>
      </form>
    </section>
  );
}

// ================= Shell =================
export default function HelpShell({
  accountEmail,
  children,
}: {
  accountEmail: string;
  children: ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2600);
  }, []);

  const [prefill, setPrefill] = useState("");
  const openChat = useCallback((text?: string) => {
    setPrefill(text ?? "");
    setChatOpen(true);
  }, []);

  return (
    <HelpCtx.Provider value={{ openChat, toast }}>
      <div className="hlp">
        <HlpStyle />
        {children}
        {!chatOpen ? (
          <button
            type="button"
            className="fab"
            aria-label="Ask Vestra Help"
            onClick={() => setChatOpen(true)}
          >
            <HIcon n="chat" />
            Ask
          </button>
        ) : null}
        {chatOpen ? (
          <ChatPanel
            accountEmail={accountEmail}
            toast={toast}
            initialInput={prefill}
            onClose={() => setChatOpen(false)}
          />
        ) : null}
        <div className={`toast${toastShow ? " show" : ""}`} role="status" aria-live="polite">
          {toastMsg}
        </div>
      </div>
    </HelpCtx.Provider>
  );
}
