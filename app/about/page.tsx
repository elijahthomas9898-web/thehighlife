import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { about, store, stats } from "@/data/site";

export const metadata: Metadata = {
  title: "About Us | The High Life Dispensary",
  description:
    "The High Life is a licensed New York adult-use dispensary in West Babylon. Curated brands, honest advice, 21+.",
};

/** Turns **text** into <strong>text</strong>. Plain string splitting — no HTML is
 *  injected, so the copy can't carry markup into the page. */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function AboutPage() {
  return (
    <>
      <div className="rail" id="rail" />
      <Nav />

      <section className="page">
        <div className="wrap">
          <div className="kicker">
            Our Story <span>/ who we are</span>
          </div>
          <h2>{about.headline}</h2>

          <div className="about-photo" role="img" aria-label={`${store.name} storefront`} />

          <div className="about-copy">
            {about.paragraphs.map((para, i) => (
              <p key={i} className={i === 0 ? "lede-para" : undefined}>
                {renderBold(para)}
              </p>
            ))}
          </div>

          <div className="statgrid">
            {stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="n">
                  {s.count}
                  {s.suffix}
                </div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="page-cta">
            <a className="btn primary" href="/menu">
              Browse The Menu →
            </a>
            <a className="btn ghost" href="/visit">
              Visit The Shop
            </a>
          </div>

          <p className="menu-legal">
            {store.name} is licensed by the New York State Office of Cannabis Management, NYS OCM#{" "}
            {store.license}. We sell to adults 21 and older only, with valid government-issued ID.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
