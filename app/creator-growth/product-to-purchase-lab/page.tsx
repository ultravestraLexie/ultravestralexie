import { requireSubscription } from "@/lib/gate";
import type { Metadata } from "next";
import Link from "next/link";
import PurchaseLab from "@/components/PurchaseLab";
import { EVALUATION, THE_LOOP, CLOSING_LINE } from "@/lib/purchaselab";

/* VIDEO INTELLIGENCE — THE PRODUCT-TO-PURCHASE LAB.
 * An UltraVestra Original: the evaluation layer of creator training.
 * Seven questions decide whether a product video is ready — first
 * frame, intended-buyer hook, demonstration, benefits, proof, next
 * step, policies — and one loop turns the answers into improvement:
 * Don't guess. Diagnose. Improve. Test. Source: the owner's
 * UltraVestra Original card. */

export const metadata: Metadata = {
  title: "Video Intelligence: The Product-to-Purchase Lab | UltraVestra",
  description:
    "UltraVestra's Product-to-Purchase Lab: the seven questions every product video must answer — is the first frame interesting, does the hook attract the intended buyer, is the product demonstrated clearly, are the benefits understandable, is there enough proof, does the ending give a clear next step, does it meet advertising and platform policies — and the loop: Don't guess. Diagnose. Improve. Test.",
  alternates: {
    canonical: "https://ultra-vestra.vercel.app/creator-growth/product-to-purchase-lab",
  },
  openGraph: {
    title: "Video Intelligence: The Product-to-Purchase Lab | UltraVestra",
    description:
      "Don't guess how your video is doing — diagnose it. The seven-question evaluation standard and the Product-to-Purchase Evaluator for UltraVestra creators.",
    url: "https://ultra-vestra.vercel.app/creator-growth/product-to-purchase-lab",
    type: "article",
  },
};

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};
const h2style: React.CSSProperties = { fontSize: 28, margin: "0 0 8px", letterSpacing: 0.4, fontWeight: 800 };
const sub: React.CSSProperties = { color: "#ddd0ff", margin: "0 0 16px", fontSize: 15.5 };
const card: React.CSSProperties = {
  border: "1px solid #4c1d95", borderRadius: 14, padding: "14px 18px", background: "rgba(13,2,33,0.65)",
};
const linkStyle: React.CSSProperties = { color: "#67e8f9", fontWeight: 700, textDecoration: "none" };

export default async function ProductToPurchaseLabPage() {
  await requireSubscription("/creator-growth/product-to-purchase-lab");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HERO */}
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ULTRA VESTRA ORIGINAL
        </span>
        <h1 className="wow-title" style={{ fontSize: 44, margin: "14px 0 8px", fontWeight: 800 }}>
          Video Intelligence
        </h1>
        <p style={{ color: "#67e8f9", fontSize: 19, fontWeight: 800, letterSpacing: 1.6, margin: "0 auto 14px", maxWidth: 720 }}>
          THE PRODUCT-TO-PURCHASE LAB
        </p>
        <p style={{ color: "#ddd0ff", fontSize: 16.5, margin: "0 auto 20px", maxWidth: 720 }}>
          A product video is not finished when it is filmed. It is finished when it can answer seven questions —
          the same seven questions your viewer is silently asking on the way from first frame to purchase.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/worlds/product-to-purchase.jpg"
          alt="A creator in a futuristic studio surrounded by holographic video analytics, live badges, and audience screens"
          style={{
            width: "100%", maxWidth: 560, borderRadius: 22, display: "block", margin: "0 auto",
            border: "1px solid #7e22ce", boxShadow: "0 0 44px rgba(168,85,247,0.35)",
          }}
        />
      </section>

      {/* THE EVALUATION STANDARD — THE SEVEN QUESTIONS */}
      <section style={panel}>
        <h2 style={h2style}>What Creators Learn to Evaluate</h2>
        <p style={sub}>
          Seven questions. Run them on every product video before you publish — each one guards a different step
          on the path from product to purchase.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {EVALUATION.map((q, i) => (
            <article key={q.question} style={{ ...card, padding: "18px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 17.5 }}>
                <span className="wow-title" style={{ fontWeight: 800, fontSize: 22 }}>{i + 1}</span>{" "}
                <strong style={{ color: "#f3e8ff" }}>{q.question}</strong>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15.5, color: "#ddd0ff" }}>
                <strong style={{ color: "#67e8f9" }}>What it checks:</strong> {q.what_it_checks}
              </p>
              <p style={{ margin: 0, fontSize: 15.5, color: "#f3e8ff" }}>
                <strong style={{ color: "#f0abfc" }}>What good looks like:</strong> {q.what_good_looks_like}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* THE EVALUATOR */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 30, fontWeight: 800, margin: "0 0 4px" }} className="wow-title">Run Your Video Through the Lab</p>
        <p style={{ color: "#ddd0ff", margin: 0, fontSize: 15.5 }}>
          Seven honest answers in — a diagnosis, a priority order, and an improvement plan out.
        </p>
      </div>
      <PurchaseLab />

      {/* THE LOOP */}
      <section style={panel}>
        <h2 style={h2style}>The Loop</h2>
        <p style={sub}>
          Evaluation is not the finish line — it is the start of the loop. Every video you publish goes around it
          again.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {THE_LOOP.map((s, i) => (
            <article key={s.step} style={{ ...card, padding: "18px 20px" }}>
              <p className="wow-title" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 2px", lineHeight: 1 }}>
                {i + 1}
              </p>
              <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 800, color: "#f0abfc" }}>{s.step}</h3>
              <p style={{ margin: 0, fontSize: 15, color: "#ddd0ff" }}>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CLOSING LINE */}
      <section style={{ ...panel, textAlign: "center", border: "1px solid #e879f9", boxShadow: "0 0 44px rgba(217,70,239,0.4)" }}>
        <p className="wow-title" style={{ fontSize: 34, fontWeight: 800, margin: "6px auto", maxWidth: 760, lineHeight: 1.3 }}>
          {CLOSING_LINE}
        </p>
      </section>

      <p style={{ textAlign: "center", margin: 0, fontSize: 15, color: "#ddd0ff" }}>
        Understand the person watching in <Link href="/creator-growth/human-behind-the-view" style={linkStyle}>The Human Behind the View</Link>,
        put them first with <Link href="/creator-growth/audience-first-protocol" style={linkStyle}>The Audience First Protocol</Link>,
        build in the <Link href="/secret-weapon" style={linkStyle}>Creator&rsquo;s Secret Weapon</Link>,
        and keep learning in the <Link href="/coach" style={linkStyle}>Creator Growth Center</Link>.
      </p>
    </div>
  );
}
