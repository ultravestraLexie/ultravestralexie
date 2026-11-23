"use client";

import { useEffect, useRef } from "react";
import { I, Icon } from "./icons";

export { I, Icon };

/* Shared Galaxy UI primitives: the modal sheet, the toast, and
 * clipboard — one implementation for every view (the prototype's
 * sheet + toast pattern). */

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("gx-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "gx-toast";
    el.className = "gx-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el?.classList.remove("show"), 3200);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** The one shooting star: fired only when a deal is marked paid. */
export function shootingStar() {
  if (typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.className = "gx-shooting-star";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open ]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className="gx-sheet"
      aria-label={title}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      onClose={onClose}
    >
      <div className="gx-sheet-inner">
        <div className="gx-sheet-head">
          <div>
            <h2>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          <button type="button" className="gx-icon-btn" onClick={onClose} aria-label="Close">
            <Icon html={I.close} size={16} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
