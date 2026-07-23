"use client";

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

  return (
    <nav id="nav">
      <a className="brand" href="/" aria-label={`${store.name} — home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/images/logo.png" alt={store.name} />
      </a>
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
      <div className="badge21">NY · 21+ Only</div>
    </nav>
  );
}
