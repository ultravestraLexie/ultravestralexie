"use client";

import { useState } from "react";
import Link from "next/link";
import { routeBrainCommand, BRAIN_SUGGESTIONS, type BrainIntent } from "@/lib/brain/commands";

/* The Brain Command Center's command box. A command is routed by
 * the deterministic intent layer (lib/brain/commands) to a REAL
 * destination, the routing is written to the action log
 * (public.brain_actions via /api/brain/actions), and the answer
 * card leads exactly where it says it leads. A command the Brain
 * cannot route yet gets an honest answer, never a fake one. */

export type BrainLogRow = { action: string; detail: string; when: string };

export default function BrainClient({ log }: { log: BrainLogRow[] }) {
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState<BrainIntent | null>(null);
  const [missed, setMissed] = useState("");

  async function ask(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    const routed = routeBrainCommand(cmd);
    if (!routed) {
      setAnswer(null);
      setMissed(
        "I can't do that one yet. Everything I can do today is below — and the list only grows when a capability is real."
      );
      return;
    }
    setMissed("");
    setAnswer(routed.intent);
    fetch("/api/brain/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "command",
        detail: `${cmd} → ${routed.intent.key}`,
      }),
    }).catch(() => {});
  }

  return (
    <div>
      <div className="cmdbox">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <div className="cmdrow">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask the Brain — “Find brands that fit my audience”"
              aria-label="Ask the Brain"
            />
            <button className="postbtn" type="submit" disabled={!text.trim()}>
              Ask
            </button>
          </div>
        </form>
        <div className="chips">
          {BRAIN_SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="chip"
              onClick={() => {
                setText(s);
                ask(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {answer ? (
          <div className="answer">
            <div className="agent">{answer.agent}</div>
            <div className="a-title">{answer.title}</div>
            <p className="a-blurb">{answer.blurb}</p>
            <Link className="cta" href={answer.href}>
              {answer.cta} →
            </Link>
          </div>
        ) : null}
        {missed ? (
          <div className="answer">
            <div className="agent">VESTRA BRAIN</div>
            <p className="a-blurb" style={{ marginTop: 6 }}>
              {missed}
            </p>
          </div>
        ) : null}
      </div>

      {log.length > 0 ? (
        <>
          <div className="label" style={{ marginTop: 22 }}>
            Action log
          </div>
          <div className="log">
            {log.map((r, i) => (
              <div className="logrow" key={i}>
                <span className="when">{r.when}</span>
                <span>
                  <strong>{r.action}</strong>
                  {r.detail ? <span style={{ color: "var(--e-text2)" }}> — {r.detail}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
