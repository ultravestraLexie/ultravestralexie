"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* SectionSync — the worlds switch. Derives the current Galaxy
 * section from the pathname and stamps data-section on <body>
 * (GalaxyBackdrop's scenery layers key off it and cross-fade)
 * and on .uv-shell (globals.css keys the --gx-accent variables
 * off it, so nav + chrome recolor with the world). Brand dossier
 * pages (/brands/[id]) belong to the Brands world; the public
 * Passport (/p/[slug]) belongs to the Passport world; anything
 * else falls back to Today. Renders nothing. */

const SECTIONS = ["today", "brands", "deals", "studio", "money", "passport"];

export function sectionForPath(pathname: string): string {
  if (pathname.startsWith("/p/")) return "passport";
  for (const s of SECTIONS) {
    if (pathname === `/${s}` || pathname.startsWith(`/${s}/`)) return s;
  }
  return "today";
}

export default function SectionSync() {
  const pathname = usePathname() ?? "";
  const section = sectionForPath(pathname);

  useEffect(() => {
    document.body.dataset.section = section;
    document
      .querySelector(".uv-shell")
      ?.setAttribute("data-section", section);
  }, [section]);

  return null;
}
