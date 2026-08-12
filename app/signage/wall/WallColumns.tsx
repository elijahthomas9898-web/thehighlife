"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/types";

export type WallColumn = { title: string; products: Product[] };

const RELOAD_MS = 5 * 60 * 1000; // refresh stock every 5 min

function money(n?: number) {
  return n == null ? "" : `$${n.toFixed(2)}`;
}

/** One product row on the board. Text-forward for TV legibility. */
function Row({ p }: { p: Product }) {
  const sale = p.salePrice != null && p.price != null && p.salePrice < p.price;
  return (
    <li className="wr">
      <div className="wr-main">
        {p.brand && <span className="wr-brand">{p.brand}</span>}
        <span className="wr-name">{p.name}</span>
      </div>
      <div className="wr-side">
        {p.lab?.thc != null && <span className="wr-thc">{p.lab.thc.toFixed(0)}%</span>}
        <span className="wr-price">
          {sale ? (
            <>
              <s>{money(p.price)}</s> <b>{money(p.salePrice)}</b>
            </>
          ) : (
            <b>{money(p.price)}</b>
          )}
        </span>
      </div>
    </li>
  );
}

function Column({ col, secondsPerItem }: { col: WallColumn; secondsPerItem: number }) {
  const items = col.products;
  // duration scales with how much there is to scroll; min so short lists aren't frantic
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
