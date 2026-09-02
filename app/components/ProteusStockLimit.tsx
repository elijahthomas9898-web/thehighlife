"use client";

import { useEffect } from "react";

/**
 * Shows how many of a product are actually in stock, and stops the quantity
 * stepper going past it.
 *
 * JSCart's card stepper is hardcoded:
 *
 *     _cardIncrementQty(productId) {
 *       let val = parseInt(input.value) || 1;
 *       if (val < 99) input.value = val + 1;   // stock never consulted
 *     }
 *
 * and the input is rendered `min="1" max="99"` regardless of inventory. So a
 * customer can put 12 of something we have 4 of, and only finds out later — which
 * is exactly the kind of thing that turns a sale into a phone call.
 *
 * The stock number is already in the API responses the widget itself fetches
 * (`inventory` on every product — verified present on 25/25), so this reads them
 * as they go past rather than making its own requests. No extra network cost, and
 * the numbers can't drift from what the shop is showing.
 *
 * Three parts:
 *   1. observe fetch, build id -> inventory
 *   2. on every render, stamp the real `max` on each stepper and label the card
 *   3. wrap the widget's own increment so the + button respects it
 */

/** Stock by product id, filled from whatever the widget fetches. */
const stock = new Map<string, number>();

/** Ids we've already labelled, so a re-render doesn't stack duplicate labels. */
const LABEL_CLASS = "hl-stock-note";

type ApiProduct = { id?: number | string; inventory?: number | string };

type ApiPayload =
  | ApiProduct[]
  | { products?: ApiProduct[]; product?: ApiProduct; categories?: { products?: ApiProduct[] }[] };

/**
 * Product lists arrive in three shapes depending on the call:
 *   action=products             -> { products: [...] }
 *   action=product              -> { product: {...} }
 *   action=products_by_category -> { categories: [ { products: [...] } ] }
 *
 * That third one is why counts appeared on the default view and then vanished the
 * moment you clicked a category: the products sit a level deeper and the shape
 * was never read.
 */
function collect(payload: ApiPayload): ApiProduct[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.products?.length) return payload.products;
  if (payload?.product) return [payload.product];
  if (payload?.categories?.length) return payload.categories.flatMap((c) => c?.products ?? []);
  return [];
}

function remember(payload: unknown) {
  const list = collect(payload as ApiPayload);

  for (const p of list) {
    if (!p || p.id === undefined || p.id === null) continue;
    const n = Number(p.inventory);
    // Only trust a real, finite count. Missing inventory must leave the card
    // alone rather than capping it at zero and blocking a sale.
    if (Number.isFinite(n) && n >= 0) stock.set(String(p.id), n);
  }
}

export default function ProteusStockLimit() {
  useEffect(() => {
    const shop = document.getElementById("proteus_shop");
    if (!shop) return;

    // ── 1. learn the stock numbers from the widget's own traffic ──────────
    const originalFetch = window.fetch;
    const patched: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      let url = "";
      try {
        url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      } catch {
        return response;
      }
      if (!/[?&]action=(products_by_category|products|product|related)(?=&|$)/.test(url)) {
        return response;
      }
      // Read a clone so the widget still gets an unconsumed body.
      response
        .clone()
        .json()
        .then((data) => {
          remember(data);
          apply();
        })
        .catch(() => {});
      return response;
    };
    window.fetch = patched;

    // ── 2. stamp the limit + label onto every card on screen ──────────────
    const apply = () => {
      const inputs = shop.querySelectorAll<HTMLInputElement>('input[id^="proteus-card-qty-"]');
      for (const input of Array.from(inputs)) {
        const id = input.id.replace("proteus-card-qty-", "");
        const qty = stock.get(id);
        if (qty === undefined) continue; // unknown stock — leave JSCart's default alone

        input.max = String(Math.max(1, qty));
        input.dataset.hlStock = String(qty);

        // Clamp anything already in the box (a re-render can restore an old value).
        const current = parseInt(input.value, 10) || 1;
        if (qty > 0 && current > qty) input.value = String(qty);

        const row = input.closest(".proteus-card-quickadd");
        if (!row || row.parentElement?.querySelector(`.${LABEL_CLASS}`)) continue;

        const note = document.createElement("div");
        note.className = LABEL_CLASS;
        if (qty <= 5) note.classList.add("is-low");
        // textContent, never innerHTML — this sits next to product data and
        // should not be an HTML sink.
        note.textContent = qty > 0 ? `${qty} in stock` : "Out of stock";
        row.parentElement?.insertBefore(note, row);
      }
    };

    // ── 3. make the + button respect it ───────────────────────────────────
    // The widget's own handler caps at 99. It's a public method, so replace it
    // rather than fighting the DOM: the onclick attributes keep working and there
    // is no second code path to keep in sync.
    type Widget = { _cardIncrementQty?: (id: number | string) => void };
    const w = window.ProteusWidget as Widget | undefined;
    const originalIncrement = w?._cardIncrementQty;

    const install = () => {
      const widget = window.ProteusWidget as Widget | undefined;
      if (!widget || (widget._cardIncrementQty as { __hlCapped?: boolean })?.__hlCapped) return false;
      const capped = (productId: number | string) => {
        const input = document.getElementById(
          "proteus-card-qty-" + productId,
        ) as HTMLInputElement | null;
        if (!input) return;
        const max = Number(input.dataset.hlStock ?? input.max ?? 99);
        const val = parseInt(input.value, 10) || 1;
        const ceiling = Number.isFinite(max) && max > 0 ? Math.min(max, 99) : 99;
        if (val < ceiling) input.value = String(val + 1);
      };
      (capped as { __hlCapped?: boolean }).__hlCapped = true;
      widget._cardIncrementQty = capped;
      return true;
    };

    // The widget may not have loaded yet; keep trying briefly, then stop.
    let tries = 0;
    const timer = setInterval(() => {
      if (install() || tries++ > 80) clearInterval(timer);
    }, 150);

    // Typing straight into the box bypasses the buttons entirely.
    const onInput = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (!el.id?.startsWith("proteus-card-qty-")) return;
      const max = Number(el.dataset.hlStock);
      if (!Number.isFinite(max) || max <= 0) return;
      if ((parseInt(el.value, 10) || 1) > max) el.value = String(max);
    };
    shop.addEventListener("input", onInput, true);

    // The widget rebuilds its grid on every filter, sort and page change.
    const obs = new MutationObserver(apply);
    obs.observe(shop, { childList: true, subtree: true });
    apply();

    return () => {
      obs.disconnect();
      shop.removeEventListener("input", onInput, true);
      clearInterval(timer);
      if (window.fetch === patched) window.fetch = originalFetch;
      const widget = window.ProteusWidget as Widget | undefined;
      if (widget && originalIncrement) widget._cardIncrementQty = originalIncrement;
    };
  }, []);

  return null;
}
