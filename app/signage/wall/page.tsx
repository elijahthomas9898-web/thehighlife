import type { Metadata } from "next";
import { getMenu } from "@/lib/proteus";
import { wallColumns, WALL_SECONDS_PER_ITEM } from "@/data/site";
import type { Product } from "@/lib/types";
import WallColumns, { type WallColumn, type WallItem } from "./WallColumns";

export const metadata: Metadata = {
  title: "The High Life — Menu Wall",
  robots: { index: false, follow: false },
};

// Fresh stock on every load; each OptiSigns refresh pulls current inventory.
export const dynamic = "force-dynamic";

/**
 * Slim a catalog product down to just what a menu-board row shows. The full
 * Product carries descriptions, terpene panels, strain/dominance, etc. — none
 * of which the wall renders. Every category is sent in FULL (no cap), so
 * trimming to these six fields keeps the payload small even for a 200-SKU
 * flower column, and the recycler still only mounts ~15 rows at a time.
 */
function toWallItem(p: Product): WallItem {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice,
    thc: p.lab?.thc,
    imageUrl: p.imageUrl,
  };
}

export default async function WallPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen } = await searchParams;
  const { products, live } = await getMenu();

  // group live products by category slug
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    const arr = byCat.get(p.category) ?? [];
    arr.push(p);
    byCat.set(p.category, arr);
  }

  // Send the WHOLE category (no cap) — the scroller cycles through all of it.
  const build = (col: { slug: string; title: string }): WallColumn => ({
    title: col.title,
    products: (byCat.get(col.slug) ?? []).map(toWallItem),
  });

  // screen=1|2|3 → that screen's two columns; no/invalid param → all six (desktop preview)
  const n = Number(screen);
  let columns: WallColumn[];
  if (n >= 1 && n <= 3) {
    columns = [wallColumns[n * 2 - 2], wallColumns[n * 2 - 1]].filter(Boolean).map(build);
  } else {
    columns = wallColumns.map(build);
  }

  return <WallColumns columns={columns} live={live} secondsPerItem={WALL_SECONDS_PER_ITEM} />;
}
