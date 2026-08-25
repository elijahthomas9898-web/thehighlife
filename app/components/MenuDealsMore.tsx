"use client";

import { useEffect } from "react";

/**
 * Adds a "View All Deals" button right after JSCart's Today's Deals carousel.
 *
 * Two modes, because the right destination differs:
 *  - website (/menu): links to our /deals page.
 *  - kiosk: must NOT navigate — leaving /kiosk drops out of kiosk mode. Instead it
 *    calls ProteusWidget.showOnSale(), the widget's own on-sale view, which is what
 *    its native "On Sale" chips use.
 *
 * The widget re-renders its DOM on navigation/filter, so we re-inject on a light
 * interval and guard against duplicates.
 */
export default function MenuDealsMore({ kiosk = false }: { kiosk?: boolean } = {}) {
  useEffect(() => {
    const ensure = () => {
      const section = document.querySelector("#proteus_shop .proteus-deals-section");
      if (!section) return;
      if (section.querySelector(".hl-deals-more")) return; // already injected

      const wrap = document.createElement("div");
      wrap.className = "hl-deals-more-wrap";

      if (kiosk) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hl-deals-more";
        btn.textContent = "View All Deals →";
        btn.addEventListener("click", () => {
          window.ProteusWidget?.showOnSale?.();
        });
        wrap.appendChild(btn);
      } else {
        const a = document.createElement("a");
        a.href = "/deals";
        a.className = "hl-deals-more";
        a.textContent = "View All Deals →";
        wrap.appendChild(a);
      }

      section.appendChild(wrap);
    };
    ensure();
    const t = setInterval(ensure, 1000);
    return () => clearInterval(t);
  }, [kiosk]);

  return null;
}
