"use client";

import { useEffect } from "react";
import { LIMITS, formatAmount, tally, type Bucket, type CartLine } from "@/lib/limits";

/**
 * Shows how much of New York's purchase limit a cart uses: 3 oz (85 g) of
 * cannabis, 24 g of concentrated cannabis.
 *
 * ── Warning only, on purpose ─────────────────────────────────────────────────
 * Proteus now enforces this at checkout — an over-limit order gets "Sorry, you
 * have exceeded your current purchase limits" and cannot proceed. That is the
 * real enforcement and it lives where it belongs, on their server.
 *
 * The problem this solves is that the customer only finds out AFTER leaving the
 * cart, filling in contact details and reaching the order summary. This tells
 * them in the cart, while the quantity steppers are still in front of them.
 *
 * So it deliberately does NOT block. Blocking here would duplicate a rule that
 * already exists in a better place, and any disagreement between our
 * classification and the register's would silently cost a legal sale.
 *
 * Two pieces of data, because neither source has both:
 *   - which limit a product counts against -> /api/purchase-limits (the browser
 *     cannot tell: categoryId is empty in the widget's response, and the
 *     by-category endpoint returns only a preview of the catalogue)
 *   - grams per unit -> read from the widget's own product responses, no extra
 *     requests, the same technique ProteusStockLimit uses
 *
 * Anything we cannot classify or weigh is simply not counted, so the worst case
 * is a total that reads low and no warning shown — never a false alarm telling
 * someone they cannot buy something they can.
 */

/** grams per unit, learned from the widget's traffic */
const grams = new Map<string, number>();
/** product id -> which limit it counts against, from our server */
const buckets = new Map<string, Bucket>();

type ApiProduct = { id?: number | string; weight?: number | string };
type ApiPayload =
  | ApiProduct[]
  | { products?: ApiProduct[]; product?: ApiProduct; categories?: { products?: ApiProduct[] }[] };

/**
 * Product lists arrive in three shapes depending on the call:
 *   action=products             -> { products: [...] }
 *   action=product              -> { product: {...} }
 *   action=products_by_category -> { categories: [ { products: [...] } ] }
 * The third nests them a level deeper and is what a category click returns.
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
    const w = Number(p.weight);
    if (Number.isFinite(w) && w >= 0) grams.set(String(p.id), w);
  }
}

type WidgetCartItem = { id?: number | string; qty?: number };

function readCart(): CartLine[] {
  const w = window.ProteusWidget as { getCart?: () => { items?: WidgetCartItem[] } } | undefined;
  const items = w?.getCart?.()?.items ?? [];
  return items.map((it) => {
    const id = String(it?.id ?? "");
    return {
      bucket: buckets.get(id) ?? null,
      grams: grams.has(id) ? (grams.get(id) as number) : null,
      qty: Number(it?.qty) || 0,
    };
  });
}

const PANEL_ID = "hl-limit-panel";

export default function ProteusPurchaseLimit() {
  useEffect(() => {
    const shop = document.getElementById("proteus_shop");
    if (!shop) return;
    let cancelled = false;

    const render = () => {
      const summary = shop.querySelector(".proteus-cart-summary");
      const existing = document.getElementById(PANEL_ID);

      // Only meaningful in the cart view.
      if (!summary) {
        existing?.remove();
        return;
      }

      const t = tally(readCart());
      const rows: string[] = [];
      let over = false;

      (["cannabis", "concentrate"] as Bucket[]).forEach((b) => {
        const used = t[b];
        if (used <= 0) return;
        const isOver = used > LIMITS[b];
        const isNear = !isOver && used >= LIMITS[b] * 0.8;
        if (isOver) over = true;
        rows.push(
          `<div class="hl-limit-row${isOver ? " is-over" : isNear ? " is-near" : ""}">` +
            `<span>${b === "cannabis" ? "Flower &amp; pre-rolls" : "Concentrate &amp; edibles"}</span>` +
            `<span>${formatAmount(used, b)} / ${formatAmount(LIMITS[b], b)}</span>` +
            `</div>`,
        );
      });

      // Nothing countable in the cart — say nothing rather than show empty rows.
      if (!rows.length) {
        existing?.remove();
        return;
      }

      const panel = existing ?? document.createElement("div");
      panel.id = PANEL_ID;
      panel.className = "hl-limit" + (over ? " is-over" : "");
      // Built only from numbers computed above, never from product text.
      panel.innerHTML =
        `<div class="hl-limit-title">New York purchase limit</div>` +
        rows.join("") +
        (over
          ? `<p class="hl-limit-msg">This is over the legal limit for one purchase. ` +
            `Checkout won't accept it — lower a quantity above and you're set.</p>`
          : "");
      if (!existing) summary.insertBefore(panel, summary.firstChild);
    };

    // ── the bucket map, once ──────────────────────────────────────────────
    fetch("/api/purchase-limits")
      .then((r) => r.json())
      .then((d: { buckets?: Record<string, Bucket> }) => {
        if (cancelled) return;
        for (const [id, b] of Object.entries(d?.buckets ?? {})) buckets.set(id, b);
        render();
      })
      .catch(() => {
        // No map means nothing is classified, so nothing is counted and no panel
        // appears. The cart behaves exactly as it did before this component.
      });

    // ── weights, from the widget's own traffic ────────────────────────────
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
      response
        .clone()
        .json()
        .then((data) => {
          remember(data);
          render();
        })
        .catch(() => {});
      return response;
    };
    window.fetch = patched;

    // The widget rebuilds the cart on every quantity change, so this keeps the
    // totals live as someone adjusts them.
    const obs = new MutationObserver(render);
    obs.observe(shop, { childList: true, subtree: true });
    render();

    return () => {
      cancelled = true;
      obs.disconnect();
      if (window.fetch === patched) window.fetch = originalFetch;
      document.getElementById(PANEL_ID)?.remove();
    };
  }, []);

  return null;
}
