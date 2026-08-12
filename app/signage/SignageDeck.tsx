"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import type { Deal } from "@/data/site";

/** Full-screen, no-interaction menu display for OptiSigns / in-store TVs. */

const SLIDE_MS = 12000; // time on each slide
const RELOAD_MS = 5 * 60 * 1000; // pull fresh stock every 5 min

type Slide =
  | { kind: "welcome" }
  | { kind: "deals"; deals: Deal[] }
  | { kind: "products"; items: Product[]; label: string };

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function money(n?: number) {
  return n == null ? "" : `$${n.toFixed(2)}`;
}

export default function SignageDeck({
  deals,
  products,
  live,
  store,
  hours,
}: {
  deals: Deal[];
  products: Product[];
  live: boolean;
  store: { name: string; license: string; addr: string };
  hours: { day: string; label: string }[];
}) {
  const slides = useMemo<Slide[]>(() => {
    const s: Slide[] = [{ kind: "welcome" }];
    if (deals.length) {
      // up to 6 deals per slide
      for (const c of chunk(deals.slice(0, 12), 6)) s.push({ kind: "deals", deals: c });
    }
    for (const c of chunk(products, 6)) s.push({ kind: "products", items: c, label: "On The Shelf" });
    return s;
  }, [deals, products]);

  const [i, setI] = useState(0);

  // advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  // refresh data periodically (in case the signage player doesn't reload the URL)
  useEffect(() => {
    const t = setTimeout(() => location.reload(), RELOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const todayIdx = (() => {
    try {
      const d = new Date().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short" });
      return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[d as "Mon"] ?? -1;
    } catch {
      return -1;
    }
  })();

  const slide = slides[i] ?? slides[0];

  return (
    <div className="sg">
      <header className="sg-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sg-logo" src="/images/logo.png" alt="The High Life Dispensary" />
        <div className="sg-hours">
          {hours.map((h, idx) => (
            <span key={h.day} className={idx === todayIdx ? "on" : undefined}>
              {h.day} {h.label}
            </span>
          ))}
        </div>
      </header>

      <main className="sg-stage" key={i}>
        {slide.kind === "welcome" && (
          <div className="sg-welcome">
            <div className="sg-eyebrow">Licensed New York Adult-Use Dispensary</div>
            <h1>
              West Babylon&rsquo;s
              <br />
              <span className="g">Neighborhood Dispensary</span>
            </h1>
            <p>
              Order ahead for pickup at <b>thehighlifeny.com</b> — fresh deals every week.
            </p>
          </div>
        )}

        {slide.kind === "deals" && (
          <div className="sg-body">
            <h2 className="sg-h">This Week&rsquo;s Deals</h2>
            <div className="sg-deals">
              {slide.deals.map((d) => (
                <div className="sg-deal" key={d.name}>
                  <span className="sg-deal-tag">{d.tag}</span>
                  <div className="sg-deal-name">{d.name}</div>
                  <div className="sg-deal-val">{d.value}</div>
                  <div className="sg-deal-valid">{d.valid}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.kind === "products" && (
          <div className="sg-body">
            <h2 className="sg-h">{slide.label}</h2>
            <div className="sg-grid">
              {slide.items.map((p) => {
                const sale = p.salePrice != null && p.price != null && p.salePrice < p.price;
                return (
                  <div className="sg-card" key={p.id}>
                    <div className="sg-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="sg-noimg" />}
                      {sale && <span className="sg-sale">Sale</span>}
                      {p.lab?.thc != null && <span className="sg-thc">{p.lab.thc.toFixed(0)}% THC</span>}
                    </div>
                    <div className="sg-info">
                      {p.brand && <div className="sg-brand">{p.brand}</div>}
                      <div className="sg-name">{p.name}</div>
                      <div className="sg-price">
                        {sale ? (
                          <>
                            <span className="was">{money(p.price)}</span>{" "}
                            <span className="now">{money(p.salePrice)}</span>
                          </>
                        ) : (
                          <span className="now">{money(p.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="sg-foot">
        <span>{store.name}</span>
        <span>{store.addr}</span>
        <span>21+ · NYS OCM# {store.license}</span>
        {!live && <span className="sg-warn">menu updating…</span>}
      </footer>

      {/* progress dots */}
      <div className="sg-dots" aria-hidden="true">
        {slides.map((_, n) => (
          <i key={n} className={n === i ? "on" : undefined} />
        ))}
      </div>
    </div>
  );
}
