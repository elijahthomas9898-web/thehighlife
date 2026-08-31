"use client";

import { useCallback, useEffect, useState } from "react";
import { KIOSK_SETTINGS_EVENT, loadKioskSettings } from "@/lib/kioskSettings";

/**
 * Full-screen deals view for the kiosk — the same enlarged 16:9 picture tiles the
 * website's /deals page shows.
 *
 * It can't just link to /deals: leaving /kiosk drops out of kiosk mode. So instead
 * of navigating, this reads the same deal list the widget already holds
 * (ProteusWidget.getDeals()) and renders the tiles itself, then hands the tap back
 * to the widget via _filterByCoupon(id) — the exact call the widget's own deal
 * cards make. The shopper lands on that deal's products without ever leaving the
 * kiosk.
 *
 * Opened by the "View All Deals" button that MenuDealsMore injects, over a window
 * event so the two don't have to be wired together through the widget's DOM.
 */
export const KIOSK_DEALS_EVENT = "hl-kiosk-deals";

type Deal = {
  id: number | string;
  image?: string;
  name?: string;
  displayText?: string;
  message?: string;
};

/** Mirrors the widget's encodeImageUrl: leave clean URLs alone, encode the rest. */
function encodeImage(url: string): string {
  if (!url) return "";
  const needsEncoding = /[\s#[\]{}|\\^`<>"]|[^\x00-\x7F]/;
  if (!needsEncoding.test(url)) return url;
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
}

export default function KioskDealsPanel() {
  // Switched per device at /kiosk/settings.
  const [enabled, setEnabled] = useState(() => loadKioskSettings().dealsPanelEnabled);
  useEffect(() => {
    const sync = () => setEnabled(loadKioskSettings().dealsPanelEnabled);
    window.addEventListener(KIOSK_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(KIOSK_SETTINGS_EVENT, sync);
  }, []);
  const [open, setOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => {
      let list: Deal[] = [];
      try {
        list = (window.ProteusWidget?.getDeals?.() as Deal[]) ?? [];
      } catch {
        list = [];
      }
      setDeals(list);
      setOpen(true);
    };
    window.addEventListener(KIOSK_DEALS_EVENT, onOpen);
    return () => window.removeEventListener(KIOSK_DEALS_EVENT, onOpen);
  }, []);

  // Escape closes it too — handy for staff with a keyboard attached.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!enabled || !open) return null;

  const pick = (d: Deal) => {
    close();
    try {
      window.ProteusWidget?._filterByCoupon?.(d.id);
    } catch {}
  };

  return (
    <div className="kiosk-deals" role="dialog" aria-modal="true" aria-label="All deals">
      <div className="kiosk-deals-head">
        <h2 className="kiosk-deals-title">This Week&rsquo;s Deals</h2>
        <button type="button" className="kiosk-deals-close" onClick={close}>
          Close ✕
        </button>
      </div>

      {deals.length === 0 ? (
        <p className="kiosk-deals-empty">No deals are running right now — check the menu for today&rsquo;s prices.</p>
      ) : (
        <div className="kiosk-deals-grid">
          {deals.map((d) => {
            const headline = (d.displayText || "").trim();
            return (
              <button
                key={String(d.id)}
                type="button"
                className={`kiosk-deal${d.image ? "" : " no-image"}`}
                onClick={() => pick(d)}
              >
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={encodeImage(d.image)} alt={d.name || headline || "Deal"} />
                ) : (
                  <span className="kiosk-deal-text">
                    <b>{headline || d.name}</b>
                    {d.message ? <em>{d.message}</em> : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
