import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { categories, categoryMenuHref } from "@/data/site";
import { getMenu } from "@/lib/proteus";

export const metadata: Metadata = {
  title: "Shop by Category | The High Life Dispensary",
  description:
    "Shop flower, pre-rolls, vapes, edibles, concentrate and topicals at The High Life Dispensary, West Babylon NY. 21+.",
};

export default async function ShopPage() {
  const { products, live } = await getMenu();

  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            The Shop <span>/ browse by category</span>
          </div>
          <h2>
            Shop By
            <br />
            Category
          </h2>
          <p className="page-lead">
            {live
              ? "Counts below are live — they reflect exactly what's on our shelves right now."
              : "Pick a category to browse the menu."}
          </p>

          <div className="catgrid">
            {categories.map((c, i) => {
              const n = counts.get(c.slug) ?? 0;
              return (
                <a
                  className={`cat${c.image ? "" : " no-photo"}`}
                  key={c.slug}
                  href={categoryMenuHref(c.slug)}
                  style={c.image ? { backgroundImage: `url('${c.image}')` } : undefined}
                >
                  <span className="arrow">↗</span>
                  <span className="cn">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                  {n > 0 && <span className="cat-count">{n} in stock</span>}
                </a>
              );
            })}
          </div>

          <div className="page-cta">
            <a className="btn primary" href="/menu">
              See Everything In Stock →
            </a>
            <a className="btn ghost" href="/deals">
              This Week&rsquo;s Deals
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
