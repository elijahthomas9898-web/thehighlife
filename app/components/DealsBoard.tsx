"use client";

import { useEffect, useState } from "react";

/**
 * Renders the store's REAL deals, pulled live from Proteus's JSCart (the same
 * "TODAY'S DEALS" you see inside the shop) — so this page always matches JSCart
 * instead of a hand-kept list.
 *
 * JSCart only exposes its deals through the widget's `getDeals()`, so we load the
 * widget into an off-screen probe container purely to read that data, then render
 * our own branded cards. Each card deep-links into the menu filtered to that
 * deal: /menu#view=products&coupon=<slug> (confirmed the widget reads it on load).
 */
const WIDGET_SRC = "https://cart.proteus420.com/highlife/cart-widget.js.cfm?v=4";
const PROBE_ID = "proteus_deals_probe";

type JsDeal = {
  id: number;
  name: string;
  message?: string;
  displayText?: string;
  type?: string;
  amount?: number;
  slug: string;
  image?: string;
  hasProducts?: boolean;
};

function typeLabel(t?: string) {
  if (t === "bogx") return "BOGO";
  if (t === "percent") return "% Off";
  if (t === "dollar") return "$ Off";
  return "Deal";
}

export default function DealsBoard() {
  const [deals, setDeals] = useState<JsDeal[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // the widget's init/reflows shouldn't fight the page's smooth scroll
    const html = document.documentElement;
    const prevSB = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    let cancelled = false;
    let tries = 0;

    const poll = () => {
      if (cancelled) return;
      const w = window.ProteusWidget;
      const d = w && w.getDeals ? w.getDeals() : null;
      if (Array.isArray(d) && d.length) {
        setDeals(d as JsDeal[]);
        return;
      }
      if (tries++ > 60) {
        setFailed(true);
        return;
      }
      setTimeout(poll, 200);
    };

    const init = () => {
      const w = window.ProteusWidget;
      if (!w) return;
      try {
        w.init({ client: "highlife", mode: "full", containerId: PROBE_ID, theme: "dark" });
      } catch {
        /* ignore — poll will time out and show the fallback */
      }
      poll();
    };

    if (window.ProteusWidget) {
      init();
    } else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
      if (s) {
        s.addEventListener("load", init);
      } else {
        s = document.createElement("script");
        s.src = WIDGET_SRC;
        s.async = true;
        s.onload = init;
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      html.style.scrollBehavior = prevSB;
    };
  }, []);

  const total = deals ? String(deals.length).padStart(2, "0") : "";

  return (
    <>
      {/* off-screen container the widget mounts into just so getDeals() works */}
      <div
        id={PROBE_ID}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "1000px",
          height: "800px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />

      {deals === null && !failed && <p className="menu-note">Loading this week&rsquo;s deals…</p>}

      {failed && (
        <p className="menu-note warn">
          Couldn&rsquo;t load deals just now —{" "}
          <a href="/menu" style={{ color: "var(--green)" }}>
            browse the menu →
          </a>
        </p>
      )}

      {deals && deals.length > 0 && (
        <div className="dealgrid">
          {deals.map((d, i) => (
            <a
              className="deal"
              key={d.id}
              href={`/menu#view=products&coupon=${encodeURIComponent(d.slug)}`}
            >
              <div className="top">
                <span className="idx">
                  {String(i + 1).padStart(2, "0")} / {total}
                </span>
                <span className="tag">{typeLabel(d.type)}</span>
              </div>
              <div>
                <h3>{d.name}</h3>
              </div>
              <div className="meta">
                <div className="val">{d.displayText || typeLabel(d.type)}</div>
                <div className="valid">
                  All week
                  <small>shop now →</small>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
