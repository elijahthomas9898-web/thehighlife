/**
 * The shape the WEBSITE uses. Proteus's raw field names are translated
 * into this in ONE place — `mapProduct()` in lib/proteus.ts.
 */

/** One terpene reading from lab data, e.g. { name: "Linalool", percent: 0.56 } */
export type Terpene = {
  name: string;
  percent: number;
};

/**
 * Lab / cannabinoid data. Comes from the `categoryListProducts` endpoint,
 * which only covers ~70% of the catalog — every field here is optional and
 * the UI must hide the section rather than invent a value.
 */
export type LabData = {
  thc?: number;
  thca?: number;
  thcv?: number;
  cbd?: number;
  cbda?: number;
  cbg?: number;
  cbn?: number;
  cbc?: number;
  /** total terpene percentage */
  terpsTotal?: number;
  /** top terpenes, de-duplicated, highest first */
  topTerps?: Terpene[];
};

export type Product = {
  id: string;
  /** needed later for creating pickup orders via addInvoice */
  sku?: string;
  name: string;
  brand?: string;
  /** our slug: flower | pre-rolls | vapes | edibles | concentrate | topicals | … */
  category: string;
  /** what Proteus actually called it, e.g. "AIO", "3.5g Flower" — the sub-category */
  proteusCategory?: string;
  /** the cultivar, e.g. "Sour Spritzer" */
  strain?: string;
  /** Sativa | Indica | Hybrid — from Proteus's `dominance` field */
  dominance?: string;
  /** marketing copy from Proteus, HTML stripped to plain paragraphs */
  description?: string;
  price?: number;
  salePrice?: number;
  /** e.g. "each" */
  unit?: string;
  imageUrl?: string;
  inStock: boolean;
  /** what we show and gate on — prefers `inventory_sellable` when Proteus has it */
  stockCount?: number;
  /**
   * Raw `num_in_stock` from the register, kept for debugging. Can disagree with
   * `stockCount`: a product may be physically on hand but not sellable.
   */
  onHandCount?: number;
  /** present only when the product was matched in categoryListProducts */
  lab?: LabData;
};

export type MenuResult = {
  products: Product[];
  /** true when the data came from Proteus, false when it's the sample set */
  live: boolean;
  error?: string;
  fetchedAt?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
   PICKUP ORDERING

   A reservation, not a sale: pay-at-store, ID checked at pickup. Modeled on a
   real `fromwebsite=1` order observed in Proteus. Money is held in integer
   CENTS everywhere below to avoid floating-point drift (Leafly's convention).
   ───────────────────────────────────────────────────────────────────────── */

/** Contact details the customer types on the reserve form. */
export type OrderCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  /** optional — Proteus stores it if given */
  email?: string;
};

/**
 * What the BROWSER posts to /api/order. Deliberately minimal: just product ids
 * and quantities. The server re-derives every price and name from live Proteus
 * data — it never trusts a price sent by the client.
 */
export type PickupOrderRequest = {
  customer: OrderCustomer;
  items: { productId: string; qty: number }[];
};

/** One validated line the server builds for the invoice. */
export type OrderLine = {
  productId: string;
  sku?: string;
  name: string;
  quantity: number;
  /** unit price the register will use, in cents */
  unitPriceCents: number;
  /** Proteus price tier; this store is single-tier, so always 1 */
  priceType: number;
};

/** Result returned to the browser. */
export type PickupOrderResult =
  | { ok: true; invoiceId: string; subtotalCents: number; taxCents: number; totalCents: number }
  | { ok: false; error: string; code?: "disabled" | "validation" | "stock" | "proteus" | "rate" };
