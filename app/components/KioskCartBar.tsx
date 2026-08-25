"use client";

import { useEffect, useState } from "react";

/**
 * Sticky "View Cart" bar pinned to the bottom of the kiosk.
 *
 * The kiosk's cart button lives in the widget header, so a shopper who has scrolled
 * down a long product list has to scroll all the way back up just to check out.
 * This puts the cart one tap away from anywhere on the page.
 *
 * Appears only once something is in the cart, and hides itself while any of the
 * widget's own overlays are up (the cart drawer, checkout, the login modal, the
 * kiosk inactivity prompt) so it never floats on top of them.
 *
 * Rendered as normal React outside #proteus_shop — the kiosk runtime pins that
 * container to the viewport at z-index 2147483000, so this sits above it but below
 * the kiosk overlays at 2147483600 (see globals.css).
 */
export default function KioskCartBar() {
  const [count, setCount] = useState(0);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const read = () => {
      const w = window.ProteusWidget;
      if (w && typeof w.getCartCount === "function") {
        try {
          setCount(Number(w.getCartCount()) || 0);
        } catch {}
      }
      // Any visible widget overlay means we're not the top layer any more.
      const overlays = document.querySelectorAll(
        ".proteus-modal-overlay, .proteus-kiosk-overlay, .proteus-cart-overlay",
      );
      let anyUp = false;
      overlays.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display !== "none" && cs.visibility !== "hidden") anyUp = true;
      });
      setCovered(anyUp);
    };
    read();
    const t = setInterval(read, 800);
    return () => clearInterval(t);
  }, []);

  if (count < 1 || covered) return null;

  return (
    <div className="kiosk-cartbar" role="region" aria-label="Cart summary">
      <span className="kiosk-cartbar-count">{count}</span>
      <span className="kiosk-cartbar-text">
        {count === 1 ? "item in your cart" : "items in your cart"}
      </span>
      <button
        type="button"
        className="kiosk-cartbar-btn"
        onClick={() => window.ProteusWidget?.showCart?.()}
      >
        View Cart →
      </button>
    </div>
  );
}
