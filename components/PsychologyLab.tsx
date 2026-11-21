"use client";

import { useState } from "react";
import {
  BLENDER_MATRIX,
  MATRIX_RULE,
  SAY_PAIRS,
  USE_INSTEAD,
  DIAGNOSTIC,
  DIAGNOSTIC_CAVEAT,
} from "@/lib/psychology";

/* THE HUMAN BEHIND THE VIEW — PSYCHOLOGY LAB. Four working tools
 * built on the Audience Psychology & Advertising Intelligence system:
 * the Audience Lens (one product, five audiences), Say It Better
 * (the say-vs-not-say pairs plus a rule-based phrase checker against
 * the avoid list), the Ad Architect (the six-stage framework built
 * as a timed 25-second script), and the Ad Diagnostic (symptom →
 * what to investigate). Everything generated here is template-built
 * and labeled as such; the vague-audience gate matches the rest of
 * UltraVestra: "everyone" is not an audience. */

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #4c1d95",
  background: "rgba(13,2,33,0.8)", color: "#f3e8ff", fontSize: 15,
};
const labelStyle: React.CSSProperties = { display: "block", margin: "0 0 6px", fontWeight: 700, fontSize: 14.5, color: "#f0abfc" };
const toolPanel: React.CSSProperties = {
  border: "1px solid #7e22ce", background: "rgba(26,8,54,0.78)", borderRadius: 22,
  padding: "24px 26px 26px", boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const toolTitle: React.CSSProperties = { fontSize: 23, margin: "0 0 6px", letterSpacing: 0.5, fontWeight: 800, color: "#f3e8ff" };
const toolSub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const actionBtn: React.CSSProperties = {
  padding: "12px 26px", borderRadius: 999, border: "none", cursor: "pointer",
  background: "linear-gradient(92deg, #a855f7, #d946ef)", color: "#fff", fontWeight: 700, fontSize: 15.5,
};
const chipBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});
const thStyle: React.CSSProperties = { textAlign: "left", padding: "9px 12px", borderBottom: "2px solid #7e22ce", color: "#f0abfc" };
const tdStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #4c1d95", color: "#ddd0ff" };

const VAGUE_AUDIENCES = new Set([
  "", "everyone", "anyone", "anybody", "everybody", "people", "all", "all people",
  "the public", "general public", "the world", "whoever", "anyone who watches",
  "everyone on tiktok", "everyone on social media", "any", "all of them",
]);

function isVagueAudience(a: string): boolean {
  const n = a.trim().toLowerCase().replace(/[.!]+$/, "");
  return VAGUE_AUDIENCES.has(n) || n.startsWith("everyone") || n === "anyone at all";
}

async function copyText(text: string, setCopied: (v: boolean) => void) {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch {
    setCopied(false);
  }
}

/* ================= AUDIENCE LENS ================= */

interface Archetype {
  name: string;
  matters: string;
  angle: (p: string) => string;
  opening: (p: string) => string;
}

/* The five archetypes from the matrix, generalized: the motivation
 * stays the owner's; the angle and opening are templates the creator
 * fills with their own product. */
const ARCHETYPES: Archetype[] = [
  {
    name: "Busy professionals",
    matters: "Convenience",
    angle: (p) => `Show ${p} working inside a busy day — at the desk, between meetings, getting the job done without an extra trip or extra time.`,
    opening: (p) => `No spare time in your day? Here's where ${p} fits into it.`,
  },
  {
    name: "Fitness enthusiasts",
    matters: "Routine and portability",
    angle: (p) => `Show ${p} as part of the training routine — before, during, or right after the workout, and easy to take along.`,
    opening: (p) => `Take your routine with you — here's ${p} on the move.`,
  },
  {
    name: "Travelers",
    matters: "Space and convenience",
    angle: (p) => `Show ${p} packed, carried, and used away from home — space is the story, so let the viewer see it in the bag and in use.`,
    opening: (p) => `Packing light? Here's where ${p} earns its space.`,
  },
  {
    name: "Parents",
    matters: "Ease of preparation",
    angle: (p) => `Show ${p} making a busy family moment simpler — quick to prepare, calm to use, one less thing to manage.`,
    opening: (p) => `Busy mornings, full hands? Here's a simpler way — with ${p}.`,
  },
  {
    name: "Students",
    matters: "Price and practicality",
    angle: (p) => `Show ${p} in a dorm or small space — practical first, honest about what it costs and what it does.`,
    opening: (p) => `Small space, small budget? Here's ${p} doing the job.`,
  },
];

function AudienceLens() {
  const [product, setProduct] = useState("");
  const [archName, setArchName] = useState(ARCHETYPES[0].name);
  const [copied, setCopied] = useState(false);
  const arch = ARCHETYPES.find((a) => a.name === archName) ?? ARCHETYPES[0];
  const p = product.trim() || "this product";
  const built = product.trim().length > 0;

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🔭 Audience Lens</p>
      <p style={toolSub}>
        One product can require five completely different advertisements — because five different groups of
        people have different reasons to buy it. First, the worked example from the masterclass: the portable
        blender, seen through five audiences.
      </p>

      <div style={{ overflowX: "auto", marginBottom: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
          <thead>
            <tr>
              <th style={thStyle}>Audience</th>
              <th style={thStyle}>What matters to them</th>
              <th style={thStyle}>Video angle</th>
            </tr>
          </thead>
          <tbody>
            {BLENDER_MATRIX.map((row) => (
              <tr key={row.audience}>
                <td style={{ ...tdStyle, fontWeight: 700, color: "#f3e8ff", whiteSpace: "nowrap" }}>{row.audience}</td>
                <td style={tdStyle}>{row.matters}</td>
                <td style={{ ...tdStyle, color: "#f3e8ff" }}>{row.angle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#67e8f9" }}>The rule: {MATRIX_RULE}</p>

      <p style={{ ...labelStyle, margin: "0 0 8px" }}>Now run your product through the lens</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="al-product">Your product</label>
          <input id="al-product" style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. this desk organizer" />
        </div>
        <div>
          <label style={labelStyle}>Pick one audience</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ARCHETYPES.map((a) => (
              <button key={a.name} style={chipBtn(archName === a.name)} onClick={() => setArchName(a.name)}>{a.name}</button>
            ))}
          </div>
        </div>
      </div>

      {built ? (
        <div style={{ ...card, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 10px", fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>
            {p} — for <span style={{ color: "#f0abfc" }}>{arch.name.toLowerCase()}</span>
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}>
            <strong style={{ color: "#67e8f9" }}>What matters to them:</strong> {arch.matters}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15.5, color: "#f3e8ff" }}>
            <strong style={{ color: "#67e8f9" }}>Video angle:</strong> {arch.angle(p)}
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 15.5, color: "#f3e8ff" }}>
            <strong style={{ color: "#67e8f9" }}>Opening line:</strong> &ldquo;{arch.opening(p)}&rdquo;
          </p>
          <button
            style={actionBtn}
            onClick={() =>
              copyText(
                `${p} — for ${arch.name}\nWhat matters to them: ${arch.matters}\nVideo angle: ${arch.angle(p)}\nOpening line: \u201c${arch.opening(p)}\u201d\n\nTemplate-built from the UltraVestra Audience Lens. ${MATRIX_RULE}`,
                setCopied
              )
            }
          >
            {copied ? "Copied ✓" : "Copy this angle"}
          </button>
          <p style={{ margin: "12px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            Template-built from the matrix pattern — say it in your own words, and only claim what your product
            actually does. Then run the same product through the other four audiences: five motivations, five
            different stories.
          </p>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "#ddd0ff" }}>
          Type your product and pick an audience. The product doesn&rsquo;t change — the motivation does, and the
          motivation writes the video.
        </p>
      )}
    </section>
  );
}

/* ================= SAY IT BETTER ================= */

interface FlagRule {
  pattern: RegExp;
  phrase: string;
  why: string;
  instead: string;
}

/* Rule-based flags drawn directly from the avoid list. The checker
 * flags phrases — it does not judge the whole video, and it says so. */
const FLAG_RULES: FlagRule[] = [
  {
    pattern: /guarantee/i,
    phrase: "\u201cGuaranteed results\u201d",
    why: "A guarantee is only honest if a genuine one exists. Without one, this is an unsupported promise.",
    instead: USE_INSTEAD[5],
  },
  {
    pattern: /every(body|one) needs/i,
    phrase: "\u201cEverybody needs this\u201d",
    why: "No product is for everybody. Naming who it is actually for makes the right viewer feel recognized.",
    instead: USE_INSTEAD[0],
  },
  {
    pattern: /works for (everyone|everybody|anyone)/i,
    phrase: "\u201cThis works for everyone\u201d",
    why: "Universal claims are the fastest way to lose a careful viewer's trust.",
    instead: USE_INSTEAD[0],
  },
  {
    pattern: /best (product|thing|one)? ?ever/i,
    phrase: "\u201cThe best product ever\u201d",
    why: "A superlative without support is a promise, not proof. Show what makes it different instead.",
    instead: USE_INSTEAD[3],
  },
  {
    pattern: /(buy now|order now|act now|hurry|last chance|don'?t miss|before it'?s gone|selling out|only \d+ left|limited time|while supplies last|countdown)/i,
    phrase: "Fake urgency / fake scarcity",
    why: "Manufactured urgency teaches viewers to distrust you. Honest information about price and availability respects their decision.",
    instead: "\u201cIf you've been considering this, check the current price and availability before deciding.\u201d",
  },
  {
    pattern: /you won'?t believe/i,
    phrase: "\u201cYou won't believe this\u201d",
    why: "If nothing genuinely surprising follows, the line spends trust you haven't earned yet.",
    instead: USE_INSTEAD[1],
  },
  {
    pattern: /(trust me|change your life|life[- ]changing)/i,
    phrase: "\u201cTrust me, this will change your life\u201d",
    why: "Trust is built by showing, not by asking for it. Demonstrate how you use it and what you noticed.",
    instead: "\u201cLet me show you exactly how I use it, what I noticed, and what you should consider before buying.\u201d",
  },
  {
    pattern: /you (need|have) to buy/i,
    phrase: "\u201cYou NEED to buy this\u201d",
    why: "Pressure is not persuasion. Tell the viewer what it does and who it benefits — then let them decide.",
    instead: "\u201cHere's what I like about this product, what it actually does, and who I think would benefit from it.\u201d",
  },
];

function SayItBetter() {
  const [category, setCategory] = useState(SAY_PAIRS[0].category);
  const [line, setLine] = useState("");
  const [flags, setFlags] = useState<FlagRule[] | null>(null);
  const pair = SAY_PAIRS.find((s) => s.category === category) ?? SAY_PAIRS[0];

  function check() {
    setFlags(FLAG_RULES.filter((r) => r.pattern.test(line)));
  }

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🗣️ Say It Better</p>
      <p style={toolSub}>
        The difference between an ineffective advertisement and a compelling one is often the way the message is
        communicated. Study the pairs — then run your own line through the checker.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {SAY_PAIRS.map((s) => (
          <button key={s.category} style={chipBtn(category === s.category)} onClick={() => setCategory(s.category)}>{s.category}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ ...card, border: "1px solid #7f1d3d" }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#fda4af" }}>WEAK</p>
          <p style={{ margin: "0 0 6px", fontSize: 16, color: "#f3e8ff" }}>{pair.weak}</p>
          {pair.why_weak && <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}><strong style={{ color: "#f0abfc" }}>Why it needs improvement:</strong> {pair.why_weak}</p>}
        </div>
        <div style={{ ...card, border: "1px solid #22d3ee" }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#67e8f9" }}>STRONGER</p>
          <p style={{ margin: "0 0 6px", fontSize: 16, color: "#f3e8ff" }}>{pair.stronger}</p>
          {pair.why_stronger && <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}><strong style={{ color: "#f0abfc" }}>Why it works better:</strong> {pair.why_stronger}</p>}
        </div>
      </div>

      <p style={{ ...labelStyle, margin: "0 0 8px" }}>Check your own line</p>
      <div>
        <label style={labelStyle} htmlFor="sb-line">Paste a line from your script</label>
        <input id="sb-line" style={inputStyle} value={line} onChange={(e) => { setLine(e.target.value); setFlags(null); }} placeholder="e.g. You need to buy this before it's gone — it works for everyone!" />
      </div>
      <p style={{ margin: "16px 0 0" }}>
        <button style={actionBtn} onClick={check}>Check my line</button>
      </p>

      {flags !== null && flags.length === 0 && (
        <div style={{ ...card, marginTop: 18, border: "1px solid #22d3ee" }}>
          <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#67e8f9" }}>No avoid-list phrases found ✓</p>
          <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
            This line doesn&rsquo;t use any of the phrases UltraVestra teaches creators to avoid. That doesn&rsquo;t
            make it a good line by itself — check that it names a real audience, a real situation, and a real
            reason to care.
          </p>
        </div>
      )}
      {flags !== null && flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {flags.map((f) => (
            <div key={f.phrase} style={{ ...card, border: "1px solid #e879f9" }}>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f0abfc" }}>Flagged: {f.phrase}</p>
              <p style={{ margin: "0 0 8px", fontSize: 15, color: "#f3e8ff" }}>{f.why}</p>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
                <strong style={{ color: "#67e8f9" }}>Say instead:</strong> {f.instead}
              </p>
            </div>
          ))}
        </div>
      )}
      <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
        Rule-based check against UltraVestra&rsquo;s avoid list — it flags phrases, it doesn&rsquo;t judge your
        whole video. The standard behind it: communicate value honestly; never manipulate.
      </p>
    </section>
  );
}

/* ================= AD ARCHITECT ================= */

interface BuiltStage {
  window: string;
  stage: string;
  action: string;
  say: string;
  visual: string;
}

function AdArchitect() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [situation, setSituation] = useState("");
  const [proof, setProof] = useState("");
  const [stages, setStages] = useState<BuiltStage[] | null>(null);
  const [guidance, setGuidance] = useState(false);
  const [copied, setCopied] = useState(false);

  function build() {
    if (isVagueAudience(audience)) {
      setStages(null);
      setGuidance(true);
      return;
    }
    setGuidance(false);
    const p = product.trim() || "this product";
    const a = audience.trim();
    const s = situation.trim() || "the problem this solves";
    const pr = proof.trim() || "show the real result on camera — and name what to check before buying";
    setStages([
      {
        window: "0–3 sec", stage: "Hook", action: "Give the right viewer a reason to stop.",
        say: `Still dealing with ${s}?`,
        visual: `Open on the situation itself — the moment ${a} recognizes as their own. No logo intro, no greeting: relevance in the first frame.`,
      },
      {
        window: "3–7 sec", stage: "Relate", action: "Introduce a recognizable need or situation.",
        say: `I wanted something that works for ${a} — without the usual hassle.`,
        visual: `Show ${p} in a real, everyday setting — the setting ${a} actually lives in.`,
      },
      {
        window: "7–13 sec", stage: "Demonstrate", action: "Show the product doing something useful.",
        say: `Here's how ${p} works.`,
        visual: `Show ${p} doing its job, in action. Let the viewer see the product working, not just hear about it.`,
      },
      {
        window: "13–18 sec", stage: "Explain", action: "Connect features to meaningful benefits.",
        say: `What matters here is what it does about ${s} — not the feature list.`,
        visual: "Close-up on the feature doing the work, with a simple on-screen explanation a muted viewer can follow.",
      },
      {
        window: "18–22 sec", stage: "Prove", action: "Give honest evidence and address objections.",
        say: `Here's the proof: ${pr}.`,
        visual: "Show the actual result and the product details — the real thing, including anything the buyer should check first.",
      },
      {
        window: "22–25 sec", stage: "Invite", action: "Make the next step clear.",
        say: "If this fits your situation, take a closer look at the details and decide for yourself.",
        visual: `${p} in frame with a clear, honest on-screen next step.`,
      },
    ]);
    setCopied(false);
  }

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🏛️ Ad Architect</p>
      <p style={toolSub}>
        Build your advertisement on the six-stage framework — Hook, Relate, Demonstrate, Explain, Prove, Invite —
        as a timed 25-second script, modeled on the masterclass&rsquo;s portable-blender example. Every line is a
        template: the claims must match your actual product.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="aa-product">Your product</label>
          <input id="aa-product" style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. this portable blender" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="aa-audience">Your exact audience</label>
          <input id="aa-audience" style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. busy professionals who skip breakfast" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="aa-situation">Their situation or problem</label>
          <input id="aa-situation" style={inputStyle} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="e.g. no time to make a healthy breakfast" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="aa-proof">One honest proof point</label>
          <input id="aa-proof" style={inputStyle} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. it blended a full smoothie on camera, uncut" />
        </div>
      </div>

      <p style={{ margin: "20px 0 0" }}>
        <button style={actionBtn} onClick={build}>Build my 25-second ad</button>
      </p>

      {guidance && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 8px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Not yet — an ad for &ldquo;everyone&rdquo; connects with no one.</p>
          <p style={{ margin: "0 0 10px", fontSize: 15, color: "#f3e8ff" }}>
            UltraVestra doesn&rsquo;t teach creators to make videos for everybody. It teaches them to make relevant
            videos for the right people. Narrow it down:
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Who would actually find this product useful — name the person, not the crowd.</li>
            <li>What is their situation on an ordinary day?</li>
            <li>What would make that one person think &ldquo;this is for me&rdquo;?</li>
          </ul>
          <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
            Instead of &ldquo;everyone&rdquo;: <em style={{ color: "#f3e8ff" }}>busy professionals who skip breakfast</em>.
            One product. Different audiences. Different motivations. Different stories.
          </p>
        </div>
      )}

      {stages && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            {stages.map((s) => (
              <div key={s.stage} style={card}>
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>
                  <strong style={{ color: "#67e8f9" }}>{s.window}</strong>{" "}
                  <span style={{ color: "#f0abfc", fontWeight: 800, fontSize: 15.5 }}>{s.stage.toUpperCase()}</span>{" "}
                  <span style={{ color: "#ddd0ff" }}>— {s.action}</span>
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 15.5, color: "#f3e8ff" }}>
                  <strong style={{ color: "#67e8f9" }}>Say:</strong> &ldquo;{s.say}&rdquo;
                </p>
                <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
                  <strong style={{ color: "#f0abfc" }}>Visual:</strong> {s.visual}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: "16px 0 0" }}>
            <button
              style={actionBtn}
              onClick={() =>
                copyText(
                  stages.map((s) => `${s.window} — ${s.stage}: ${s.action}\nSay: \u201c${s.say}\u201d\nVisual: ${s.visual}`).join("\n\n") +
                    "\n\nTemplate-built from the UltraVestra six-stage advertising framework. An example structure, not a promise of sales performance — the claims must match the actual product.",
                  setCopied
                )
              }
            >
              {copied ? "Copied ✓" : "Copy the script"}
            </button>
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            Template-built from the UltraVestra framework — say it in your own words, and only say what&rsquo;s
            true. Then test it: make a Problem-based, a Demonstration, and a Transformation opening for the same
            ad, and measure retention, clicks, and conversions — never views alone.
          </p>
        </>
      )}
    </section>
  );
}

/* ================= AD DIAGNOSTIC ================= */

const FIRST_CHECKS: Record<string, string> = {
  "People scroll immediately":
    "Watch your own first frame and first spoken line with fresh eyes: does the right viewer recognize their situation in the first second — and does the first visual give them a reason to stay?",
  "People watch but don't click":
    "Read your ending back. Is the next step actually stated, and is the offer itself easy to understand in one pass?",
  "People click but don't buy":
    "Walk your own product page as a stranger: the price, the trust signals, the shipping. Find the exact point where you would hesitate — that is your first fix.",
  "People comment with questions":
    "Write down every question in the comments. That list is the missing information — your next video answers it before anyone has to ask.",
  "People watch but seem confused":
    "Play the video on mute for someone who has never seen the product. If they can't explain what it does, the demonstration — not the editing — is the problem.",
  "People buy but return products":
    "Compare your video's claims against the delivered product, line by line. The gap between expectation and experience is where returns are born.",
};

function AdDiagnostic() {
  const [symptom, setSymptom] = useState<string | null>(null);
  const row = DIAGNOSTIC.find((d) => d.happens === symptom) ?? null;

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🩺 Ad Diagnostic</p>
      <p style={toolSub}>
        Not every unsuccessful video needs better editing — sometimes the real problem is the message, the
        audience, the offer, or the product. Pick what is happening; the diagnostic tells you what to investigate
        first.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {DIAGNOSTIC.map((d) => (
          <button key={d.happens} style={chipBtn(symptom === d.happens)} onClick={() => setSymptom(d.happens)}>{d.happens}</button>
        ))}
      </div>

      {row ? (
        <div style={{ ...card, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 8px", fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>
            {row.happens} → <span style={{ color: "#f0abfc" }}>investigate: {row.investigate}</span>
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 15.5, color: "#f3e8ff" }}>
            <strong style={{ color: "#67e8f9" }}>Suggested first check:</strong> {FIRST_CHECKS[row.happens]}
          </p>
          <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}>{DIAGNOSTIC_CAVEAT}</p>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "#ddd0ff" }}>
          These are diagnostic possibilities, not automatic explanations — pick the symptom closest to what your
          numbers and comments are telling you.
        </p>
      )}
    </section>
  );
}

/* ================= THE LAB ================= */

export default function PsychologyLab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <AudienceLens />
      <SayItBetter />
      <AdArchitect />
      <AdDiagnostic />
    </div>
  );
}
