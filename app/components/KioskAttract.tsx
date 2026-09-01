"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Idle "attract" screen for the in-store tablets: after 45s untouched, the kiosk
 * takes over with the store's current coupon deals, one at a time, full screen.
 * Any touch hands straight back to shopping.
 *
 * ── Why this keeps JSCart's timer alive ──────────────────────────────────────
 * The widget resets the kiosk (clear cart, sign out, RELOAD) after its own
 * inactivity window, warning 30s beforehand. Left alone, that would drop an "Are
 * you still there?" countdown on top of this screen every few minutes and reload
 * the tablet all day. So while this is showing we dispatch a synthetic mousemove
 * to keep that timer from firing.
 *
 * ⚠️ That suppression is ONLY safe because this screen only shows with an EMPTY
 * CART and NOBODY SIGNED IN — there is nothing for the reset to clean up. The two
 * are deliberately inseparable: `shouldShow()` is re-evaluated on every tick, and
 * the moment a cart appears or someone signs in, the screen hides AND the
 * keep-alive stops in the same pass, handing control back to the real reset.
 * If you ever loosen those conditions, remove the keep-alive with them.
 */

const IDLE_MS = 45_000; // untouched before the showcase takes over
const ROTATE_MS = 6_000; // per deal
const TICK_MS = 1_000;
const KEEPALIVE_EVERY = 30; // ticks (~30s)

type Deal = { id: number | string; image?: string; name?: string; displayText?: string; message?: string };

/** Same rule as KioskDealsPanel: leave clean URLs alone, encode the rest. */
function encodeImage(url: string): string {
  if (!url) return "";
  if (!/[\s#[\]{}|\\^`<>"]|[^\x00-\x7F]/.test(url)) return url;
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
}

export default function KioskAttract({ forceOpen = false }: { forceOpen?: boolean } = {}) {
  const [open, setOpen] = useState(forceOpen);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [idx, setIdx] = useState(0);
  const lastActive = useRef(Date.now());
  const tick = useRef(0);

  /** Every guard that must hold for the screen to be up. Checked continuously. */
  const shouldShow = useCallback(() => {
    const w = window.ProteusWidget;
    if (!w) return false;
    try {
      // Never interrupt a basket, and never leave a signed-in screen exposed.
      if (Number(w.getCartCount?.() ?? 0) > 0) return false;
      if (w.isAuthenticated?.() === true) return false;
    } catch {
      return false;
    }
    // Never cover JSCart's own overlays (setup, timeout, reset, PIN, auth modal).
    const overlays = document.querySelectorAll(
      ".proteus-modal-overlay, .proteus-kiosk-overlay, .proteus-cart-overlay",
    );
    for (const el of Array.from(overlays)) {
      const cs = getComputedStyle(el);
      if (cs.display !== "none" && cs.visibility !== "hidden") return false;
    }
    return true;
  }, []);

  // Load the deals the widget already holds; prefer ones with artwork.
  useEffect(() => {
    let tries = 0;
    const load = () => {
      let list: Deal[] = [];
      try {
        list = (window.ProteusWidget?.getDeals?.() as Deal[]) ?? [];
      } catch {
        list = [];
      }
      if (list.length) {
        const withArt = list.filter((d) => d.image);
        setDeals(withArt.length ? withArt : list);
        return;
      }
      if (tries++ < 40) setTimeout(load, 500);
    };
    load();
  }, []);

  // Track real interaction. Capture phase so we see it before anything swallows it.
  useEffect(() => {
    if (forceOpen) return;
    const seen = () => {
      lastActive.current = Date.now();
      setOpen(false);
    };
    const evts: (keyof DocumentEventMap)[] = ["touchstart", "pointerdown", "click", "keydown", "wheel"];
    evts.forEach((e) => document.addEventListener(e, seen, { capture: true, passive: true }));
    return () => evts.forEach((e) => document.removeEventListener(e, seen, { capture: true }));
  }, [forceOpen]);

  // The one loop: decide whether to show, and keep JSCart's timer alive while we do.
  useEffect(() => {
    if (forceOpen) return;
    const t = setInterval(() => {
      const idle = Date.now() - lastActive.current >= IDLE_MS;
      const ok = idle && deals.length > 0 && shouldShow();
      setOpen(ok);
      if (ok) {
        // Guards passed THIS tick — only now is suppressing the reset safe.
        if (++tick.current % KEEPALIVE_EVERY === 0) {
          document.dispatchEvent(new Event("mousemove"));
        }
      } else {
        tick.current = 0;
      }
    }, TICK_MS);
    return () => clearInterval(t);
  }, [forceOpen, deals.length, shouldShow]);

  // Rotate, and preload the next image so the change doesn't flash.
  useEffect(() => {
    if (!open || deals.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => {
        const next = (i + 1) % deals.length;
        const img = deals[(next + 1) % deals.length]?.image;
        if (img) {
          const pre = new Image();
          pre.src = encodeImage(img);
        }
        return next;
      });
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [open, deals]);

  if (!open || deals.length === 0) return null;

  const deal = deals[idx % deals.length];
  const headline = (deal.displayText || "").trim();

  return (
    <div className="kiosk-attract" role="presentation">
      <div className="kiosk-attract-brand">Today&rsquo;s Deals</div>

      {/* Sits on the black ABOVE the artwork, not on it — a glowing invitation
          that reads as "waiting for you" and never competes with the deal image. */}
      <span className="kiosk-attract-cue">Tap anywhere to shop</span>

      <div className="kiosk-attract-stage">
        <div className="kiosk-attract-frame">
          {deal.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={String(deal.id)}
              className="kiosk-attract-img"
              src={encodeImage(deal.image)}
              alt={deal.name || headline || "Deal"}
            />
          ) : (
            <div key={String(deal.id)} className="kiosk-attract-text">
              <b>{headline || deal.name}</b>
              {deal.message ? <em>{deal.message}</em> : null}
            </div>
          )}
        </div>
      </div>

      <div className="kiosk-attract-foot">
        <span className="kiosk-attract-dots">
          {deals.slice(0, 12).map((d, i) => (
            <i key={String(d.id)} className={i === idx % deals.length ? "on" : undefined} />
          ))}
        </span>
      </div>
    </div>
  );
}
