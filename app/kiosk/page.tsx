import type { Metadata } from "next";
import ProteusShop from "../components/ProteusShop";
import KioskInputHints from "../components/KioskInputHints";
import KioskCartBar from "../components/KioskCartBar";
import MenuDealsMore from "../components/MenuDealsMore";
import KioskPreload from "../components/KioskPreload";
import dynamic from "next/dynamic";

/**
 * None of these two are needed for the shopper to start browsing, so they are
 * split out of the initial bundle rather than parsed before first paint:
 *   KioskAttract       - idle screen, first shows 45s in
 *   KioskDealsPanel    - only when someone taps View All Deals
 *
 * This matters more here than on a normal page: the kiosk hard-reloads after
 * every order and every idle timeout, so it pays its startup cost per customer,
 * all day.
 */
const KioskDealsPanel = dynamic(() => import("../components/KioskDealsPanel"));
const KioskAttract = dynamic(() => import("../components/KioskAttract"));

export const metadata: Metadata = {
  title: "Kiosk | The High Life Dispensary",
  robots: { index: false, follow: false },
};

/**
 * The in-store pickup kiosk for the Android tablets on the floor.
 *
 * This is NOT a custom kiosk UI — it switches on the kiosk runtime that already
 * ships inside JSCart (see the `kiosk` prop on ProteusShop). That runtime takes
 * the whole viewport, resets itself between customers, and tags its orders as
 * `kiosk` in Proteus, so the shopper's order is waiting at the counter where they
 * pay and show ID.
 *
 * Deliberately renders no <Nav /> and no <Footer />: the kiosk runtime covers the
 * viewport anyway (position:fixed; inset:0), so site chrome would only flash
 * before being hidden. The 21+ gate is also bypassed here — ID is checked at the
 * door, same reasoning as /signage (see BOOT_SCRIPT in layout.tsx and the
 * `.kiosk-page` rules in globals.css).
 */
export default function KioskPage() {
  return (
    <div className="kiosk-page">
      {/* Starts the 560KB JSCart download during HTML parse, not after hydration. */}
      <KioskPreload />
      <KioskInputHints />
      <MenuDealsMore kiosk />
      <ProteusShop kiosk kioskTimeout={3} />
      <KioskCartBar />
      <KioskDealsPanel />
      <KioskAttract />
    </div>
  );
}
