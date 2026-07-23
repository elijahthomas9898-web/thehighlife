import { deals, featuredDeals, dealSlug, type Deal } from "@/data/site";
import DealRail from "./DealRail";

/** One deal card. Links through to that deal's products. */
export function DealCard({
  deal,
  index,
  total,
}: {
  deal: Deal;
  index?: number;
  total?: string;
}) {
  return (
    <a className="deal" href={`/deals/${dealSlug(deal)}`}>
      <div className="top">
        {index != null && total ? (
          <span className="idx">
            {String(index + 1).padStart(2, "0")} / {total}
          </span>
        ) : (
          <span className="idx">{deal.code}</span>
        )}
        <span className="tag">{deal.tag}</span>
      </div>
      <div>
        <h3>{deal.name}</h3>
        <div className="desc">{deal.desc}</div>
      </div>
      <div className="meta">
        <div className="val">{deal.value}</div>
        <div className="valid">
          {deal.valid}
          <small>see products →</small>
        </div>
      </div>
    </a>
  );
}

export function Marquee() {
  const unit = (
    <span>
      Deals Deals Deals <em className="sep">✦</em> Airo 25% Off <em className="sep">✦</em> Puff
      Pre-Rolls 40% <em className="sep">✦</em> Stiiizy 20% Off Vapes <em className="sep">✦</em> Old
      Pal 30% <em className="sep">✦</em> BOGO All Week <em className="sep">✦</em>
    </span>
  );
  return (
    <div className="marquee" aria-hidden="true">
      {/* duplicated so the loop is seamless */}
      <div className="mtrack">
        {unit}
        {unit}
      </div>
    </div>
  );
}

export function DealsIntro() {
  return (
    <section className="deals-intro" id="deals">
      <div className="wrap">
        <div className="kicker reveal">
          01 — Deals Deals Deals <span>/ new every week</span>
        </div>
        <h2 className="reveal">
          This Week&rsquo;s
          <br />
          Deals
        </h2>
        <p className="lead reveal">
          We don&rsquo;t do markups — we do markdowns. Every week we rotate a fresh set of specials
          across the shop. Here&rsquo;s what&rsquo;s live right now. Scroll sideways →
        </p>
      </div>
    </section>
  );
}

/**
 * Horizontal row of deal cards.
 *
 * The page scrolls vertically as normal — this no longer hijacks the wheel to
 * drive a pinned track. The row itself scrolls sideways on its own (swipe,
 * trackpad, or the arrow buttons), so the layout stays horizontal without
 * taking over the page scroll.
 */
export function DealsGallery() {
  // only the featured handful — all 37 live on /deals
  const total = String(featuredDeals.length).padStart(2, "0");
  return (
    <section className="gallery" id="weekly">
      <div className="wrap gal-wrap">
        <div className="gal-head">
          <div>
            <div className="kicker">Live Now</div>
            <h2>On Special</h2>
          </div>
          <a className="btn ghost gal-all" href="/deals">
            All {deals.length} deals →
          </a>
        </div>
      </div>

      <DealRail>
        {featuredDeals.map((d, i) => (
          <DealCard key={d.name} deal={d} index={i} total={total} />
        ))}
      </DealRail>
    </section>
  );
}
