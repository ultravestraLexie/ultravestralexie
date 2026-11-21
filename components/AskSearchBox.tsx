"use client";

import { useEffect, useRef, useState } from "react";

/* The Ask UltraVestra search box — a real search field with live
 * suggestions. As the creator types, it asks /api/suggest for matching
 * brand names and niches from the live database. Picking a suggestion
 * fills the box and runs the search. Without JavaScript the plain
 * textarea still submits the form exactly as before. */

interface Suggestion { kind: "brand" | "category"; label: string; value: string }

export default function AskSearchBox({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        const next: Suggestion[] = [
          ...(data.categories ?? []).map((c: { slug: string; name: string }) => ({ kind: "category" as const, label: `${c.name} brands`, value: `${c.name} brands with affiliate programs` })),
          ...(data.brands ?? []).map((b: { id: string; name: string }) => ({ kind: "brand" as const, label: b.name, value: b.name })),
        ];
        setSugs(next);
        setOpen(next.length > 0);
      } catch { /* suggestions are a bonus — the search itself never depends on them */ }
    }, 220);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (s: Suggestion) => {
    setValue(s.value);
    setOpen(false);
    const form = areaRef.current?.form;
    if (form) setTimeout(() => form.requestSubmit(), 30);
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <textarea
        ref={areaRef}
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => { if (sugs.length) setOpen(true); }}
        placeholder="Search brands, niches, commissions… try “uncapped beauty brands on Awin”"
        rows={3}
        style={{ width: "100%", borderRadius: 14, padding: "13px 16px", fontSize: 16.5 }}
      />
      {open && sugs.length > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 6, background: "#160636", border: "1px solid #a855f7", borderRadius: 14, overflow: "hidden", zIndex: 30, boxShadow: "0 12px 40px rgba(168,85,247,0.4)" }}>
          {sugs.map((s, i) => (
            <button
              key={`${s.kind}-${s.label}-${i}`}
              type="button"
              onClick={() => pick(s)}
              style={{ display: "flex", width: "100%", textAlign: "left", gap: 10, alignItems: "center", padding: "11px 16px", background: "transparent", border: "none", borderBottom: i < sugs.length - 1 ? "1px solid #3b1470" : "none", color: "#f3e8ff", fontSize: 15.5, cursor: "pointer" }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: s.kind === "brand" ? "#f0abfc" : "#67e8f9", border: "1px solid currentColor", borderRadius: 999, padding: "1px 8px" }}>{s.kind === "brand" ? "BRAND" : "NICHE"}</span>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
