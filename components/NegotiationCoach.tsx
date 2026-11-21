"use client";

import { useState } from "react";
import Link from "next/link";
import { TERMS, HONESTY_NOTE } from "@/lib/negotiation";

/* THE OFFER CHECKER — the working half of the Commission
 * Negotiation Coach. A creator enters the terms of a real offer
 * and gets every term graded — Strong / Workable / Weak / Red
 * flag — with the one-sentence reason and, for anything below
 * Strong, the exact counter line to send. The weak terms are then
 * assembled into one counter-offer message, template-labeled with
 * a copy button. Educational tool — not legal advice, and never a
 * prediction of what a brand will accept. */

type Grade = "strong" | "workable" | "weak" | "redflag";
interface GradeResult {
  grade: Grade;
  reason: string;
}

const GRADE_META: Record<Grade, { label: string; color: string; bg: string }> = {
  strong: { label: "Strong", color: "#4ade80", bg: "rgba(5,46,22,0.55)" },
  workable: { label: "Workable", color: "#22d3ee", bg: "rgba(8,47,73,0.55)" },
  weak: { label: "Weak", color: "#facc15", bg: "rgba(66,32,6,0.55)" },
  redflag: { label: "Red flag", color: "#f87171", bg: "rgba(69,10,10,0.55)" },
};
const GRADE_RANK: Record<Grade, number> = { strong: 0, workable: 1, weak: 2, redflag: 3 };

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
const inputStyle: React.CSSProperties = {
  background: "rgba(13,2,33,0.65)", border: "1px solid #4c1d95", borderRadius: 10,
  color: "#f3e8ff", padding: "9px 12px", fontSize: 15, width: "100%", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, color: "#f0abfc", margin: "0 0 6px" };
const fieldWrap: React.CSSProperties = { flex: "1 1 200px", minWidth: 180 };

function termById(id: string) {
  return TERMS.find((t) => t.id === id)!;
}

export default function NegotiationCoach() {
  const [rate, setRate] = useState("");
  const [cap, setCap] = useState("");
  const [cookie, setCookie] = useState("");
  const [exclusivity, setExclusivity] = useState("");
  const [usage, setUsage] = useState("");
  const [threshold, setThreshold] = useState("");
  const [netDays, setNetDays] = useState("");
  const [copied, setCopied] = useState(false);

  const rateNum = rate.trim() === "" ? null : Number(rate);
  const cookieNum = cookie.trim() === "" ? null : Number(cookie);
  const netNum = netDays.trim() === "" ? null : Number(netDays);

  /* ---- Grading, term by term. Every reason is educational
   * guidance grounded in the anatomy above — no invented
   * averages, no promised outcomes. ---- */
  const grades: { id: string; result: GradeResult | null }[] = [
    {
      id: "rate",
      result:
        rateNum == null || Number.isNaN(rateNum)
          ? null
          : rateNum <= 0
            ? { grade: "redflag", reason: "A 0% “commission” is a gifting deal wearing an affiliate costume — there is no partnership economics here at all." }
            : rateNum < 5
              ? { grade: "weak", reason: "Low single digits leave very little after your production time. The rate alone rarely kills a deal — but at this level the other terms have to be excellent." }
              : rateNum < 10
                ? { grade: "workable", reason: "A workable starting rate, common on bigger retail programs. Worth more with a long window, no cap, and a written step-up." }
                : { grade: "strong", reason: "Double digits is where creator-focused published programs live. Protect it by checking the cap and the window below — they decide what this rate is worth." },
    },
    {
      id: "cap",
      result:
        cap === ""
          ? null
          : cap === "uncapped"
            ? { grade: "strong", reason: "No ceiling — the deal keeps paying on the video that takes off in month three. This is the term strong programs publish proudly." }
            : cap === "capped"
              ? { grade: "redflag", reason: "A stated cap means your earnings stop at the ceiling no matter how well the content performs. Removing it can be worth more than several points of rate." }
              : { grade: "weak", reason: "Not stated means unknown — and unknown is never assumed uncapped. Ask, and get the answer in writing before you build a series on this program." },
    },
    {
      id: "cookie",
      result:
        cookieNum == null || Number.isNaN(cookieNum)
          ? null
          : cookieNum >= 30
            ? { grade: "strong", reason: "In the 30–90 day range strong programs commonly publish — late discoveries of your video still count as your sales." }
            : cookieNum >= 14
              ? { grade: "workable", reason: "Workable, but short for video: a viewer who watches today and buys in three weeks may fall outside it." }
              : cookieNum >= 7
                ? { grade: "weak", reason: "Under two weeks credits only the fastest buyers. Most of the demand your video creates will land outside this window." }
                : { grade: "redflag", reason: "Under a week — near same-session attribution. Almost none of the sales your content causes will ever be credited to you." },
    },
    {
      id: "exclusivity",
      result:
        exclusivity === ""
          ? null
          : exclusivity === "none"
            ? { grade: "strong", reason: "No exclusivity demanded — you keep every other deal in your niche open. This is the clean starting position." }
            : exclusivity === "category"
              ? { grade: "workable", reason: "Category exclusivity can be fair — if it is short and paid for. Untimed and unpaid, it quietly taxes every competing deal you turn down." }
              : { grade: "redflag", reason: "Total exclusivity hands the brand your whole niche. Demanded without a serious fee and a hard end date, it costs more than most commissions pay." },
    },
    {
      id: "usage",
      result:
        usage === ""
          ? null
          : usage === "organic"
            ? { grade: "strong", reason: "Organic posting on your own channels only — the clean line. Anything the brand wants beyond that is a separate license, priced separately." }
            : { grade: "redflag", reason: "Paid usage bundled into the commission means the brand can run your video as their ad while you earn only when links convert. Usage is a separate fee — always." },
    },
    {
      id: "payment",
      result: (() => {
        const parts: Grade[] = [];
        if (threshold === "none") parts.push("strong");
        else if (threshold === "low") parts.push("workable");
        else if (threshold === "high") parts.push("weak");
        if (netNum != null && !Number.isNaN(netNum)) {
          parts.push(netNum <= 30 ? "strong" : netNum <= 60 ? "workable" : "weak");
        }
        if (!parts.length) return null;
        const worst = parts.reduce((a, b) => (GRADE_RANK[b] > GRADE_RANK[a] ? b : a), "strong" as Grade);
        return {
          grade: worst,
          reason:
            worst === "strong"
              ? "Monthly, low-friction payment on a clear schedule — money arrives while the partnership is still warm."
              : worst === "workable"
                ? "Workable, but watch it: thresholds and slower timing are where small earnings quietly go to sleep."
                : "This structure locks small balances up and pays late. Creators stop promoting programs that never seem to pay — brands know it, so it is a fair term to raise.",
        } as GradeResult;
      })(),
    },
  ];

  const graded = grades.filter((g) => g.result !== null);
  const weakTerms = grades.filter((g) => g.result && g.result.grade !== "strong");
  const hasRedFlag = grades.some((g) => g.result?.grade === "redflag");
  const allStrong = graded.length === grades.length && weakTerms.length === 0;

  const verdict = !graded.length
    ? null
    : hasRedFlag
      ? { line: "Counter before you create", detail: "At least one term is a red flag. Do not start filming on these terms — send the counter below first. A professional no is cheaper than a resentful yes." }
      : weakTerms.length
        ? { line: "A workable offer with weak points", detail: "Nothing here has to kill the deal — but every weak term below is money or freedom left on the table. Counter on those, in writing, before you start." }
        : { line: "A strong offer", detail: "Every term you entered grades Strong. Get it in writing exactly as offered, then go make the content earn it." };

  function buildMessage(): string {
    const lines = weakTerms.map((g) => {
      const t = termById(g.id);
      return `• ${t.name}: ${t.counter}`;
    });
    return (
      "Hi team,\n\n" +
      "Thank you for the offer — I am genuinely interested in working together, and I want us both to walk in clear-eyed. A few terms I would like to adjust before I start:\n\n" +
      lines.join("\n\n") +
      "\n\nIf any of these do not work on your side, no hard feelings at all — I would rather we both know where we stand. I am also glad to start smaller and revisit the terms once we have seen real results.\n\n" +
      "Thank you again,\n[Your name]"
    );
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section style={toolPanel}>
      <p style={toolTitle}>🤝 The Offer Checker</p>
      <p style={toolSub}>
        Paste in the terms of a real offer — every term gets graded, every weak term gets the exact words to
        counter with. Leave knowing what to send.
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#f0abfc", fontWeight: 700, letterSpacing: 0.4 }}>
        {HONESTY_NOTE}
      </p>

      {/* INPUTS */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-rate">Commission rate (%)</label>
          <input id="nc-rate" style={inputStyle} type="number" min="0" step="0.5" placeholder="e.g. 10"
            value={rate} onChange={(e) => { setRate(e.target.value); setCopied(false); }} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-cap">Earnings cap</label>
          <select id="nc-cap" style={inputStyle} value={cap} onChange={(e) => { setCap(e.target.value); setCopied(false); }}>
            <option value="">Select…</option>
            <option value="uncapped">Uncapped — terms say no ceiling</option>
            <option value="capped">Capped — a maximum is stated</option>
            <option value="not-stated">Not stated anywhere</option>
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-cookie">Cookie window (days)</label>
          <input id="nc-cookie" style={inputStyle} type="number" min="0" step="1" placeholder="e.g. 30"
            value={cookie} onChange={(e) => { setCookie(e.target.value); setCopied(false); }} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-exclusivity">Exclusivity demanded</label>
          <select id="nc-exclusivity" style={inputStyle} value={exclusivity} onChange={(e) => { setExclusivity(e.target.value); setCopied(false); }}>
            <option value="">Select…</option>
            <option value="none">None</option>
            <option value="category">Category only</option>
            <option value="total">Total — no competitors at all</option>
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-usage">Usage rights asked</label>
          <select id="nc-usage" style={inputStyle} value={usage} onChange={(e) => { setUsage(e.target.value); setCopied(false); }}>
            <option value="">Select…</option>
            <option value="organic">Organic posting only</option>
            <option value="paid-included">Paid usage included in the deal</option>
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-threshold">Payout threshold</label>
          <select id="nc-threshold" style={inputStyle} value={threshold} onChange={(e) => { setThreshold(e.target.value); setCopied(false); }}>
            <option value="">Select…</option>
            <option value="none">No minimum — pays monthly</option>
            <option value="low">Minimum of $50 or less</option>
            <option value="high">Minimum over $50</option>
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="nc-net">Paid within (days)</label>
          <input id="nc-net" style={inputStyle} type="number" min="0" step="1" placeholder="e.g. 30"
            value={netDays} onChange={(e) => { setNetDays(e.target.value); setCopied(false); }} />
        </div>
      </div>

      {!graded.length && (
        <p style={{ margin: "16px 0 0", fontSize: 14.5, color: "#ddd0ff" }}>
          Fill in the terms you have — each one is graded as you enter it.
        </p>
      )}

      {/* GRADES */}
      {graded.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {grades.map((g) => {
            if (!g.result) return null;
            const t = termById(g.id);
            const meta = GRADE_META[g.result.grade];
            return (
              <div key={g.id} style={{ ...card, borderColor: meta.color }}>
                <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#f3e8ff", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {t.name}
                  <span style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}`, borderRadius: 999, padding: "1px 11px", fontWeight: 700, fontSize: 12.5 }}>
                    {meta.label}
                  </span>
                </p>
                <p style={{ margin: "0 0 6px", fontSize: 15, color: "#ddd0ff" }}>{g.result.reason}</p>
                {g.result.grade !== "strong" && (
                  <p style={{ margin: 0, fontSize: 15, color: "#f3e8ff" }}>
                    <strong style={{ color: "#67e8f9" }}>Say this:</strong> “{t.counter}”
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VERDICT + ASSEMBLED COUNTER */}
      {verdict && (
        <>
          <div style={{ ...card, marginTop: 20, border: "1px solid #e879f9", textAlign: "center", padding: "20px 22px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#f0abfc" }}>
              THE VERDICT — {graded.length} OF {grades.length} TERMS CHECKED
            </p>
            <p className="wow-title" style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800 }}>{verdict.line}</p>
            <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{verdict.detail}</p>
            {!allStrong && graded.length < grades.length && (
              <p style={{ margin: "10px 0 0", fontSize: 14, color: "#f0abfc" }}>
                Some terms are still unchecked — an unchecked term is an unknown, and unknowns get asked about, not assumed.
              </p>
            )}
          </div>

          {weakTerms.length > 0 && (
            <>
              <p style={{ margin: "22px 0 10px", fontSize: 17, fontWeight: 800, color: "#f0abfc" }}>
                Your counter-offer message
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "#f0abfc", fontWeight: 700, letterSpacing: 0.4 }}>
                TEMPLATE — ADAPT IT TO YOUR VOICE BEFORE SENDING
              </p>
              <pre style={{
                ...card, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit",
                fontSize: 15, color: "#f3e8ff", margin: 0, lineHeight: 1.55,
              }}>
                {buildMessage()}
              </pre>
              <p style={{ margin: "16px 0 0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button style={actionBtn} onClick={copyMessage}>{copied ? "Copied ✓" : "Copy my counter-offer"}</button>
              </p>
              <p style={{ margin: "12px 0 0", fontSize: 14, color: "#ddd0ff" }}>
                Every line follows the standard: <strong style={{ color: "#f3e8ff" }}>make it easy to say yes — and
                equally safe to say no.</strong> Then whatever is agreed, get it in writing. Not sure what strong
                looks like in the wild? The{" "}
                <Link href="/commissions" style={{ color: "#67e8f9", fontWeight: 700 }}>Commission Intelligence
                Center</Link>{" "}
                shows verified-uncapped programs with their published terms.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
