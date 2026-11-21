"use client";

import { useMemo, useState } from "react";

/* VIDEO STRATEGY & SCRIPT STUDIO — builds a complete selling script
 * from the creator's OWN product facts using the five-beat structure
 * the Video Lab scores: hook, demonstration, story, proof, CTA.
 * Template-built and honestly labeled: every claim in the output comes
 * from what the creator typed — the Studio invents nothing about the
 * product, and the creator verifies every line before filming. */

const HOOKS: Record<string, (p: string, b: string) => string> = {
  result: (p, b) => `Stop scrolling — this is what ${b || "it"} actually does. Watch the end.`,
  problem: (p, b) => `If you struggle with this, watch. I tried ${p} so you don't have to guess.`,
  honest: (p, b) => `Nobody talks about the downside of ${p}. I will — right after I show you why I still use it.`,
  compare: (p, b) => `I put ${p} next to what I was using before. The difference is not small.`,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #4c1d95",
  background: "rgba(13,2,33,0.8)", color: "#f3e8ff", fontSize: 15,
};
const labelStyle: React.CSSProperties = { display: "block", margin: "0 0 6px", fontWeight: 700, fontSize: 14.5, color: "#f0abfc" };

export default function ScriptStudio() {
  const [product, setProduct] = useState("");
  const [benefit, setBenefit] = useState("");
  const [proof, setProof] = useState("");
  const [objection, setObjection] = useState("");
  const [hookStyle, setHookStyle] = useState<keyof typeof HOOKS>("result");
  const [platform, setPlatform] = useState("TikTok");
  const [copied, setCopied] = useState(false);

  const ready = product.trim().length > 0 && benefit.trim().length > 0;

  const script = useMemo(() => {
    if (!ready) return null;
    const p = product.trim();
    const b = benefit.trim();
    const hook = HOOKS[hookStyle](p, b);
    const lines: [string, string][] = [
      ["HOOK (0–3s) — say it with the product already in frame", `"${hook}"\nOn-screen text: ${b}.`],
      ["DEMONSTRATION (3–12s) — show, don't describe", `Show ${p} working at its key moment, uncut. Hands in frame for scale. Say: "Watch what happens when…" and let the product prove the claim.`],
      ["STORY (12–22s) — problem → attempt → result", `Say: "I had this problem, I tried the usual fixes, then I tried ${p}. Here's the part that surprised me." One idea only — this video is about: ${b}.`],
      ["PROOF (22–28s)", proof.trim() ? `Show your proof on screen, in the same light as the claim: ${proof.trim()}` : `Show the result, a comparison or a number on screen — in the same light as the claim. (Add your real proof point in the Studio and it lands here.)`],
      ["OBJECTION + HONEST LINE (28–34s)", objection.trim() ? `Answer it head-on: "${objection.trim()}" Then one honest limitation, said plainly — it makes everything before it believable.` : `Name the biggest doubt a viewer has about ${p} and answer it. Then one honest limitation, said plainly.`],
      ["CTA (last 3s) — one action, product on screen", `Say ONE action while ${p} is on screen: "Tap the product link if you want the same result." No second CTA.`],
      ["FILMING NOTES", `Platform: ${platform}. A visual change every 3–5 seconds. Caption every spoken line. Face lit from the front, voice close to the mic. End card is forbidden — the CTA happens over the product.`],
    ];
    return lines;
  }, [ready, product, benefit, proof, objection, hookStyle, platform]);

  const fullText = script ? script.map(([h, body]) => `${h}\n${body}`).join("\n\n") : "";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div>
          <label style={labelStyle}>Product you are selling *</label>
          <input style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. the LED sunset lamp" />
        </div>
        <div>
          <label style={labelStyle}>The one benefit this video proves *</label>
          <input style={inputStyle} value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="e.g. my room looks like golden hour every night" />
        </div>
        <div>
          <label style={labelStyle}>Your real proof point (optional)</label>
          <input style={inputStyle} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. side-by-side with my old lamp, same wall" />
        </div>
        <div>
          <label style={labelStyle}>Biggest objection to answer (optional)</label>
          <input style={inputStyle} value={objection} onChange={(e) => setObjection(e.target.value)} placeholder="e.g. 'Is it bright enough for a whole room?'" />
        </div>
        <div>
          <label style={labelStyle}>Hook style</label>
          <select style={inputStyle} value={hookStyle} onChange={(e) => setHookStyle(e.target.value as keyof typeof HOOKS)}>
            <option value="result">Result first</option>
            <option value="problem">Problem call-out</option>
            <option value="honest">Honest downside</option>
            <option value="compare">Comparison</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Platform</label>
          <select style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option>TikTok</option>
            <option>Instagram</option>
            <option>YouTube</option>
            <option>Trybe</option>
            <option>Amazon</option>
            <option>eBay</option>
          </select>
        </div>
      </div>

      {!ready && (
        <p style={{ color: "#f0abfc", fontWeight: 700, marginTop: 18 }}>
          Add the product and the one benefit it proves — the Studio builds the full script from your facts. It invents nothing: every claim in the script is yours.
        </p>
      )}

      {script && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {script.map(([h, body]) => (
            <div key={h} style={{ border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, color: "#67e8f9" }}>{h}</p>
              <p style={{ margin: 0, fontSize: 15.5, whiteSpace: "pre-line", color: "#f3e8ff" }}>{body}</p>
            </div>
          ))}
          <button
            onClick={() => { navigator.clipboard?.writeText(fullText); setCopied(true); }}
            className="neon-btn"
            style={{ alignSelf: "flex-start", padding: "11px 24px", borderRadius: 999, background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}
          >
            {copied ? "Copied ✓" : "Copy the full script"}
          </button>
          <p style={{ color: "#ddd0ff", fontSize: 13.5, margin: 0 }}>
            Template-built from your inputs — verify every claim about the product before you film. Then run the finished video through the Video Lab diagnostic.
          </p>
        </div>
      )}
    </div>
  );
}
