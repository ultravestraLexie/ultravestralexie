"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* SectionSync — the worlds switch. Derives the current Galaxy
 * section from the pathname and stamps data-section on <body>
 * (GalaxyBackdrop's scenery layers key off it and cross-fade)
 * and on .uv-shell (globals.css keys the --gx-accent variables
 * off it, so nav + chrome recolor with the world). It also
 * stamps data-visited on .gx-worlds with every section seen
 * this session: globals.css only applies a world's photo once
 * its section is visited or active, so first paint downloads
 * just one world and visited worlds stay loaded for instant
 * crossfades. Brand dossier pages (/brands/[id]) belong to the
 * Brands world; the public Passport (/p/[slug]) belongs to the
 * Passport world; anything else falls back to Today. Renders
 * nothing. */

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
    const worlds = document.querySelector(".gx-worlds");
    if (worlds) {
      const visited = new Set(
        (worlds.getAttribute("data-visited") ?? "").split(" ").filter(Boolean)
      );
      if (!visited.has(section)) {
        visited.add(section);
        worlds.setAttribute("data-visited", [...visited].join(" "));
      }
    }
  }, [section]);

  return null;
}
