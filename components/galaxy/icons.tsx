/* Galaxy icon set — plain SVG strings + a tiny renderer.
 * No "use client": safe in server and client components alike. */

export const I = {
  alert:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.6v4M8 11.2v.2" stroke-linecap="round"/></svg>',
  warn:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M8 2l6.5 11.5h-13z"/><path d="M8 6.5v3.2M8 11.6v.2" stroke-linecap="round"/></svg>',
  clock:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.4 1.6"/></svg>',
  check:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  close:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  copy:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2"/><path d="M11 5V3.8A1.8 1.8 0 009.2 2H3.8A1.8 1.8 0 002 3.8v5.4A1.8 1.8 0 003.8 11H5"/></svg>',
  ver:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.6l1.7 1.3 2.1-.1.6 2 1.7 1.3-.7 2 .7 2-1.7 1.3-.6 2-2.1-.1L8 14.4l-1.7-1.3-2.1.1-.6-2L1.9 9.9l.7-2-.7-2 1.7-1.3.6-2 2.1.1z"/><path d="M5.6 8.2l1.6 1.6 3.2-3.4" stroke-linecap="round"/></svg>',
  star:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8l-5.3 2.9 1.1-6-4.4-4.2 6-.8z"/></svg>',
  plus:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
};

export function Icon({ html, size = 16 }: { html: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", width: size, height: size, flex: "none" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
