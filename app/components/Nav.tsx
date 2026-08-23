"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { store } from "@/data/site";
import CategoryBar from "./CategoryBar";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/merch", label: "Merch" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // close the menu on route change, and lock scroll while it's open
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reflect the JSCart cart count in the header while the widget is on the page
  // (the shop / menu). Harmless elsewhere — getCartCount is simply absent, so the
  // badge just stays hidden.
  useEffect(() => {
    const read = () => {
      const w = window.ProteusWidget;
      if (w && typeof w.getCartCount === "function") {
        try {
          setCartCount(Number(w.getCartCount()) || 0);
        } catch {}
      }
    };
    read();
    const t = setInterval(read, 1500);
    return () => clearInterval(t);
  }, []);

  // JSCart owns login/accounts, and its widget only exists on /menu. So: if the
  // widget is present, open its login (or account, if already signed in); from
  // any other page, route to the shop with ?login=1 (ProteusShop opens it there).
  function openAccount() {
    const w = window.ProteusWidget;
    if (w && w.showLoginModal) {
      if (w.isAuthenticated && w.isAuthenticated()) w.showAccount?.();
      else w.showLoginModal();
      return;
    }
    window.location.href = "/menu?login=1";
  }

  // Same idea for the cart: open it in place if the widget is here, else route
  // to the shop and open it there (ProteusShop handles ?cart=1).
  function openCart() {
    const w = window.ProteusWidget;
    if (w && w.showCart) {
      w.showCart();
      return;
    }
    window.location.href = "/menu?cart=1";
  }

  return (
    <nav id="nav">
      {/* top row: logo, links, sign-in */}
      <div className="nav-main">
        <a className="brand" href="/" aria-label={`${store.name} — home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/images/logo.png" alt={store.name} />
        </a>

        {/* desktop links */}
        <div className="navlinks">
          {LINKS.map((l) => {
            const on = path === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                className={on ? "on" : undefined}
                aria-current={on ? "page" : undefined}
              >
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="nav-right">
          <button
            className="nav-cart"
            onClick={openCart}
            aria-label={cartCount ? `View cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "View cart"}
          >
            Cart
            {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}
          </button>
          <button className="nav-signin" onClick={openAccount}>
            Sign In
          </button>
          <div className="badge21">NY · 21+ Only</div>
          {/* hamburger — only shows on small screens (CSS) */}
          <button
            className={`nav-burger${open ? " open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* second row: green category banner, deep-links into the JSCart shop */}
      <CategoryBar />

      {/* mobile drawer */}
      <div className={`nav-drawer${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
        {LINKS.map((l) => {
          const on = path === l.href;
          return (
            <a key={l.href} href={l.href} className={on ? "on" : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          );
        })}
        <button
          className="drawer-signin"
          onClick={() => {
            setOpen(false);
            openCart();
          }}
        >
          View Cart{cartCount > 0 ? ` (${cartCount})` : ""}
        </button>
        <button
          className="drawer-signin"
          onClick={() => {
            setOpen(false);
            openAccount();
          }}
        >
          Sign In
        </button>
      </div>
      {open && <div className="nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
    </nav>
  );
}
