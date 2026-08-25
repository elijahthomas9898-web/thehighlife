"use client";

import { useEffect } from "react";

/**
 * Makes JSCart's quick/guest checkout fields workable on an in-store tablet.
 *
 * Two jobs, both about the on-screen keyboard:
 *
 * 1. Keypads, not QWERTY — set inputMode on the phone fields.
 *
 * 2. Typed birthdate. The widget renders birthdate as <input type="date">, which
 *    on Android throws up the OS calendar picker — miserable when you have to
 *    scroll back 30+ years. We swap it to a plain text field with an MM/DD/YYYY
 *    mask. The catch: submitQuickCheckout() reads the field raw and POSTs it to
 *    api_auth.cfm as `birthdate`, and a date input always yields YYYY-MM-DD — so
 *    we MUST hand the server that same ISO format. A capture-phase listener
 *    rewrites the value to ISO just before the widget's own handler reads it,
 *    then restores the friendly display on the next tick (the widget reads
 *    synchronously, so the restore can't race it).
 *
 * The widget builds and destroys this modal itself, so everything re-applies on a
 * light interval and is guarded against double-binding (same approach as
 * MenuDealsMore). Kiosk-only — rendered from /kiosk.
 */
const BD_ID = "proteus-quick-birthdate";
const MARK = "data-hl-typed";

const PHONE_HINTS: [string, "tel" | "numeric"][] = [
  ["proteus-quick-phone", "tel"],
  ["proteus-guest-phone", "tel"],
];

/** "12/25/1990" (or "12251990") -> "1990-12-25". null when it isn't a real date. */
function toISO(typed: string): string | null {
  const d = typed.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const mm = d.slice(0, 2);
  const dd = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  const m = Number(mm);
  const day = Number(dd);
  const y = Number(yyyy);
  if (m < 1 || m > 12 || day < 1 || day > 31) return null;
  if (y < 1900 || y > new Date().getFullYear()) return null;
  // Reject the likes of 02/31 — the Date would roll into March.
  const probe = new Date(y, m - 1, day);
  if (probe.getMonth() !== m - 1 || probe.getDate() !== day) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/** Digits in, slashes added as you go. */
function mask(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

export default function KioskInputHints() {
  useEffect(() => {
    const onType = (e: Event) => {
      const el = e.target as HTMLInputElement;
      const masked = mask(el.value);
      if (el.value !== masked) el.value = masked;
    };

    const apply = () => {
      for (const [id, mode] of PHONE_HINTS) {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && el.inputMode !== mode) el.inputMode = mode;
      }

      const bd = document.getElementById(BD_ID) as HTMLInputElement | null;
      if (bd && !bd.hasAttribute(MARK)) {
        bd.setAttribute(MARK, "1");
        bd.type = "text"; // drops the OS calendar picker
        bd.inputMode = "numeric";
        bd.placeholder = "MM/DD/YYYY";
        bd.maxLength = 10;
        bd.setAttribute("autocomplete", "bday");
        bd.value = "";
        bd.addEventListener("input", onType);
      }
    };

    // Runs before the submit button's inline onclick (capture phase), so the
    // widget reads an ISO date. Blocks submission on a malformed date and speaks
    // through the widget's own error element.
    const normalizeBeforeSubmit = (e: Event) => {
      const bd = document.getElementById(BD_ID) as HTMLInputElement | null;
      if (!bd || !bd.hasAttribute(MARK) || !bd.value.trim()) return;

      const iso = toISO(bd.value);
      if (iso) {
        const shown = bd.value;
        bd.value = iso;
        setTimeout(() => {
          if (bd.value === iso) bd.value = shown;
        }, 0);
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();
      const err = document.getElementById("proteus-quick-error");
      if (err) {
        err.textContent = "Enter your birthdate as MM/DD/YYYY.";
        (err as HTMLElement).style.display = "block";
      }
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("#proteus-quick-submit")) normalizeBeforeSubmit(e);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("#proteus-quick-panel")) normalizeBeforeSubmit(e);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    apply();
    const t = setInterval(apply, 1000);
    return () => {
      clearInterval(t);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
