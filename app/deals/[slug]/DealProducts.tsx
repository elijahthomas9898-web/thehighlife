"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductCard, ProductModal, CartToast } from "../../components/ProductUI";
import { useCart } from "../../components/CartProvider";

const PAGE_SIZE = 24;

export default function DealProducts({ products }: { products: Product[] }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Product | null>(null);
  const { add } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  function addToCart(p: Product) {
    add(p);
    setToast(`${p.name} — added to your list`);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const visible = products.slice(0, limit);

  return (
    <>
      <div className="prodgrid">
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} onOpen={setOpen} onAdd={addToCart} />
        ))}
      </div>

      {products.length > visible.length && (
        <div className="menu-more">
          <button className="btn ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Show more — {products.length - visible.length} more →
          </button>
        </div>
      )}

      {open && <ProductModal p={open} onClose={() => setOpen(null)} onAdd={addToCart} />}
      <CartToast toast={toast} />
    </>
  );
}
