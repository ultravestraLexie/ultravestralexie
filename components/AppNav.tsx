"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* App navigation for the member shell (Build 9 — the owner's mockup
 * frame). One source for both the desktop sidebar and the phone
 * bottom tabs. Active state = the longest matching route prefix, so
 * /growth-center/profile lights Profile, not Growth Center. */

const ic = (children: React.ReactNode) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const SIDE_NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: ic(
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </>
    ),
  },
  {
    href: "/growth-center/advisor",
    label: "Advisor",
    icon: ic(
      <>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
      </>
    ),
  },
  {
    href: "/campaign-match",
    label: "Campaign Match",
    icon: ic(
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/creator-lab",
    label: "Content Tools",
    icon: ic(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/opportunities",
    label: "Marketplace",
    icon: ic(
      <>
        <path d="M5 8h14l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.8H8a1.8 1.8 0 0 1-1.8-1.8z" />
        <path d="M8.5 10.5V6.5a3.5 3.5 0 0 1 7 0v4" />
      </>
    ),
  },
  {
    href: "/academy",
    label: "Academy",
    icon: ic(
      <>
        <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
        <path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" />
        <path d="M21.5 9.5V15" />
      </>
    ),
  },
  {
    href: "/growth-center",
    label: "Growth Center",
    icon: ic(
      <>
        <path d="M3.5 17.5 9 12l3.5 3.5L20 8" />
        <path d="M14.5 8H20v5.5" />
      </>
    ),
  },
  {
    href: "/command-center",
    label: "Command Center",
    icon: ic(
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: "/growth-center/profile",
    label: "Profile",
    icon: ic(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20.5c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" />
      </>
    ),
  },
  {
    href: "/support",
    label: "Help & Support",
    icon: ic(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.3A2.6 2.6 0 0 1 12 7.5c1.4 0 2.5 1 2.5 2.2 0 1.7-2.4 2-2.4 3.6" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
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
            key={n.href + n.label}
            href={n.href}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              color: isActive ? "#ffffff" : "#cfc4f5",
              background: isActive
                ? "linear-gradient(92deg, rgba(168,85,247,0.55), rgba(124,58,237,0.35))"
                : "transparent",
              boxShadow: isActive ? "0 0 18px rgba(168,85,247,0.35)" : "none",
              border: isActive ? "1px solid rgba(232,121,249,0.5)" : "1px solid transparent",
            }}
          >
            {n.icon}
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

const TABS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/dashboard", label: "Home", icon: SIDE_NAV[0].icon },
  { href: "/growth-center", label: "Growth", icon: SIDE_NAV[6].icon },
  { href: "/academy", label: "Academy", icon: SIDE_NAV[5].icon },
  { href: "/growth-center/profile", label: "Profile", icon: SIDE_NAV[8].icon },
];

export function VMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="uv-vgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0abfc" />
          <stop offset="0.5" stopColor="#c026d3" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M5 8 L24 41 L43 8 L33.5 8 L24 25.5 L14.5 8 Z" fill="url(#uv-vgrad)" />
    </svg>
  );
}

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const all = [...TABS.map((t) => t.href), "/creator-lab"];
  const active = activeHref(pathname, all);
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    fontWeight: 700,
    textDecoration: "none",
    color: isActive ? "#f0abfc" : "#9d8fd6",
    minWidth: 58,
    padding: "2px 0 0",
  });
  return (
    <>
      <Link href={TABS[0].href} style={tabStyle(active === TABS[0].href)} aria-label="Home">
        {TABS[0].icon}
        Home
      </Link>
      <Link href={TABS[1].href} style={tabStyle(active === TABS[1].href)} aria-label="Growth Center">
        {TABS[1].icon}
        Growth
      </Link>
      <Link
        href="/creator-lab"
        aria-label="Creator Lab — content tools"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          marginTop: -22,
          borderRadius: "50%",
          background: "rgba(10,4,26,0.95)",
          border: "2px solid #c026d3",
          boxShadow: "0 0 22px rgba(217,70,239,0.55)",
          textDecoration: "none",
        }}
      >
        <VMark size={30} />
      </Link>
      <Link href={TABS[2].href} style={tabStyle(active === TABS[2].href)} aria-label="Academy">
        {TABS[2].icon}
        Academy
      </Link>
      <Link href={TABS[3].href} style={tabStyle(active === TABS[3].href)} aria-label="Profile">
        {TABS[3].icon}
        Profile
      </Link>
    </>
  );
}
