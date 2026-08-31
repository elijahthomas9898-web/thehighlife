import type { Metadata } from "next";
import KioskSettingsClient from "./KioskSettingsClient";

export const metadata: Metadata = {
  title: "Kiosk Settings | The High Life Dispensary",
  // Staff-only, and it exposes device details. Keep it out of search entirely —
  // same treatment as /kiosk and /signage.
  robots: { index: false, follow: false },
};

/**
 * Staff configuration for one kiosk tablet.
 *
 * Deliberately unlinked: the kiosk runtime covers the whole viewport and there is
 * no keyboard, so a customer can't reach this. Staff type the URL. It isn't
 * PIN-gated because nothing here is destructive — the worst case is a wrong idle
 * timeout, fixed by tapping "Reset to defaults".
 *
 * Rendered on the public site chrome rather than inside `.kiosk-page`, so it
 * scrolls and behaves like a normal page while someone is configuring it.
 */
export default function KioskSettingsPage() {
  return <KioskSettingsClient />;
}
