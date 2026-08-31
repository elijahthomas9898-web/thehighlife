"use client";

import { useEffect } from "react";
import { buildPickupTicket } from "@/lib/escpos";
import { sendToRawbt } from "@/lib/rawbt";
import { KIOSK_ORDER_EVENT } from "./ProteusShop";
import { loadKioskSettings } from "@/lib/kioskSettings";
import { store } from "@/data/site";

/**
 * Prints a pickup ticket when a kiosk order is placed.
 *
 * Listens for the order event ProteusShop raises from JSCart's onOrderComplete
 * callback, then hands the ticket to RawBT (see lib/rawbt.ts for why it goes
 * through an app rather than straight to USB).
 *
 * ⚠️ This is NOT silent, and it cannot be. Android has no route from a web page to
 * a printer that doesn't surface something — a browser can't start a background
 * service, so any handoff foregrounds the app. RawBT will flash up, print, and
 * drop back. The only genuinely invisible path is Proteus's Server Direct
 * Printing, which prints server-side and never involves the tablet.
 *
 * Off unless `autoPrintTickets` is switched on at /kiosk/settings, because SDP may
 * also be printing these — two systems printing hands every customer two tickets,
 * which their own kiosk source warns about.
 *
 * The setting is read AT ORDER TIME, not at mount: a tablet can run for days, and
 * staff flipping the switch shouldn't need to restart it.
 */
export default function KioskTicketPrinter() {
  useEffect(() => {
    const onOrder = (e: Event) => {
      if (!loadKioskSettings().autoPrintTickets) return;

      const detail = (e as CustomEvent).detail as { invoice?: string } | undefined;
      // JSCart hands us the invoice number and nothing else — no name, no items,
      // no total. The ticket is built from what actually arrives.
      const orderNumber = String(detail?.invoice || "").trim();
      if (!orderNumber) return; // nothing worth handing a customer

      try {
        sendToRawbt(
          buildPickupTicket({
            storeName: store.name,
            addressLine: store.addressLine1,
            orderNumber,
            placedAt: new Date(),
          }),
        );
      } catch {
        // A failed print must never take the kiosk down mid-order. The order is
        // already placed and waiting in the POS either way.
      }
    };

    window.addEventListener(KIOSK_ORDER_EVENT, onOrder);
    return () => window.removeEventListener(KIOSK_ORDER_EVENT, onOrder);
  }, []);

  return null;
}
