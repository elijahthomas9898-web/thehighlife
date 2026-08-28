"use client";

import { useEffect } from "react";

/**
 * Publishes the fixed header's real height as `--header-h` on :root.
 *
 * The header is `position: fixed`, so anything that must start below it needs to
 * know how tall it is — but that height changes with the breakpoint (the logo and
 * nav padding shrink under 560px) and would change again with any header edit.
 * Hardcoding the number meant the event banner sat 12px behind the nav on desktop
 * and 5px behind on mobile.
 *
 * CSS carries a sensible default so the first paint is already close; this then
 * corrects it from the DOM and keeps it right on resize/rotate.
 */
export default function HeaderOffset() {
  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return;

    const apply = () => {
      const h = Math.round(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--header-h", `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}
