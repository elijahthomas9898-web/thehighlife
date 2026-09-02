import { categorize } from "@/lib/proteus";
import { BUCKETS } from "@/lib/limits";

/**
 * Which purchase limit each product counts against, as a compact id -> bucket map.
 *
 * The browser cannot work this out for itself. The widget's flat products
 * response leaves `categoryId` empty, and `action=products_by_category` returns
 * only 123 of ~1,800 products — a preview, not the catalogue. The keyed API does
 * carry a real category on every product, but it needs credentials, so the lookup
 * has to be built here.
 *
 * ── Why this does its own fetch instead of reusing getMenu() ──────────────────
 * It did reuse it, and the route took 16.5 SECONDS cold. getMenu() also pulls the
 * lab-data enrichment and builds full product objects; the catalogue alone is
 * 5.5s of that, the rest is work this route throws away. Sixteen seconds matters
 * because the limits are not enforced until the map arrives — so a cold start was
 * a sixteen-second window with no limits at all.
 *
 * This asks for the same catalogue and keeps two fields.
 *
 * Products that count toward nothing are OMITTED rather than sent as null — a few
 * hundred accessories, batteries, papers, grinders, lighters and CBD. A missing id
 * means "does not count", which is also the safe default on the client.
 *
 * Weights are NOT here: the keyed catalogue has no weight field. The client reads
 * those from the widget's own product responses.
 */
export const revalidate = 300;

/**
 * In-process cache, same pattern as lib/proteus.ts.
 *
 * `revalidate` alone did not hold: this handler fetches with cache:"no-store"
 * (it must — the credentials make it uncacheable upstream), so every request
 * re-walked the catalogue and a "warm" call still cost 2.4s. Holding the built
 * map here takes that to nothing.
 */
type Cached = { at: number; body: { buckets: Record<string, string>; live: boolean } };
let cache: Cached | null = null;
const TTL_MS = 5 * 60 * 1000;

const CLIENT = process.env.PROTEUS_CLIENT_NAME ?? "highlife";
const PASS = process.env.PROTEUS_WEBSERVICE_PASS ?? "";
const APP_NAME = process.env.PROTEUS_APP_NAME ?? "";
const BASE = `https://api.proteuserp.com/${CLIENT}/webservices`;

type RawRow = { product_id?: string | number; category?: string };

async function fetchCategories(): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  let cursor = 0;

  // Cursor is the highest product_id seen, not an offset — so the pages have to
  // be walked in order. Guard against a server that stops making progress.
  for (let guard = 0; guard < 12; guard++) {
    const res = await fetch(`${BASE}/products_json.cfm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        AppName: APP_NAME,
        webservicepass: PASS,
        action: "getProductsById",
        startrow: String(cursor),
        maxrows: "1000",
        active: "1",
      }),
      cache: "no-store",
    });
    if (!res.ok) break;

    const page = (await res.json()) as RawRow[];
    if (!Array.isArray(page) || page.length === 0) break;

    rows.push(...page);

    let maxId = cursor;
    for (const r of page) {
      const n = Number(r.product_id);
      if (Number.isFinite(n) && n > maxId) maxId = n;
    }
    if (page.length < 1000 || maxId <= cursor) break;
    cursor = maxId + 1;
  }

  return rows;
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return Response.json(cache.body, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  }

  let rows: RawRow[] = [];
  try {
    if (PASS) rows = await fetchCategories();
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    // Catalogue unavailable. Send an empty map rather than an error: the client
    // treats unknown products as uncounted, so the shop keeps working without
    // limits rather than blocking every add.
    return Response.json({ buckets: {}, live: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const buckets: Record<string, string> = {};
  for (const r of rows) {
    const id = String(r.product_id ?? "");
    if (!id) continue;
    // categorize() already folds the 35 raw POS names ("AIO", "510 Cart", "Pod",
    // "Infused Prerolls", "14g Flower (1/2 Oz)" …) into the slugs BUCKETS uses.
    const bucket = BUCKETS[categorize(r.category ?? "")];
    if (bucket) buckets[id] = bucket;
  }

  cache = { at: Date.now(), body: { buckets, live: true } };

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
