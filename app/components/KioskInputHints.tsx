"use client";

import { useEffect } from "react";

/**
 * Kiosk-only keyboard hints for JSCart's quick/guest checkout fields.
 *
 * The widget renders the quick-checkout phone as a plain text input, so an Android
 * tablet pops a full QWERTY keyboard for what is a 10-digit number. Setting
 * inputMode gets the numeric keypad instead — the difference between a two-tap
 * entry and a fumble at the counter.
 *
 * The widget builds and destroys this modal itself, so we re-apply on a light
 * interval rather than once (same approach as MenuDealsMore). Setting inputMode to
 * the value it already has is a no-op, so this is cheap and can't fight the widget.
 */
const HINTS: [string, string][] = [
  ["proteus-quick-phone", "tel"],
  ["proteus-quick-birthdate", "numeric"],
  ["proteus-guest-phone", "tel"],
];

export default function KioskInputHints() {
  useEffect(() => {
    const apply = () => {
      for (const [id, mode] of HINTS) {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && el.inputMode !== mode) el.inputMode = mode;
      }
    };
    apply();
    const t = setInterval(apply, 1000);
    return () => clearInterval(t);
  }, []);

  return null;
}
