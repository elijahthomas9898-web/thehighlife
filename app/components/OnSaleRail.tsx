import { getOnSaleProducts } from "@/lib/onsale";

/**
 * Horizontal rail of everything currently marked down, biggest saving first.
 *
 * Complements the deals slideshow rather than repeating it: that one shows coupon
 * artwork ("B1G1"), this shows real products at real prices ("$150 → $100").
 *
 * Deliberately reuses the site's existing product-card classes (.prod, .prod-img,
 * .prod-price .now/.was, .prod-sale) so a card here is visually identical to one
 * on the menu — only the scroller around them is new.
 *
 * Server component: the products are fetched server-side (see lib/onsale.ts), so
 * the cards are in the HTML rather than appearing after JavaScript. Renders
 * nothing at all if the feed is empty or unreachable.
 */
const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export default async function OnSaleRail() {
  const products = await getOnSaleProducts();
  if (products.length === 0) return null;

  return (
    <section className="onsale" id="onsale">
      <div className="wrap onsale-wrap">
        <div className="onsale-head">
          <h2>
            On Sale
            <br />
            Right Now
          </h2>
          <a className="btn ghost onsale-all" href="/menu#view=products&onsale=1">
            View All On Sale →
          </a>
        </div>

        <p className="onsale-lead">
          Live markdowns from the register, biggest savings first. Prices exclude tax, while
          supplies last.
        </p>

        {/* Scrolls horizontally on its own — the page must never scroll sideways. */}
        <div className="onsale-rail">
          {products.map((p) => (
            <a
              key={String(p.id)}
              className="prod onsale-card"
              href={`/menu#view=products&pid=${p.id}`}
              aria-label={`${p.name} — now ${money(p.salePrice)}, was ${money(p.price)}`}
            >
              <div className="prod-img">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : (
                  <div className="prod-noimg" />
                )}
                <span className="prod-sale">Save {money(p.saved)}</span>
              </div>

              <div className="prod-body">
                {p.brand ? <span className="prod-brand">{p.brand}</span> : null}
                <h3 className="prod-name">{p.name}</h3>
                <div className="prod-foot">
                  <span className="prod-price">
                    <span className="now">{money(p.salePrice)}</span>
                    <span className="was">{money(p.price)}</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
