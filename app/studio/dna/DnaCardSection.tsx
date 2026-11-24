"use client";

import { useEffect, useRef, useState } from "react";
import {
  DNA_CARD_SAMPLE_CSV,
  DNA_CARD_STORE_KEY,
  DNA_CARD_TEMPLATE_CSV,
  DNA_CARD_TIERS,
  analyze,
  dnaCardFileName,
  dnaCardFmtDate,
  dnaCardLink,
  dnaCardMessage,
  dnaCardPickTier,
  dnaCardSanitizeStoredHandle,
  dnaCardTierNeedText,
  dnaCardTierUnlocked,
  dnaDepth,
  drawHelix,
  normalize,
  parseCSV,
  renderCard,
  type DnaCardAnalysis,
  type DnaCardField,
  type DnaCardFieldKey,
  type DnaCardShow,
  type DnaCardShowKey,
  type DnaCardTierDef,
  type DnaCardView,
} from "@/lib/galaxy/dna-card";

/* CREATOR DNA CARD — the owner's prototype ported (2026-11-24) as a
 * section inside Studio › Content DNA (below the six-tab module).
 * The prototype's .top/.tabs bars were preview chrome and are not
 * ported — the app's own navigation frames the page; the sample/real
 * source chip from that bar lives in the section's title row instead.
 * State is the prototype's own store (localStorage "uv.dna.card.v1",
 * device-local). The card carries UltraVestra branding + the QR code;
 * creator information appears only from the creator's own imported
 * data — until then the sample state stays visibly SAMPLE and the
 * guard sheet blocks sharing it as real. Share actions never post:
 * Web Share / save file / copy, exactly as the prototype. */

const DC_CSS = `
.dnac{--bg:#050308;--ink:#f4f1ff;--mut:#a59cbf;--dim:#6f6689;--line:rgba(255,255,255,.09);--panel:rgba(255,255,255,.035);--vio:#8b5cf6;--lil:#c4b5fd;--hi:#b794ff;--ok:#6ee7b7;--blu:#93c5fd;--warn:#fcd34d;color-scheme:dark;margin-top:28px;border-radius:28px;padding:16px 16px 40px;background:radial-gradient(900px 520px at 85% -8%,rgba(124,77,255,.28),transparent 60%),radial-gradient(700px 600px at -10% 40%,rgba(178,76,255,.12),transparent 60%),var(--bg);color:var(--ink);font:16px/1.55 Manrope,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:clip;-webkit-font-smoothing:antialiased}
.dnac *{box-sizing:border-box;min-width:0}
.dnac button,.dnac input,.dnac select{font:inherit;color:inherit}
.dnac button{cursor:pointer}
.dnac :focus-visible{outline:2px solid var(--hi);outline-offset:2px;border-radius:10px}
.dnac h2,.dnac h3{font-family:Unbounded,Manrope,sans-serif;font-weight:600;line-height:1.1;margin:0;text-wrap:balance}
.dc-src{font-size:13px;font-weight:700;padding:5px 10px;border-radius:99px;white-space:nowrap}
.dc-src.dc-sample{background:rgba(252,211,77,.12);color:var(--warn)}
.dc-src.dc-real{background:rgba(110,231,183,.12);color:var(--ok)}
.dc-grid{display:grid;gap:20px;max-width:1120px;margin:0 auto}
@media(min-width:900px){.dc-grid{grid-template-columns:minmax(0,400px) minmax(0,1fr);gap:40px;align-items:start}.dc-left{position:sticky;top:84px}}
.dc-hero{position:relative;border:1px solid var(--line);border-radius:22px;background:linear-gradient(180deg,rgba(124,77,255,.10),rgba(255,255,255,.02));overflow:hidden}
.dc-fig{position:relative;height:132px}.dc-fig>canvas{position:absolute;inset:0;width:100%;height:100%}
.dc-state{display:flex;align-items:center;gap:8px;margin:0;padding:0 16px 14px;font-size:14px;font-weight:600;color:var(--lil)}
.dc-pulse{width:8px;height:8px;border-radius:50%;background:var(--hi);box-shadow:0 0 0 0 rgba(183,148,255,.6);animation:dc-pulse 1.6s infinite;flex:none}
.dc-state.dc-done .dc-pulse{background:var(--ok);animation:none;box-shadow:0 0 12px rgba(110,231,183,.6)}
@keyframes dc-pulse{70%{box-shadow:0 0 0 10px rgba(183,148,255,0)}100%{box-shadow:0 0 0 0 rgba(183,148,255,0)}}
.dc-title{padding:18px 2px 4px}
.dc-titlerow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dc-title h2{font-size:clamp(26px,7vw,34px)}
.dc-title p{margin:6px 0 0;color:var(--mut);font-size:14px}
.dc-preview{margin:14px auto 0;max-width:340px;aspect-ratio:9/16;border-radius:22px;overflow:hidden;border:1px solid rgba(196,181,253,.22);box-shadow:0 30px 80px -30px rgba(124,77,255,.55);background:#0b0614}
.dc-preview img{display:block;width:100%;height:100%;object-fit:cover;-webkit-touch-callout:default}
.dc-hint{text-align:center;color:var(--dim);font-size:13px;margin:10px 0 0}
section.dc-block{margin-top:22px}
.dc-block h3{font-size:18px;margin-bottom:6px}
.dc-note{color:var(--mut);font-size:14px;margin:0 0 12px}
.dc-share{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:18px;background:var(--panel);overflow:hidden}
.dc-share li+li{border-top:1px solid var(--line)}
.dc-share button{display:grid;grid-template-columns:44px minmax(0,1fr) 16px;align-items:center;gap:12px;width:100%;min-height:64px;padding:10px 14px;background:none;border:0;text-align:left;color:inherit}
.dc-share button:active{background:rgba(139,92,246,.12)}
.dc-ico{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(139,92,246,.35),rgba(139,92,246,.10));border:1px solid rgba(196,181,253,.25)}
.dc-ico svg{width:22px;height:22px;stroke:#efe8ff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dc-share b{display:block;font-size:16px}
.dc-share small{display:block;color:var(--mut);font-size:13px;line-height:1.35}
.dc-chev{color:var(--dim);font-size:20px}
.dc-linkrow{display:flex;gap:8px;align-items:center;margin-top:10px}
.dc-linkrow code{flex:1;font:600 13px/1.3 ui-monospace,Menlo,monospace;color:var(--lil);background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;overflow-wrap:anywhere}
.dc-btn{min-height:44px;padding:0 16px;border-radius:14px;border:1px solid rgba(196,181,253,.3);background:rgba(139,92,246,.16);font-weight:700;white-space:nowrap;color:inherit;display:inline-grid;place-items:center}
.dc-btn.dc-primary{background:#f4f1ff;color:#120a24;border-color:#f4f1ff}
.dc-btn.dc-ghost{background:none}
.dc-fields{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:18px;background:var(--panel)}
.dc-fields>li{padding:12px 14px}.dc-fields>li+li{border-top:1px solid var(--line)}
.dc-frow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.dc-lab{display:block;font-size:13px;color:var(--mut);font-weight:600}
.dc-val{display:block;font-weight:700;font-size:16px;line-height:1.3}
.dc-off .dc-val{color:var(--dim);text-decoration:line-through}
.dc-na .dc-val{color:var(--dim);font-weight:600}
.dc-chip{display:inline-block;font-size:12.5px;font-weight:800;padding:2px 8px;border-radius:99px;margin-top:4px}
.dc-chip.dc-verified{background:rgba(110,231,183,.12);color:var(--ok)}
.dc-chip.dc-observed{background:rgba(196,181,253,.14);color:var(--lil)}
.dc-chip.dc-testing{background:rgba(147,197,253,.12);color:var(--blu)}
.dc-sw{appearance:none;-webkit-appearance:none;width:52px;height:32px;border-radius:99px;background:#2a2340;position:relative;margin:0;cursor:pointer;transition:background .2s;flex:none}
.dc-sw::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#cfc8e6;transition:transform .2s}
.dc-sw:checked{background:var(--vio)}.dc-sw:checked::after{transform:translateX(20px);background:#fff}
.dc-sw:disabled{opacity:.35;cursor:default}
.dnac details{margin-top:6px}
.dnac summary{cursor:pointer;color:var(--lil);font-size:14px;font-weight:700;min-height:32px;display:flex;align-items:center;list-style:none}
.dnac summary::-webkit-details-marker{display:none}
.dnac summary::before{content:"+";width:18px;font-weight:800}
.dnac details[open ] summary::before{content:"–"}
.dnac details p{margin:4px 0 2px;color:var(--mut);font-size:14px}
.dc-never{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(110,231,183,.06);border:1px solid rgba(110,231,183,.18);font-size:14px;color:#cdeee0}
.dc-priv{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:4px 14px}
.dc-priv>div{padding:12px 0}.dc-priv>div+div{border-top:1px solid var(--line)}
.dc-priv p{margin:2px 0 0;color:var(--mut);font-size:14px}
.dc-data{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:14px;display:grid;gap:12px}
.dc-data label.dc-f{display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--mut)}
.dc-data input[type=text]{min-height:48px;border-radius:14px;border:1px solid rgba(196,181,253,.25);background:#0d0817;padding:0 14px;font-size:16px;color:var(--ink)}
.dc-btns{display:flex;flex-wrap:wrap;gap:8px}
.dc-file{position:relative;overflow:hidden;display:inline-grid;place-items:center}
.dc-file input{position:absolute;inset:0;opacity:0;cursor:pointer}
.dc-issues{margin:0;padding-left:18px;color:var(--warn);font-size:14px}
.dc-issues:empty{display:none}
.dc-scrim{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}
.dc-sheet{position:relative;width:min(560px,100%);max-height:88vh;overflow:auto;background:#100a1c;border:1px solid rgba(196,181,253,.2);border-bottom:0;border-radius:24px 24px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -30px 80px rgba(0,0,0,.6);color:var(--ink)}
.dc-sheet h3{font-size:20px;margin-bottom:8px;padding-right:40px;font-family:Unbounded,Manrope,sans-serif;font-weight:600;line-height:1.1}
.dc-sheet .dc-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:none;font-size:20px;color:inherit;cursor:pointer}
.dc-sheet p{color:var(--mut);margin:0 0 12px;font-size:15px}
.dc-sheet ol{margin:0 0 14px;padding-left:20px}.dc-sheet ol li{margin:6px 0}
.dc-sheet .dc-thumb{display:block;width:120px;aspect-ratio:9/16;object-fit:cover;border-radius:12px;border:1px solid rgba(196,181,253,.25);margin:0 auto 12px}
.dc-sheet .dc-msg{background:#0b0614;border:1px solid var(--line);border-radius:14px;padding:12px;font-size:14px;color:var(--ink);margin-bottom:12px;overflow-wrap:anywhere}
.dc-sheet .dc-acts{display:grid;gap:8px}
.dc-sheet .dc-acts a.dc-btn{text-decoration:none;color:#120a24}
.dc-toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(20px);z-index:210;background:#f4f1ff;color:#120a24;font-weight:700;font-size:14px;padding:12px 16px;border-radius:14px;opacity:0;pointer-events:none;transition:.25s;max-width:calc(100vw - 32px);text-align:center}
.dc-toast.dc-on{opacity:1;transform:translateX(-50%)}
.dc-tierhead{display:flex;align-items:center;justify-content:space-between;margin-top:20px}
.dc-tierhead h3{font-size:18px}
.dc-tnav{display:flex;gap:6px}
.dc-tb{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--panel);font-size:22px;line-height:1;color:inherit;cursor:pointer}
.dc-tiers{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px 2px 8px;scrollbar-width:none;margin:0 -2px}
.dc-tiers::-webkit-scrollbar{display:none}
.dc-tier{flex:none;width:118px;scroll-snap-align:start;background:none;border:0;padding:0;text-align:left;position:relative;color:inherit;cursor:pointer}
.dc-tier .dc-th{display:block;width:100%;aspect-ratio:9/16;border-radius:14px;border:2px solid var(--line);overflow:hidden;background:#0b0614;transition:transform .2s}
.dc-tier img{display:block;width:100%;height:100%;object-fit:cover}
.dc-tier[aria-checked=true ] .dc-th{border-color:var(--hi);box-shadow:0 0 0 3px rgba(183,148,255,.28);transform:translateY(-4px)}
.dc-tier b{display:flex;align-items:center;gap:6px;font-size:15px;margin-top:8px}
.dc-tier small{display:block;font-size:13px;color:var(--mut);line-height:1.3}
.dc-tier.dc-locked img{filter:grayscale(.5) brightness(.4)}
.dc-tier .dc-lk{position:absolute;top:10px;right:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.65);display:grid;place-items:center}
.dc-tier .dc-lk svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2}
.dc-tier .dc-topbadge{position:absolute;top:10px;left:8px;font-size:12.5px;font-weight:800;padding:2px 8px;border-radius:99px;background:#f4f1ff;color:#3b1a7a}
.dc-gemdot{width:10px;height:10px;transform:rotate(45deg);border-radius:2px;flex:none}
.dc-photo{display:grid;grid-template-columns:56px minmax(0,1fr);gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:18px;background:var(--panel);margin-bottom:10px}
.dc-photo small{display:block;color:var(--mut);font-size:13px;line-height:1.4}
.dc-pthumb{width:56px;height:56px;border-radius:50%;border:2px solid rgba(196,181,253,.55);background:radial-gradient(circle at 50% 45%,#f3ecff 0 6%,#b794ff 18%,#3b1d7a 55%,#0b0614 75%) center/cover;box-shadow:0 0 18px rgba(139,92,246,.45)}
.dc-pbtns{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}
@media(max-width:600px){.dc-preview{max-width:300px}}
@media(prefers-reduced-motion:reduce){.dc-tier .dc-th{transition:none}.dc-pulse{animation:none}.dc-toast,.dc-sw,.dc-sw::after{transition:none}}
`;

const TIER_LABEL: Record<string, string> = { verified: "Verified", observed: "Observed", testing: "Testing" };
const GEMCSS: Record<string, string> = {
  quartz: "linear-gradient(135deg,#fff,#ffc2f0)",
  amethyst: "linear-gradient(135deg,#ede4ff,#8b5cf6)",
  sapphire: "linear-gradient(135deg,#dbeafe,#2563eb)",
  ruby: "linear-gradient(135deg,#ffd1e8,#ff2d87)",
  gold: "linear-gradient(135deg,#fff1c1,#e8b94a 50%,#8a5a12)",
  diamond: "linear-gradient(135deg,#fff,#a5e8ff 40%,#ffc2f0 70%,#c9b6ff)",
};
const NA_LABEL: Record<string, string> = {
  trait: "Signature trait",
  topic: "Strongest topic",
  format: "Most effective format",
  opportunity: "Biggest growth opportunity",
  experiment: "Next experiment",
  identity: "Creator identity",
};
const FIELD_KEYS: DnaCardFieldKey[] = ["identity", "trait", "topic", "format", "opportunity", "experiment"];

interface CardState {
  handle: string;
  csv: string | null;
  sample: boolean;
  sampleOk: boolean;
  show: DnaCardShow;
  a: DnaCardAnalysis | null;
  blob: Blob | null;
  url: string | null;
  issues: string[];
  photo: string | null;
  photoImg: HTMLImageElement | null;
  tier: string | null;
}

interface SheetAction {
  label: string;
  primary?: boolean;
  run: () => void;
}
interface SheetState {
  title: string;
  body?: string;
  steps?: string[];
  thumb?: boolean;
  msg?: string;
  anchor?: { href: string; label: string; blank?: boolean };
  actions: SheetAction[];
}

const track = (event: string, props: Record<string, unknown> = {}) => {
  try {
    const w = window as unknown as { UV?: { track?: (e: string, p: Record<string, unknown>) => void } };
    if (w.UV && typeof w.UV.track === "function") w.UV.track(event, props);
    window.dispatchEvent(new CustomEvent("uv:track", { detail: { event, ...props } }));
  } catch {
    /* the prototype swallows analytics errors */
  }
};

export default function DnaCardSection() {
  const S = useRef<CardState>({
    handle: "", // no default handle — the card shows one only when the creator sets their own
    csv: null,
    sample: true,
    sampleOk: false,
    show: { handle: true, identity: true, trait: true, topic: true, format: true, opportunity: true, experiment: true },
    a: null,
    blob: null,
    url: null,
    issues: [],
    photo: null,
    photoImg: null,
    tier: null,
  });
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [phase, setPhase] = useState<"analyzing" | "done">("analyzing");
  const [handleText, setHandleText] = useState("");

  const helixRef = useRef<HTMLCanvasElement | null>(null);
  const tiersRef = useRef<HTMLDivElement | null>(null);
  const csvRef = useRef<HTMLInputElement | null>(null);
  const sheetHRef = useRef<HTMLHeadingElement | null>(null);
  const reduceRef = useRef(false);
  const rafRef = useRef(0);
  const phaseAnimRef = useRef(0);
  const revealRef = useRef(0);
  const lastRef = useRef(0);
  const rTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbsDirtyRef = useRef(true);
  const dlRef = useRef<unknown>(null);

  const persist = () => {
    try {
      localStorage.setItem(
        DNA_CARD_STORE_KEY,
        JSON.stringify({ handle: S.current.handle, show: S.current.show, csv: S.current.sample ? null : S.current.csv, photo: S.current.photo, tier: S.current.tier }),
      );
    } catch {
      /* device storage unavailable — the prototype carries on */
    }
  };

  const view = (): DnaCardView | null =>
    S.current.a
      ? { a: S.current.a, handle: S.current.handle, show: S.current.show, sample: S.current.sample, tier: S.current.tier, photoImg: S.current.photoImg }
      : null;

  const toast = (t: string) => {
    setToastMsg(t);
    setToastOn(true);
    if (ttRef.current) clearTimeout(ttRef.current);
    ttRef.current = setTimeout(() => setToastOn(false), 2600);
  };

  const closeSheet = () => setSheet(null);
  const openSheet = (cfg: SheetState) => setSheet(cfg);

  /* ---------- card + thumbnails ---------- */
  const scheduleThumbs = () => {
    if (thTimerRef.current) clearTimeout(thTimerRef.current);
    thTimerRef.current = setTimeout(() => {
      if (!thumbsDirtyRef.current || !S.current.a) return;
      thumbsDirtyRef.current = false;
      DNA_CARD_TIERS.forEach((t, i) =>
        setTimeout(() => {
          const v = view();
          if (!v) return;
          const cv = document.createElement("canvas");
          renderCard(cv, v, t, 0.26);
          const url = cv.toDataURL("image/jpeg", 0.82);
          setThumbs((prev) => ({ ...prev, [t.id]: url }));
        }, i * 30),
      );
    }, 260);
  };

  const rebuildCard = (styleOnly?: boolean) => {
    if (!S.current.a) return;
    if (!styleOnly) {
      thumbsDirtyRef.current = true;
      scheduleThumbs();
    }
    if (rTimerRef.current) clearTimeout(rTimerRef.current);
    rTimerRef.current = setTimeout(() => {
      const v = view();
      if (!v) return;
      const cv = document.createElement("canvas");
      renderCard(cv, v);
      cv.toBlob((b) => {
        if (!b) return;
        S.current.blob = b;
        if (S.current.url) URL.revokeObjectURL(S.current.url);
        S.current.url = URL.createObjectURL(b);
        setCardUrl(S.current.url);
        track("dna_card_generated", { sample: S.current.sample, tier: S.current.tier });
      }, "image/png");
    }, 60);
  };

  /* ---------- live helix ---------- */
  const sizeHelix = () => {
    const hc = helixRef.current;
    if (!hc) return;
    const r = hc.getBoundingClientRect(),
      d = Math.min(2, window.devicePixelRatio || 1);
    hc.width = Math.round(r.width * d);
    hc.height = Math.round(r.height * d);
  };
  const frameHelix = (ts: number) => {
    const hc = helixRef.current,
      a = S.current.a;
    if (!hc || !a) return;
    const dt = lastRef.current ? Math.min(50, ts - lastRef.current) : 16;
    lastRef.current = ts;
    if (revealRef.current < 1) {
      revealRef.current = Math.min(1, revealRef.current + dt / 1700);
      if (revealRef.current === 1) setPhase("done");
    }
    if (!reduceRef.current) phaseAnimRef.current += dt * 0.0006;
    const c = hc.getContext("2d");
    if (!c) return;
    const d = hc.width / (hc.getBoundingClientRect().width || 1);
    c.clearRect(0, 0, hc.width, hc.height);
    drawHelix(c, 0, 6 * d, hc.width, hc.height - 12 * d, a, phaseAnimRef.current, { reveal: revealRef.current, scale: d * 0.9, turns: 2.6 });
    if (!document.hidden && (!reduceRef.current || revealRef.current < 1)) rafRef.current = requestAnimationFrame(frameHelix);
  };
  const animateHelix = (full: boolean) => {
    cancelAnimationFrame(rafRef.current);
    lastRef.current = 0;
    revealRef.current = reduceRef.current || !full ? 1 : 0;
    setPhase(revealRef.current === 1 ? "done" : "analyzing");
    rafRef.current = requestAnimationFrame(frameHelix);
  };

  /* ---------- data ---------- */
  const scrollTierIntoView = () => {
    requestAnimationFrame(() => {
      const box = tiersRef.current,
        sel = box?.querySelector('[aria-checked="true"]') as HTMLElement | null;
      if (box && sel) box.scrollLeft = Math.max(0, sel.offsetLeft - box.offsetLeft - 8);
    });
  };

  const load = (csvText: string, isSample: boolean): boolean => {
    const { rows, issues } = normalize(parseCSV(csvText));
    const result = analyze(rows);
    if (!result.ok) {
      S.current.issues = [...issues, result.reason || "Could not read that file."];
      bump();
      toast("Need at least 8 videos to map your DNA");
      return false;
    }
    S.current.a = result;
    S.current.issues = isSample ? [] : issues;
    S.current.sample = isSample;
    S.current.csv = csvText;
    S.current.tier = dnaCardPickTier(result, S.current.tier);
    bump();
    scrollTierIntoView();
    rebuildCard();
    animateHelix(true);
    persist();
    return true;
  };

  const setPhoto = (dataUrl: string | null) => {
    if (!dataUrl) {
      S.current.photo = null;
      S.current.photoImg = null;
      bump();
      persist();
      rebuildCard();
      return;
    }
    const im = new Image();
    im.onload = () => {
      S.current.photo = dataUrl;
      S.current.photoImg = im;
      bump();
      persist();
      rebuildCard();
    };
    im.onerror = () => toast("That image could not be opened");
    im.src = dataUrl;
  };

  /* ---------- start: restore, fonts, then sample-or-saved (the prototype's boot) ---------- */
  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let clearedLegacyHandle = false;
    try {
      const saved = JSON.parse(localStorage.getItem(DNA_CARD_STORE_KEY) || "null") as {
        show?: Partial<DnaCardShow>;
        handle?: string;
        csv?: string;
        photo?: string;
        tier?: string;
      } | null;
      if (saved) {
        Object.assign(S.current.show, saved.show || {});
        if (saved.handle) {
          // the first shipped build persisted its sample handle as if it
          // were the creator's — that value reads back as unset, so those
          // devices stop showing it; a self-typed handle is untouched.
          const restored = dnaCardSanitizeStoredHandle(saved.handle);
          S.current.handle = restored;
          setHandleText(restored);
          clearedLegacyHandle = restored !== saved.handle;
        }
        if (saved.csv) {
          S.current.csv = saved.csv;
          S.current.sample = false;
        }
        if (saved.photo) S.current.photo = saved.photo;
        if (saved.tier) S.current.tier = saved.tier;
      }
    } catch {
      /* corrupted store — start from the sample, like the prototype */
    }
    // write the cleared state back, so the legacy sample handle is gone
    // from the device for good, not just for this visit
    if (clearedLegacyHandle) persist();
    bump();
    (async () => {
      try {
        const w = window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } };
        if (w.claude && typeof w.claude.use === "function") dlRef.current = await w.claude.use("downloads");
      } catch {
        dlRef.current = null;
      }
    })();
    sizeHelix();
    const hc = helixRef.current;
    const ro = hc
      ? new ResizeObserver(() => {
          sizeHelix();
          if (reduceRef.current || revealRef.current >= 1) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(frameHelix);
          }
        })
      : null;
    if (hc && ro) ro.observe(hc);
    const onVis = () => {
      if (!document.hidden) {
        cancelAnimationFrame(rafRef.current);
        lastRef.current = 0;
        rafRef.current = requestAnimationFrame(frameHelix);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const fontsReady = Promise.race([
      Promise.all(
        ["700 80px Unbounded", "600 40px Unbounded", "700 40px Manrope", "600 26px Manrope", "800 24px Manrope", '700 20px "Space Mono"'].map((f) =>
          document.fonts ? document.fonts.load(f) : Promise.resolve(),
        ),
      ),
      new Promise((r) => setTimeout(r, 2500)),
    ]).catch(() => 0);
    fontsReady.then(() => {
      if (!(S.current.csv && !S.current.sample && load(S.current.csv, false))) load(DNA_CARD_SAMPLE_CSV, true);
      if (S.current.photo) setPhoto(S.current.photo);
    });
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sheet) return;
    sheetHRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  /* ---------- delivery: native share → host save → browser download → press-and-hold ---------- */
  const cardFile = () => new File([S.current.blob as Blob], dnaCardFileName(S.current.tier, S.current.handle), { type: "image/png" });
  const tryShare = async (payload: { files?: File[]; text?: string }): Promise<string> => {
    if (!navigator.share) return "unsupported";
    if (payload.files && !(navigator.canShare && navigator.canShare({ files: payload.files }))) return "unsupported";
    try {
      await navigator.share(payload);
      return "shared";
    } catch (e) {
      return e && (e as Error).name === "AbortError" ? "cancelled" : "failed";
    }
  };
  const saveFile = async (data: Blob | string, filename: string): Promise<string> => {
    const dl = dlRef.current as { save?: (o: { filename: string; data: unknown }) => Promise<void> } | null;
    if (dl && typeof dl.save === "function") {
      try {
        await dl.save({ filename, data });
        return "saved";
      } catch (e) {
        const code = (e as { code?: string } | null)?.code;
        if (code === "declined") return "declined";
        if (code === "rate_limited") return "busy";
      }
    }
    try {
      const u = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: "text/csv" }));
      const el = document.createElement("a");
      el.href = u;
      el.download = filename;
      document.body.appendChild(el);
      el.click();
      el.remove();
      setTimeout(() => URL.revokeObjectURL(u), 5000);
      return "downloaded";
    } catch {
      return "manual";
    }
  };
  const savedNote = (r: string): string =>
    r === "saved"
      ? "Card saved."
      : r === "downloaded"
        ? "Card saved to your downloads. Not there? Press and hold the card image and choose Save."
        : r === "declined"
          ? "Save cancelled. You can also press and hold the card image to save it."
          : "Press and hold the card image and choose Save to Photos.";
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
      return true;
    } catch {
      toast("Press and hold the text to copy it");
      return false;
    }
  };
  const shareMessage = () => dnaCardMessage(S.current.a as DnaCardAnalysis, S.current.show, S.current.handle);
  const shareLink = () => dnaCardLink(S.current.handle, S.current.show.handle);
  const copyLinkAct: SheetAction = { label: "Copy my link", run: () => void copy(shareLink()) };

  const ACT: Record<string, () => Promise<string>> = {
    async story() {
      const r = await tryShare({ files: [cardFile()] });
      if (r === "shared") {
        toast("Sent to your share sheet");
        return "shared";
      }
      if (r === "cancelled") return "cancelled";
      const s = await saveFile(S.current.blob as Blob, dnaCardFileName(S.current.tier, S.current.handle));
      openSheet({
        title: "Post it to your Story",
        thumb: true,
        body: savedNote(s),
        steps: ["Open Instagram, tap + and choose Story.", "Pick your DNA card from your photos.", "Add a Link sticker with your link so viewers can find their own DNA."],
        actions: [{ ...copyLinkAct, primary: true }],
      });
      return s;
    },
    async tiktok() {
      const r = await tryShare({ files: [cardFile()] });
      if (r === "cancelled") return "cancelled";
      const s = r === "shared" ? "shared" : await saveFile(S.current.blob as Blob, dnaCardFileName(S.current.tier, S.current.handle));
      openSheet({
        title: "Use it on TikTok",
        thumb: true,
        body: r === "shared" ? "If you saved the image, it is in your photos now." : savedNote(s),
        steps: ["Open TikTok and tap +, then Upload.", "Choose the card. Post it as a photo, or make it the first frame of a video about your results.", "Put your link in your bio and tell viewers to find theirs."],
        actions: [copyLinkAct],
      });
      return s;
    },
    async whatsapp() {
      const r = await tryShare({ files: [cardFile()], text: shareMessage() });
      if (r === "shared") {
        toast("Sent to your share sheet");
        return "shared";
      }
      if (r === "cancelled") return "cancelled";
      const s = await saveFile(S.current.blob as Blob, dnaCardFileName(S.current.tier, S.current.handle));
      openSheet({
        title: "Send on WhatsApp",
        thumb: true,
        body: `${savedNote(s)} WhatsApp opens with your message and link; attach the card from your photos.`,
        msg: shareMessage(),
        anchor: { href: "https://wa.me/?text=" + encodeURIComponent(shareMessage()), label: "Open WhatsApp", blank: true },
        actions: [{ label: "Copy message", run: () => void copy(shareMessage()) }],
      });
      return s;
    },
    async text() {
      openSheet({
        title: "Send by text",
        body: "Your link shows a preview of your card in the conversation. If Messages does not open, copy the message instead.",
        msg: shareMessage(),
        anchor: { href: "sms:?&body=" + encodeURIComponent(shareMessage()), label: "Open Messages" },
        actions: [{ label: "Copy message", run: () => void copy(shareMessage()) }],
      });
      return "opened";
    },
    async download() {
      const s = await saveFile(S.current.blob as Blob, dnaCardFileName(S.current.tier, S.current.handle));
      if (s === "saved") toast("Card saved · 1080 × 1920 PNG");
      else if (s === "busy") toast("A save is already open");
      else openSheet({ title: "Save your card", thumb: true, body: savedNote(s), actions: [] });
      return s;
    },
  };

  const guardSample = (run: () => void) => {
    if (!S.current.sample || S.current.sampleOk) return run();
    openSheet({
      title: "This card uses sample data",
      body: "Sharing it would show patterns that are not yours. Import your content to share your real Content DNA.",
      actions: [
        {
          label: "Import my content",
          primary: true,
          run: () => {
            closeSheet();
            csvRef.current?.click();
          },
        },
        {
          label: "Share the sample anyway",
          run: () => {
            S.current.sampleOk = true;
            closeSheet();
            run();
          },
        },
      ],
    });
  };

  const onShare = (m: string) => {
    if (!S.current.blob) {
      toast("Your card is still rendering");
      return;
    }
    guardSample(async () => {
      const result = await ACT[m]();
      track("dna_card_shared", { method: m, result, sample: S.current.sample, fields: (Object.keys(S.current.show) as DnaCardShowKey[]).filter((k) => S.current.show[k]) });
    });
  };

  /* ---------- field toggles / tiers / inputs ---------- */
  const onToggle = (k: DnaCardShowKey, on: boolean) => {
    S.current.show[k] = on;
    bump();
    persist();
    rebuildCard();
    track("dna_field_toggled", { field: k, on });
  };

  const onTierClick = (t: DnaCardTierDef) => {
    const a = S.current.a;
    if (!a) return;
    const d = dnaDepth(a);
    if (!dnaCardTierUnlocked(t, d)) {
      toast(`${t.name} unlocks with ${dnaCardTierNeedText(t, d)}`);
      return;
    }
    S.current.tier = t.id;
    persist();
    track("dna_card_style", { tier: t.id, rank: t.rank });
    bump();
    rebuildCard(true);
  };

  const scrollTiers = (dir: number) =>
    tiersRef.current?.scrollBy({ left: dir * 256, behavior: reduceRef.current ? "auto" : "smooth" });

  const onHandle = (raw: string) => {
    setHandleText(raw);
    let v = raw.trim().replace(/\s+/g, "");
    if (v && !v.startsWith("@")) v = "@" + v;
    S.current.handle = v; // empty stays empty — unset, never a default
    persist();
    bump();
    rebuildCard();
  };

  const onCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const text = await f.text();
    e.target.value = "";
    if (load(text, false)) {
      S.current.sampleOk = false;
      const a = S.current.a as DnaCardAnalysis;
      toast(`Imported ${a.n} videos`);
      track("dna_data_imported", { videos: a.n, platforms: a.platforms });
    }
  };

  const onTemplate = async () => {
    const r = await saveFile(DNA_CARD_TEMPLATE_CSV, "content-dna-template.csv");
    if (r === "saved" || r === "downloaded") toast("Template saved");
    else
      openSheet({
        title: "CSV template",
        body: "Copy this header row into a spreadsheet, add one row per video, then export as CSV.",
        msg: DNA_CARD_TEMPLATE_CSV.split("\n")[0],
        actions: [{ label: "Copy header row", primary: true, run: () => void copy(DNA_CARD_TEMPLATE_CSV.split("\n")[0]) }],
      });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const u = URL.createObjectURL(f),
      im = new Image();
    im.onload = () => {
      const z = 720,
        cv = document.createElement("canvas");
      cv.width = cv.height = z;
      const k = Math.max(z / im.width, z / im.height);
      cv.getContext("2d")?.drawImage(im, (z - im.width * k) / 2, (z - im.height * k) / 2, im.width * k, im.height * k);
      URL.revokeObjectURL(u);
      setPhoto(cv.toDataURL("image/jpeg", 0.86));
      track("dna_photo_added", {});
    };
    im.onerror = () => toast("That image could not be opened");
    im.src = u;
  };

  const onUseSample = () => {
    S.current.handle = "";
    setHandleText("");
    load(DNA_CARD_SAMPLE_CSV, true);
  };

  /* ---------- render ---------- */
  const s = S.current;
  const a = s.a;
  const depth = a ? dnaDepth(a) : null;
  const nextTier = depth ? DNA_CARD_TIERS.find((t) => !dnaCardTierUnlocked(t, depth)) : null;
  const stateText = !a
    ? "Discovering your patterns…"
    : phase === "analyzing"
      ? `Analyzing ${a.n} videos…`
      : s.sample
        ? "Sample DNA mapped · import yours to replace it"
        : "DNA mapped · intelligence updated";
  const coverage = a
    ? `${a.n} videos · ${a.platforms.join(", ")}${a.from ? ` · ${dnaCardFmtDate(a.from)} – ${dnaCardFmtDate(a.to, true)}` : ""} · analyzed ${dnaCardFmtDate(a.analyzedAt)}`
    : "Loading…";
  const fieldItems: [DnaCardShowKey, DnaCardField | null][] = a
    ? FIELD_KEYS.map((k) => [k, a.fields[k]] as [DnaCardShowKey, DnaCardField | null])
    : [];
  // the handle row comes first in the prototype's list and carries no evidence tier
  const handleField = a
    ? { label: "Your handle", value: s.handle, why: "Shown so people know whose DNA this is. Turn it off to share anonymously: your link then uses your creator ID instead of your handle." }
    : null;

  const SHARE_ROWS: { act: string; title: string; sub: string; icon: React.ReactNode }[] = [
    {
      act: "story",
      title: "Instagram Story",
      sub: "Shares a vertical image",
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="5" y="2.5" width="14" height="19" rx="3.5" />
          <circle cx="12" cy="11" r="3.2" />
          <path d="M9 18h6" />
        </svg>
      ),
    },
    {
      act: "tiktok",
      title: "TikTok",
      sub: "Saves the card for a video or photo post",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.6 2.6 2.4 4.2 5 4.5" />
        </svg>
      ),
    },
    {
      act: "whatsapp",
      title: "WhatsApp",
      sub: "Sends the image and your personalized link",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 20l1.3-4A8 8 0 1 1 8.5 19z" />
          <path d="M9 10.5c.5 2 2 3.5 4 4" />
        </svg>
      ),
    },
    {
      act: "text",
      title: "Text message",
      sub: "Sends your link with a card preview",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
        </svg>
      ),
    },
    {
      act: "download",
      title: "Download",
      sub: "Saves the high-resolution card (1080 × 1920)",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 3v12M7 10l5 5 5-5" />
          <path d="M4 17v3h16v-3" />
        </svg>
      ),
    },
  ];

  return (
    <section id="dna-card-feature" className="dnac">
      <style>{DC_CSS}</style>
      <div className="dc-grid">
        <div className="dc-left">
          <div className="dc-hero">
            <div className="dc-fig">
              <canvas ref={helixRef} aria-hidden="true" />
            </div>
            <p className={`dc-state${phase === "done" ? " dc-done" : ""}`}>
              <span className="dc-pulse" />
              <span>{stateText}</span>
            </p>
          </div>
          <div className="dc-title">
            <div className="dc-titlerow">
              <h2>Your DNA Card</h2>
              <span className={`dc-src ${s.sample ? "dc-sample" : "dc-real"}`}>{s.sample ? "Sample data" : "Your data"}</span>
            </div>
            <p>{coverage}</p>
          </div>
          <div className="dc-preview">{cardUrl ? <img src={cardUrl} alt="Your Creator DNA Card" /> : null}</div>
          <p className="dc-hint">This is exactly what gets shared. Press and hold to save.</p>
          <div className="dc-tierhead">
            <h3 id="dc-tier-h">Pick your card</h3>
            <span className="dc-tnav">
              <button type="button" className="dc-tb" aria-label="Previous cards" onClick={() => scrollTiers(-1)}>
                ‹
              </button>
              <button type="button" className="dc-tb" aria-label="More cards" onClick={() => scrollTiers(1)}>
                ›
              </button>
            </span>
          </div>
          <div
            className="dc-tiers"
            role="radiogroup"
            aria-labelledby="dc-tier-h"
            tabIndex={0}
            ref={tiersRef}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                scrollTiers(1);
              }
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                scrollTiers(-1);
              }
            }}
          >
            {a &&
              depth &&
              DNA_CARD_TIERS.map((t) => {
                const ok = dnaCardTierUnlocked(t, depth);
                const selected = s.tier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    className={`dc-tier${ok ? "" : " dc-locked"}`}
                    aria-checked={selected}
                    aria-label={`${t.name} card, tier ${t.rank} of ${DNA_CARD_TIERS.length}${ok ? "" : ", locked"}`}
                    onClick={() => onTierClick(t)}
                  >
                    <span className="dc-th">{thumbs[t.id] ? <img alt="" src={thumbs[t.id]} /> : null}</span>
                    {t.rank === DNA_CARD_TIERS.length ? <span className="dc-topbadge">Highest</span> : null}
                    {ok ? null : (
                      <span className="dc-lk" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      </span>
                    )}
                    <b>
                      <span className="dc-gemdot" style={{ background: GEMCSS[t.id] }} />
                      {t.name}
                    </b>
                    <small>{ok ? `Tier ${t.rank}${selected ? " · selected" : ""}` : `Needs ${dnaCardTierNeedText(t, depth)}`}</small>
                  </button>
                );
              })}
          </div>
          <p className="dc-note">
            {a && depth
              ? `Your DNA: ${depth.v} videos analyzed · ${depth.p} verified pattern${depth.p === 1 ? "" : "s"}. ${nextTier ? `Next card: ${nextTier.name}, with ${dnaCardTierNeedText(nextTier, depth)}.` : `All ${DNA_CARD_TIERS.length} cards unlocked.`} Higher cards unlock as Content DNA learns more about you, never from followers or views.`
              : ""}
          </p>
        </div>

        <div>
          <section className="dc-block" aria-labelledby="dc-share-h">
            <h3 id="dc-share-h">Share your card</h3>
            <p className="dc-note">Sharing is optional. Nothing posts until you choose where it goes.</p>
            <ul className="dc-share">
              {SHARE_ROWS.map((r) => (
                <li key={r.act}>
                  <button type="button" onClick={() => onShare(r.act)}>
                    <span className="dc-ico">{r.icon}</span>
                    <span>
                      <b>{r.title}</b>
                      <small>{r.sub}</small>
                    </span>
                    <span className="dc-chev">›</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="dc-linkrow">
              <code>{a ? shareLink() : ""}</code>
              <button
                className="dc-btn"
                type="button"
                onClick={() => {
                  void copy(shareLink());
                  track("dna_link_copied", {});
                }}
              >
                Copy link
              </button>
            </div>
          </section>

          <section className="dc-block" aria-labelledby="dc-pub-h">
            <h3 id="dc-pub-h">On your card</h3>
            <p className="dc-note">You decide what&apos;s public. Turn off anything you&apos;d rather keep to yourself.</p>
            <div className="dc-photo">
              <span
                className="dc-pthumb"
                aria-hidden="true"
                style={s.photo ? { backgroundImage: `url("${s.photo}")` } : undefined}
              />
              <span>
                <b>Your photo</b>
                <small>Optional. Puts you at the center of your card, wrapped in your content fingerprint.</small>
              </span>
              <span className="dc-pbtns">
                <span className="dc-btn dc-file">
                  <span>{s.photo ? "Change photo" : "Add photo"}</span>
                  <input type="file" accept="image/*" aria-label="Add your photo" onChange={onPhoto} />
                </span>
                {s.photo ? (
                  <button className="dc-btn dc-ghost" type="button" onClick={() => setPhoto(null)}>
                    Remove photo
                  </button>
                ) : null}
              </span>
            </div>
            <ul className="dc-fields">
              {a && handleField ? (
                <li className={s.show.handle ? "" : "dc-off"}>
                  <div className="dc-frow">
                    <span>
                      <span className="dc-lab">{handleField.label}</span>
                      <span className="dc-val">{handleField.value}</span>
                    </span>
                    <input
                      className="dc-sw"
                      type="checkbox"
                      checked={s.show.handle}
                      onChange={(e) => onToggle("handle", e.target.checked)}
                      aria-label={`Show ${handleField.label} on card`}
                    />
                  </div>
                  <details>
                    <summary>Why this?</summary>
                    <p>{handleField.why}</p>
                  </details>
                </li>
              ) : null}
              {a &&
                fieldItems.map(([k, f]) => {
                  if (!f)
                    return (
                      <li key={k} className="dc-na">
                        <div className="dc-frow">
                          <span>
                            <span className="dc-lab">{NA_LABEL[k]}</span>
                            <span className="dc-val">Not enough evidence yet</span>
                          </span>
                          <input className="dc-sw" type="checkbox" disabled aria-label={`${NA_LABEL[k]} unavailable`} />
                        </div>
                      </li>
                    );
                  return (
                    <li key={k} className={s.show[k] ? "" : "dc-off"}>
                      <div className="dc-frow">
                        <span>
                          <span className="dc-lab">{f.label}</span>
                          <span className="dc-val">{f.value}</span>
                          <span className={`dc-chip dc-${f.tier}`}>{TIER_LABEL[f.tier]}</span>
                        </span>
                        <input
                          className="dc-sw"
                          type="checkbox"
                          checked={s.show[k]}
                          onChange={(e) => onToggle(k, e.target.checked)}
                          aria-label={`Show ${f.label} on card`}
                        />
                      </div>
                      <details>
                        <summary>Why this?</summary>
                        <p>{f.why}</p>
                      </details>
                    </li>
                  );
                })}
            </ul>
            <div className="dc-never">
              <span aria-hidden="true">✓</span>
              <span>Never on your card: views, followers, audience details, earnings or any raw analytics. Only the patterns you switch on.</span>
            </div>
          </section>

          <section className="dc-block" aria-labelledby="dc-priv-h">
            <h3 id="dc-priv-h">Kept private</h3>
            <p className="dc-note">Your numbers stay inside ULTRA VESTRA.</p>
            <div className="dc-priv">
              {a ? (
                <>
                  <div>
                    <b>Your baseline</b>
                    <p>
                      Typical engagement {(a.mainBase.er * 100).toFixed(1)}%
                      {a.hasShares ? ` · ${a.mainBase.sr.toFixed(1)} shares per 1,000 views` : ""} (median of {a.mainBase.n} videos). Each video is compared with its own
                      platform&apos;s baseline, using rates rather than raw views so older or boosted posts don&apos;t dominate.
                    </p>
                  </div>
                  {a.rethink ? (
                    <div>
                      <b>Worth rethinking</b>
                      <p>{a.rethink}</p>
                    </div>
                  ) : null}
                  {a.fields.experiment ? (
                    <div>
                      <b>Experiment plan</b>
                      <p>
                        {a.fields.experiment.change} Measure: {a.fields.experiment.metric}. Compare once all 4 are at least 7 days old. Four videos give a signal, not proof.
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <details>
                      <summary>How Content DNA decides</summary>
                      <p>
                        <b>Verified</b>: 5+ videos, at least 1.2× your typical engagement, and 70%+ of them beat your baseline. <b>Observed</b>: 3+ videos at 1.15× or more.{" "}
                        <b>Testing</b>: a promising signal with too little evidence. Patterns show what tends to go with stronger results, not proven causes.
                      </p>
                    </details>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="dc-block" aria-labelledby="dc-data-h">
            <h3 id="dc-data-h">Your data</h3>
            <div className="dc-data">
              <label className="dc-f">
                Your handle on the card
                <input type="text" value={handleText} maxLength={31} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="@yourhandle" onChange={(e) => onHandle(e.target.value)} />
              </label>
              <div className="dc-btns">
                <span className="dc-btn dc-primary dc-file">
                  Import my content (CSV)
                  <input ref={csvRef} type="file" accept=".csv,text/csv,text/plain" aria-label="Import content CSV" onChange={onCsv} />
                </span>
                <button className="dc-btn" type="button" onClick={() => void onTemplate()}>
                  Get the CSV template
                </button>
                {s.sample ? null : (
                  <button className="dc-btn dc-ghost" type="button" onClick={onUseSample}>
                    Use sample data
                  </button>
                )}
              </div>
              <ul className="dc-issues">
                {s.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="dc-note" style={{ margin: 0 }}>
                Works with the template or an analytics export that has views, likes, comments, shares and saves. Add topic, format and hook columns for the sharpest DNA. Direct
                TikTok and Instagram connections plug in here once those integrations are live.
              </p>
            </div>
          </section>
        </div>
      </div>

      {sheet ? (
        <div
          className="dc-scrim"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <div className="dc-sheet" role="dialog" aria-modal="true" aria-labelledby="dc-sheet-h">
            <button className="dc-x" type="button" aria-label="Close" onClick={closeSheet}>
              ×
            </button>
            <h3 id="dc-sheet-h" ref={sheetHRef} tabIndex={-1}>
              {sheet.title}
            </h3>
            {sheet.thumb && cardUrl ? <img className="dc-thumb" src={cardUrl} alt="Your DNA card" /> : null}
            {sheet.body ? <p>{sheet.body}</p> : null}
            {sheet.steps ? (
              <ol>
                {sheet.steps.map((st) => (
                  <li key={st}>{st}</li>
                ))}
              </ol>
            ) : null}
            {sheet.msg ? <div className="dc-msg">{sheet.msg}</div> : null}
            <div className="dc-acts">
              {sheet.anchor ? (
                <a className="dc-btn dc-primary" href={sheet.anchor.href} {...(sheet.anchor.blank ? { target: "_blank", rel: "noopener" } : {})}>
                  {sheet.anchor.label}
                </a>
              ) : null}
              {sheet.actions.map((x, i) => (
                <button key={i} className={`dc-btn${x.primary ? " dc-primary" : ""}`} type="button" onClick={() => x.run()}>
                  {x.label}
                </button>
              ))}
              <button className="dc-btn dc-ghost" type="button" onClick={closeSheet}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className={`dc-toast${toastOn ? " dc-on" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </section>
  );
}
