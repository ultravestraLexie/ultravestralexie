import Link from "next/link";
import { ENG_CSS } from "@/lib/engine-css";
import type { GrowthEngine } from "@/lib/galaxy/engine";

/* THE GROWTH ENGINE on Home (owner direction 2026-11-24):
 * ULTRA VESTRA BRAIN on top — the next best actions read across
 * all six stages — then the six stage cards in loop order, each
 * carrying its real number from the creator's own records and
 * opening its stage's home. Rendered under the start screen,
 * above the Today intelligence. All data comes from
 * lib/galaxy/engine.ts (pure, fixture-pinned); this component
 * only presents it. */
export default function EngineSection({ engine }: { engine: GrowthEngine }) {
  return (
    <div className="eng">
      <style>{ENG_CSS}</style>
      <div className="wrap">
        <div className="label">Ultra Vestra Brain · Growth Engine</div>
        <h2 className="eng-title">One engine, six stages.</h2>
        <p className="sub">
          Discovery, collaboration, marketing, customers, revenue and retention — connected,
          so a paid deal moves every stage at once. The Brain reads across all of them and
          tells you the next best move.
        </p>

        <div className="brain">
          <div className="label">Brain — next best actions</div>
          {engine.brain.map((r, i) => (
            <div className="rec" key={i}>
              <span className="tag">{r.stage}</span>
              <div style={{ flex: 1 }}>
                <div className="t">{r.title}</div>
                <div className="w">{r.why}</div>
              </div>
              <Link href={r.href}>{r.cta}</Link>
            </div>
          ))}
        </div>

        <div className="grid">
          {engine.stages.map((s, i) => (
            <Link className="stage" href={s.href} key={s.id}>
              <div className="n">
                Stage {i + 1} · {s.state === "strong" ? "Strong" : s.state === "going" ? "Moving" : "Start here"}
              </div>
              <div className="name">{s.name}</div>
              <div className="verb">{s.verb}</div>
              <div className="metric">{s.metric}</div>
              <div className="detail">{s.detail}</div>
              <span className="go">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
