"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GALACTIC_PILLARS, type GalacticPillar } from "@/lib/galactic-pillars";

// UltraVestra — The Nine Galactic Pillars (/pillars).
//
// A public showcase of the nine functions of a creator business.
// Selection swaps the detail panel client-side from the static data
// in lib/galactic-pillars.ts — no fetch, no API, no reload. Every
// tool link points at a real existing route; gated routes behave
// exactly as they do from the homepage (login/subscribe wall for
// non-members). Protection has no tools and its panel says so.
//
// The galaxy styling lives entirely in app/pillars/pillars.css,
// scoped under .pillars-root — no other page is affected.

function PillarIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "discovery":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="15" opacity="0.45" />
          <circle cx="20" cy="20" r="8" />
          <line x1="26" y1="26" x2="37" y2="37" />
        </svg>
      );
    case "intelligence":
      return (
        <svg {...common}>
          <path d="M24 12c-1.5-3-5-5-8-4C11 9.5 7 13 7.5 17 4 19 3.5 24 6 27c-1.8 3 .5 7 4 7.5C11 38 15 40 18 38.5c1 2 3.5 3 6 2.5z" />
          <path d="M24 12c1.5-3 5-5 8-4 5 1.5 9 5 8.5 9 3.5 2 4 7 1.5 10 1.8 3-.5 7-4 7.5C37 38 33 40 30 38.5c-1 2-3.5 3-6 2.5z" />
          <line x1="24" y1="12" x2="24" y2="41" opacity="0.5" />
        </svg>
      );
    case "relationships":
      return (
        <svg {...common}>
          <circle cx="17" cy="24" r="10" />
          <circle cx="31" cy="24" r="10" />
        </svg>
      );
    case "negotiation":
      return (
        <svg {...common}>
          <rect x="5" y="8" width="21" height="15" rx="4" />
          <path d="M12 23v6l7-6" />
          <rect x="22" y="25" width="21" height="15" rx="4" />
          <path d="M36 40v6l-7-6" />
        </svg>
      );
    case "protection":
      return (
        <svg {...common}>
          <path d="M24 4l16 5v13c0 11-7 18-16 22C15 40 8 33 8 22V9z" />
          <path d="M17 23l5 5 9-11" />
        </svg>
      );
    case "revenue":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="5.5" fill="currentColor" stroke="none" opacity="0.85" />
          <circle cx="24" cy="24" r="12" />
          <circle cx="24" cy="24" r="18.5" strokeDasharray="3 5" opacity="0.7" />
          <circle cx="42" cy="17" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="8" cy="33" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "growth":
      return (
        <svg {...common}>
          <path d="M7 41h34" opacity="0.5" />
          <path d="M10 34l10-8 7 4 11-16" />
          <path d="M31 13h8v8" />
        </svg>
      );
    case "performance":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="4.5" />
          <ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(-20 24 24)" />
          <circle cx="39.5" cy="15.5" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "nexus":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="5" />
          <line x1="24" y1="19" x2="24" y2="9" />
          <line x1="28.3" y1="26.5" x2="36.7" y2="31.5" />
          <line x1="19.7" y1="26.5" x2="11.3" y2="31.5" />
          <line x1="28.3" y1="21.5" x2="36.7" y2="16.5" />
          <line x1="19.7" y1="21.5" x2="11.3" y2="16.5" />
          <circle cx="24" cy="7" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="38.5" cy="32.5" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="32.5" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="38.5" cy="15.5" r="2.6" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="15.5" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="12" />
        </svg>
      );
  }
}

function accentStyle(p: GalacticPillar): React.CSSProperties {
  return { "--pillar-accent": p.accent } as React.CSSProperties;
}

export default function NinePillars() {
  const [selectedId, setSelectedId] = useState<string>(GALACTIC_PILLARS[0].id);

  // Deep links: /pillars#revenue opens with that pillar selected.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (GALACTIC_PILLARS.some((p) => p.id === fromHash)) {
      setSelectedId(fromHash);
    }
  }, []);

  const selected =
    GALACTIC_PILLARS.find((p) => p.id === selectedId) ?? GALACTIC_PILLARS[0];

  function select(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="pillars-root">
      <section className="pillars-title">
        <div className="pillars-eyebrow">ULTRA&nbsp;VESTRA</div>
        <h1 className="pillars-h1">THE NINE GALACTIC PILLARS</h1>
        <p className="pillars-subtitle">
          One Creator Business. Infinite Possibilities.
        </p>
        <p className="pillars-intro">
          Nine essential functions of a successful creator business — one
          operating system. Select a pillar to see what it does and which
          working tools stand behind it today.
        </p>
      </section>

      <div className="pillars-platform">
        <div className="pillars-row" role="tablist" aria-label="The nine pillars">
          {GALACTIC_PILLARS.map((p) => {
            const isActive = p.id === selected.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={
                  "pillar-col" +
                  (isActive ? " pillar-col--active" : "") +
                  (p.id === "nexus" ? " pillar-col--nexus" : "")
                }
                style={accentStyle(p)}
                onClick={() => select(p.id)}
              >
                <span className="pillar-col-number">{p.number}</span>
                <span className="pillar-col-name">{p.name}</span>
                <span className="pillar-col-icon">
                  <PillarIcon id={p.id} />
                </span>
                <span className="pillar-col-promise">{p.promise}</span>
              </button>
            );
          })}
        </div>
        <div className="pillars-platform-ring" aria-hidden="true" />
      </div>

      <section className="pillars-detail" aria-live="polite">
        <aside className="pillars-list" aria-label="Pillar list">
          <div className="pillars-list-title">THE NINE PILLARS</div>
          {GALACTIC_PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                "pillars-list-row" +
                (p.id === selected.id ? " pillars-list-row--active" : "")
              }
              style={accentStyle(p)}
              onClick={() => select(p.id)}
              aria-pressed={p.id === selected.id}
            >
              <span className="pillars-list-number">{p.number}</span>
              <span className="pillars-list-icon">
                <PillarIcon id={p.id} />
              </span>
              <span className="pillars-list-name">{p.name}</span>
            </button>
          ))}
        </aside>

        <article
          className="pillars-panel"
          style={accentStyle(selected)}
          key={selected.id}
        >
          <div className="pillars-panel-head">
            <div>
              <div className="pillars-panel-kicker">
                PILLAR {selected.number} — {selected.identity.toUpperCase()}
              </div>
              <h2 className="pillars-panel-name">{selected.name}</h2>
              <p className="pillars-panel-tagline">{selected.tagline}</p>
            </div>
            <div
              className={
                "pillars-emblem" +
                (selected.id === "nexus" ? " pillars-emblem--nexus" : "")
              }
              aria-hidden="true"
            >
              <PillarIcon id={selected.id} />
            </div>
          </div>

          <p className="pillars-panel-desc">{selected.description}</p>

          <ul className="pillars-benefits">
            {selected.benefits.map((b) => (
              <li key={b}>
                <span className="pillars-check" aria-hidden="true">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          {selected.tools.length > 0 ? (
            <div className="pillars-tools">
              {selected.tools.map((t, i) => (
                <Link
                  key={t.href + t.label}
                  href={t.href}
                  className={
                    "pillars-tool" + (i === 0 ? " pillars-tool--primary" : "")
                  }
                >
                  {t.label} →
                </Link>
              ))}
            </div>
          ) : (
            <div className="pillars-no-tools">
              No tool buttons here — by design. This pillar communicates the
              principle; it does not link to a feature that doesn&apos;t exist.
            </div>
          )}

          {selected.statusNote && (
            <p className="pillars-status">{selected.statusNote}</p>
          )}
        </article>

        <aside className="pillars-side">
          <div className="pillars-side-card">
            <div className="pillars-side-title">WHY IT MATTERS</div>
            <p>{selected.whyItMatters}</p>
          </div>
          <div className="pillars-side-card">
            <div className="pillars-side-title">KEY BENEFITS</div>
            <ul className="pillars-side-list">
              {selected.benefits.map((b) => (
                <li key={b}>
                  <span className="pillars-check" aria-hidden="true">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <footer className="pillars-footerbar">
        <span className="pillars-footer-brand">ULTRA VESTRA</span>
        <span className="pillars-footer-line">
          The Operating System for Creator Businesses
        </span>
        <span className="pillars-footer-points">
          9 Pillars&nbsp;&nbsp;·&nbsp;&nbsp;Unlimited
          Opportunities&nbsp;&nbsp;·&nbsp;&nbsp;Limitless Growth
        </span>
        <Link href="/dashboard" className="pillars-enter">
          Enter Your Galaxy →
        </Link>
      </footer>
    </div>
  );
}
