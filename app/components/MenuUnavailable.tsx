import { store, hours } from "@/data/site";

/**
 * Shown when the live menu can't be reached.
 *
 * Deliberately shows NO products. A dispensary menu that invents stock sends
 * people in for things we don't have and puts prices on screen that were never
 * real — so this says what's happening and gives them a way to reach us.
 */
export default function MenuUnavailable({ error }: { error?: string }) {
  return (
    <div className="unavail">
      <div className="unavail-icon" aria-hidden="true">
        ⚠
      </div>
      <h3>Our menu is temporarily unavailable</h3>
      <p>
        We can&rsquo;t load live inventory from the shop right now, so we&rsquo;re not showing a
        menu rather than showing you something inaccurate. Our shelves are still stocked —
        come in or get in touch and we&rsquo;ll tell you exactly what we have.
      </p>

      <div className="unavail-contact">
        <div>
          <span className="unavail-label">Visit</span>
          {store.addressLine1}, {store.addressLine2}
        </div>
        <div>
          <span className="unavail-label">Email</span>
          <a href={`mailto:${store.email}`}>{store.email}</a>
        </div>
        <div>
          <span className="unavail-label">Open</span>
          {hours[0].label} Mon–Sat · {hours[6].label} Sun
        </div>
      </div>

      <div className="page-cta">
        <a className="btn primary" href="/visit">
          Get Directions →
        </a>
        <a className="btn ghost" href="/deals">
          See This Week&rsquo;s Deals
        </a>
      </div>

      {/* the reason, for whoever is debugging — not shouted at customers */}
      {error && <p className="unavail-tech">Technical detail: {error}</p>}
    </div>
  );
}
