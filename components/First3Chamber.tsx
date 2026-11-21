"use client";

import { useState } from "react";
import { OPENING_STYLES, SEQUENCE, TIMED_EXAMPLE } from "@/lib/first3";

/* THE FIRST 3 SECONDS CHAMBER — UltraVestra's First-Three-Seconds
 * testing lab. The creator brings a product, an exact audience and a
 * viewer problem; the Chamber builds a complete opening on the three
 * beats (Interrupt / Connect / Create a reason to stay) in a chosen
 * or suggested opening style, an A/B alternative in a second style,
 * and the full HOOK → PROOF → VALUE → PAYOFF → ACTION continuation —
 * so a good hook is never followed by nothing. Template-built and
 * honestly labeled: a hook is a creative testing hypothesis, not a
 * guaranteed attention formula, and every line must be truthful. */

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

interface BuiltOpening {
  style: string;
  pattern: string;
  s1Spoken: string;
  s1Visual: string;
  s2: string;
  s3: string;
}

type Builder = (p: string, a: string, d: string) => Omit<BuiltOpening, "style" | "pattern">;

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* One builder per opening style. Each writes the three beats in that
 * style's own voice, from the creator's own inputs — nothing invented
 * about the product beyond what the creator typed. */
const BUILDERS: Record<string, Builder> = {
  "Problem": (p, a, d) => ({
    s1Spoken: `Struggling with ${d}?`,
    s1Visual: "Open on the problem itself — show the real situation your viewer recognizes. No logo intro, no \u201chey guys.\u201d",
    s2: `This is for ${a} — the ones who deal with ${d} and are tired of guessing.`,
    s3: `Here's what to look for — watch what happens when I use ${p}.`,
  }),
  "Curiosity": (p, a, d) => ({
    s1Spoken: `There's something you should check before buying ${p}.`,
    s1Visual: "Show the product label or one telling detail close to the camera, then turn it toward the viewer.",
    s2: `Especially for ${a} — this is the part that decides whether it fits you.`,
    s3: "Let me show you the difference it makes.",
  }),
  "Demonstration": (p, a, d) => ({
    s1Spoken: `Look at what ${p} actually does.`,
    s1Visual: "Start with the product already in action — the demonstration is in progress before your first word lands.",
    s2: `Watch how it handles ${d} — that's the test that matters.`,
    s3: "Stay for the finish — that's where you'll see whether it holds up.",
  }),
  "Surprise": (p, a, d) => ({
    s1Spoken: `I didn't expect this detail on ${p}.`,
    s1Visual: "Close-up on the surprising detail itself — let the viewer see it before you explain it.",
    s2: `For ${a}, this might change what you look for.`,
    s3: "And it's not even the most useful part — here's why.",
  }),
  "Transformation": (p, a, d) => ({
    s1Spoken: `Watch what happens when I use ${p}.`,
    s1Visual: "Show the truthful starting point first, then begin the process on camera — real and uncut.",
    s2: `For ${a} dealing with ${d}, this is the part that matters.`,
    s3: "Let's see how it ends.",
  }),
  "Question": (p, a, d) => ({
    s1Spoken: `Are you choosing ${p} based on what you actually need?`,
    s1Visual: "Face to camera, product in hand — ask it like a real question, then give it a beat.",
    s2: `Most ${a} never get asked that — and it changes the answer.`,
    s3: "Here's the question to ask instead — and what to check.",
  }),
  "Comparison": (p, a, d) => ({
    s1Spoken: "Let's compare — because these two are not the same.",
    s1Visual: "Both options side by side in the frame from the very first frame.",
    s2: `For ${a} torn between them, this is how you decide.`,
    s3: "Watch the test closely — the difference shows itself.",
  }),
  "Relatable moment": (p, a, d) => ({
    s1Spoken: `When ${d} turns a simple thing into a whole project...`,
    s1Visual: "Act out the moment — the pile, the sigh, the mess. Let them recognize themselves.",
    s2: `If that sounds familiar, this one's for ${a}.`,
    s3: `So here's the simpler way I found — starting with ${p}.`,
  }),
  "Mistake": (p, a, d) => ({
    s1Spoken: `One thing beginners often forget when choosing ${p}.`,
    s1Visual: "Show the overlooked step or detail up close — point at exactly what's forgotten.",
    s2: `For ${a}, that one miss is behind a lot of ${d}.`,
    s3: "Here's what to check instead — it takes ten seconds.",
  }),
  "Personal story": (p, a, d) => ({
    s1Spoken: `Here's what I learned when I tried ${p}.`,
    s1Visual: "Start in the middle of your real routine — the product already in your hands, in your real space.",
    s2: `I started because of ${d} — ${a} will understand why.`,
    s3: "What surprised me wasn't the start. It was this.",
  }),
  "Sensory": (p, a, d) => ({
    s1Spoken: `Hear that? That's ${p}.`,
    s1Visual: "Extreme close-up: the texture, the sound, the movement. Fill the frame with the sensation.",
    s2: `For ${a}, how it feels is half the decision.`,
    s3: "Watch what it does next.",
  }),
  "Mystery": (p, a, d) => ({
    s1Spoken: `Can you guess what ${p} is actually designed for?`,
    s1Visual: "Show the product partly — one angle, one detail, never the whole answer.",
    s2: `Most ${a} guess wrong — I did too.`,
    s3: "The answer is in how it works. Watch.",
  }),
  "Challenge": (p, a, d) => ({
    s1Spoken: `Let's see if ${p} is as easy to use as it looks.`,
    s1Visual: "Set the test up on camera — show the conditions clearly before you start.",
    s2: `If ${d} is what you're trying to solve, this is the honest way to check.`,
    s3: "Pass or fail, you'll see it here first.",
  }),
  "Benefit": (p, a, d) => ({
    s1Spoken: `Here's a simpler way to deal with ${d}.`,
    s1Visual: "Clear the clutter from the frame and introduce the featured product as the simple option.",
    s2: `Made for ${a} — no twenty-step routine required.`,
    s3: "Let me show you exactly how it works.",
  }),
  "Direct audience callout": (p, a, d) => ({
    s1Spoken: `${cap(a)}, this one's for you.`,
    s1Visual: "Look straight into the camera and name them — like you're talking to one person, not an audience.",
    s2: `If ${d} is your thing too, you're in the right video.`,
    s3: "Here's the one thing to check before you buy anything.",
  }),
};

const VAGUE_AUDIENCES = new Set([
  "", "everyone", "anyone", "anybody", "everybody", "people", "all", "all people",
  "the public", "general public", "the world", "whoever", "anyone who watches",
  "everyone on tiktok", "everyone on social media", "any", "all of them",
]);

function isVagueAudience(a: string): boolean {
  const n = a.trim().toLowerCase().replace(/[.!]+$/, "");
  return VAGUE_AUDIENCES.has(n) || n.startsWith("everyone") || n === "anyone at all";
}

/* A simple, honest suggestion: read the problem and audience for the
 * shape of the opening they are already describing. */
function suggestStyle(problem: string, audience: string): { style: string; reason: string } {
  const text = `${problem} ${audience}`.toLowerCase();
  if (/beginner|new to|just starting|first time/.test(text))
    return { style: "Direct audience callout", reason: "Your audience is defined by where they are — name them in second one and the video becomes personal." };
  if (/compare|versus|\bvs\b|difference between|which one|two options/.test(text))
    return { style: "Comparison", reason: "Your viewer is already deciding between options — put both in the frame and let them judge." };
  if (/mistake|wrong|forget|overlook/.test(text))
    return { style: "Mistake", reason: "Your problem has a forgotten step inside it — name the miss and the viewer stays to check themselves." };
  if (/texture|sound|feel|satisfying|sensory|crispy|smooth/.test(text))
    return { style: "Sensory", reason: "Your product can be felt through the screen — lead with the sensation, not the description." };
  if (/guess|secret|hidden|nobody knows|no one tells/.test(text))
    return { style: "Mystery", reason: "There's something unknown at the center of your video — open the loop and make them stay for the answer." };
  if (/test|challenge|really work|actually work|as good as/.test(text))
    return { style: "Challenge", reason: "Your video is a test — set it up honestly and the result becomes the reason to stay." };
  if (/story|learned|i tried|my experience|journey/.test(text))
    return { style: "Personal story", reason: "You have a real experience behind this — your own lesson is the most credible opening you own." };
  if (/simple|easy|easier|simpler|routine|quick/.test(text))
    return { style: "Benefit", reason: "Your viewer wants the simpler path — promise clarity in second one, then prove it." };
  return { style: "Problem", reason: "A recognizable problem is the most reliable interrupt there is — the viewer sees their own situation in second one." };
}

interface ChamberResult {
  a: BuiltOpening;
  b: BuiltOpening;
  suggestedReason: string | null;
  continuation: { time: string; step: string; question: string; line: string }[];
}

export default function First3Chamber() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [styleChoice, setStyleChoice] = useState<string>("suggest");
  const [result, setResult] = useState<ChamberResult | null>(null);
  const [guidance, setGuidance] = useState(false);
  const [copied, setCopied] = useState(false);

  function build() {
    if (isVagueAudience(audience)) {
      setResult(null);
      setGuidance(true);
      return;
    }
    setGuidance(false);
    const p = product.trim() || "this product";
    const a = audience.trim();
    const d = problem.trim() || "finding the right one";

    let styleA: string;
    let reason: string | null = null;
    if (styleChoice === "suggest") {
      const s = suggestStyle(d, a);
      styleA = s.style;
      reason = s.reason;
    } else {
      styleA = styleChoice;
    }
    const idxA = OPENING_STYLES.findIndex((s) => s.style === styleA);
    const styleB = OPENING_STYLES[(idxA + 7) % OPENING_STYLES.length].style;

    const make = (style: string): BuiltOpening => ({
      style,
      pattern: OPENING_STYLES.find((s) => s.style === style)?.example ?? "",
      ...BUILDERS[style](p, a, d),
    });

    const openingA = make(styleA);
    const openingB = make(styleB);

    const continuation = SEQUENCE.map((seq, i) => {
      const time = TIMED_EXAMPLE[i].time;
      const lines: Record<string, string> = {
        Hook: `\u201c${openingA.s1Spoken}\u201d Then open the loop: \u201c${openingA.s3}\u201d`,
        Proof: `Show ${p} for real — in action, up close, exactly as it is. No self-introduction, no repeating the product name: the demonstration is the proof.`,
        Value: `Explain what ${p} is for and the features that matter for ${d} — only what you can verify, in words ${a} would use.`,
        Payoff: `Deliver what second 3 promised: what to check, what the test showed, what you discovered — the thing ${a} stayed to learn.`,
        Action: "Give a clear conclusion, then invite viewers to explore the product details and decide for themselves.",
      };
      return { time, step: seq.step, question: seq.question, line: lines[seq.step] };
    });

    setResult({ a: openingA, b: openingB, suggestedReason: reason, continuation });
    setCopied(false);
  }

  async function copyPlan() {
    if (!result) return;
    const openingText = (o: BuiltOpening, label: string) =>
      `${label} — ${o.style} opening\nSecond 1 (Interrupt): \u201c${o.s1Spoken}\u201d\nVisual: ${o.s1Visual}\nSecond 2 (Connect): \u201c${o.s2}\u201d\nSecond 3 (Stay): \u201c${o.s3}\u201d`;
    const text =
      openingText(result.a, "OPENING A") + "\n\n" + openingText(result.b, "OPENING B (A/B test)") + "\n\n" +
      "THE CONTINUATION — HOOK → PROOF → VALUE → PAYOFF → ACTION\n" +
      result.continuation.map((c) => `${c.time} — ${c.step}: ${c.line}`).join("\n") +
      "\n\nTemplate-built from the UltraVestra First 3 Seconds system. A hook is a creative testing hypothesis, not a guaranteed attention formula — and it must be truthful.";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const renderOpening = (o: BuiltOpening, label: string, accent: string) => (
    <div style={{ ...card, border: `1px solid ${accent}` }}>
      <p style={{ margin: "0 0 2px", fontSize: 16.5, fontWeight: 800, color: "#f3e8ff" }}>
        {label} — <span style={{ color: "#f0abfc" }}>{o.style}</span>
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#ddd0ff" }}>
        The pattern: <em>{o.pattern}</em>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#67e8f9" }}>SECOND 1 — INTERRUPT · get noticed</p>
          <p style={{ margin: "0 0 2px", fontSize: 15.5, color: "#f3e8ff" }}>&ldquo;{o.s1Spoken}&rdquo;</p>
          <p style={{ margin: 0, fontSize: 14.5, color: "#ddd0ff" }}><strong style={{ color: "#f0abfc" }}>Visual:</strong> {o.s1Visual}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#67e8f9" }}>SECOND 2 — CONNECT · make it relevant</p>
          <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>&ldquo;{o.s2}&rdquo;</p>
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#67e8f9" }}>SECOND 3 — CREATE A REASON TO STAY · open curiosity</p>
          <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>&ldquo;{o.s3}&rdquo;</p>
        </div>
      </div>
    </div>
  );

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🔬 First 3 Seconds Chamber</p>
      <p style={toolSub}>
        UltraVestra&rsquo;s First-Three-Seconds testing lab. Creators should not assume their favorite hook is
        automatically the best — so the Chamber builds your opening in one style, an A/B alternative in a second
        style, and the full continuation, so the hook is never followed by nothing. Film both, keep the rest of
        the video the same, and let what you measure decide.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="f3-product">Your product</label>
          <input id="f3-product" style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. this moisturizer" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="f3-audience">Your exact audience</label>
          <input id="f3-audience" style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. skincare beginners choosing their first moisturizer" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="f3-problem">Their problem or desire</label>
          <input id="f3-problem" style={inputStyle} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g. choosing a moisturizer without wasting money" />
        </div>
      </div>

      <p style={{ ...labelStyle, margin: "18px 0 8px" }}>Opening style — pick one, or let the Chamber suggest</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button style={chipBtn(styleChoice === "suggest")} onClick={() => setStyleChoice("suggest")}>✨ Suggest one for me</button>
        {OPENING_STYLES.map((s) => (
          <button key={s.style} style={chipBtn(styleChoice === s.style)} onClick={() => setStyleChoice(s.style)}>{s.style}</button>
        ))}
      </div>

      <p style={{ margin: "20px 0 0" }}>
        <button style={actionBtn} onClick={build}>Build my first 3 seconds</button>
      </p>

      {guidance && (
        <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9" }}>
          <p style={{ margin: "0 0 8px", fontSize: 16.5, fontWeight: 800, color: "#f0abfc" }}>Not yet — your audience is too wide to open for.</p>
          <p style={{ margin: "0 0 10px", fontSize: 15, color: "#f3e8ff" }}>
            &ldquo;Everyone&rdquo; is not an audience. Second 2 only connects when the viewer hears themselves named.
            Narrow it down:
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#f3e8ff", fontSize: 15, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Who exactly is this for — a beginner, or someone experienced?</li>
            <li>What is the one problem or desire they already know they have?</li>
            <li>What would make this one person say &ldquo;this is for me&rdquo; in the second second?</li>
          </ul>
          <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>
            Instead of &ldquo;everyone&rdquo;: <em style={{ color: "#f3e8ff" }}>skincare beginners choosing their first moisturizer</em>.
            Name that person, then build.
          </p>
        </div>
      )}

      {result && (
        <>
          {result.suggestedReason && (
            <p style={{ margin: "18px 0 0", fontSize: 15, color: "#f3e8ff" }}>
              <strong style={{ color: "#f0abfc" }}>Suggested style: {result.a.style}.</strong> {result.suggestedReason}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
            {renderOpening(result.a, "Opening A", "#e879f9")}
            {renderOpening(result.b, "Opening B — your A/B test", "#22d3ee")}
          </div>

          <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
            Then don&rsquo;t follow it with nothing — the continuation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.continuation.map((c) => (
              <div key={c.step} style={card}>
                <p style={{ margin: "0 0 4px", fontSize: 14 }}>
                  <strong style={{ color: "#67e8f9" }}>{c.time}</strong>{" "}
                  <span style={{ color: "#f0abfc", fontWeight: 700 }}>{c.step.toUpperCase()}</span>{" "}
                  <span style={{ color: "#ddd0ff" }}>— {c.question}</span>
                </p>
                <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>{c.line}</p>
              </div>
            ))}
          </div>

          <p style={{ margin: "16px 0 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button style={actionBtn} onClick={copyPlan}>{copied ? "Copied ✓" : "Copy the full opening plan"}</button>
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 13.5, color: "#ddd0ff" }}>
            Template-built from the UltraVestra First 3 Seconds system — say it in your own words, and only say
            what&rsquo;s true. A hook is a creative testing hypothesis, not a guaranteed attention formula: film
            both openings, keep the rest of the video reasonably consistent, and compare initial retention,
            average watch time, rewatches, product clicks and attributed purchases — never views alone.
          </p>
        </>
      )}
      {!result && !guidance && (
        <p style={{ margin: "14px 0 0", fontSize: 14, color: "#ddd0ff" }}>
          The pattern to develop, from the masterclass: choose an opening — Problem, Curiosity, Demonstration,
          Humor — and develop its spoken line and visual direction. Fill in what you know; blanks become honest
          placeholders, never invented claims.
        </p>
      )}
    </section>
  );
}
