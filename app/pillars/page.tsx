import type { Metadata } from "next";
import NinePillars from "@/components/NinePillars";
import "./pillars.css";

// The Nine Galactic Pillars — public showcase page (not in
// GATED_PREFIXES, public by omission like / and /pricing). Its tool
// links lead into the existing gated features, which keep their own
// authentication and subscription checks untouched.

export const metadata: Metadata = {
  title: "UltraVestra — The Nine Galactic Pillars",
  description:
    "The nine essential functions of a successful creator business: Discovery, Intelligence, Relationships, Negotiation, Protection, Revenue, Growth, Performance, and Intelligence & Automation. One Creator Business. Infinite Possibilities.",
};

export default function PillarsPage() {
  return <NinePillars />;
}
