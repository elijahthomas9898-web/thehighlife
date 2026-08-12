import type { Metadata } from "next";
import { getMenu } from "@/lib/proteus";
import { deals, featuredDeals, store, hours } from "@/data/site";
import type { Product } from "@/lib/types";
import SignageDeck from "./SignageDeck";

export const metadata: Metadata = {
  title: "The High Life — Now Showing",
  robots: { index: false, follow: false },
};

// Render fresh on every request so each OptiSigns refresh pulls current stock.
export const dynamic = "force-dynamic";

/** A spread of products to feature: sale items first, then a rotation across
 *  the main categories so the screen shows variety, not 30 pre-rolls. */
function pickHighlights(products: Product[]): Product[] {
  const onSale = products.filter(
    (p) => p.salePrice != null && p.price != null && p.salePrice < p.price
  );

  const cats = ["flower", "pre-rolls", "vapes", "edibles", "concentrate", "topicals"];
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.imageUrl) continue; // signage wants pictures
    const arr = byCat.get(p.category) ?? [];
    arr.push(p);
    byCat.set(p.category, arr);
  }

  // round-robin a few from each category
  const spread: Product[] = [];
  for (let i = 0; i < 6; i++) {
    for (const c of cats) {
      const arr = byCat.get(c);
      if (arr && arr[i]) spread.push(arr[i]);
    }
  }

  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of [...onSale, ...spread]) {
    if (seen.has(p.id)) continue;
    if (!p.imageUrl) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= 36) break;
  }
  return out;
}

export default async function SignagePage() {
  const { products, live } = await getMenu();
  const highlights = pickHighlights(products);
  const showDeals = featuredDeals.length ? featuredDeals : deals;

  return (
    <SignageDeck
      deals={showDeals}
      products={highlights}
      live={live}
      store={{ name: store.name, license: store.license, addr: `${store.addressLine1}, ${store.addressLine2}` }}
      hours={hours}
    />
  );
}
