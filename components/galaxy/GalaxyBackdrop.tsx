"use client";

import { useEffect, useRef } from "react";

/* The Galaxy backdrop: the six per-section WORLDS (scenery layers
 * below, styled in globals.css and cross-faded by SectionSync's
 * data-section on <body>) under a fixed star canvas with a slow
 * twinkle. All motion stops with prefers-reduced-motion — the
 * canvas then paints one static star field and never animates. */

type Star = { x: number; y: number; r: number; p: number; s: number };

export default function GalaxyBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    function seed() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const full = Math.min(170, Math.round((w * h) / 11000));
      const count = w <= 860 ? Math.round(full / 2) : full;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 0.9,
      }));
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(s.p + t / 1600 * s.s);
        ctx!.globalAlpha = Math.max(0.12, tw);
        ctx!.fillStyle = "#DCE6FF";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
    }

    seed();
    draw(0);
    const onResize = () => {
      seed();
      if (reduced) draw(0);
    };
    /* No twinkle work while the tab is hidden. */
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      {/* The six WORLDS — one photo layer per section, all in
       * the DOM at once. SectionSync stamps data-section on
       * <body>; globals.css fades the matching layer in over
       * 600ms so a tab click melts one world into the next.
       * Each layer's background (a generated photo in
       * public/worlds/<section>.jpg under a dark readability
       * gradient) lives in globals.css (.gx-world-*); the
       * container is fixed + overflow hidden, so the backdrops
       * can never widen the page. */}
      <div className="gx-worlds" aria-hidden="true">
        <div className="gx-world gx-world-today" />
        <div className="gx-world gx-world-brands" />
        <div className="gx-world gx-world-deals" />
        <div className="gx-world gx-world-studio" />
        <div className="gx-world gx-world-money" />
        <div className="gx-world gx-world-passport" />
      </div>
      <canvas
        ref={ref}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      />
    </>
  );
}
