"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A horizontally-scrolling row that does NOT hijack vertical page scroll.
 * The page scrolls normally; this rail scrolls sideways on its own via swipe,
 * trackpad, keyboard, or the arrow buttons.
 */
export default function DealRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  /**
   * Scrolls the rail by one card.
   *
   * Deliberately NOT using `scrollBy({behavior:"smooth"})`: CSS scroll-snap
   * cancels smooth programmatic scrolling (scrollLeft simply never moves), and
   * some browsers ignore it regardless. Animating scrollLeft ourselves works
   * everywhere. Snapping is switched off for the duration so it can't fight
   * the tween, then restored so manual swiping still snaps.
   */
  function nudge(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;

    const card = el.querySelector(".deal") as HTMLElement | null;
    const step = card ? card.offsetWidth + 26 : el.clientWidth * 0.8;
    const from = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    const to = Math.max(0, Math.min(from + dir * step, max));
    if (Math.abs(to - from) < 1) return;

    const snap = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollLeft = to;
      el.style.scrollSnapType = snap;
      return;
    }

    const duration = 380;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      el.scrollLeft = from + (to - from) * ease(t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.style.scrollSnapType = snap;
        update();
      }
    };
    requestAnimationFrame(frame);
  }

  return (
    <div className="rail-wrap">
      <button
        className="rail-arrow left"
        onClick={() => nudge(-1)}
        disabled={atStart}
        aria-label="Scroll deals left"
      >
        ‹
      </button>

      <div className="track" ref={ref} tabIndex={0} aria-label="Deals, scroll sideways">
        {children}
      </div>

      <button
        className="rail-arrow right"
        onClick={() => nudge(1)}
        disabled={atEnd}
        aria-label="Scroll deals right"
      >
        ›
      </button>
    </div>
  );
}
