import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProteusShop from "../components/ProteusShop";

export const metadata: Metadata = {
  title: "Deals | The High Life Dispensary",
  description:
    "This week's cannabis deals at The High Life Dispensary in West Babylon, NY — straight from our shop. 21+.",
};

/**
 * The deals page embeds the real JSCart widget and shows ONLY its native
 * "Today's Deals" section (the `.deals-only` CSS in globals.css hides the rest of
 * the shop chrome). This renders the store's actual deals directly from JSCart —
 * reliable, always current, and clickable — instead of custom cards.
 */
export default function DealsPage() {
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap order-wrap">
          <div className="kicker">
            Deals Deals Deals <span>/ live from the register</span>
          </div>
          <h2>
            This Week&rsquo;s
            <br />
            Deals
          </h2>
          <p className="page-lead">
            Our current deals, straight from the shop — always up to date. Tap <b>Shop Now</b> on any
            deal to see what qualifies. Prices exclude tax, while supplies last.
          </p>

          <div className="deals-only">
            <ProteusShop />
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
