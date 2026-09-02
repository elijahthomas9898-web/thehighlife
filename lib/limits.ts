/**
 * New York adult-use purchase limits, in one place.
 *
 * A single purchase is capped at 3 oz (85 g) of cannabis and 24 g of
 * concentrated cannabis. Nothing in Proteus enforces this for us: their
 * `action=validate_cart` caps by STOCK ("quantity reduced from 10 to 7 — limited
 * stock") but happily returned 7 × 14 g = 98 g = 3.46 oz without complaint.
 *
 * ⚠️ This is a compliance rule implemented to the store's specification, not
 * legal advice, and the register remains the authority. If the two ever disagree
 * the register wins — which is why the bucket map below is worth confirming
 * against it rather than trusting this file alone.
 */

export const LIMITS = {
  /** 3 oz. Flower and pre-rolls. */
  cannabis: 85,
  /** Concentrated cannabis: extracts, vapes, edibles, tinctures, topicals. */
  concentrate: 24,
} as const;

export type Bucket = keyof typeof LIMITS;

export const GRAMS_PER_OUNCE = 28.3495;

/**
 * Normalised category (as produced by `categorize()` in lib/proteus.ts) to the
 * limit it counts against. Anything absent counts toward NOTHING — accessories,
 * batteries, rolling papers, grinders, lighters and CBD all land here, which is
 * correct: none are adult-use cannabis.
 *
 * Checked against the real catalogue: 35 distinct raw POS categories across 2,125
 * products all resolve through `categorize()` into these keys or into an excluded
 * one. Raw names like "AIO", "510 Cart", "Pod", "Infused Prerolls", "Ground
 * Flower" and "14g Flower (1/2 Oz)" are handled there, not here.
 */
export const BUCKETS: Record<string, Bucket> = {
  flower: "cannabis",
  "pre-rolls": "cannabis",

  concentrate: "concentrate",
  vapes: "concentrate",
  edibles: "concentrate",
  tinctures: "concentrate",
  topicals: "concentrate",
};

export type CartLine = {
  /** Which limit this counts against, or null when we could not classify it. */
  bucket: Bucket | null;
  /** Grams PER UNIT. Null when unknown. */
  grams: number | null;
  qty: number;
};

export type Tally = {
  cannabis: number;
  concentrate: number;
  /** Lines we could not classify or weigh, and therefore did not count. */
  skipped: number;
};

/**
 * Total a cart into its two buckets.
 *
 * Deliberately fails OPEN: a line with an unknown bucket or an unknown weight is
 * skipped rather than guessed at. Under-counting means the register catches an
 * over-limit order at pickup — annoying. Over-counting would block a legal sale
 * we would never hear about, which is worse.
 */
export function tally(lines: CartLine[]): Tally {
  const out: Tally = { cannabis: 0, concentrate: 0, skipped: 0 };

  for (const line of lines) {
    const qty = Number(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    if (!line.bucket || line.grams === null || !Number.isFinite(line.grams) || line.grams < 0) {
      out.skipped += 1;
      continue;
    }
    out[line.bucket] += line.grams * qty;
  }

  // Grams come back as floats (0.01 edibles, 3.5 eighths); round to milligrams so
  // 24 exactly-1g vapes total 24 and not 23.999999999999996 — which would read as
  // under the limit by a hair and let a 25th through.
  out.cannabis = Math.round(out.cannabis * 1000) / 1000;
  out.concentrate = Math.round(out.concentrate * 1000) / 1000;
  return out;
}

/** True when adding `add` more grams to `bucket` would exceed the limit. */
export function wouldExceed(current: number, add: number, bucket: Bucket): boolean {
  const next = Math.round((current + add) * 1000) / 1000;
  return next > LIMITS[bucket];
}

/** "2.4 oz" for the cannabis bucket, "18 g" for concentrate — how each is sold. */
export function formatAmount(grams: number, bucket: Bucket): string {
  if (bucket === "cannabis") {
    const oz = grams / GRAMS_PER_OUNCE;
    return `${oz.toFixed(oz < 10 ? 2 : 1)} oz`;
  }
  return `${Number(grams.toFixed(2))} g`;
}
