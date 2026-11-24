"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  dashboardNumbers,
  loadMarketState,
  type MarketState,
} from "@/lib/marketplace";

/* Business-home dashboard strip + entry cards for the local-gigs
 * preview tools (owner order 2026-11-24). The numbers are computed
 * from the device-local market store — the same store the three
 * tools read — so they always match what the tools show on this
 * device. Styled to sit inside the business home's existing cards;
 * the store itself is labeled sample data in each tool. */

const stripStyle: React.CSSProperties = {
  border: "1px solid #3d2a6e",
  background: "#1b123d",
  borderRadius: 12,
  padding: 22,
  marginTop: 24,
};

const TOOLS = [
  {
    href: "/business/campaigns",
    title: "Campaigns",
    detail: "Post opportunities and review the creators working on them.",
  },
  {
    href: "/business/creators",
    title: "Creators",
    detail: "Browse local creators and invite them to a campaign.",
  },
  {
    href: "/business/customers",
    title: "Customers",
    detail: "Today's follow-ups and the automations that generate them.",
  },
];

export default function MarketStrip() {
  const [state, setState] = useState<MarketState | null>(null);
  useEffect(() => {
    setState(loadMarketState());
  }, []);
  if (!state) return null;
  const n = dashboardNumbers(state, Date.now());
  const stats: [string, number][] = [
    ["Active campaigns", n.activeCampaigns],
    ["Applicants waiting", n.applicantsWaiting],
    ["Follow-ups due", n.followUpsDue],
  ];
  return (
    <section style={stripStyle} aria-label="Local gigs preview">
      <h2 style={{ marginTop: 0 }}>Your local-gigs tools — preview</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {stats.map(([label, v]) => (
          <div
            key={label}
            style={{
              border: "1px solid #3d2a6e",
              borderRadius: 10,
              padding: "12px 14px",
              background: "#150e30",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
            <div style={{ color: "#b3a6e0", fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            style={{
              display: "block",
              border: "1px solid #3d2a6e",
              borderRadius: 10,
              padding: "14px 16px",
              background: "#150e30",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>
              {t.title}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 4,
                color: "#ddd0ff",
                fontSize: 14,
              }}
            >
              {t.detail}
            </span>
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                fontWeight: 700,
                fontSize: 13.5,
                color: "#c084fc",
              }}
            >
              Open →
            </span>
          </Link>
        ))}
      </div>
      <p style={{ color: "#b3a6e0", fontSize: 14, marginBottom: 0 }}>
        A preview that runs on this device with sample data — see
        “Where things stand” below for exactly what is and is not live.
      </p>
    </section>
  );
}
