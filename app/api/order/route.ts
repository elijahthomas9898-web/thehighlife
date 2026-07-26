import {
  getMenu,
  checkTaxes,
  computeTotals,
  findUser,
  createPickupOrder,
  isOrderingEnabled,
} from "@/lib/proteus";
import type { OrderLine, PickupOrderRequest, PickupOrderResult } from "@/lib/types";

/**
 * POST /api/order — create a pickup RESERVATION in Proteus.
 *
 * Runs server-side only; the Proteus key never reaches the browser. The client
 * sends just product ids + quantities + contact info — every price and name is
 * re-derived here from live Proteus data, so a tampered client price/qty can't
 * get through. Nothing is written until validation passes and ordering is on.
 */

export const dynamic = "force-dynamic";

const MAX_LINES = 30;
const MAX_TOTAL_QTY = 60;

/* ── crude per-IP rate limit ──────────────────────────────────────────────
   Best-effort spam guard against junk invoices. Module memory isn't shared
   across serverless instances, so this is a speed bump, not a wall — the real
   protections are validation + the ORDERING_ENABLED gate. */
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for");
  return (fwd ?? "unknown").split(",")[0].trim();
}

function reply(body: PickupOrderResult, status: number): Response {
  return Response.json(body, { status });
}

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request): Promise<Response> {
  // Gate: feature flag off ⇒ endpoint doesn't exist as far as clients know.
  if (!isOrderingEnabled()) {
    return reply({ ok: false, error: "Online ordering isn't available yet.", code: "disabled" }, 404);
  }

  if (rateLimited(clientIp(req))) {
    return reply(
      { ok: false, error: "Too many requests — please wait a minute and try again.", code: "rate" },
      429
    );
  }

  // Parse
  let payload: PickupOrderRequest;
  try {
    payload = (await req.json()) as PickupOrderRequest;
  } catch {
    return reply({ ok: false, error: "Malformed request.", code: "validation" }, 400);
  }

  // Validate contact
  const c = payload?.customer;
  if (!c || !isNonEmpty(c.firstName) || !isNonEmpty(c.lastName)) {
    return reply({ ok: false, error: "Please enter your first and last name.", code: "validation" }, 400);
  }
  const phoneDigits = String(c.phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return reply({ ok: false, error: "Please enter a valid phone number.", code: "validation" }, 400);
  }
  if (isNonEmpty(c.email) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) {
    return reply({ ok: false, error: "That email doesn't look right.", code: "validation" }, 400);
  }

  // Validate items shape
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) {
    return reply({ ok: false, error: "Your cart is empty.", code: "validation" }, 400);
  }
  if (items.length > MAX_LINES) {
    return reply({ ok: false, error: "That's too many items for an online order.", code: "validation" }, 400);
  }

  // Re-price + re-stock against LIVE Proteus data — never trust the client.
  const menu = await getMenu();
  if (!menu.live) {
    return reply(
      { ok: false, error: "The menu is temporarily unavailable — please try again shortly.", code: "proteus" },
      503
    );
  }
  const byId = new Map(menu.products.map((p) => [p.id, p]));

  const lines: OrderLine[] = [];
  let totalQty = 0;
  for (const it of items) {
    const qty = Math.floor(Number(it?.qty));
    const product = isNonEmpty(it?.productId) ? byId.get(it.productId) : undefined;

    if (!product || !product.inStock) {
      return reply(
        { ok: false, error: "One of your items just sold out. Please review your cart.", code: "stock" },
        409
      );
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return reply({ ok: false, error: "Invalid quantity in your cart.", code: "validation" }, 400);
    }
    if (product.stockCount != null && qty > product.stockCount) {
      return reply(
        {
          ok: false,
          error: `Only ${product.stockCount} of "${product.name}" left. Please lower the quantity.`,
          code: "stock",
        },
        409
      );
    }

    const unit = product.salePrice ?? product.price ?? 0;
    lines.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: qty,
      unitPriceCents: Math.round(unit * 100),
      priceType: 1, // this store is single-tier; confirmed 0 multi-tier products
    });
    totalQty += qty;
  }

  if (totalQty > MAX_TOTAL_QTY) {
    return reply({ ok: false, error: "That's a large order — please call the store instead.", code: "validation" }, 400);
  }

  // Authoritative totals when Proteus gives them; otherwise our local estimate.
  const totals = (await checkTaxes(lines)) ?? computeTotals(lines);

  // Match a returning customer (best-effort; guest otherwise).
  const customerId = await findUser(c.lastName.trim(), phoneDigits).catch(() => null);

  // THE WRITE.
  try {
    const { invoiceId } = await createPickupOrder({
      customer: {
        firstName: c.firstName.trim(),
        lastName: c.lastName.trim(),
        phone: phoneDigits,
        email: isNonEmpty(c.email) ? c.email.trim() : undefined,
      },
      lines,
      totals,
      customerId,
    });

    return reply(
      {
        ok: true,
        invoiceId,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
      },
      200
    );
  } catch (e) {
    // Never leave the customer stranded — tell them to call the store.
    console.error("[order] addInvoice failed:", e);
    return reply(
      {
        ok: false,
        error: "We couldn't place your order just now. Please call the store to reserve.",
        code: "proteus",
      },
      502
    );
  }
}
