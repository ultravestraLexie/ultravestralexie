"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Navigation — the rebuild's five destinations (owner-confirmed
 * 2026-11-24): Feed, Studio, Brain, Market, Universe. The Brain
 * sits at the center of the bar because it sits at the center of
 * the platform. Universe is the creator's whole business home
 * (/me — Money + Passport + levels + customers). The rail renders
 * them vertically on desktop; the same five become the bottom
 * tab bar on mobile. Active state = the longest matching route
 * prefix. The worlds behind the destinations (Brands, Deals,
 * Customers, Retention…) stay reachable from inside them. */

const ic = (children: React.ReactNode) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICONS = {
  feed: ic(
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.2 9.4l4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none" />
    </>
  ),
  studio: ic(
    <>
      <rect x="3" y="6" width="13" height="12" rx="2.6" />
      <path d="M16 10.2l5-3v9.6l-5-3z" />
    </>
  ),
  brain: ic(
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.6" transform="rotate(-28 12 12)" />
    </>
  ),
  market: ic(
    <>
      <path d="M4 9.5L5.6 4h12.8L20 9.5" />
      <path d="M4 9.5h16V20H4z" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  universe: ic(
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.6" />
      <circle cx="12" cy="10" r="2.8" />
      <path d="M8.6 16.8c.8-1.5 2-2.3 3.4-2.3s2.6.8 3.4 2.3" />
    </>
  ),
};

export const SIDE_NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/feed", label: "Feed", icon: ICONS.feed },
  { href: "/studio", label: "Studio", icon: ICONS.studio },
  { href: "/brain", label: "Brain", icon: ICONS.brain },
  { href: "/market", label: "Market", icon: ICONS.market },
  { href: "/me", label: "Universe", icon: ICONS.universe },
];

function activeHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const h of hrefs) {
    if (pathname === h || pathname.startsWith(h + "/")) {
      if (!best || h.length > best.length) best = h;
    }
  }
  return best;
}

export function SideNav() {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname, SIDE_NAV.map((n) => n.href));
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }} aria-label="Main">
      {SIDE_NAV.map((n) => {
        const isActive = n.href === active;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: isActive ? 600 : 500,
              textDecoration: "none",
              color: isActive ? "var(--gx-accent)" : "var(--ink-2)",
              background: isActive
                ? "linear-gradient(90deg, color-mix(in srgb, var(--gx-accent) 26%, transparent), color-mix(in srgb, var(--gx-accent) 10%, transparent))"
                : "transparent",
              boxShadow: isActive
                ? "inset 0 0 0 1px color-mix(in srgb, var(--gx-accent) 50%, transparent), 0 0 22px -6px var(--gx-glow), inset 0 0 18px -8px var(--gx-glow)"
                : "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                color: isActive ? "var(--gx-accent)" : undefined,
                filter: isActive ? "drop-shadow(0 0 6px var(--gx-accent))" : undefined,
              }}
            >
              {n.icon}
            </span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname, SIDE_NAV.map((n) => n.href));
  return (
    <>
      {SIDE_NAV.map((n) => {
        const isActive = n.href === active;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive ? "page" : undefined}
            aria-label={n.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "7px 0 5px",
              fontSize: 10.5,
              fontWeight: 600,
              textDecoration: "none",
              color: isActive ? "var(--gx-accent)" : "var(--ink-3)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                color: isActive ? "var(--gx-accent)" : undefined,
                filter: isActive ? "drop-shadow(0 0 6px var(--gx-accent))" : undefined,
              }}
            >
              {n.icon}
            </span>
            {n.label}
          </Link>
        );
      })}
    </>
  );
}

/** The UV ring mark (prototype logo), kept as the shared brand
 *  glyph for the shell and public surfaces. */
export function VMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ flex: "none", filter: "drop-shadow(0 0 10px rgba(124,100,255,.55))" }}>
      <defs>
        <linearGradient id="uvRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B07BFF" />
          <stop offset=".55" stopColor="#7A6BFF" />
          <stop offset="1" stopColor="#4C74FF" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="16.5" fill="rgba(10,15,46,.7)" stroke="url(#uvRing)" strokeWidth="3" />
      <text x="20" y="24.4" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontSize="11" fontWeight="600" fill="#EEF2FF" letterSpacing=".5">
        UV
      </text>
    </svg>
  );
}
