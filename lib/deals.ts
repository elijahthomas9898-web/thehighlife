/**
 * The store's live coupon deals, straight from JSCart's public endpoint.
 *
 * This is the SAME data the shop widget shows — but fetched server-side so the
 * homepage can render deal artwork without loading the ~570KB JSCart bundle on a
 * page that has no shop on it. The endpoint is a plain unauthenticated GET (it's
 * what the widget itself calls on load), so there's no key here and nothing
 * sensitive to leak.
 *
 * `lib/proteus.ts` deliberately isn't the home for this: that module talks to the
 * key-protected webservices host and has to cache in-process because Proteus needs
 * POST. This is a GET on the public cart host, so Next's own fetch cache handles it.
 */
export type ShopDeal = {
  id: number | string;
  name?: string;
  /** Short badge text, e.g. "B1G1" or "25%". */
  displayText?: string;
  /** Longer line, e.g. "Felas BUY1 GET1". */
  message?: string;
  image?: string;
  slug?: string;
  hasProducts?: boolean;
};

const DEALS_URL = "https://cart.proteus420.com/highlife/api_cart_v2.cfm?action=deals";

/** Five minutes: deals change weekly, but a stale hero on launch day is worse. */
const REVALIDATE_SECONDS = 300;

/**
 * Returns only deals that actually have artwork — this feeds an image slideshow,
 * and a gap in the rotation reads as a broken page. Never throws: the homepage
 * must render even if Proteus is unreachable (callers hide the slideshow on []).
 */
export async function getShopDeals(): Promise<ShopDeal[]> {
  try {
    const res = await fetch(DEALS_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];
    const data = (await res.json()) as { success?: boolean; deals?: ShopDeal[] };
    if (!data?.success || !Array.isArray(data.deals)) return [];
    return data.deals.filter((d) => d && typeof d.image === "string" && d.image.trim() !== "");
  } catch {
    return [];
  }
}
