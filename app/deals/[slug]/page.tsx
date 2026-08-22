import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BrowseGrid from "../../components/BrowseGrid";
import { deals, dealSlug, findDealBySlug, dealMatchesProduct } from "@/data/site";
import { getMenu } from "@/lib/proteus";

/** Pre-build a route for every deal. */
export function generateStaticParams() {
  return deals.map((d) => ({ slug: dealSlug(d) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const deal = findDealBySlug(slug);
  if (!deal) return { title: "Deal not found | The High Life Dispensary" };
  return {
    title: `${deal.name} | The High Life Dispensary`,
    description: `${deal.desc} — ${deal.valid}. In-store pickup at The High Life Dispensary, West Babylon NY. 21+.`,
  };
}

export default async function DealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = findDealBySlug(slug);
  if (!deal) notFound();

  const { products, live } = await getMenu();
  const matches = products.filter((p) => dealMatchesProduct(deal, p));

  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <a className="backlink" href="/deals">
            ← All deals
          </a>

          <div className="dealhead">
            <div className="dealhead-main">
              <span className="tag">{deal.tag}</span>
              <h2>{deal.name}</h2>
              <p className="page-lead">{deal.desc}</p>
              <div className="dealhead-meta">
                <span className="dealhead-valid">{deal.valid}</span>
                <span className="dealhead-code">
                  Code <b>{deal.code}</b>
                </span>
              </div>
            </div>
            <div className="dealhead-value">{deal.value}</div>
          </div>

          {matches.length > 0 ? (
            <>
              <div className="kicker dealhead-kicker">
                {matches.length} {matches.length === 1 ? "product" : "products"} in this deal ·
                applied automatically at checkout in the menu
              </div>
              <BrowseGrid products={matches} />
            </>
          ) : (
            <p className="menu-note warn">
              {live
                ? `No ${deal.tag} products are in stock right now. This deal is still running — check back, or ask us in store.`
                : "Couldn't reach the live menu, so we can't show this deal's products right now."}
            </p>
          )}

          <div className="page-cta">
            <a className="btn primary" href="/menu">
              Browse The Full Menu →
            </a>
            <a className="btn ghost" href="/deals">
              See All Deals
            </a>
          </div>

          <p className="menu-legal">
            Discount applies at the register. Deals are subject to change and availability, and
            can&rsquo;t always be combined with other offers — ask in store. Prices exclude tax.
            Must be 21+ with valid government ID.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
