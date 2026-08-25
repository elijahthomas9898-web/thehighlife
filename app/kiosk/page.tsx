import type { Metadata } from "next";
import ProteusShop from "../components/ProteusShop";
import KioskInputHints from "../components/KioskInputHints";

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
      <KioskInputHints />
      <ProteusShop kiosk kioskTimeout={3} />
    </div>
  );
}
