"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard, ProductModal } from "./ProductUI";

/**
 * A browse-only product grid: cards + a detail modal, but NO cart. Adding to
 * cart and checkout happen in the JSCart shop (/menu) — the ProductCard/Modal
 * show a "Shop in the Menu" link instead of an add button when no `onAdd` is
 * given. Used by the deal pages and the merch page as marketing/browse surfaces
 * that funnel into the one real shop.
 */
export default function BrowseGrid({
  products,
  pageSize = 24,
  shopHref = "/menu",
}: {
  products: Product[];
  pageSize?: number;
  /** Where the product modal's "Shop in the Menu" link points. */
  shopHref?: string;
}) {
  const [limit, setLimit] = useState(pageSize);
  const [open, setOpen] = useState<Product | null>(null);

  const visible = products.slice(0, limit);

  return (
    <>
      <div className="prodgrid">
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} onOpen={setOpen} />
        ))}
      </div>

      {products.length > visible.length && (
        <div className="menu-more">
          <button className="btn ghost" onClick={() => setLimit((l) => l + pageSize)}>
            Show more — {products.length - visible.length} more →
          </button>
        </div>
      )}

      {open && <ProductModal p={open} onClose={() => setOpen(null)} shopHref={shopHref} />}
    </>
  );
}
