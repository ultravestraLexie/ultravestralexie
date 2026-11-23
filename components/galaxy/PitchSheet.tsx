"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAP_LABEL,
  pitchText,
  type GalaxyBrand,
  type GalaxyProfile,
} from "@/lib/galaxy/core";
import { Icon, I, Sheet, copyText, toast } from "./ui";

/* The pitch writer — lives in Brands and in Today's pitch
 * actions. "Log as sent" creates the deal at stage Pitched via
 * the existing /api/deals route; the pitch itself is copied by
 * the creator into their own email/DM (UltraVestra does not send
 * outreach — the honest platform rule). */

export function PitchSheet({
  brand,
  profile,
  paidCount,
  open,
  onClose,
  onSent,
}: {
  brand: GalaxyBrand | null;
  profile: GalaxyProfile;
  paidCount: number;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (open && brand && seededFor !== brand.id) {
    const t = pitchText(profile, brand, paidCount);
    setSeededFor(brand.id);
    setSubject(t.subject);
    setBody(t.body);
    setAmount("");
  }
  if (!open && seededFor !== null) setSeededFor(null);
  if (!brand) return null;

  async function logSent() {
    if (!brand) return;
    setBusy(true);
    try {
      const cents = Math.round(parseFloat(amount));
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.name,
          stage: "pitched",
          compensationCents: Number.isFinite(cents) && cents > 0 ? cents * 100 : null,
        }),
      });
      if (res.ok) {
        toast(`Pitch to ${brand.name} logged in Deals.`);
        /* The new deal must show up in Deals / Today without a
         * manual reload — refresh the server data in place. */
        router.refresh();
        onSent();
        onClose();
      } else {
        toast("The pitch could not be logged. Please try again.");
      }
    } catch {
      toast("The pitch could not be logged. Please try again.");
    }
    setBusy(false);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Pitch ${brand.name}`}
      sub={`${brand.rate != null ? `${brand.rate}% commission, ` : ""}${CAP_LABEL[brand.cap].toLowerCase()}${brand.program ? `, ${brand.program}` : ""}`}
    >
      <label className="gx-field">
        <span>Subject</span>
        <input className="gx-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="gx-field">
        <span>Message</span>
        <textarea className="gx-input" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <label className="gx-field">
        <span>What the deal is worth, if you know ($)</span>
        <input
          className="gx-input"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          placeholder="Optional"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <div className="gx-sheet-actions">
        <button
          type="button"
          className="gx-btn"
          onClick={async () => {
            const ok = await copyText(`${subject}\n\n${body}`);
            toast(ok ? "Pitch copied — paste it into your email or DM." : "Copy failed.");
          }}
        >
          <Icon html={I.copy} size={15} /> Copy pitch
        </button>
        <span className="spacer" />
        <button type="button" className="gx-btn gx-btn-primary" disabled={busy} onClick={() => void logSent()}>
          Log as sent
        </button>
      </div>
    </Sheet>
  );
}
