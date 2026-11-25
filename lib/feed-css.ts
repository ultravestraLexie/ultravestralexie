/* Feed + Brain Command Center styles (rebuild Phase 1), scoped
 * under .fd alongside the Growth Engine's .eng base. */
export const FEED_CSS = `
.fd .composer{background:var(--e-panel);border:1px solid var(--e-line);border-radius:18px;padding:16px;margin:18px 0}
.fd textarea{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid var(--e-line);border-radius:12px;color:var(--e-text);padding:12px 14px;font-size:15px;font-family:inherit;resize:vertical;min-height:64px}
.fd textarea:focus{outline:none;border-color:var(--e-violet)}
.fd .composer-row{display:flex;align-items:center;gap:10px;margin-top:10px}
.fd .count{margin-left:auto;font-size:12.5px;color:var(--e-muted)}
.fd .postbtn{background:linear-gradient(120deg,var(--e-violet),var(--e-violet));color:#fff;border:none;border-radius:999px;padding:10px 22px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit}
.fd .postbtn:disabled{opacity:.45;cursor:default}
.fd .err{color:#ff9db1;font-size:13.5px;margin-top:8px}
.fd .post{background:var(--e-panel);border:1px solid var(--e-line);border-radius:18px;padding:16px 18px;margin:0 0 12px}
.fd .p-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.fd .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--e-violet),var(--e-violet));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#fff;flex:0 0 36px}
.fd .p-name{font-weight:700;font-size:15px}
.fd .p-meta{font-size:12.5px;color:var(--e-muted)}
.fd .kind{margin-left:auto;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--e-violet);border:1px solid var(--e-line);padding:3px 9px;border-radius:999px}
.fd .p-cap{font-size:15.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word}
.fd .p-actions{display:flex;gap:8px;margin-top:12px}
.fd .like{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.05);border:1px solid var(--e-line);color:var(--e-text2);border-radius:999px;padding:7px 14px;font-size:13.5px;cursor:pointer;font-family:inherit}
.fd .like.on{color:#ff7d9c;border-color:rgba(255,125,156,.5)}
.fd .cmdbox{background:var(--e-panel);border:1px solid var(--e-line);border-radius:18px;padding:16px;margin:18px 0}
.fd .cmdrow{display:flex;gap:10px}
.fd .cmdrow input{flex:1;background:rgba(255,255,255,.05);border:1px solid var(--e-line);border-radius:12px;color:var(--e-text);padding:12px 14px;font-size:15px;font-family:inherit;min-width:0}
.fd .cmdrow input:focus{outline:none;border-color:var(--e-violet)}
.fd .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.fd .chip{background:rgba(255,255,255,.05);border:1px solid var(--e-line);color:var(--e-text2);border-radius:999px;padding:7px 13px;font-size:13px;cursor:pointer;font-family:inherit}
.fd .chip:hover{color:var(--e-text);border-color:var(--e-violet)}
.fd .answer{border:1px solid color-mix(in srgb,var(--e-violet) 45%,transparent);background:linear-gradient(120deg,color-mix(in srgb,var(--e-violet) 14%,transparent),transparent);border-radius:16px;padding:16px 18px;margin-top:14px}
.fd .agent{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--e-violet);font-weight:700}
.fd .a-title{font-size:17px;font-weight:700;margin:5px 0 4px}
.fd .a-blurb{color:var(--e-text2);font-size:14.5px;line-height:1.5;margin:0 0 12px}
.fd .log{margin-top:8px}
.fd .logrow{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--e-line);font-size:13.5px}
.fd .logrow:last-child{border-bottom:none}
.fd .logrow .when{color:var(--e-muted);white-space:nowrap}
.fd .mkt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:18px}
.fd .mkt{display:block;background:var(--e-panel);border:1px solid var(--e-line);border-radius:18px;padding:18px;text-decoration:none;color:var(--e-text)}
.fd .mkt:hover{border-color:var(--e-violet)}
.fd .mkt .t{font-size:16.5px;font-weight:700;margin:0 0 5px}
.fd .mkt .d{color:var(--e-text2);font-size:14px;line-height:1.5;margin:0}
.fd .mkt .go2{color:var(--e-violet);font-size:13.5px;font-weight:700;margin-top:10px;display:inline-block}
`;
