import ScriptStudio from "@/components/ScriptStudio";

/* VIDEO STRATEGY & SCRIPT STUDIO — the strategy is the five-beat
 * structure every converting creator video follows. The Studio turns a
 * creator's own product facts into a complete, filmable script in
 * that structure. */

const panel: React.CSSProperties = {
  border: "1px solid #7e22ce",
  background: "rgba(26,8,54,0.78)",
  borderRadius: 22,
  padding: "24px 26px 26px",
  boxShadow: "0 0 30px rgba(168,85,247,0.22)",
};

const BEATS: [string, string][] = [
  ["1 · Hook", "Earn the next 30 seconds in the first 3. Product in frame, payoff spoken, text for the muted viewer."],
  ["2 · Demonstration", "The product working, key moment uncut. This is where belief is built."],
  ["3 · Story", "Problem → attempt → result. One idea, told like it happened to you — because it did."],
  ["4 · Proof + honest line", "The result on screen, then one real limitation. Proof sells; honesty makes it stick."],
  ["5 · CTA", "One action, at the moment of peak belief, with the product on screen."],
];

export default function StudioPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      <section style={{ textAlign: "center", paddingTop: 8 }}>
        <span style={{ background: "#2e1065", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>VIDEO STRATEGY &amp; SCRIPT STUDIO</span>
        <h1 className="wow-title" style={{ fontSize: 42, margin: "12px 0 6px", fontWeight: 800 }}>Build the script before you film</h1>
        <p style={{ color: "#ddd0ff", margin: "0 auto", maxWidth: 640, fontSize: 16 }}>
          Converting videos are built, not improvised. Five beats, in order — give the Studio your product
          facts and it writes the full script in that structure.
        </p>
      </section>

      <section style={panel}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {BEATS.map(([name, desc]) => (
            <p key={name} style={{ margin: 0, fontSize: 15.5 }}>
              <strong style={{ color: "#f0abfc" }}>{name}:</strong> <span style={{ color: "#f3e8ff" }}>{desc}</span>
            </p>
          ))}
        </div>
        <ScriptStudio />
      </section>
    </div>
  );
}
