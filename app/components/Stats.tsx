import { stats } from "@/data/site";

export default function Stats() {
  return (
    <section className="stats" id="stats">
      <div className="wrap">
        <h2 className="reveal">Retail, Done Right</h2>
        <div className="statgrid reveal">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              {/* ScrollEffects animates these from 0 when they scroll into view */}
              <div className="n" data-count={s.count} data-suffix={s.suffix}>
                0
              </div>
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
