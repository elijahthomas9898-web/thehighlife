"use client";

import { useEffect, useRef, useState } from "react";
import type { ShopDeal } from "@/lib/deals";

/**
 * Auto-advancing slideshow of the real deal tiles, for the homepage deals band.
 *
 * Deals are fetched on the server (see lib/deals.ts) and passed in, so this ships
 * no data-loading of its own — it just cycles what it's given. Each slide links to
 * that deal's products on the menu, using the same numeric-coupon hash the deals
 * page uses (the slug only sets a label; the id is what actually filters).
 *
 * Pauses on hover/focus so someone reading a tile isn't yanked off it, and honours
 * prefers-reduced-motion by not auto-advancing at all.
 */
const ROTATE_MS = 3000;
const DOTS = 10;

export default function DealsSlideshow({ deals }: { deals: ShopDeal[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  useEffect(() => {
    if (paused || reduced.current || deals.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => {
        const next = (i + 1) % deals.length;
        // Warm the one after, so the swap never shows an empty frame.
        const upcoming = deals[(next + 1) % deals.length]?.image;
        if (upcoming) {
          const pre = new Image();
          pre.src = upcoming;
        }
        return next;
      });
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, deals]);

  if (deals.length === 0) return null;

  const deal = deals[idx % deals.length];

  return (
    <div
      className="deals-show"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <a
        className="deals-show-tile"
        href={`/menu#view=products&coupon=${deal.id}`}
        aria-label={`Shop ${deal.name || deal.message || "this deal"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={String(deal.id)}
          src={deal.image}
          alt={deal.name || deal.message || "Deal"}
          loading="lazy"
          decoding="async"
        />
      </a>

      {/* There are ~36 deals — one dot each would be a smear. These are position
          markers: DOTS segments across the whole set, with the one covering the
          current slide lit. (Highlighting `i === idx` instead would leave nothing
          lit at all once the index passed the last dot.) */}
      <div className="deals-show-dots" aria-hidden="true">
        {Array.from({ length: Math.min(DOTS, deals.length) }, (_, i) => {
          const span = deals.length / Math.min(DOTS, deals.length);
          const active = Math.floor((idx % deals.length) / span) === i;
          return (
            <button
              key={i}
              type="button"
              className={active ? "on" : undefined}
              onClick={() => setIdx(Math.round(i * span))}
              tabIndex={-1}
            />
          );
        })}
      </div>
    </div>
  );
}
