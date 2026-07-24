"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { store } from "@/data/site";

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

  // close the menu on route change, and lock scroll while it's open
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav id="nav">
      <a className="brand" href="/" aria-label={`${store.name} — home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/images/logo.png" alt={store.name} />
      </a>

      {/* desktop links */}
      <div className="navlinks">
        {LINKS.map((l) => {
          const on = path === l.href;
          return (
            <a key={l.href} href={l.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
              {l.label}
            </a>
          );
        })}
      </div>

      <div className="nav-right">
        <div className="badge21">NY · 21+ Only</div>
        {/* hamburger — only shows on small screens (CSS) */}
        <button
          className={`nav-burger${open ? " open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

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
      </div>
      {open && <div className="nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
    </nav>
  );
}
