"use client";

import { useEffect, useRef } from "react";
import AccountLinkPrompt from "./AccountLinkPrompt";
import ProteusTextFix from "./ProteusTextFix";
import AuthModalGuard from "./AuthModalGuard";
import ProteusSearchFix from "./ProteusSearchFix";

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

/**
 * `kiosk` turns on JSCart's OWN kiosk runtime (a module already inside the
 * widget, off by default): full-screen takeover, an inactivity timeout that
 * resets the cart for the next customer, a reset after each order, a PIN-gated
 * staff exit, bigger touch targets, and orders flagged `kiosk` in Proteus.
 * Used by /kiosk for the in-store tablets. Requires mode "full", which we
 * already pass. `kioskTimeout` is in MINUTES.
 */
export default function ProteusShop({
  kiosk = false,
  kioskTimeout = 3,
}: {
  kiosk?: boolean;
  kioskTimeout?: number;
} = {}) {
  const started = useRef(false);

  // The site sets `scroll-behavior: smooth` on <html> (for homepage anchor
  // jumps). On this page the widget lazy-loads dozens of product images, and
  // each reflow restarts the in-flight smooth-scroll animation — which makes the
  // page feel frozen / impossible to scroll. Force instant scrolling while the
  // shop is mounted, and restore on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    if (started.current) return; // guard React 18/19 StrictMode double-run
    started.current = true;

    // If a nav button sent us here from another page (?login=1 or ?cart=1),
    // open the widget's login/account or cart once it's actually loaded.
    const maybeOpenAction = () => {
      let params: URLSearchParams;
      try {
        params = new URLSearchParams(location.search);
      } catch {
        return;
      }
      const wantLogin = params.get("login") === "1";
      const wantCart = params.get("cart") === "1";
      if (!wantLogin && !wantCart) return;
      let tries = 0;
      const go = () => {
        const w = window.ProteusWidget;
        // wait until the widget has actually loaded (brands present) before
        // acting — calling too early silently no-ops.
        const ready = w && w.getBrands && w.getBrands().length > 0;
        if (ready) {
          if (wantCart && w.showCart) {
            w.showCart();
          } else if (wantLogin && w.showLoginModal) {
            if (w.isAuthenticated && w.isAuthenticated()) w.showAccount?.();
            else w.showLoginModal();
          }
          params.delete("login"); // don't reopen on refresh
          params.delete("cart");
          const qs = params.toString();
          history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
          return;
        }
        if (tries++ < 60) setTimeout(go, 150);
      };
      go();
    };

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
        // Kiosk-only config. None of this changes how the public site behaves.
        //
        // quickCheckout: phone + birthdate. Nobody types an email and password
        //   standing at a tablet.
        // Guest/anonymous checkout is deliberately OFF — an unidentified order isn't
        //   something a licensed dispensary can take; every order ties to a customer.
        // collapseCategories reclaims the fixed 240px category sidebar into a drawer.
        //   JSCart added it for exactly this case: on a portrait kiosk that sidebar
        //   costs a third of the width and squeezes the grid down a column. The
        //   horizontal category chips stay on screen, so navigation isn't lost.
        ...(kiosk
          ? {
              kiosk: true,
              kioskTimeout,
              quickCheckout: true,
              collapseCategories: true,
            }
          : {}),
      });
      maybeOpenAction();
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

  return (
    <>
      {/* Both of these patch the widget's own DOM, so they live here and cover every
          route it runs on — /menu, /deals and /kiosk. */}
      {/* Repairs mojibake in JSCart's copy (their source file is double-encoded). */}
      <ProteusTextFix />
      {/* Keeps the sign-in modal from closing on a retargeted click while typing. */}
      <AuthModalGuard />
      {/* Corrects the 404 path JSCart uses for search suggestions. */}
      <ProteusSearchFix />
      {/* Offers a way forward when someone registers an email that already exists in
          Proteus from an in-store visit. */}
      <AccountLinkPrompt />
      <div id="proteus_shop" className="proteus-full-container" />
    </>
  );
}
