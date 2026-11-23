"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Galaxy navigation — exactly six destinations (owner's
 * prototype, 2026-11-23): Today, Brands, Deals, Studio, Money,
 * Passport. The rail renders them vertically on desktop; the same
 * six become the bottom tab bar on mobile. Active state = the
 * longest matching route prefix. */

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
  today: ic(
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.6" transform="rotate(-28 12 12)" />
    </>
  ),
  brands: ic(
    <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8l-5.3 2.9 1.1-6-4.4-4.2 6-.8z" />
  ),
  deals: ic(
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.6" />
      <rect x="10" y="4" width="5" height="11" rx="1.6" />
      <rect x="17" y="4" width="4" height="7" rx="1.6" />
    </>
  ),
  studio: ic(
    <>
      <rect x="3" y="6" width="13" height="12" rx="2.6" />
      <path d="M16 10.2l5-3v9.6l-5-3z" />
    </>
  ),
  money: ic(
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.6" />
      <path d="M3 10.2h18" />
      <circle cx="16.4" cy="14.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  passport: ic(
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.6" />
      <circle cx="12" cy="10" r="2.8" />
      <path d="M8.6 16.8c.8-1.5 2-2.3 3.4-2.3s2.6.8 3.4 2.3" />
    </>
  ),
};

export const SIDE_NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/today", label: "Today", icon: ICONS.today },
  { href: "/brands", label: "Brands", icon: ICONS.brands },
  { href: "/deals", label: "Deals", icon: ICONS.deals },
  { href: "/studio", label: "Studio", icon: ICONS.studio },
  { href: "/money", label: "Money", icon: ICONS.money },
  { href: "/passport", label: "Passport", icon: ICONS.passport },
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
              fontWeight: 500,
              textDecoration: "none",
              color: isActive ? "var(--ink)" : "var(--ink-2)",
              background: isActive
                ? "linear-gradient(90deg, rgba(76,116,255,.22), rgba(155,92,255,.08))"
                : "transparent",
              boxShadow: isActive ? "inset 0 0 0 1px rgba(143,166,255,.22)" : "none",
            }}
          >
            <span style={{ display: "inline-flex", color: isActive ? "var(--blue-2)" : undefined }}>
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
              color: isActive ? "var(--ink)" : "var(--ink-3)",
            }}
          >
            <span style={{ display: "inline-flex", color: isActive ? "var(--blue-2)" : undefined }}>
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
