import Image from "next/image";
import HeaderOffset from "./HeaderOffset";
import banner from "@/public/images/rove-popup.png";

/**
 * Temporary promo banner at the top of the homepage — the ROVE pop-up.
 *
 * ⚠️ IT TAKES ITSELF DOWN. The banner disappears on its own once the event ends,
 * so nobody has to remember to remove it and the homepage can't be left
 * advertising last weekend. Change EVENT_END (or delete this component from
 * app/page.tsx) to run a different promo.
 *
 * The homepage already renders per-request (the layout reads the age-gate cookie),
 * so this date check is evaluated on every visit rather than baked in at build.
 *
 * Uses next/image rather than a plain <img> — unlike the rest of the site, this is
 * a 1672x941 / 2.7MB source, and shipping that untouched to phones would be the
 * single heaviest thing on the page. The optimizer resizes and re-encodes it.
 */

/** Saturday 29 Aug 2026, 6:00 PM — event end, in Eastern (EDT = UTC-4). */
const EVENT_END = new Date("2026-08-29T18:00:00-04:00");

export default function EventBanner() {
  if (Date.now() > EVENT_END.getTime()) return null;

  return (
    <>
      <HeaderOffset />
      <aside className="evtbanner" aria-label="ROVE pop-up event, Saturday August 29">
      <a href="/visit" className="evtbanner-link">
        <Image
          src={banner}
          alt="ROVE pop-up at The High Life Dispensary — Saturday 8/29/26, 4PM to 6PM. Stop by for exclusive penny deals."
          priority
          sizes="100vw"
          className="evtbanner-img"
        />
      </a>
      </aside>
    </>
  );
}
