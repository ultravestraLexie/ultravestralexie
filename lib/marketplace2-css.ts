/* Marketplace v2 additions to the scoped .mkt stylesheet — the two
 * classes the v2 prototype's home pages use that the v1 port did not
 * need (the brand dashboard's progress bar and the dashboard header
 * icon button), with the prototype's values and the --m-* variable
 * names of lib/marketplace-css.ts. Include alongside MKT_CSS. */
export const MKT2_CSS = `
.mkt .icon-btn{width:44px;height:44px;flex-shrink:0;border-radius:14px;background:var(--m-glass);border:1px solid var(--m-edge);display:grid;place-items:center;cursor:pointer;padding:0;color:var(--m-text)}
.mkt .icon-btn:hover{border-color:var(--m-edge2)}
.mkt .prog{height:10px;border-radius:999px;background:rgba(130,150,255,.14);overflow:hidden;margin-top:8px}
.mkt .prog i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--m-cyan),var(--m-purple))}
.mkt .tabrow{display:flex;gap:8px;margin:2px 0 14px}
`;
