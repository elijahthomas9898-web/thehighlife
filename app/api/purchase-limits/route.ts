import { getMenu } from "@/lib/proteus";
import { BUCKETS } from "@/lib/limits";

/**
 * Which purchase limit each product counts against, as a compact id -> bucket map.
 *
 * The browser cannot work this out for itself. The widget's flat products
 * response leaves `categoryId` empty, and `action=products_by_category` returns
 * only 123 of ~1,800 products — a preview, not the catalogue. The keyed API does
 * have a real category on every product, but it needs credentials, so the lookup
 * has to be built here.
 *
 * No new Proteus traffic: getMenu() is the same call the menu already makes, with
 * its own in-process cache, and categorize() has already normalised the 35 raw POS
 * category names ("AIO", "510 Cart", "Ground Flower", "14g Flower (1/2 Oz)" …)
 * into the handful of slugs BUCKETS is keyed on.
 *
 * Products that count toward nothing are OMITTED rather than sent as null — that
 * is 321 of 2,125 (accessories, batteries, papers, grinders, lighters, CBD) and
 * dropping them keeps the payload small. A missing id means "does not count",
 * which is also the safe default on the client.
 *
 * Weights are NOT here. The keyed catalogue has no weight field; the cart API
 * does, and the client reads it from the widget's own traffic.
 */
export const revalidate = 300;

export async function GET() {
  const { products, live } = await getMenu();

  if (!live) {
    // Menu is down. Send an empty map rather than a 500: the client treats
    // unknown products as uncounted, so the shop keeps working without limits
    // rather than blocking every add.
    return Response.json(
      { buckets: {}, live: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const buckets: Record<string, string> = {};
  for (const p of products) {
    const bucket = BUCKETS[p.category];
    if (bucket && p.id) buckets[p.id] = bucket;
  }

  return Response.json(
    { buckets, live: true },
    {
      headers: {
        // Categories change rarely; a few minutes of staleness is fine and keeps
        // this off the critical path for shoppers.
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
