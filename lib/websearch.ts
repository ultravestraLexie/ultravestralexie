/* Live web search — the second UltraVestra search engine.
 * When the verified database does not hold an answer (or to widen any
 * search), UltraVestra also searches the public web and returns links
 * with their sources. Results are always labeled as live-web findings:
 * they are NOT verified by UltraVestra research, and no commission or
 * term from a web result is ever presented as a verified fact. */

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

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

export async function webSearch(query: string, max = 8): Promise<WebResult[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UltraVestraSearch/1.0" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();

    const links: { title: string; url: string }[] = [];
    const linkRe = /<a[^>]+class='result-link'[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null && links.length < max) {
      let url = m[1];
      if (url.startsWith("//")) url = `https:${url}`;
      try {
        const u = new URL(url);
        const uddg = u.searchParams.get("uddg");
        if (uddg) url = decodeURIComponent(uddg);
      } catch { /* keep the raw href */ }
      links.push({ title: clean(m[2]), url });
    }
    const snippets: string[] = [];
    const snipRe = /<td[^>]+class='result-snippet'[^>]*>([\s\S]*?)<\/td>/g;
    while ((m = snipRe.exec(html)) !== null && snippets.length < max) snippets.push(clean(m[1]));

    return links.map((l, i) => {
      let domain = "";
      try { domain = new URL(l.url).hostname.replace(/^www\./, ""); } catch { domain = ""; }
      return { title: l.title || l.url, url: l.url, snippet: snippets[i] ?? "", domain };
    });
  } catch {
    return [];
  }
}
