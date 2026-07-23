"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard, ProductModal, CartToast } from "../components/ProductUI";
import { useCart } from "../components/CartProvider";

const PAGE_SIZE = 48;

type SortKey = "default" | "price-asc" | "price-desc" | "thc-desc" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "thc-desc", label: "THC: high to low" },
  { key: "name", label: "Name: A–Z" },
];

export default function MenuBrowser({
  products,
  categoryName,
}: {
  products: Product[];
  categoryName: string;
}) {
  const [sub, setSub] = useState<string>("all");
  const [dom, setDom] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Product | null>(null);
  const { add } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  // sub-categories present in this category, e.g. "3.5g Flower", "AIO"
  const subs = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (!p.proteusCategory) continue;
      m.set(p.proteusCategory, (m.get(p.proteusCategory) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  const doms = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (!p.dominance) continue;
      m.set(p.dominance, (m.get(p.dominance) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  // 162 brands across the catalog — far too many chips to show at once, so the
  // most-stocked lead and the rest hide behind a toggle.
  const brands = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (!p.brand) continue;
      m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = products.filter(
      (p) =>
        (sub === "all" || p.proteusCategory === sub) &&
        (dom === "all" || p.dominance === dom) &&
        (brand === "all" || p.brand === brand) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (p.strain ?? "").toLowerCase().includes(q))
    );

    const priceOf = (p: Product) => p.salePrice ?? p.price ?? Infinity;
    const sorted = [...rows];
    if (sort === "price-asc") sorted.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") sorted.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === "thc-desc") sorted.sort((a, b) => (b.lab?.thc ?? -1) - (a.lab?.thc ?? -1));
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, sub, dom, brand, query, sort]);

  const visible = filtered.slice(0, limit);
  const hasFilters = sub !== "all" || dom !== "all" || brand !== "all" || query.trim() !== "";

  function clearAll() {
    setSub("all");
    setDom("all");
    setBrand("all");
    setQuery("");
  }

  function addToCart(p: Product) {
    add(p);
    setToast(`${p.name} — added to your list`);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // reset paging when filters change
  useEffect(() => setLimit(PAGE_SIZE), [sub, dom, brand, query, sort]);

  return (
    <>
      <div className="toolbar">
        <div className="searchbox">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${categoryName.toLowerCase()}…`}
            aria-label={`Search ${categoryName}`}
          />
        </div>

        {subs.length > 1 && (
          <label className="field">
            <span className="field-label">Type</span>
            <select value={sub} onChange={(e) => setSub(e.target.value)}>
              <option value="all">All types</option>
              {subs.map(([name, n]) => (
                <option key={name} value={name}>
                  {name} ({n})
                </option>
              ))}
            </select>
          </label>
        )}

        {doms.length > 0 && (
          <label className="field">
            <span className="field-label">Effect</span>
            <select value={dom} onChange={(e) => setDom(e.target.value)}>
              <option value="all">Any effect</option>
              {doms.map(([name, n]) => (
                <option key={name} value={name}>
                  {name} ({n})
                </option>
              ))}
            </select>
          </label>
        )}

        {brands.length > 1 && (
          <label className="field">
            <span className="field-label">Brand</span>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="all">All brands</option>
              {brands.map(([name, n]) => (
                <option key={name} value={name}>
                  {name} ({n})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span className="field-label">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="resultbar">
        <p className="filter-count">
          <b>{filtered.length.toLocaleString()}</b>{" "}
          {filtered.length === 1 ? "product" : "products"} in {categoryName}
        </p>

        {hasFilters && (
          <div className="active-pills">
            {query.trim() && (
              <button className="pill" onClick={() => setQuery("")}>
                “{query.trim()}” <i>✕</i>
              </button>
            )}
            {sub !== "all" && (
              <button className="pill" onClick={() => setSub("all")}>
                {sub} <i>✕</i>
              </button>
            )}
            {dom !== "all" && (
              <button className={`pill dom-${dom.toLowerCase()}`} onClick={() => setDom("all")}>
                {dom} <i>✕</i>
              </button>
            )}
            {brand !== "all" && (
              <button className="pill" onClick={() => setBrand("all")}>
                {brand} <i>✕</i>
              </button>
            )}
            <button className="pill clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="prodgrid">
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} onOpen={setOpen} onAdd={addToCart} />
        ))}
      </div>

      {filtered.length > visible.length && (
        <div className="menu-more">
          <button className="btn ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Show more — {filtered.length - visible.length} more →
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="menu-note warn">Nothing matches those filters right now.</p>
      )}

      {open && <ProductModal p={open} onClose={() => setOpen(null)} onAdd={addToCart} />}
      <CartToast toast={toast} />
    </>
  );
}
