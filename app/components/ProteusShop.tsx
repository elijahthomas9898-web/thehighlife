"use client";

import { useEffect, useRef } from "react";

/**
 * Embeds Proteus's JSCart widget (the store's real cart / checkout / delivery /
 * ID-upload / accounts) inside our custom site. The widget is a self-contained
 * script that mounts into #proteus_shop and runs its own SPA — we just load it
 * and call ProteusWidget.init(). React never touches the div's children, so the
 * widget's DOM and React don't fight.
 *
 * This is THE shop: browse, cart, checkout, accounts, pickup/delivery. Skinned
 * to the brand via the `#proteus_shop` rules in globals.css.
 * Recipe reverse-engineered from the live embed on thehighlifeny.com/shop.
 */
const WIDGET_SRC = "https://cart.proteus420.com/highlife/cart-widget.js.cfm?v=4";

// The widget attaches a global; it's untyped.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProteusWidget?: any;
  }
}

export default function ProteusShop() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // guard React 18/19 StrictMode double-run
    started.current = true;

    const init = () => {
      if (!window.ProteusWidget) return;
      window.ProteusWidget.init({
        client: "highlife",
        mode: "full",
        containerId: "proteus_shop",
        showCategories: true,
        showSearch: true,
        showBrandFilter: true,
        showSort: true,
        theme: "dark", // brand skin lives in globals.css (#proteus_shop)
        headerTitle: "Shop The High Life",
        logoImage: "",
      });
    };

    if (window.ProteusWidget) {
      init();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    if (script) {
      script.addEventListener("load", init);
      return;
    }
    script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  return <div id="proteus_shop" className="proteus-full-container" />;
}
