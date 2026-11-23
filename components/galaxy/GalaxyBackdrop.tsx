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
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(170, Math.round((w * h) / 11000));
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
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    seed();
    draw(0);
    const onResize = () => {
      seed();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* The six WORLDS — one scenery layer per section, all in
       * the DOM at once. SectionSync stamps data-section on
       * <body>; globals.css fades the matching layer in over
       * 600ms so a tab click melts one world into the next.
       * CSS gradients + inline SVG only; the container is
       * fixed + overflow hidden, so scenery can never widen
       * the page. Nebula washes live in globals.css (.gx-world-*). */}
      <div className="gx-worlds" aria-hidden="true">
        <div className="gx-world gx-world-today">
          <div className="gx-sc-horizon" />
        </div>
        <div className="gx-world gx-world-brands">
          <div className="gx-sc-planet gx-sc-planet-violet" />
        </div>
        <div className="gx-world gx-world-deals">
          <div className="gx-sc-ribbon gx-sc-ribbon-1" />
          <div className="gx-sc-ribbon gx-sc-ribbon-2" />
          <svg className="gx-sc-spire" viewBox="0 0 200 300" preserveAspectRatio="xMaxYMax meet" focusable="false">
            <polygon points="118,18 132,120 148,300 92,300 106,120" fill="#07271e" />
            <polygon points="122,18 132,120 140,300 118,300 112,110" fill="#0a3527" />
            <polygon points="160,84 170,170 182,300 140,300 150,168" fill="#06231b" />
            <polygon points="66,110 76,190 88,300 40,300 54,188" fill="#06231b" />
            <polygon points="118,18 124,66 112,66" fill="#2eea8c" opacity="0.35" />
            <polygon points="160,84 165,118 156,118" fill="#2eea8c" opacity="0.25" />
          </svg>
        </div>
        <div className="gx-world gx-world-studio">
          <svg className="gx-sc-ringed" viewBox="0 0 200 200" focusable="false">
            <defs>
              <radialGradient id="gxRingedPlanet" cx="0.36" cy="0.34" r="0.85">
                <stop offset="0" stopColor="#ffd7f6" />
                <stop offset="0.38" stopColor="#ff8ae8" />
                <stop offset="0.72" stopColor="#e843c8" />
                <stop offset="1" stopColor="#8b2a86" stopOpacity="0.25" />
              </radialGradient>
            </defs>
            <ellipse cx="100" cy="100" rx="86" ry="23" transform="rotate(-18 100 100)" fill="none" stroke="rgba(255, 150, 240, 0.4)" strokeWidth="6" />
            <circle cx="100" cy="100" r="47" fill="url(#gxRingedPlanet)" />
            <ellipse cx="100" cy="100" rx="86" ry="23" transform="rotate(-18 100 100)" fill="none" stroke="rgba(255, 190, 248, 0.22)" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="gx-world gx-world-money">
          <div className="gx-sc-swirl" />
          <div className="gx-sc-core" />
        </div>
        <div className="gx-world gx-world-passport">
          <div className="gx-sc-planet gx-sc-planet-azure" />
        </div>
      </div>
      <canvas
        ref={ref}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      />
    </>
  );
}
