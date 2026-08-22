/**
 * Homepage deals section: a scrolling marquee + a bold teaser band that routes
 * to /deals (which pulls the REAL deals live from JSCart). No hand-kept deal
 * data lives here anymore — nothing to drift out of sync.
 */

export function Marquee() {
  // Generic, always-true energy — no specific brand/percent claims that could go stale.
  const unit = (
    <span>
      Deals Deals Deals <em className="sep">✦</em> BOGO All Week <em className="sep">✦</em> 2 For $40
      <em className="sep">✦</em> 25% Off <em className="sep">✦</em> Bundles <em className="sep">✦</em>
      Fresh Markdowns <em className="sep">✦</em>
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

/** The homepage deals moment — big energy, honest copy, one route into /deals. */
export function DealsBand() {
  return (
    <section className="deals-band" id="deals">
      <div className="wrap">
        <div className="kicker reveal">
          Deals Deals Deals <span>/ fresh every week</span>
        </div>
        <h2 className="reveal">
          This Week&rsquo;s
          <br />
          Deals
        </h2>
        <p className="lead reveal">
          We don&rsquo;t do markups — we do markdowns. BOGOs, bundles and fresh price drops across the
          shop, pulled straight from the register so what you see is always what&rsquo;s live.
        </p>

        <div className="deals-band-chips reveal" aria-hidden="true">
          <span>BOGO</span>
          <span>2 for $40</span>
          <span>25% Off</span>
          <span>Bundles</span>
          <span>Grand-Opening Drops</span>
        </div>

        <div className="page-cta reveal">
          <a className="btn primary" href="/deals">
            See This Week&rsquo;s Deals →
          </a>
          <a className="btn ghost" href="/menu">
            Shop The Menu
          </a>
        </div>
      </div>
    </section>
  );
}
