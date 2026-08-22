"use client";

import { useEffect } from "react";
import type { Product } from "@/lib/types";

/* Shared product UI, used by both the menu browser and the deal pages. */

export function money(n?: number) {
  return n == null ? null : `$${n.toFixed(2)}`;
}

export function isOnSale(p: Product) {
  return p.salePrice != null && p.price != null && p.salePrice < p.price;
}

export function PriceTag({ p }: { p: Product }) {
  if (isOnSale(p)) {
    return (
      <>
        <span className="was">{money(p.price)}</span>
        <span className="now">{money(p.salePrice)}</span>
      </>
    );
  }
  return p.price != null ? <span className="now">{money(p.price)}</span> : null;
}

/**
 * Terpene bars. Widths are scaled to the STRONGEST terpene in the profile so
 * the shape is readable, but every bar is labelled with its true percentage —
 * the chart never implies a value Proteus didn't give us.
 */
export function TerpeneChart({ p }: { p: Product }) {
  const terps = p.lab?.topTerps;
  if (!terps?.length) return null;
  const max = Math.max(...terps.map((t) => t.percent));

  return (
    <div className="terp">
      <div className="terp-head">
        <h4>Terpene Profile</h4>
        {p.lab?.terpsTotal != null && (
          <span className="terp-total">{p.lab.terpsTotal.toFixed(2)}% total</span>
        )}
      </div>
      <ul className="terp-list">
        {terps.map((t) => (
          <li key={t.name}>
            <span className="terp-name">{t.name}</span>
            <span className="terp-bar" aria-hidden="true">
              <i style={{ width: `${Math.max((t.percent / max) * 100, 4)}%` }} />
            </span>
            <span className="terp-val">{t.percent.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Cannabinoids({ p }: { p: Product }) {
  const lab = p.lab;
  if (!lab) return null;
  const rows: [string, number | undefined][] = [
    ["THC", lab.thc],
    ["CBD", lab.cbd],
    ["THCA", lab.thca],
    ["CBG", lab.cbg],
    ["CBN", lab.cbn],
    ["CBC", lab.cbc],
    ["THCV", lab.thcv],
  ];
  const present = rows.filter(([, v]) => v != null);
  if (!present.length) return null;

  return (
    <div className="canna">
      {present.map(([label, v]) => (
        <div className="canna-cell" key={label}>
          <div className="canna-val">{v!.toFixed(2)}%</div>
          <div className="canna-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function ProductModal({
  p,
  onClose,
  onAdd,
  shopHref = "/menu",
}: {
  p: Product;
  onClose: () => void;
  /** Omit for browse-only pages — the modal then links to the JSCart menu. */
  onAdd?: (p: Product) => void;
  /** Where the "Shop in the Menu" link points (e.g. a brand-filtered menu). */
  shopHref?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("modal-open");
    };
  }, [onClose]);

  const hasLab = Boolean(p.lab?.thc || p.lab?.topTerps?.length);

  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalName"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-grid">
          <div className="modal-media">
            {p.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={p.imageUrl} alt={p.name} />
            ) : (
              <div className="prod-noimg" aria-hidden="true" />
            )}
            {isOnSale(p) && <span className="prod-sale">Sale</span>}
          </div>

          <div className="modal-body">
            {p.brand && <div className="prod-brand">{p.brand}</div>}
            <h3 id="modalName">{p.name}</h3>

            <div className="modal-tags">
              {p.dominance && (
                <span className={`dom dom-${p.dominance.toLowerCase()}`}>{p.dominance}</span>
              )}
              {p.strain && <span className="tag">{p.strain}</span>}
              {p.proteusCategory && <span className="prod-cat">{p.proteusCategory}</span>}
            </div>

            <div className="modal-buy">
              <div className="prod-price">
                <PriceTag p={p} />
              </div>
              {p.stockCount != null && <span className="prod-stock">{p.stockCount} in stock</span>}
            </div>

            {onAdd ? (
              <button className="btn primary addbtn" onClick={() => onAdd(p)}>
                + Add to Cart
              </button>
            ) : (
              <a className="btn primary addbtn" href={shopHref}>
                Shop in the Menu →
              </a>
            )}

            <Cannabinoids p={p} />
            <TerpeneChart p={p} />

            {p.description && (
              <div className="modal-desc">
                {p.description.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {!hasLab && (
              <p className="modal-nolab">
                Lab details aren&rsquo;t published for this product yet — ask us in store and
                we&rsquo;ll pull the COA for you.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({
  p,
  onOpen,
  onAdd,
}: {
  p: Product;
  onOpen: (p: Product) => void;
  /** Omit for browse-only pages — the quick-add button is then hidden. */
  onAdd?: (p: Product) => void;
}) {
  return (
    <article className="prod is-clickable">
      <button className="prod-open" onClick={() => onOpen(p)} aria-label={`View ${p.name}`}>
        <div className="prod-img">
          {p.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={p.imageUrl} alt={p.name} loading="lazy" />
          ) : (
            <div className="prod-noimg" aria-hidden="true" />
          )}
          {isOnSale(p) && <span className="prod-sale">Sale</span>}
          {p.lab?.thc != null && <span className="prod-thc">{p.lab.thc.toFixed(1)}% THC</span>}
        </div>
        <div className="prod-body">
          {p.brand && <div className="prod-brand">{p.brand}</div>}
          <h3 className="prod-name">{p.name}</h3>
          <div className="prod-tags">
            {p.dominance && (
              <span className={`dom dom-${p.dominance.toLowerCase()}`}>{p.dominance}</span>
            )}
            {p.proteusCategory && <span className="prod-cat">{p.proteusCategory}</span>}
          </div>
        </div>
      </button>

      <div className="prod-foot">
        <div className="prod-price">
          <PriceTag p={p} />
        </div>
        {onAdd && (
          <button
            className="quickadd"
            onClick={() => onAdd(p)}
            aria-label={`Add ${p.name} to your pickup list`}
            title="Add to your pickup list"
          >
            +
          </button>
        )}
      </div>
    </article>
  );
}
