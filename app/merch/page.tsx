import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { getMenu } from "@/lib/proteus";
import BrowseGrid from "../components/BrowseGrid";

export const metadata: Metadata = {
  title: "Merch & Accessories | The High Life Dispensary",
  description:
    "Batteries, grinders, papers, lighters and High Life gear at our West Babylon, NY dispensary. 21+.",
};

/** Proteus category slugs that count as merch/accessories. */
const MERCH_SLUGS = ["accessories"];

export default async function MerchPage() {
  const { products, live, error } = await getMenu();
  const merch = products.filter((p) => MERCH_SLUGS.includes(p.category));

  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="menu-page">
        <div className="wrap">
          <h2>
            Merch &amp;
            <br />
            Accessories
          </h2>

          {live ? (
            <p className="menu-note ok">
              <b>{merch.length}</b> items in stock — batteries, grinders, papers, lighters and High
              Life gear.
            </p>
          ) : (
            <p className="menu-note warn">
              <b>Our menu is temporarily unavailable.</b> We&rsquo;d rather show nothing than
              show you inaccurate stock — come in or email us and we&rsquo;ll tell you what we
              have.
            </p>
          )}

          {merch.length > 0 ? (
            <BrowseGrid products={merch} />
          ) : (
            <p className="menu-note warn">Nothing in stock in this category right now.</p>
          )}

          <p className="menu-legal">
            Accessories are not cannabis products. Menu reflects current in-store inventory and may
            change without notice. Prices exclude tax. In-store pickup only — pay at the counter.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
