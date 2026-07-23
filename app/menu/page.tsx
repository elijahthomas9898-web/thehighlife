import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { getMenu } from "@/lib/proteus";
import { categories } from "@/data/site";
import MenuBrowser from "./MenuBrowser";
import MenuUnavailable from "../components/MenuUnavailable";

export const metadata: Metadata = {
  title: "Menu | The High Life Dispensary",
  description:
    "Browse the live menu at The High Life Dispensary in West Babylon, NY. In-store pickup, pay at the counter. 21+.",
};

export default async function MenuPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise and must be awaited
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const { products, live, error } = await getMenu();

  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  // only show tabs for categories we actually have stock in
  const tabs = categories.filter((c) => (counts.get(c.slug) ?? 0) > 0);
  const active = cat && counts.has(cat) ? cat : tabs[0]?.slug ?? "flower";
  const activeName = categories.find((c) => c.slug === active)?.name ?? active;

  const inCategory = products.filter((p) => p.category === active);

  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="menu-page">
        <div className="wrap">
          <div className="kicker">
            The Menu <span>/ {live ? "live from our shelves" : "temporarily unavailable"}</span>
          </div>
          <h2>Shop The Menu</h2>

          {live ? (
            <>
              <p className="menu-note ok">
                Showing <b>{products.length.toLocaleString()}</b> products in stock right now,
                synced from our register.
              </p>

              <div className="menu-tabs">
                {tabs.map((c) => (
                  <a
                    key={c.slug}
                    href={`/menu?cat=${c.slug}`}
                    className={`menu-tab${c.slug === active ? " on" : ""}`}
                  >
                    {c.name} <b>{counts.get(c.slug)}</b>
                  </a>
                ))}
              </div>

              <MenuBrowser products={inCategory} categoryName={activeName} />
            </>
          ) : (
            /* Never show invented products — say what's wrong and point people
               at the shop instead. */
            <MenuUnavailable error={error} />
          )}

          <p className="menu-legal">
            Menu reflects current in-store inventory and may change without notice. Prices exclude
            tax. In-store pickup only — pay at the counter. Must be 21+ with valid government ID.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
