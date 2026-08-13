"use client";

import { useEffect, useRef, useState } from "react";

/** The minimal per-product shape the board renders (slimmed server-side). */
export type WallItem = {
  id: string;
  brand?: string;
  name: string;
  price?: number;
  salePrice?: number;
  thc?: number;
  imageUrl?: string;
};

export type WallColumn = { title: string; products: WallItem[] };

const RELOAD_MS = 5 * 60 * 1000; // refresh stock every 5 min

function money(n?: number) {
  return n == null ? "" : `$${n.toFixed(2)}`;
}

/** One product row on the board: thumbnail, brand + name, THC, price. */
function Row({ p }: { p: WallItem }) {
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
        {p.thc != null && <span className="wr-thc">{p.thc.toFixed(0)}%</span>}
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
 * A recycling ("virtualized") scroller. Only WINDOW rows ever exist in the DOM;
 * as the column scrolls, rows that leave the top are recycled to the bottom with
 * the next product, cycling through the WHOLE category — however many products
 * there are. The signage player only ever composites a screenful, so it stays
 * smooth no matter the inventory size (the earlier stutter was a giant 300-row
 * layer the GPU couldn't keep up with).
 *
 * Rows are a FIXED height (CSS), so recycling is exact and we can measure the
 * row height once instead of reading layout every frame.
 */
const WINDOW = 15; // rows kept mounted: ~2 above the viewport + visible + a few below
const TOP_BUFFER = 2; // recycle only once a row is this many rows ABOVE the viewport (off-screen → seamless)

function Column({ col, secondsPerItem }: { col: WallColumn; secondsPerItem: number }) {
  const products = col.products;
  const n = products.length;

  // `head` = index (into the full list) of the top row in the window. Rendering
  // products[(head+i) % n] with key = head+i means each scroll step reuses every
  // row but one — only the exited row unmounts and the entering one mounts.
  const [head, setHead] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const rowHRef = useRef(0);

  useEffect(() => {
    if (n === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // rows are fixed-height, so measuring the first one once (per resize) is enough
    const measure = () => {
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (first?.offsetHeight) rowHRef.current = first.offsetHeight;
    };
    measure();
    window.addEventListener("resize", measure);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp big gaps (e.g. tab backgrounded)
      last = now;
      const rowH = rowHRef.current || 100;
      const speed = rowH / Math.max(secondsPerItem, 0.5); // px/sec ≈ one row every `secondsPerItem`
      offsetRef.current += speed * dt;
      // recycle when the top row is safely off-screen (TOP_BUFFER rows up)
      let recycled = false;
      if (offsetRef.current >= TOP_BUFFER * rowH) {
        offsetRef.current -= rowH;
        setHead((h) => h + 1);
        recycled = true;
      }
      // On the recycle frame, skip the transform write: the DOM (head) and the
      // offset both shift by one row, and letting the previous transform hold for
      // that single frame — then re-applying next frame on the new DOM — keeps the
      // motion perfectly continuous with no swap flicker.
      if (!recycled && trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [n, secondsPerItem]);

  const rows = [];
  for (let i = 0; i < WINDOW && n > 0; i++) {
    const k = head + i;
    rows.push(<Row key={k} p={products[k % n]} />);
  }

  return (
    <section className="wall-col">
      <header className="wall-col-head">
        <h2>{col.title}</h2>
      </header>

      <div className="wall-scrollport">
        {n === 0 ? (
          <p className="wall-empty">Restocking soon</p>
        ) : (
          <ul className="wall-track" ref={trackRef}>
            {rows}
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
