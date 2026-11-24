/* Scoped stylesheet for the local-gigs market surfaces (landing
 * hero, Local opportunities on /brands, /me/marketplace, and the
 * business campaigns/creators/customers previews). It is the
 * prototype's own stylesheet with every rule scoped under .mkt and
 * its variables renamed --m-*, so nothing leaks into (or is leaked
 * into) the Galaxy app — the .dnac / .econ precedent. */

export const MKT_CSS = `
.mkt{--m-page:#04060F;--m-glass:rgba(14,20,52,.8);--m-glass2:rgba(24,33,77,.78);--m-edge:rgba(130,150,255,.18);--m-edge2:rgba(130,150,255,.34);--m-line:rgba(130,150,255,.12);--m-text:#F2F4FF;--m-text2:#D5DAF5;--m-muted:#A3ACD6;--m-faint:#8E98C8;--m-cyan:#3EE6E0;--m-blue:#4C7DFF;--m-blue-soft:#9DB8FF;--m-blue-btn:#3563E9;--m-purple:#B69CFF;--m-gold:#F5C451;--m-orange:#F59E42;--m-green:#4ADE80;--m-red:#FF8A8A;--m-display:'Space Grotesk',system-ui,sans-serif;--m-body:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:dark;position:relative;color:var(--m-text);font:16px/1.5 var(--m-body);-webkit-font-smoothing:antialiased}
.mkt *{box-sizing:border-box}
.mkt button,.mkt input,.mkt textarea,.mkt select{font-family:var(--m-body);color:inherit}
.mkt a{color:var(--m-blue-soft)}
.mkt svg.i{width:20px;height:20px;flex-shrink:0}
.mkt .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mkt-col{max-width:680px;margin:0 auto}
.mkt .sky{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:inherit}
.mkt .stars{position:absolute;inset:0;background-image:radial-gradient(1px 1px at 20px 30px,#fff,transparent 60%),radial-gradient(1px 1px at 140px 90px,#cbd5ff,transparent 60%),radial-gradient(1.4px 1.4px at 220px 200px,#b69cff,transparent 60%),radial-gradient(1px 1px at 80px 240px,#3ee6e0,transparent 60%);background-size:280px 280px;opacity:.3}
.mkt .glow{position:absolute;width:540px;height:540px;border-radius:50%;filter:blur(70px);opacity:.4}
.mkt .glow.g1{left:-240px;top:-200px;background:radial-gradient(circle,rgba(124,92,255,.6),transparent 65%)}
.mkt .glow.g2{right:-260px;top:220px;background:radial-gradient(circle,rgba(62,230,224,.3),transparent 65%)}
.mkt .glow.g3{left:10%;bottom:-260px;background:radial-gradient(circle,rgba(245,158,66,.22),transparent 65%)}
.mkt .lift{position:relative;z-index:1}
.mkt .glass{background:var(--m-glass);border:1px solid var(--m-edge);border-radius:22px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mkt .pad{padding:18px}
.mkt .label{font-size:11px;letter-spacing:1.5px;font-weight:700;color:var(--m-muted);text-transform:uppercase}
.mkt .muted{color:var(--m-muted)}
.mkt .faint{color:var(--m-faint)}
.mkt .title{font:700 28px/1.1 var(--m-display);margin:6px 2px 6px;letter-spacing:-.3px}
.mkt .sub{color:var(--m-muted);font-size:14px;line-height:1.5;margin:0 2px 12px}
.mkt .section-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:26px 4px 10px}
.mkt .section-head h2{font:700 18px var(--m-display);margin:0}
.mkt .stack{display:flex;flex-direction:column;gap:10px}
.mkt .row{display:flex;align-items:center;gap:10px}
.mkt .wrap{flex-wrap:wrap}
.mkt .grow{flex:1;min-width:0}
.mkt .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mkt .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.mkt .btn{min-height:48px;border-radius:14px;border:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:15px;cursor:pointer;padding:0 18px;text-decoration:none;color:var(--m-text);transition:transform .12s;background:none}
.mkt .btn:active{transform:scale(.98)}
.mkt .btn.primary{background:var(--m-blue-btn);color:#fff;box-shadow:0 8px 26px rgba(53,99,233,.3)}
.mkt .btn.primary:hover{background:#2D55D0}
.mkt .btn.gold{background:linear-gradient(135deg,#F5C451,#F59E42);color:#1A1200}
.mkt .btn.ghost{background:var(--m-glass2);border:1px solid var(--m-edge2)}
.mkt .btn.danger{background:transparent;border:1px solid rgba(255,138,138,.45);color:var(--m-red)}
.mkt .btn.small{min-height:40px;font-size:13px;padding:0 14px;border-radius:12px}
.mkt .btn.block{width:100%}
.mkt .btn:disabled{opacity:.4;cursor:not-allowed}
.mkt .btn svg{width:18px;height:18px}
.mkt .chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.mkt .chips::-webkit-scrollbar{display:none}
.mkt .chips.wrap{flex-wrap:wrap;overflow:visible}
.mkt .chip{flex-shrink:0;min-height:40px;padding:8px 14px;border-radius:999px;background:var(--m-glass);border:1px solid var(--m-edge);font-size:13px;font-weight:600;color:var(--m-text2);cursor:pointer;white-space:nowrap}
.mkt .chip:hover{border-color:var(--m-edge2)}
.mkt .chip[aria-pressed="true"],.mkt .chip[aria-checked="true"]{background:rgba(62,230,224,.14);border-color:var(--m-cyan);color:var(--m-text)}
.mkt .chip .n{margin-left:4px;color:var(--m-faint);font-weight:500}
.mkt .tag{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.mkt .tag svg{width:12px;height:12px}
.mkt .t-cyan{background:rgba(62,230,224,.13);color:var(--m-cyan)}
.mkt .t-gold{background:rgba(245,196,81,.14);color:var(--m-gold)}
.mkt .t-purple{background:rgba(182,156,255,.16);color:var(--m-purple)}
.mkt .t-blue{background:rgba(76,125,255,.16);color:var(--m-blue-soft)}
.mkt .t-green{background:rgba(74,222,128,.13);color:var(--m-green)}
.mkt .t-orange{background:rgba(245,158,66,.14);color:var(--m-orange)}
.mkt .t-faint{background:rgba(130,150,255,.1);color:var(--m-faint)}
.mkt .avatar{width:46px;height:46px;flex-shrink:0;border-radius:14px;display:grid;place-items:center;font:700 15px var(--m-display);color:#0A0F28}
.mkt .avatar.round{border-radius:50%}
.mkt .avatar.sm{width:36px;height:36px;font-size:12px;border-radius:11px}
.mkt .opp{display:block;width:100%;text-align:left;padding:16px;cursor:pointer;position:relative;overflow:hidden;transition:border-color .2s,transform .2s;color:var(--m-text)}
.mkt .opp:hover{border-color:var(--m-edge2);transform:translateY(-2px)}
.mkt .opp .biz{font-size:13px;font-weight:600;color:var(--m-text2)}
.mkt .opp .meta{font-size:12px;color:var(--m-faint);margin-top:2px}
.mkt .opp h3{font:700 18px/1.25 var(--m-display);margin:12px 0 8px}
.mkt .opp .pay{font:700 16px var(--m-display);color:var(--m-gold)}
.mkt .opp .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mkt .ring{width:52px;height:52px;flex-shrink:0;border-radius:50%;display:grid;place-items:center;position:relative}
.mkt .ring::before{content:"";position:absolute;inset:5px;border-radius:50%;background:#0B1030}
.mkt .ring b{position:relative;font:700 14px var(--m-display)}
.mkt .ring small{position:absolute;bottom:-16px;font-size:9px;letter-spacing:1px;color:var(--m-faint);font-weight:700}
.mkt .loop{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;align-items:center;margin:14px 0 0;padding:0;list-style:none}
.mkt .loop li{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--m-text2)}
.mkt .loop li span{padding:6px 10px;border-radius:999px;background:var(--m-glass);border:1px solid var(--m-edge)}
.mkt .loop li svg{width:12px;height:12px;color:var(--m-faint)}
.mkt .hero{text-align:center;padding:10px 0 6px}
.mkt .hero h1{font:700 clamp(32px,8.5vw,48px)/1.05 var(--m-display);margin:14px 0 10px;letter-spacing:-.5px}
.mkt .hero p{margin:0 auto;max-width:480px;color:var(--m-text2);font-size:15px;line-height:1.55}
.mkt .grad{background:linear-gradient(92deg,#F5C451 0%,#FF9CC8 40%,#B69CFF 70%,#3EE6E0 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.mkt .orbit{width:100%;max-width:360px;height:auto;display:block;margin:0 auto;overflow:visible}
.mkt .orbit .spin{transform-origin:180px 120px;animation:mktspin 30s linear infinite}
@keyframes mktspin{to{transform:rotate(360deg)}}
.mkt .role-card{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:16px;cursor:pointer;transition:border-color .2s,transform .2s;color:var(--m-text);text-decoration:none}
.mkt .role-card:hover{border-color:var(--m-edge2);transform:translateY(-2px)}
.mkt .role-card .ico{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;flex-shrink:0}
.mkt .role-card .ico svg{width:24px;height:24px}
.mkt .role-card b{font:700 17px var(--m-display);display:block}
.mkt .role-card span.d{font-size:13px;color:var(--m-muted);display:block;margin-top:3px;line-height:1.4}
.mkt .kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.mkt .kpi{padding:14px 12px}
.mkt .kpi b{display:block;font:700 22px/1.05 var(--m-display)}
.mkt .kpi span{display:block;font-size:11px;color:var(--m-muted);margin-top:6px}
.mkt .funnel{display:flex;flex-direction:column;gap:8px}
.mkt .fstep{display:grid;grid-template-columns:86px minmax(0,1fr) 70px;gap:10px;align-items:center;font-size:13px}
.mkt .fstep .bar2{height:26px;border-radius:8px;background:rgba(130,150,255,.08);overflow:hidden}
.mkt .fstep .bar2 i{display:block;height:100%;border-radius:8px}
.mkt .fstep b{text-align:right;font:700 14px var(--m-display)}
.mkt .list{display:flex;flex-direction:column;overflow:hidden}
.mkt .li{display:flex;align-items:center;gap:12px;padding:14px 16px;width:100%;background:none;border:none;text-align:left;cursor:pointer;color:var(--m-text)}
.mkt .li + .li{border-top:1px solid var(--m-line)}
.mkt .li:hover{background:rgba(130,150,255,.05)}
.mkt .li .t{font-size:15px;font-weight:600}
.mkt .li .s{font-size:12px;color:var(--m-faint);margin-top:3px;line-height:1.4}
.mkt .li .chev{width:18px;height:18px;color:var(--m-faint)}
.mkt .collab{padding:16px}
.mkt .collab + .collab{margin-top:10px}
.mkt .collab .head{display:flex;align-items:flex-start;gap:12px}
.mkt .collab .head .t{font:700 16px/1.3 var(--m-display)}
.mkt .collab .head .s{font-size:12px;color:var(--m-faint);margin-top:3px}
.mkt .steps{display:flex;gap:4px;margin:14px 0 6px}
.mkt .steps i{flex:1;height:5px;border-radius:999px;background:rgba(130,150,255,.15)}
.mkt .steps i.on{background:linear-gradient(90deg,var(--m-cyan),var(--m-purple))}
.mkt .steps-l{display:flex;justify-content:space-between;font-size:10px;color:var(--m-faint);font-weight:600;letter-spacing:.3px}
.mkt .next{margin-top:14px;padding:14px;border-radius:16px;background:rgba(4,6,15,.45);border:1px solid var(--m-edge)}
.mkt .next .q{font-size:14px;font-weight:600;margin-bottom:10px;line-height:1.4}
.mkt .stats4{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:12px}
.mkt .stats4 div{text-align:center;padding:10px 4px;border-radius:12px;background:rgba(4,6,15,.45)}
.mkt .stats4 b{display:block;font:700 15px var(--m-display)}
.mkt .stats4 span{display:block;font-size:10px;color:var(--m-faint);margin-top:3px}
.mkt .field{display:block;margin-top:14px}
.mkt .field > span{display:block;font-size:13px;font-weight:600;color:var(--m-text2);margin-bottom:7px}
.mkt .field small{display:block;font-size:12px;color:var(--m-faint);margin-top:6px;line-height:1.4}
.mkt .in{width:100%;min-height:48px;border-radius:14px;border:1px solid var(--m-edge2);background:rgba(4,6,15,.55);padding:10px 14px;font-size:15px}
.mkt .in:focus{outline:2px solid var(--m-purple);outline-offset:1px}
.mkt .in::placeholder{color:var(--m-faint)}
.mkt textarea.in{min-height:96px;resize:vertical;line-height:1.45}
.mkt select.in{appearance:none;-webkit-appearance:none;background-image:linear-gradient(45deg,transparent 50%,#A3ACD6 50%),linear-gradient(135deg,#A3ACD6 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 15px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px}
.mkt .check{display:flex;align-items:flex-start;gap:10px;margin-top:14px;font-size:14px;line-height:1.45;color:var(--m-text2);cursor:pointer}
.mkt .check input{width:20px;height:20px;margin:1px 0 0;accent-color:var(--m-cyan);flex-shrink:0}
.mkt .preview-tag{display:inline-block;margin-bottom:8px}
.mkt .fu{padding:14px 16px}
.mkt .fu + .fu{border-top:1px solid var(--m-line)}
.mkt .fu .why{font-size:12px;color:var(--m-faint);margin-top:2px}
.mkt .fu .msg{margin-top:10px;padding:12px;border-radius:14px;background:rgba(4,6,15,.45);border:1px solid var(--m-edge);font-size:14px;line-height:1.5;color:var(--m-text2);white-space:pre-wrap}
.mkt .fu .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.mkt .switch{width:52px;height:32px;flex-shrink:0;border-radius:999px;border:1px solid var(--m-edge2);background:rgba(130,150,255,.14);position:relative;cursor:pointer;padding:0}
.mkt .switch span{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#C9D0F0;transition:transform .2s}
.mkt .switch[aria-checked="true"]{background:var(--m-blue-btn);border-color:var(--m-blue-btn)}
.mkt .switch[aria-checked="true"] span{transform:translateX(20px);background:#fff}
.mkt .banner{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;padding:10px 14px;border-radius:14px;border:1px dashed rgba(245,196,81,.55);background:rgba(245,196,81,.07);color:var(--m-gold);font-size:12px;line-height:1.45}
.mkt .banner .grow{min-width:170px}
.mkt .empty{padding:20px 18px;text-align:center;color:var(--m-muted);font-size:14px;line-height:1.55}
.mkt .note{font-size:12px;color:var(--m-faint);line-height:1.5;margin:10px 4px 0}
.mkt .back{display:inline-flex;align-items:center;gap:4px;min-height:40px;background:none;border:none;color:var(--m-blue-soft);font-size:14px;font-weight:600;cursor:pointer;padding:0 4px 0 0}
.mkt .back svg{width:18px;height:18px}
.mkt .sheet-backdrop{position:fixed;inset:0;z-index:80;background:rgba(2,3,10,.66);display:flex;align-items:flex-end;justify-content:center}
.mkt .sheet{width:min(560px,100%);max-height:calc(100vh - 40px);overflow-y:auto;margin:0 10px calc(10px + env(safe-area-inset-bottom));padding:22px 18px 18px;border-radius:24px;background:rgba(14,20,52,.99);border:1px solid var(--m-edge2)}
.mkt .sheet h2{font:700 21px var(--m-display);margin:0 0 6px}
.mkt .sheet p{margin:0 0 6px;color:var(--m-muted);font-size:14px;line-height:1.5}
.mkt .sheet .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.mkt .toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);background:rgba(24,33,77,.97);border:1px solid var(--m-edge2);padding:12px 18px;border-radius:14px;font-size:14px;font-weight:600;z-index:90;max-width:90vw;text-align:center;color:var(--m-text)}
.mkt .foot{text-align:center;font-size:11px;letter-spacing:3px;color:var(--m-faint);margin-top:28px;font-weight:600}
@media (prefers-reduced-motion: reduce){.mkt .orbit .spin{animation:none}}
`;
