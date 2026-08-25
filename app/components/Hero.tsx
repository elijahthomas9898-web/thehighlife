export default function Hero() {
  return (
    <header className="hero" id="top">
      <div
        className="hero-photo"
        style={{ backgroundImage: "url('/images/storefront.jpg')" }}
        role="img"
        aria-label="The High Life Dispensary storefront on Wellwood Ave, West Babylon"
      />
      <canvas id="smoke" />
      <div className="hero-overlay" />
      <div className="hero-inner" id="heroInner">
        <div className="eyebrow">Licensed New York Adult-Use Dispensary</div>
        <h1 className="hero-h1">
          West Babylon&rsquo;s
          <br />
          <span className="g">Neighborhood Dispensary</span>
        </h1>
        <p className="hero-sub">
          Your neighborhood dispensary in New York. The brands you love, tested and shelf-ready —
          with fresh deals dropping every single week.
        </p>
        <div className="hero-cta">
          <a className="btn primary" href="#deals">
            See This Week&rsquo;s Deals →
          </a>
          <a className="btn ghost" href="#shop">
            Shop by Category
          </a>
        </div>
      </div>
      <div className="scrollcue">
        <span>Scroll</span>
        <span className="dot" />
      </div>
    </header>
  );
}
