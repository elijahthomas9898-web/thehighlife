import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { store } from "@/data/site";

export const metadata: Metadata = {
  title: "FAQ | The High Life Dispensary — West Babylon, NY",
  description:
    "Answers about shopping at The High Life, a licensed adult-use cannabis dispensary in West Babylon, NY: products, pickup, deals, ID requirements, and New York cannabis law. 21+.",
  alternates: { canonical: "/faq" },
};

type QA = { q: string; a: string };
type Group = { h: string; items: QA[] };

/**
 * The FAQ content, in one place, used TWICE on this page: once for the visible
 * accordions and once to build the FAQPage structured data below. The single
 * source is the point — search engines penalise structured data that doesn't
 * match what the visitor sees, and two hand-maintained copies WILL drift.
 *
 * Grouped so the page can be scanned. The order runs from "who are you" through
 * "what do you sell" to "what do I need to bring" — roughly the order a
 * first-time customer asks them in.
 */
const groups: Group[] = [
  {
    h: "About The High Life",
    items: [
      {
        q: "What is The High Life?",
        a: "The High Life is a licensed adult-use cannabis dispensary in West Babylon, New York, serving Long Island with a premium cannabis shopping experience built around honest pricing, expert guidance, and a curated menu of top cannabis brands. We offer flower, pre-rolls, vapes, edibles, concentrates, beverages, tinctures, and wellness products for adult consumers 21+.",
      },
      {
        q: "What makes The High Life different from other Long Island dispensaries?",
        a: "The High Life was built around a smarter definition of value: premium cannabis products, expert guidance, an elevated retail experience, and fair pricing without inflated markups. Our goal is to become the most trusted cannabis dispensary on Long Island.",
      },
      {
        q: "Where is The High Life cannabis dispensary located?",
        a: "The High Life is located in West Babylon, New York, conveniently serving customers across Long Island including Babylon, Lindenhurst, Deer Park, Huntington, Farmingdale, Massapequa, Islip, and surrounding communities looking for a trusted legal cannabis dispensary nearby.",
      },
      {
        q: "Is The High Life a licensed legal cannabis dispensary in New York?",
        a: "Yes. The High Life is a licensed adult-use cannabis dispensary operating in compliance with New York State cannabis regulations. All products sold are tested, regulated, and sourced through New York’s legal cannabis market.",
      },
    ],
  },
  {
    h: "Products & Ordering",
    items: [
      {
        q: "What cannabis products does The High Life sell?",
        a: "The High Life offers a curated selection of legal cannabis products including premium flower, pre-rolls, vape cartridges, disposable vapes, gummies and other edibles, concentrates, cannabis beverages, tinctures, topicals, and wellness-focused cannabis products from leading New York cannabis brands.",
      },
      {
        q: "What are the best cannabis brands available at The High Life?",
        a: "The High Life carries a rotating selection of trusted cannabis brands available in New York, with a focus on product quality, consistency, and customer value. Our menu is curated to help customers discover the products actually worth buying.",
      },
      {
        q: "Can I order cannabis online from The High Life?",
        a: "Yes. Eligible customers can browse our online cannabis menu, check product availability, and place orders for pickup in accordance with New York State regulations.",
      },
      {
        q: "Do you offer cannabis pickup in West Babylon?",
        a: "Yes. The High Life offers convenient cannabis pickup for eligible adult-use customers shopping from West Babylon and surrounding Long Island communities.",
      },
    ],
  },
  {
    h: "Deals & Payment",
    items: [
      {
        q: "Does The High Life offer cannabis deals or daily specials?",
        a: "Yes. The High Life offers ongoing promotions, grand opening specials, and our “Every Day Is 4/20” daily deals program featuring rotating offers on top cannabis products. Promotions may vary based on availability and New York compliance guidelines.",
      },
      {
        q: "Does The High Life have a best price guarantee?",
        a: "Yes. If you find the same advertised cannabis product for a lower price, The High Life will match the price and provide a $4.20 credit toward your next purchase, because premium cannabis should come with honest pricing.",
      },
      {
        q: "Can I pay with a credit card at The High Life?",
        a: "Payment options may vary depending on current cannabis retail payment processing availability. Contact The High Life or check in-store for current accepted payment methods.",
      },
    ],
  },
  {
    h: "Age, ID & New York Law",
    items: [
      {
        q: "Do I need a medical card to shop at The High Life?",
        a: "No. The High Life is an adult-use recreational cannabis dispensary. Anyone 21 years of age or older with valid government-issued identification can shop without a medical cannabis card.",
      },
      {
        q: "What do I need to buy cannabis in New York?",
        a: "To purchase legal adult-use cannabis in New York, you must be at least 21 years old and present a valid government-issued photo ID at the dispensary.",
      },
      {
        q: "How much cannabis can I legally buy in New York?",
        a: "Under New York adult-use cannabis law, eligible adults can purchase cannabis within state legal possession limits. Our team can help guide you through current purchasing regulations during your visit.",
      },
    ],
  },
];

/**
 * schema.org FAQPage markup, built from the SAME `groups` above so it can never
 * describe something the page doesn't show. This is what lets search engines and
 * AI answer engines read the page as questions and answers rather than as a wall
 * of text.
 *
 * On expectations: since 2023 Google has limited its expandable FAQ rich result
 * to government and health sites, so this probably won't draw that dropdown in
 * Google. It's still correct markup, Bing and the AI answer engines do use it,
 * and it costs one static script tag.
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: groups.flatMap((g) =>
    g.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default function FaqPage() {
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <h2>Frequently Asked Questions</h2>

          <p className="faq-lead">
            Everything people ask us most — what we carry, how ordering works, and what to bring.
            Still stuck? <a href={`mailto:${store.email}`}>Email us</a> or{" "}
            <a href="/visit">stop by the shop</a>.
          </p>

          <div className="faq">
            {groups.map((g) => (
              <section className="faq-group" key={g.h}>
                <h3>{g.h}</h3>
                {g.items.map((item) => (
                  /* Native <details>, not a JavaScript accordion: it opens before
                     (and without) hydration, the keyboard and screen-reader
                     behaviour is the browser's own, and every answer sits in the
                     HTML where crawlers read it even while collapsed. */
                  <details className="faq-item" key={item.q}>
                    <summary>
                      <span className="faq-q">{item.q}</span>
                      <span className="faq-mark" aria-hidden="true" />
                    </summary>
                    <p className="faq-a">{item.a}</p>
                  </details>
                ))}
              </section>
            ))}
          </div>

          <div className="page-cta">
            <a className="btn primary" href="/menu">
              Browse The Menu →
            </a>
            <a className="btn ghost" href="/visit">
              Hours & Directions
            </a>
          </div>

          <p className="menu-legal">
            {store.name} is licensed by the New York State Office of Cannabis Management, NYS OCM#{" "}
            {store.license}. We sell to adults 21 and older only, with valid government-issued ID.
            The answers above are general information about our shop, not legal advice — New York
            State rules are set by the Office of Cannabis Management and can change.
          </p>
        </div>
      </section>

      <Footer />

      <script
        type="application/ld+json"
        // Static, authored content — and `<` is escaped regardless, so no string
        // in the copy can ever close this tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
