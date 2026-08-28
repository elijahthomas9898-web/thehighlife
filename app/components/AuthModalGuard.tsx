"use client";

import { useEffect } from "react";

/**
 * Stops the sign-in modal closing while someone is typing in it.
 *
 * JSCart closes the auth modal on any click whose target IS the overlay:
 *
 *   overlay.addEventListener('click', (e) => {
 *     if (e.target === overlay) closeLoginModal();
 *   });
 *
 * That's the normal click-outside pattern, and it's correct for a real backdrop
 * click. The problem is what a browser does when the element under the cursor
 * disappears between press and release: the `click` is retargeted to the nearest
 * common ancestor — the overlay — and the modal closes even though the person
 * never touched the backdrop. Typing and backspacing cause exactly that, because
 * validation text appears and disappears under the fields and shifts the layout.
 * It fits the report: intermittent, and on both desktop and mobile.
 *
 * The fix is the standard one: a backdrop click only counts when the press AND
 * the release both happened on the backdrop. We can't edit their handler, so this
 * runs in the capture phase and stops the event before it reaches them — but only
 * in the case their handler gets wrong.
 *
 * Deliberately fails OPEN: if we haven't seen a pointerdown, or it was on the
 * overlay, the event passes through untouched and the modal closes as normal. The
 * only thing suppressed is a click whose press began INSIDE the dialog.
 */
const OVERLAY_IDS = ["proteus-login-modal", "proteus-product-modal"];

export default function AuthModalGuard() {
  useEffect(() => {
    // Where the most recent press started. null = unknown, so let clicks through.
    let pressedOnOverlay: boolean | null = null;

    const onPointerDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        pressedOnOverlay = null;
        return;
      }
      const overlay = target.closest?.(`#${OVERLAY_IDS.join(", #")}`);
      // Pressed the backdrop itself (not something inside it)?
      pressedOnOverlay = overlay ? target === overlay : null;
    };

    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.id || !OVERLAY_IDS.includes(target.id)) return;
      // The click is on the backdrop. Only genuine if the press was too.
      if (pressedOnOverlay === false) {
        // Press began inside the dialog — this is a retargeted click, not an
        // intent to dismiss. Keep the modal open.
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      pressedOnOverlay = null;
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return null;
}
