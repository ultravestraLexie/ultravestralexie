/** Tailwind — Phase 1 Build 2b.
 *
 * The newest screens (Revenue, Growth Center, Deals, Planner, …) are
 * written in Tailwind utilities, but Tailwind was never installed, so
 * those classes generated no CSS. This config generates the utility
 * layer ONLY:
 *
 * - Preflight is DISABLED on purpose. app/globals.css already carries
 *   the app's own global rules (box-sizing, body, button padding) for
 *   the 50+ existing screens; Tailwind's reset would strip those and
 *   regress every older page. Utilities are class-scoped, so they fix
 *   the Tailwind-written screens without touching anything else.
 * - No theme overrides: the screens use the default palette and
 *   arbitrary values (bg-[#111827], tracking-[.35em]), which the JIT
 *   compiler generates from the default theme as-is.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
