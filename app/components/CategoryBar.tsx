import { shopCategories } from "@/data/site";

/**
 * The green category banner that sits under the main nav (part of the fixed
 * header). Each link deep-links the JSCart shop to that category via the URL
 * hash the widget reads on load. Horizontally scrollable on small screens.
 *
 * NOTE: intentionally a <div role="navigation">, NOT a <nav> — the global
 * `nav{position:fixed}` rule would otherwise rip this out of the header.
 */
export default function CategoryBar() {
  return (
    <div className="catbar" role="navigation" aria-label="Shop by category">
      {shopCategories.map((c) => (
        <a key={c.label} href={c.href} className={c.href === "/deals" ? "catbar-deals" : undefined}>
          {c.label}
        </a>
      ))}
    </div>
  );
}
