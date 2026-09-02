"use client";

import { useEffect } from "react";

/**
 * Stops the quantity stepper going past what we actually have.
 *
 * JSCart's card stepper is hardcoded and never consults inventory:
 *
 *     _cardIncrementQty(productId) {
 *       let val = parseInt(input.value) || 1;
 *       if (val < 99) input.value = val + 1;   // stock never checked
 *     }
 *
 * and the input renders `min="1" max="99"` on every product regardless of stock.
 * So a customer could put 12 of something we have 4 of and only find out at the
 * counter.
 *
 * The number is already in the API responses the widget itself fetches
 * (`inventory` on every product), so this reads them as they go past rather than
 * making its own requests. No extra network cost, and the cap cannot drift from
 * what the shop is showing.
 *
 * The cap is SILENT — no count is displayed on the card. Someone who tries to go
 * past the stock just finds the + button stops.
 */

/** Stock by product id, filled from whatever the widget fetches. */
const stock = new Map<string, number>();

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
 * The third nests them a level deeper and is what a CATEGORY CLICK returns. Miss
 * it and the cap silently stops applying the moment someone browses a category,
 * which is most of the time.
 */
function collect(payload: ApiPayload): ApiProduct[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.products?.length) return payload.products;
  if (payload?.product) return [payload.product];
  if (payload?.categories?.length) return payload.categories.flatMap((c) => c?.products ?? []);
  return [];
}

function remember(payload: unknown) {
  for (const p of collect(payload as ApiPayload)) {
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

    // ── stamp the real ceiling onto every stepper on screen ───────────────
    const apply = () => {
      const inputs = shop.querySelectorAll<HTMLInputElement>('input[id^="proteus-card-qty-"]');
      for (const input of Array.from(inputs)) {
        const qty = stock.get(input.id.replace("proteus-card-qty-", ""));
        if (qty === undefined || qty <= 0) continue; // unknown — leave JSCart's default

        input.max = String(qty);
        input.dataset.hlStock = String(qty);

        // A re-render can restore a value from before the cap was known.
        if ((parseInt(input.value, 10) || 1) > qty) input.value = String(qty);
      }
    };

    // ── learn the stock numbers from the widget's own traffic ─────────────
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

    // ── make the + button respect it ──────────────────────────────────────
    // The widget's handler caps at 99. It's a public method, so replace it rather
    // than fighting the DOM: JSCart's onclick attributes keep working and there is
    // no second code path to keep in sync.
    type Widget = { _cardIncrementQty?: (id: number | string) => void };
    const originalIncrement = (window.ProteusWidget as Widget | undefined)?._cardIncrementQty;

    const install = () => {
      const widget = window.ProteusWidget as Widget | undefined;
      if (!widget) return false;
      if ((widget._cardIncrementQty as { __hlCapped?: boolean })?.__hlCapped) return true;

      const capped = (productId: number | string) => {
        const input = document.getElementById(
          "proteus-card-qty-" + productId,
        ) as HTMLInputElement | null;
        if (!input) return;
        const max = Number(input.dataset.hlStock);
        const val = parseInt(input.value, 10) || 1;
        // Unknown stock falls back to JSCart's own 99 — never block a sale over a
        // number we do not have.
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
