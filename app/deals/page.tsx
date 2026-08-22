import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { categories } from "@/data/site";
import DealsBoard from "../components/DealsBoard";
import { getMenu } from "@/lib/proteus";

export const metadata: Metadata = {
  title: "Deals | The High Life Dispensary",
  description:
    "This week's cannabis deals at The High Life Dispensary in West Babylon, NY. New specials every week. 21+.",
};

export default async function DealsPage() {
  // live products that are actually marked down in the register
  const { products, live } = await getMenu();
  const onSale = products
    .filter((p) => p.salePrice != null && p.price != null && p.salePrice < p.price)
    .sort((a, b) => (b.price! - b.salePrice!) - (a.price! - a.salePrice!))
    .slice(0, 12);

  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            Deals Deals Deals <span>/ live from the register</span>
          </div>
          <h2>
            This Week&rsquo;s
            <br />
            Deals
          </h2>
          <p className="page-lead">
            We don&rsquo;t do markups — we do markdowns. These are pulled straight from our shop, so
            they&rsquo;re always current. Tap one to shop it. Prices exclude tax, while supplies last.
          </p>

          {/* Real deals, pulled live from JSCart so they always match the shop. */}
          <DealsBoard />

          {live && onSale.length > 0 && (
            <>
              <div className="kicker" style={{ marginTop: "clamp(60px,8vw,100px)" }}>
                Marked Down Right Now <span>/ straight from the register</span>
              </div>
              <h2>On Sale Today</h2>
              <p className="page-lead">
                These are live price drops on our shelves this minute — they change as stock moves.
              </p>

              <div className="prodgrid">
                {onSale.map((p) => (
                  <article className="prod" key={p.id}>
                    <div className="prod-img">
                      {p.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.imageUrl} alt={p.name} loading="lazy" />
                      ) : (
                        <div className="prod-noimg" aria-hidden="true" />
                      )}
                      <span className="prod-sale">Sale</span>
                    </div>
                    <div className="prod-body">
                      {p.brand && <div className="prod-brand">{p.brand}</div>}
                      <h3 className="prod-name">{p.name}</h3>
                      <div className="prod-foot">
                        <div className="prod-price">
                          <span className="was">${p.price!.toFixed(2)}</span>
                          <span className="now">${p.salePrice!.toFixed(2)}</span>
                        </div>
                        <span className="prod-stock">{p.stockCount} left</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="page-cta">
            <a className="btn primary" href="/menu">
              Browse The Full Menu →
            </a>
            {categories.slice(0, 3).map((c) => (
              <a className="btn ghost" href={`/menu#view=products&cat=${c.slug}`} key={c.slug}>
                {c.name}
              </a>
            ))}
          </div>

          <p className="menu-legal">
            Deals are subject to change and availability. Cannot always be combined with other
            offers — ask in store. Prices exclude tax. Must be 21+ with valid government ID.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
