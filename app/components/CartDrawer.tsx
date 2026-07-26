"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { CANNABIS_TAX_RATE, store } from "@/data/site";
import type { PickupOrderResult } from "@/lib/types";

/**
 * The cart drawer.
 *
 * Two modes, controlled by NEXT_PUBLIC_ORDERING_ENABLED:
 *  - OFF  → a browser-local "pickup list" the customer reads to a budtender.
 *  - ON   → a real reserve-for-pickup flow that creates a Proteus reservation
 *           (pay-at-store, ID checked at pickup — never an online payment).
 *
 * The flag ships OFF; nothing hits the ordering API until it's turned on.
 */
const ORDERING = process.env.NEXT_PUBLIC_ORDERING_ENABLED === "true";

type View = "cart" | "form" | "confirmed";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartDrawer() {
  const { lines, count, subtotal, tax, total, setQty, remove, clear, open, setOpen } = useCart();

  const [view, setView] = useState<View>("cart");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<PickupOrderResult, { ok: true }> | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("modal-open");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    // once an order is placed, closing resets everything and empties the cart
    if (view === "confirmed") {
      clear();
      setView("cart");
      setResult(null);
    }
    setOpen(false);
  }

  async function placeOrder() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { firstName, lastName, phone, email: email || undefined },
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        }),
      });
      const data = (await res.json()) as PickupOrderResult;
      if (data.ok) {
        setResult(data);
        setView("confirmed");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Couldn't reach the store. Please try again, or call us to reserve.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    view === "confirmed" ? "Reservation Placed" : view === "form" ? "Reserve for Pickup" : "Your Cart";

  return (
    <>
      {count > 0 && !open && (
        <button className="cartpill" onClick={() => setOpen(true)}>
          <b>{count}</b> {count === 1 ? "item" : "items"}
          <span>{ORDERING ? "Review & reserve" : "View list"}</span>
        </button>
      )}

      {open && (
        <div className="cart-back" onClick={close} role="presentation">
          <aside
            className="cart"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cartTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="cart-head">
              <h3 id="cartTitle">{title}</h3>
              <button className="modal-x" onClick={close} aria-label="Close">
                ✕
              </button>
            </header>

            {/* ─── EMPTY ─── */}
            {lines.length === 0 && view !== "confirmed" ? (
              <div className="cart-empty">
                <p>Nothing on your list yet.</p>
                <a className="btn ghost" href="/menu" onClick={close}>
                  Browse the menu →
                </a>
              </div>
            ) : view === "confirmed" && result ? (
              /* ─── CONFIRMED ─── */
              <div className="cart-confirmed">
                <div className="confirm-badge" aria-hidden="true">
                  ✓
                </div>
                <h4>You&rsquo;re all set</h4>
                <p className="confirm-num">
                  Reservation <b>#{result.invoiceId}</b>
                </p>
                <p className="confirm-total">Estimated total {money(result.totalCents)}</p>
                <div className="cart-instruct">
                  <b>Come pick it up.</b> Bring a valid 21+ ID and pay at the counter — we hold your
                  order for you. Final price is set at the register (coupons apply there).
                </div>
                <p className="confirm-addr">
                  {store.name}
                  <br />
                  {store.addressLine1}, {store.addressLine2}
                </p>
                <div className="cart-actions">
                  <a
                    className="btn primary"
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${store.addressLine1}, ${store.addressLine2}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions →
                  </a>
                  <button className="btn ghost" onClick={close}>
                    Done
                  </button>
                </div>
              </div>
            ) : view === "form" ? (
              /* ─── RESERVE FORM ─── */
              <>
                <div className="cart-form">
                  <p className="form-lead">
                    Reserve for in-store pickup. No payment now — pay at the counter. We&rsquo;ll
                    have it ready.
                  </p>
                  <label className="fld">
                    <span>First name</span>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                  </label>
                  <label className="fld">
                    <span>Last name</span>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                  </label>
                  <label className="fld">
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="(516) 555-0123"
                    />
                  </label>
                  <label className="fld">
                    <span>
                      Email <em>(optional)</em>
                    </span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </label>

                  {error && <p className="form-error">{error}</p>}
                </div>

                <footer className="cart-foot">
                  <div className="cart-total">
                    <span>Estimated total</span>
                    <b>${total.toFixed(2)}</b>
                  </div>
                  <p className="cart-note">
                    Estimate only — the register sets the final price (coupons apply there). Reservation
                    is subject to availability and a valid 21+ ID at pickup.
                  </p>
                  <div className="cart-actions">
                    <button className="btn primary" onClick={placeOrder} disabled={busy}>
                      {busy ? "Placing…" : "Place Reservation →"}
                    </button>
                    <button className="btn ghost" onClick={() => setView("cart")} disabled={busy}>
                      ← Back
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              /* ─── CART ─── */
              <>
                <ul className="cart-lines">
                  {lines.map(({ product: p, qty }) => (
                    <li key={p.id}>
                      <div className="cart-thumb">
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <div className="prod-noimg" aria-hidden="true" />
                        )}
                      </div>

                      <div className="cart-info">
                        {p.brand && <div className="prod-brand">{p.brand}</div>}
                        <div className="cart-name">{p.name}</div>
                        <div className="cart-unit">
                          {p.salePrice != null && p.price != null && p.salePrice < p.price ? (
                            <>
                              <span className="was">${p.price.toFixed(2)}</span>{" "}
                              <span className="now">${p.salePrice.toFixed(2)}</span>
                            </>
                          ) : p.price != null ? (
                            <span className="now">${p.price.toFixed(2)}</span>
                          ) : null}
                          <span className="cart-ea"> each</span>
                        </div>
                      </div>

                      <div className="cart-qty">
                        <button onClick={() => setQty(p.id, qty - 1)} aria-label={`One fewer ${p.name}`}>
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          onClick={() => setQty(p.id, qty + 1)}
                          disabled={p.stockCount != null && qty >= p.stockCount}
                          aria-label={`One more ${p.name}`}
                        >
                          +
                        </button>
                        <button className="cart-remove" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="cart-foot">
                  <div className="cart-sums">
                    <div className="cart-row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="cart-row">
                      <span>NYS cannabis tax ({(CANNABIS_TAX_RATE * 100).toFixed(0)}%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="cart-total">
                    <span>Estimated total</span>
                    <b>${total.toFixed(2)}</b>
                  </div>

                  {ORDERING ? (
                    <>
                      <p className="cart-note">
                        Estimate — coupons apply at the register. Reserve online, then pay at the
                        counter with a valid 21+ ID.
                      </p>
                      <div className="cart-actions">
                        <button className="btn primary" onClick={() => setView("form")}>
                          Reserve for Pickup →
                        </button>
                        <button className="btn ghost" onClick={clear}>
                          Clear
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="cart-note">
                        An estimate. Coupons are applied at the register and will lower both the
                        subtotal and the tax, so you may pay less than this.
                      </p>
                      <div className="cart-instruct">
                        <b>This isn&rsquo;t an online order.</b> Bring this list in and let your
                        budtender know what you want — they&rsquo;ll pull it and you pay at the counter.
                      </div>
                      <div className="cart-actions">
                        <a className="btn primary" href="/visit" onClick={close}>
                          Get Directions →
                        </a>
                        <button className="btn ghost" onClick={clear}>
                          Clear list
                        </button>
                      </div>
                    </>
                  )}
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
