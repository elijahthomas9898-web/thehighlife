"use client";

import { useEffect } from "react";
import {
  LIMITS,
  formatAmount,
  tally,
  wouldExceed,
  type Bucket,
  type CartLine,
} from "@/lib/limits";

/**
 * Keeps a cart inside New York's purchase limits: 3 oz (85 g) of cannabis and
 * 24 g of concentrated cannabis.
 *
 * Proteus does not do this. Their `action=validate_cart` caps by STOCK — verified
 * with a live call that reduced 10 to 7 for "limited stock" — and then returned
 * 7 × 14 g = 98 g = 3.46 oz without a word. Stock is enforced; the legal cap is not.
 *
 * Two pieces of data, from two places, because neither has both:
 *   - which limit a product counts against -> /api/purchase-limits (the browser
 *     cannot tell: categoryId is empty in the widget's response and the
 *     by-category endpoint only returns a preview of the catalogue)
 *   - grams per unit -> read from the widget's own product responses, the same
 *     technique ProteusStockLimit uses. No extra requests.
 *
 * ⚠️ The register is the authority, not this. It fails OPEN throughout: a product
 * we cannot classify or weigh is not counted and never blocks. Under-counting
 * means the counter catches an over-limit order — irritating. Over-counting would
 * silently kill a legal sale, which is worse and invisible.
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

type WidgetCartItem = { id?: number | string; qty?: number; name?: string };

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

    // ── the bucket map, once ──────────────────────────────────────────────
    fetch("/api/purchase-limits")
      .then((r) => r.json())
      .then((d: { buckets?: Record<string, Bucket> }) => {
        if (cancelled) return;
        for (const [id, b] of Object.entries(d?.buckets ?? {})) buckets.set(id, b);
        render();
      })
      .catch(() => {
        // No map means nothing is classified, so nothing is counted and nothing
        // blocks. The shop behaves exactly as it did before this component.
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

    // ── the running total, shown in the cart view ─────────────────────────
    const render = () => {
      const summary = shop.querySelector(".proteus-cart-summary");
      const existing = document.getElementById(PANEL_ID);
      if (!summary) {
        existing?.remove();
        return;
      }

      const t = tally(readCart());
      const rows: string[] = [];
      (["cannabis", "concentrate"] as Bucket[]).forEach((b) => {
        const used = t[b];
        if (used <= 0) return;
        const over = used > LIMITS[b];
        const near = !over && used >= LIMITS[b] * 0.8;
        rows.push(
          `<div class="hl-limit-row${over ? " is-over" : near ? " is-near" : ""}">` +
            `<span>${b === "cannabis" ? "Cannabis" : "Concentrate"}</span>` +
            `<span>${formatAmount(used, b)} / ${formatAmount(LIMITS[b], b)}</span>` +
            `</div>`,
        );
      });
      if (!rows.length) {
        existing?.remove();
        return;
      }

      const over = t.cannabis > LIMITS.cannabis || t.concentrate > LIMITS.concentrate;
      const panel = existing ?? document.createElement("div");
      panel.id = PANEL_ID;
      panel.className = "hl-limit" + (over ? " is-over" : "");
      // Built from numbers we computed, never from product text.
      panel.innerHTML =
        `<div class="hl-limit-title">New York purchase limit</div>` +
        rows.join("") +
        (over
          ? `<p class="hl-limit-msg">This cart is over the legal limit. Remove some items to check out.</p>`
          : "");
      if (!existing) summary.insertBefore(panel, summary.firstChild);
    };

    // ── stop an add that would cross the line ─────────────────────────────
    type Widget = { add?: (...args: unknown[]) => unknown; _cardQuickAdd?: (...a: unknown[]) => unknown };
    const install = () => {
      const w = window.ProteusWidget as Widget | undefined;
      if (!w?.add || (w.add as { __hlLimited?: boolean }).__hlLimited) return !!w?.add;
      const original = w.add.bind(w);

      const guarded = (...args: unknown[]) => {
        const id = String(args[0] ?? "");
        const bucket = buckets.get(id);
        const per = grams.get(id);
        // Unknown either way -> let it through untouched.
        if (bucket && per !== undefined) {
          const asked = Number(args[1]);
          const qty = Number.isFinite(asked) && asked > 0 ? asked : 1;
          const now = tally(readCart())[bucket];
          if (wouldExceed(now, per * qty, bucket)) {
            const w2 = window.ProteusWidget as { showNotification?: (m: string) => void } | undefined;
            const msg =
              `That would put you over New York's ${formatAmount(LIMITS[bucket], bucket)} ` +
              `${bucket === "cannabis" ? "cannabis" : "concentrate"} limit for one purchase.`;
            if (w2?.showNotification) w2.showNotification(msg);
            else alert(msg);
            render();
            return;
          }
        }
        const result = original(...args);
        setTimeout(render, 60);
        return result;
      };
      (guarded as { __hlLimited?: boolean }).__hlLimited = true;
      w.add = guarded;
      return true;
    };

    let tries = 0;
    const timer = setInterval(() => {
      if (install() || tries++ > 80) clearInterval(timer);
    }, 150);

    const obs = new MutationObserver(render);
    obs.observe(shop, { childList: true, subtree: true });
    render();

    return () => {
      cancelled = true;
      obs.disconnect();
      clearInterval(timer);
      if (window.fetch === patched) window.fetch = originalFetch;
      document.getElementById(PANEL_ID)?.remove();
    };
  }, []);

  return null;
}
