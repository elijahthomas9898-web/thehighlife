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

      const id = m[1];

      // Block the widget's in-place filter and go to the menu filtered to this
      // deal. IMPORTANT: the coupon filter keys on the NUMERIC coupon id (the same
      // arg the card's _filterByCoupon uses). The slug only sets a label and does
      // NOT actually filter the products — so pass the id straight through.
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = `/menu#view=products&coupon=${id}`;
    };

    document.addEventListener("click", onClick, true); // capture: runs before inline onclick
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
