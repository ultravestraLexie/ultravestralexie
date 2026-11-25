/* Growth Engine scoped styles (.eng) — the six-stage engine
 * section on Home plus the /customers and /retention pages.
 * Galaxy tokens, glass cards, gold Brain panel. */
export const ENG_CSS = `
.eng{--e-bg:#04051A;--e-panel:rgba(16,20,48,.72);--e-line:rgba(130,150,255,.16);--e-text:#F2F4FF;--e-text2:#C3C9EA;--e-muted:#8B93BC;--e-gold:#F5C451;--e-violet:#B69CFF;--e-teal:#3EE6E0;--e-pink:#FF9CC8;--e-green:#4ADE80;--e-amber:#FBBF24;color:var(--e-text);font-family:Inter,system-ui,sans-serif}
.eng *{box-sizing:border-box}
.eng .wrap{max-width:1060px;margin:0 auto;padding:28px 18px 8px}
.eng .label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--e-gold)}
.eng h2.eng-title{font-family:'Space Grotesk',Inter,sans-serif;font-size:26px;margin:6px 0 4px}
.eng .sub{color:var(--e-text2);font-size:14px;line-height:1.55;margin:0 0 18px;max-width:640px}
.eng .brain{background:linear-gradient(135deg,rgba(245,196,81,.10),rgba(182,156,255,.10));border:1px solid rgba(245,196,81,.35);border-radius:18px;padding:16px;margin-bottom:14px}
.eng .brain .label{color:var(--e-gold)}
.eng .rec{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--e-line)}
.eng .rec:first-of-type{border-top:none}
.eng .rec .tag{flex:none;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 8px;border-radius:999px;background:rgba(182,156,255,.14);color:var(--e-violet)}
.eng .rec .t{font-weight:600;font-size:15px}
.eng .rec .w{color:var(--e-text2);font-size:13px;line-height:1.5;margin-top:2px}
.eng .rec a{flex:none;align-self:center;color:var(--e-gold);font-weight:600;font-size:13px;text-decoration:none;border:1px solid rgba(245,196,81,.4);padding:7px 12px;border-radius:999px;white-space:nowrap}
.eng .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.eng .stage{display:block;background:var(--e-panel);border:1px solid var(--e-line);border-radius:16px;padding:14px;text-decoration:none;color:var(--e-text)}
.eng .stage .n{font-size:10px;font-weight:700;letter-spacing:2px;color:var(--e-muted);text-transform:uppercase}
.eng .stage .name{font-family:'Space Grotesk',Inter,sans-serif;font-size:17px;font-weight:700;margin-top:2px}
.eng .stage .verb{color:var(--e-text2);font-size:12.5px}
.eng .stage .metric{font-size:19px;font-weight:700;margin-top:10px}
.eng .stage .detail{color:var(--e-muted);font-size:12.5px;line-height:1.5;margin-top:3px}
.eng .stage .go{color:var(--e-gold);font-size:12.5px;font-weight:600;margin-top:10px;display:block}
.eng .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.eng .kpi{background:var(--e-panel);border:1px solid var(--e-line);border-radius:14px;padding:12px 14px}
.eng .kpi .v{font-size:21px;font-weight:700}
.eng .kpi .k{color:var(--e-muted);font-size:12px;margin-top:2px}
.eng .row{display:flex;gap:12px;align-items:center;background:var(--e-panel);border:1px solid var(--e-line);border-radius:14px;padding:12px 14px;margin-bottom:8px;flex-wrap:wrap}
.eng .row .grow{flex:1;min-width:160px}
.eng .row .t{font-weight:600;font-size:15px}
.eng .row .s{color:var(--e-muted);font-size:12.5px;margin-top:2px}
.eng .badge{font-size:10.5px;font-weight:700;letter-spacing:.5px;padding:4px 8px;border-radius:999px;text-transform:uppercase}
.eng .b-repeat{background:rgba(74,222,128,.14);color:var(--e-green)}
.eng .b-due{background:rgba(251,191,36,.14);color:var(--e-amber)}
.eng .b-active{background:rgba(62,230,224,.12);color:var(--e-teal)}
.eng .row a.cta,.eng .card a.cta{color:var(--e-gold);font-weight:600;font-size:13px;text-decoration:none;border:1px solid rgba(245,196,81,.4);padding:7px 12px;border-radius:999px;white-space:nowrap}
.eng .card{background:var(--e-panel);border:1px solid var(--e-line);border-radius:16px;padding:16px;margin-bottom:12px}
.eng .empty{color:var(--e-text2);font-size:14px;line-height:1.6;background:var(--e-panel);border:1px dashed var(--e-line);border-radius:16px;padding:18px}
.eng .note{color:var(--e-muted);font-size:12.5px;line-height:1.6;margin-top:14px}
.eng h3.eng-h{font-family:'Space Grotesk',Inter,sans-serif;font-size:18px;margin:20px 0 10px}
`;
