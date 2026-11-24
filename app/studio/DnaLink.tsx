"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DNA_STORAGE_KEY, dnaHomeState, type DnaState } from "@/lib/galaxy/dna";

/* The Content DNA entry card under the Studio five-stage flow.
 * Its words come from the DNA state on this device (the prototype's
 * home-state logic): an invite before discovery, the running
 * experiment, the top opportunity, or the strongest pattern after. */
export default function DnaLink() {
  const [home, setHome] = useState(() => dnaHomeState(null));

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(DNA_STORAGE_KEY) || "null");
      if (raw && raw.v === 1) setHome(dnaHomeState(raw as DnaState));
    } catch {
      /* no saved DNA on this device — the invite stands */
    }
  }, []);

  return (
    <section className="gx-panel" aria-label="Content DNA" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span
          aria-hidden="true"
          style={{
            flex: "none",
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "radial-gradient(circle at 32% 30%, #e879f9, #8b5cf6 55%, #3b82f6)",
            boxShadow: "0 0 18px rgba(167,139,250,.55)",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--ink-3)", margin: 0 }}>
            Vestra Content DNA{home.sample ? " · sample data" : ""}
          </p>
          <p style={{ fontWeight: 700, fontSize: 17, margin: "2px 0 0" }}>{home.title}</p>
          <p className="gx-sub">{home.detail}</p>
          <Link href="/studio/dna" className="gx-btn" style={{ marginTop: 10, display: "inline-flex" }}>
            {home.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
