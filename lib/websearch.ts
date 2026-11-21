/* Live web search — the second UltraVestra search engine.
 * When the verified database does not hold an answer (or to widen any
 * search), UltraVestra also searches the public web and returns links
 * with their sources. Results are always labeled as live-web findings:
 * they are NOT verified by UltraVestra research, and no commission or
 * term from a web result is ever presented as a verified fact.
 *
 * Engine: DuckDuckGo's keyless Lite endpoint, with the HTML endpoint
 * as fallback. Two hard-won details (both verified live 2026-11-21):
 *  1. DDG answers Node/fetch requests that carry a bot-looking
 *     User-Agent with a 202 "anomaly" page containing no results, so
 *     the request must carry a plain browser UA + Accept headers.
 *  2. In Lite result anchors the href attribute comes BEFORE the
 *     class attribute, so parsing must not assume attribute order. */

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

function clean(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeTarget(raw: string): string {
  let url = raw;
  if (url.startsWith("//")) url = `https:${url}`;
  try {
    const u = new URL(url);
    const uddg = u.searchParams.get("uddg");
    if (uddg) url = decodeURIComponent(uddg);
  } catch { /* keep the raw href */ }
  return url;
}

/* Scan every anchor in the page; keep those whose class matches.
 * Attribute order in the tag is irrelevant. */
function anchorsWithClass(html: string, cls: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const tagRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    if (!m[1].includes(cls)) continue;
    const href = /href="([^"]+)"/.exec(m[1])?.[1] ?? /href='([^']+)'/.exec(m[1])?.[1];
    if (!href) continue;
    out.push({ href, text: clean(m[2]) });
  }
  return out;
}

function cellsWithClass(html: string, cls: string): string[] {
  const out: string[] = [];
  const cellRe = new RegExp(`<td\\b[^>]*${cls}[^>]*>([\\s\\S]*?)<\\/td>`, "g");
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(html)) !== null) out.push(clean(m[1]));
  return out;
}

function toResults(links: { href: string; text: string }[], snippets: string[], max: number): WebResult[] {
  return links.slice(0, max).map((l, i) => {
    const url = decodeTarget(l.href);
    let domain = "";
    try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { domain = ""; }
    return { title: l.text || url, url, snippet: snippets[i] ?? "", domain };
  });
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, { signal: ctrl.signal, headers: HEADERS, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function webSearch(query: string, max = 8): Promise<WebResult[]> {
  const q = encodeURIComponent(query);

  /* Primary: DuckDuckGo Lite. */
  const lite = await fetchHtml(`https://lite.duckduckgo.com/lite/?q=${q}`);
  if (lite) {
    const links = anchorsWithClass(lite, "result-link");
    if (links.length) return toResults(links, cellsWithClass(lite, "result-snippet"), max);
  }

  /* Fallback: DuckDuckGo HTML endpoint (different markup). */
  const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${q}`);
  if (html) {
    const links = anchorsWithClass(html, "result__a");
    if (links.length) {
      const snippets = anchorsWithClass(html, "result__snippet").map((a) => a.text);
      return toResults(links, snippets, max);
    }
  }

  return [];
}
