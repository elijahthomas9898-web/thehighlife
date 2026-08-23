"use client";

import { useEffect } from "react";

/**
 * On /deals we show ONLY JSCart's native deal cards (the product grid is hidden).
 * Each card's built-in click calls `ProteusWidget._filterByCoupon(<id>)`, which
 * filters the now-hidden grid in place — so nothing appears to happen.
 *
 * This bridge intercepts those clicks (capture phase, before the card's inline
 * onclick) and instead sends the shopper to the MENU filtered to that deal, where
 * the products are visible: /menu#view=products&coupon=<slug>. The card's numeric
 * coupon id maps 1:1 to getDeals().id, which carries the slug the hash expects.
 */
export default function DealsLinkBridge() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const card = t?.closest?.(".proteus-deal-card") as HTMLElement | null;
      if (!card || !card.closest(".deals-only")) return;

      const m = (card.getAttribute("onclick") || "").match(/_filterByCoupon\((\d+)\)/);
      if (!m) return;

      const id = Number(m[1]);
      let slug = "";
      try {
        const deals = window.ProteusWidget?.getDeals?.() ?? [];
        slug =
          deals.find((d: { id: number; slug: string }) => Number(d.id) === id)?.slug ?? "";
      } catch {
        /* fall back to the menu */
      }

      // block the widget's in-place filter and go to the menu view of this deal
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = slug
        ? `/menu#view=products&coupon=${encodeURIComponent(slug)}`
        : "/menu";
    };

    document.addEventListener("click", onClick, true); // capture: runs before inline onclick
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
