"use client";

import { useState } from "react";
import {
  TRIGGERS,
  OUTCOMES,
  OUTCOME_TRIGGERS,
  CONTROVERSY_FORMULA,
  JOURNEY,
  CONVERSATION_STARTERS,
  NEVER_LIST,
  CHALLENGE,
  type ViewerOutcome,
} from "@/lib/attention";

/* THE HUMAN ATTENTION REACTOR — the interactive heart of The Art of
 * Captivating Human Attention. A creator enters topic, product, exact
 * audience and desired outcome; the Reactor assembles attention
 * strategies from the 15 triggers, a Friendly Controversy angle, an
 * emotional journey map, comment prompts and one full video concept —
 * each with the reason it could connect. Template-built creative
 * hypotheses from the masterclass system, honestly labeled, and bound
 * by the rule that separates attention from manipulation: the Reactor
 * never builds on a tactic from the NEVER list. */

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
  padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14,
  border: active ? "1px solid #e879f9" : "1px solid #4c1d95",
  background: active ? "linear-gradient(92deg, #a855f7, #d946ef)" : "rgba(13,2,33,0.65)",
  color: "#fff",
});
const sectionLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: "#67e8f9", margin: "0 0 10px",
};

const VAGUE_AUDIENCES = ["everyone", "anyone", "anybody", "everybody", "all", "people", "all people", "the public", "general audience"];

const STARTER_PICKS: Record<ViewerOutcome, number[]> = {
  learn: [4, 0, 6],
  trust: [0, 2, 6],
  comment: [1, 5, 3],
  buy: [1, 0, 2],
  follow: [0, 5, 6],
};

const OUTCOME_CLOSE: Record<ViewerOutcome, string> = {
  learn: "Close by recapping the one useful thing — said plainly, in one sentence.",
  trust: "Close with the honest verdict: who this suits, who it might not, and what you still don't know.",
  comment: "End on the discussion question, pin it as the first comment, and actually reply.",
  buy: "Point viewers to the full details — price, specs, terms — and leave the decision entirely with them.",
  follow: "Tease the next honest test in this series and invite them back for the answer.",
};

interface ReactorOutput {
  strategies: { name: string; hook: string; why: string }[];
  controversy: { step: string; line: string }[];
  journey: { stage: string; viewer: string; move: string }[];
  prompts: string[];
  concept: { title: string; beats: string[] };
}

function fill(template: string, topic: string, product: string, audience: string): string {
  return template
    .replaceAll("{topic}", topic)
    .replaceAll("{product}", product)
    .replaceAll("{audience}", audience);
}

export default function AttentionReactor() {
  const [topic, setTopic] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [outcome, setOutcome] = useState<ViewerOutcome>("comment");
  const [triggerPick, setTriggerPick] = useState("");
  const [guidance, setGuidance] = useState(false);
  const [output, setOutput] = useState<ReactorOutput | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    const a = audience.trim();
    const aNorm = a.toLowerCase().replace(/[.!]+$/, "");
    if (!a || VAGUE_AUDIENCES.includes(aNorm) || aNorm.startsWith("everyone") || aNorm.startsWith("anyone")) {
      setGuidance(true);
      setOutput(null);
      return;
    }
    setGuidance(false);
    const t = topic.trim() || "this topic";
    const p = product.trim() || "this product";

    /* Strategies: the creator's picked trigger leads; the rest are
     * matched to the desired outcome from the 15 triggers. */
    const matchedNames = OUTCOME_TRIGGERS[outcome];
    const orderedNames: string[] = [];
    if (triggerPick) orderedNames.push(triggerPick);
    for (const n of matchedNames) if (!orderedNames.includes(n)) orderedNames.push(n);
    const strategies = orderedNames.slice(0, 4).map((name) => {
      const trigger = TRIGGERS.find((tr) => tr.name === name) ?? TRIGGERS[0];
      return { name: trigger.name, hook: fill(trigger.hook, t, p, a), why: fill(trigger.why, t, p, a) };
    });
    const leadHook = strategies[0].hook;

    /* Friendly Controversy — the formula, filled. Respectful by build:
     * it questions an assumption, never a person. */
    const controversyLines = [
      `Most people assume the best-known name in ${t} is automatically the right choice.`,
      `I don't think the name is the decision — what ${p} actually does for ${a} is.`,
      `Because a familiar label never did the job itself. What matters is what you can watch, test, and judge in real use.`,
      `What decides it for you — the name, or what it does?`,
    ];
    const controversy = CONTROVERSY_FORMULA.map((f, i) => ({ step: f.step, line: controversyLines[i] }));

    const journey = JOURNEY.map((s) => ({
      stage: s.stage,
      viewer: s.viewer,
      move: fill(s.reactorMove, t, p, a),
    }));

    const prompts = STARTER_PICKS[outcome].map((i) => fill(CONVERSATION_STARTERS[i].template, t, p, a));

    const outcomeLabel = OUTCOMES.find((o) => o.key === outcome)?.label ?? "";
    const concept: ReactorOutput["concept"] = {
      title: `${p} for ${a} — built to earn a ${outcomeLabel.toLowerCase()}`,
      beats: [
        `0–3 sec — Open: \u201c${leadHook}\u201d Interrupt the scroll, make it personal to ${a}, and leave one loop open.`,
        `Attention → Recognition: name the real ${t} situation ${a} is in — in their words, not marketing words.`,
        `The honest middle: demonstrate ${p} doing the job. Show the moment it works — and the moment it doesn't, if there is one.`,
        `Friendly Controversy beat: \u201c${controversyLines[1]}\u201d Then give the reason, and hand the question to the room.`,
        `Payoff: deliver exactly what the opening promised about ${p}. ${OUTCOME_CLOSE[outcome]}`,
        `Participation: \u201c${prompts[0]}\u201d`,
      ],
    };

    setOutput({ strategies, controversy, journey, prompts, concept });
    setCopied(false);
  }

  async function copyOutput() {
    if (!output) return;
    const text = [
      `HUMAN ATTENTION REACTOR — ${output.concept.title}`,
      "",
      "ATTENTION STRATEGIES",
      ...output.strategies.map((s) => `• ${s.name}\n  Hook: ${s.hook}\n  Why it could connect: ${s.why}`),
      "",
      "FRIENDLY CONTROVERSY ANGLE",
      ...output.controversy.map((c) => `• ${c.step}: ${c.line}`),
      "",
      "EMOTIONAL JOURNEY",
      ...output.journey.map((j) => `• ${j.stage} — viewer: ${j.viewer} Move: ${j.move}`),
      "",
      "COMMENT PROMPTS",
      ...output.prompts.map((pr) => `• ${pr}`),
      "",
      "THE VIDEO CONCEPT",
      ...output.concept.beats.map((b) => `• ${b}`),
      "",
      "Template-built creative hypotheses from the UltraVestra masterclass system — not predictions. Only claim what you can show.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section style={toolPanel}>
      <h2 style={toolTitle}>⚛️ The Human Attention Reactor</h2>
      <p style={toolSub}>
        Enter your topic, product, exact audience, and the outcome you want. The Reactor builds attention strategies,
        a respectful controversy angle, an emotional journey, comment prompts, and one full video concept — and
        explains why each could connect. Template-built creative hypotheses from the masterclass system, not
        predictions of real audience behavior.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="ar-topic">Your topic</label>
          <input id="ar-topic" style={inputStyle} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. choosing a water bottle" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ar-product">Your product</label>
          <input id="ar-product" style={inputStyle} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. the TrailChill 1L bottle" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ar-audience">Your exact audience</label>
          <input id="ar-audience" style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. gym beginners who hate lukewarm water" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ar-trigger">Lead trigger (optional)</label>
          <select id="ar-trigger" style={inputStyle} value={triggerPick} onChange={(e) => setTriggerPick(e.target.value)}>
            <option value="">Match it to my outcome</option>
            {TRIGGERS.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={labelStyle}>Desired viewer outcome</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {OUTCOMES.map((o) => (
            <button key={o.key} type="button" style={chipBtn(outcome === o.key)} onClick={() => setOutcome(o.key)} title={o.line}>
              {o.label}
            </button>
          ))}
        </div>
        <p style={{ color: "#ddd0ff", fontSize: 14, margin: "8px 0 0" }}>
          {OUTCOMES.find((o) => o.key === outcome)?.line}
        </p>
      </div>

      <button type="button" style={actionBtn} onClick={generate}>Run the Reactor ⚛️</button>

      {guidance && (
        <div style={{ ...card, marginTop: 18, borderColor: "#e879f9" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#f0abfc", fontSize: 16 }}>Not yet — the audience is too wide to aim at.</p>
          <p style={{ margin: 0, color: "#f3e8ff", fontSize: 15 }}>
            &ldquo;Everyone&rdquo; can&rsquo;t recognize themselves in an opening, and recognition is what earns the
            second second. Narrow it to one exact person in one exact situation — not &ldquo;everyone,&rdquo; but
            &ldquo;gym beginners who hate lukewarm water.&rdquo; The Reactor only builds for an audience specific
            enough to feel spoken to.
          </p>
        </div>
      )}

      {output && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <p style={sectionLabel}>ATTENTION STRATEGIES — MATCHED FROM THE 15 TRIGGERS</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {output.strategies.map((s) => (
                <article key={s.name} style={card}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16.5, color: "#f3e8ff" }}>{s.name}</h3>
                  <p style={{ margin: "0 0 8px", color: "#f0abfc", fontWeight: 700, fontSize: 15 }}>&ldquo;{s.hook}&rdquo;</p>
                  <p style={{ margin: 0, color: "#ddd0ff", fontSize: 14.5 }}>
                    <strong style={{ color: "#67e8f9" }}>Why it could connect:</strong> {s.why}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <p style={sectionLabel}>FRIENDLY CONTROVERSY ANGLE — BELIEF → OPINION → REASON → DISCUSSION</p>
            <div style={card}>
              {output.controversy.map((c) => (
                <p key={c.step} style={{ margin: "0 0 8px", color: "#f3e8ff", fontSize: 15 }}>
                  <strong style={{ color: "#f0abfc" }}>{c.step}:</strong> {c.line}
                </p>
              ))}
              <p style={{ margin: "4px 0 0", color: "#ddd0ff", fontSize: 14 }}>
                It questions an assumption, never a person. No insults, no fake claims — a difference of opinion
                people can discuss without attacking one another.
              </p>
            </div>
          </div>

          <div>
            <p style={sectionLabel}>EMOTIONAL JOURNEY MAP — WHAT THEY FEEL, WHAT YOU DO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {output.journey.map((j, i) => (
                <div key={j.stage} style={{ ...card, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline", padding: "10px 16px" }}>
                  <span style={{ fontWeight: 800, color: "#f0abfc", minWidth: 120 }}>{i + 1}. {j.stage}</span>
                  <span style={{ color: "#67e8f9", fontStyle: "italic", minWidth: 190 }}>{j.viewer}</span>
                  <span style={{ color: "#f3e8ff", fontSize: 14.5, flex: 1 }}>{j.move}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={sectionLabel}>COMMENT PROMPTS — PERSONALIZED TO YOUR TOPIC</p>
            <div style={card}>
              {output.prompts.map((pr) => (
                <p key={pr} style={{ margin: "0 0 6px", color: "#f3e8ff", fontSize: 15 }}>&ldquo;{pr}&rdquo;</p>
              ))}
              <p style={{ margin: "6px 0 0", color: "#ddd0ff", fontSize: 14 }}>
                Don&rsquo;t just ask people to comment. Give them something interesting to respond to.
              </p>
            </div>
          </div>

          <div>
            <p style={sectionLabel}>THE VIDEO CONCEPT — EVERYTHING COMBINED</p>
            <div style={{ ...card, borderColor: "#e879f9" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 17, color: "#f3e8ff" }}>{output.concept.title}</h3>
              {output.concept.beats.map((b) => (
                <p key={b.slice(0, 40)} style={{ margin: "0 0 8px", color: "#f3e8ff", fontSize: 15 }}>{b}</p>
              ))}
              <p style={{ margin: "10px 0 14px", color: "#ddd0ff", fontSize: 14 }}>
                A creative hypothesis to test — not a prediction. Only claim what you can show, and deliver what
                the opening promises.
              </p>
              <button type="button" style={actionBtn} onClick={copyOutput}>
                {copied ? "Copied ✓" : "Copy the full Reactor output"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...card, marginTop: 22 }}>
        <p style={{ ...sectionLabel, margin: "0 0 8px" }}>THE REACTOR&rsquo;S GUARDRAILS — IT NEVER BUILDS ON THESE</p>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#f3e8ff", fontSize: 14.5, display: "flex", flexDirection: "column", gap: 3 }}>
          {NEVER_LIST.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </section>
  );
}

/* ---------- The 7-Day Captivating-Content Challenge tracker ---------- */
export function ChallengeTracker() {
  const [done, setDone] = useState<boolean[]>(() => CHALLENGE.map(() => false));
  const count = done.filter(Boolean).length;

  function toggle(i: number) {
    setDone((prev) => prev.map((d, j) => (j === i ? !d : d)));
  }

  return (
    <div>
      <p style={{ color: "#ddd0ff", margin: "0 0 14px", fontSize: 15 }}>
        <strong style={{ color: "#f0abfc" }}>{count}/7 completed</strong> — one honest attention skill per day.
        Check each day off as you post it.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CHALLENGE.map((c, i) => (
          <button
            key={c.day}
            type="button"
            onClick={() => toggle(i)}
            style={{
              ...card, textAlign: "left", cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
              color: "#f3e8ff", fontSize: 15, width: "100%",
              borderColor: done[i] ? "#e879f9" : "#4c1d95",
              opacity: done[i] ? 1 : 0.92,
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15,
              border: "1px solid #e879f9",
              background: done[i] ? "linear-gradient(92deg, #a855f7, #d946ef)" : "transparent",
              color: "#fff",
            }}>
              {done[i] ? "✓" : ""}
            </span>
            <span>
              <strong style={{ color: "#f0abfc" }}>{c.day}</strong> — {c.task}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDone(CHALLENGE.map(() => false))}
        style={{
          marginTop: 14, padding: "9px 20px", borderRadius: 999, cursor: "pointer",
          border: "1px solid #4c1d95", background: "rgba(13,2,33,0.65)", color: "#ddd0ff", fontWeight: 700, fontSize: 14,
        }}
      >
        Reset challenge
      </button>
    </div>
  );
}
