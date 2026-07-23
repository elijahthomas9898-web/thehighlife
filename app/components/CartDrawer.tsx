"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { CANNABIS_TAX_RATE } from "@/data/site";

/**
 * The visitor's pickup list. Deliberately NOT a checkout — there's no payment,
 * no order submission, and nothing leaves the browser. It exists so someone can
 * build a list at home and read it to a budtender at the counter.
 */
export default function CartDrawer() {
  const { lines, count, subtotal, tax, total, setQty, remove, clear, open, setOpen } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("modal-open");
    };
  }, [open, setOpen]);

  return (
    <>
      {/* floating button — only once something is in the list */}
      {count > 0 && !open && (
        <button className="cartpill" onClick={() => setOpen(true)}>
          <b>{count}</b> {count === 1 ? "item" : "items"}
          <span>View list</span>
        </button>
      )}

      {open && (
        <div className="cart-back" onClick={() => setOpen(false)} role="presentation">
          <aside
            className="cart"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cartTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="cart-head">
              <h3 id="cartTitle">Your Pickup List</h3>
              <button className="modal-x" onClick={() => setOpen(false)} aria-label="Close list">
                ✕
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="cart-empty">
                <p>Nothing on your list yet.</p>
                <a className="btn ghost" href="/menu" onClick={() => setOpen(false)}>
                  Browse the menu →
                </a>
              </div>
            ) : (
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
                        <button
                          className="cart-remove"
                          onClick={() => remove(p.id)}
                          aria-label={`Remove ${p.name}`}
                        >
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
                  <p className="cart-note">
                    An estimate. Coupons are applied at the register and will lower both the
                    subtotal and the tax, so you may pay less than this.
                  </p>

                  <div className="cart-instruct">
                    <b>This isn&rsquo;t an online order.</b> Bring this list in and let your
                    budtender know what you want — they&rsquo;ll pull it and you pay at the counter.
                  </div>

                  <div className="cart-actions">
                    <a className="btn primary" href="/visit" onClick={() => setOpen(false)}>
                      Get Directions →
                    </a>
                    <button className="btn ghost" onClick={clear}>
                      Clear list
                    </button>
                  </div>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
