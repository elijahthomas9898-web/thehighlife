import type { ShopDeal } from "@/lib/deals";

/**
 * Scrollable row of the real deal tiles for the homepage deals band.
 *
 * Replaces an auto-advancing slideshow. Auto-rotation meant a deal you wanted to
 * read could slide away mid-look, and there was no way to go back to it; this puts
 * the pace in the visitor's hands — swipe on a phone, trackpad or drag on desktop.
 *
 * No client JavaScript: it's a plain overflow-x container with scroll-snap, so the
 * tiles are in the HTML and work before (and without) hydration. Each links to that
 * deal's products via the numeric coupon hash — the slug only sets a label.
 *
 * The next tile is deliberately left peeking at the edge; that overflow is the
 * only affordance telling people there's more to scroll.
 */
export default function DealsRail({ deals }: { deals: ShopDeal[] }) {
  if (deals.length === 0) return null;

  return (
    <div className="dealsrail" role="region" aria-label="This week's deals">
      {deals.map((d) => (
        <a
          key={String(d.id)}
          className="dealsrail-tile"
          href={`/menu#view=products&coupon=${d.id}`}
          aria-label={`Shop ${d.name || d.message || "this deal"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.image} alt={d.name || d.message || "Deal"} loading="lazy" decoding="async" />
        </a>
      ))}
    </div>
  );
}
