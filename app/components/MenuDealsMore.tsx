"use client";

import { useEffect } from "react";

/**
 * On the menu, JSCart shows a "Today's Deals" carousel at the top. This injects a
 * "View All Deals →" button right after that carousel, linking to the full /deals
 * page. The widget re-renders its DOM on navigation/filter, so we re-inject on a
 * light interval and guard against duplicates. Menu-only (not used on /deals).
 */
export default function MenuDealsMore() {
  useEffect(() => {
    const ensure = () => {
      const section = document.querySelector("#proteus_shop .proteus-deals-section");
      if (!section) return;
      if (section.querySelector(".hl-deals-more")) return; // already injected
      const wrap = document.createElement("div");
      wrap.className = "hl-deals-more-wrap";
      const a = document.createElement("a");
      a.href = "/deals";
      a.className = "hl-deals-more";
      a.textContent = "View All Deals →";
      wrap.appendChild(a);
      section.appendChild(wrap);
    };
    ensure();
    const t = setInterval(ensure, 1000);
    return () => clearInterval(t);
  }, []);

  return null;
}
