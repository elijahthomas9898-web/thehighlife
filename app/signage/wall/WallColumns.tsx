"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/types";

export type WallColumn = { title: string; products: Product[] };

const RELOAD_MS = 5 * 60 * 1000; // refresh stock every 5 min

function money(n?: number) {
  return n == null ? "" : `$${n.toFixed(2)}`;
}

/** One product row on the board: thumbnail, brand + name, THC, price. */
function Row({ p }: { p: Product }) {
  const sale = p.salePrice != null && p.price != null && p.salePrice < p.price;
  return (
    <li className={sale ? "wr on-sale" : "wr"}>
      <div className="wr-thumb">
        {p.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={p.imageUrl} alt="" decoding="async" />
        ) : (
          <div className="wr-noimg" aria-hidden="true" />
        )}
      </div>
      <div className="wr-main">
        {p.brand && <span className="wr-brand">{p.brand}</span>}
        <span className="wr-name">{p.name}</span>
      </div>
      <div className="wr-side">
        {p.lab?.thc != null && <span className="wr-thc">{p.lab.thc.toFixed(0)}%</span>}
        {sale ? (
          <span className="wr-price sale">
            <span className="wr-saletag">Sale</span>
            <s>{money(p.price)}</s>
            <b>{money(p.salePrice)}</b>
          </span>
        ) : (
          <span className="wr-price">
            <b>{money(p.price)}</b>
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Max products that scroll in one column. A menu board doesn't need 300 at
 * once — and a giant scrolling layer (hundreds of rows, each with an image)
 * overwhelms a weak signage player's GPU, which is what made some columns
 * stutter/pause while lighter ones stayed smooth. Capping keeps the animated
 * layer small so every column scrolls at a constant, even speed.
 */
const MAX_ROWS = 28;

function Column({ col, secondsPerItem }: { col: WallColumn; secondsPerItem: number }) {
  const items = col.products.slice(0, MAX_ROWS);
  // duration scales with item count so every column moves at the SAME pixel speed
  const duration = Math.max(items.length * secondsPerItem, 20);

  return (
    <section className="wall-col">
      <header className="wall-col-head">
        <h2>{col.title}</h2>
      </header>

      <div className="wall-scrollport">
        {items.length === 0 ? (
          <p className="wall-empty">Restocking soon</p>
        ) : (
          // list rendered twice so translateY(-50%) wraps seamlessly
          <ul className="wall-track" style={{ animationDuration: `${duration}s` }}>
            {items.map((p) => (
              <Row key={p.id} p={p} />
            ))}
            {items.map((p) => (
              <Row key={`dup-${p.id}`} p={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function WallColumns({
  columns,
  live,
  secondsPerItem,
}: {
  columns: WallColumn[];
  live: boolean;
  secondsPerItem: number;
}) {
  // reload periodically so the board reflects current stock even if the
  // signage player never reloads the URL itself
  useEffect(() => {
    const t = setTimeout(() => location.reload(), RELOAD_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="wall" data-cols={columns.length}>
      {columns.map((c, i) => (
        <Column key={`${c.title}-${i}`} col={c} secondsPerItem={secondsPerItem} />
      ))}
      {!live && <div className="wall-updating">menu updating…</div>}
    </div>
  );
}
