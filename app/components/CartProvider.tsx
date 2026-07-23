"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { CANNABIS_TAX_RATE } from "@/data/site";

/**
 * A shopping LIST, not an order.
 *
 * Nothing here is transmitted anywhere — it lives in the visitor's own browser
 * so they can walk in and read it off to a budtender. Persisted to
 * localStorage so it survives moving between the menu, deals and category
 * pages.
 */

export type CartLine = { product: Product; qty: number };

type CartApi = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** NYS cannabis retail tax on the subtotal */
  tax: number;
  /** subtotal + tax */
  total: number;
  add: (p: Product) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const KEY = "hl_cart";
const CartCtx = createContext<CartApi | null>(null);

export function useCart(): CartApi {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Price a customer would actually pay, before the register applies coupons. */
function unitPrice(p: Product): number {
  return p.salePrice ?? p.price ?? 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // restore once on mount — starting empty keeps server and client markup identical
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* corrupt or unavailable storage — start empty */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* quota or privacy mode — the cart just won't persist */
    }
  }, [lines, loaded]);

  const add = useCallback((p: Product) => {
    setLines((cur) => {
      const i = cur.findIndex((l) => l.product.id === p.id);
      if (i === -1) return [...cur, { product: p, qty: 1 }];
      const next = [...cur];
      const max = p.stockCount ?? 99;
      next[i] = { ...next[i], qty: Math.min(next[i].qty + 1, max) };
      return next;
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((cur) =>
      qty <= 0
        ? cur.filter((l) => l.product.id !== id)
        : cur.map((l) =>
            l.product.id === id
              ? { ...l, qty: Math.min(qty, l.product.stockCount ?? 99) }
              : l
          )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((cur) => cur.filter((l) => l.product.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + unitPrice(l.product) * l.qty, 0);
    // round to cents so tax + subtotal always equals the displayed total
    const tax = Math.round(subtotal * CANNABIS_TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { lines, count, subtotal, tax, total, add, setQty, remove, clear, open, setOpen };
  }, [lines, add, setQty, remove, clear, open]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
