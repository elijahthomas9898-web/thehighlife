import { categories, categoryMenuHref } from "@/data/site";

export default function Categories() {
  return (
    <section className="shop" id="shop">
      <div className="wrap">
        <h2 className="reveal">
          Shop By
          <br />
          Category
        </h2>
        <div className="catgrid reveal">
          {categories.map((c, i) => (
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
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
