"use client";

import { useEffect } from "react";

/**
 * Invites the shopper to say WHEN they're coming, right above "Proceed to Checkout".
 *
 * Proteus's checkout page already has a "Notes / Requests / Instructions" box, and
 * whatever goes in it lands on the real order in the POS where budtenders see it.
 * Nobody uses it, because nothing ever suggests they should — so the store has no
 * idea when anyone is arriving.
 *
 * That makes this the cheapest version of pickup scheduling we can actually build.
 * A real time-slot picker is not possible from our side: checkout leaves our site
 * for Proteus, and the handoff carries no time field (see ProteusShop — the POST
 * has cartData, shopType, locationId, authToken and little else). A picker here
 * would collect a time that reached nobody. This points at a field that already
 * works instead.
 *
 * Deliberately NOT a promise. It says we'll know when to expect you — not that the
 * order will be ready by then. The store can't guarantee a ready-by time and the
 * site shouldn't imply one.
 *
 * Not shown on the kiosk: the shopper is standing in the building.
 *
 * The widget rebuilds its cart with `container.innerHTML = html` on every change,
 * which wipes anything we insert — hence the observer rather than a one-time
 * insert. Re-insertion is keyed on our own id, so it can't stack up.
 */
const HINT_ID = "hl-pickup-time-hint";

export default function PickupTimeHint() {
  useEffect(() => {
    const shop = document.getElementById("proteus_shop");
    if (!shop) return;

    const insert = () => {
      const summary = shop.querySelector(".proteus-cart-summary");
      if (!summary || summary.querySelector(`#${HINT_ID}`)) return;

      const btn = summary.querySelector(".proteus-checkout-btn");
      if (!btn) return;

      const hint = document.createElement("div");
      hint.id = HINT_ID;
      hint.className = "hl-pickup-hint";
      // textContent, not innerHTML — nothing here is user input, but this element
      // is rebuilt constantly next to cart data and shouldn't be an HTML sink.
      const strong = document.createElement("strong");
      strong.textContent = "Coming at a certain time?";
      const p = document.createElement("span");
      p.textContent =
        "Add it to the Notes box on the next page and we'll know when to expect you.";
      hint.append(strong, p);

      summary.insertBefore(hint, btn);
    };

    insert();
    const obs = new MutationObserver(insert);
    obs.observe(shop, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return null;
}
