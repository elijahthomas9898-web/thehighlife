/**
 * Minimal ESC/POS command builder for the kiosk's receipt printer.
 *
 * ESC/POS is the de-facto command set for USB thermal printers — Epson's, and
 * near-universally cloned by everyone else. Commands are raw bytes written to the
 * printer's bulk endpoint, not text, so this returns a Uint8Array.
 *
 * Kept as pure functions with no browser APIs so the byte output can be asserted
 * in a test without a printer plugged in.
 */
const ESC = 0x1b;
const GS = 0x1d;

const INIT = [ESC, 0x40]; // reset to a known state
const ALIGN_CENTER = [ESC, 0x61, 0x01];
const ALIGN_LEFT = [ESC, 0x61, 0x00];
const SIZE_NORMAL = [GS, 0x21, 0x00];
const SIZE_DOUBLE = [GS, 0x21, 0x11]; // double width + height
const BOLD_ON = [ESC, 0x45, 0x01];
const BOLD_OFF = [ESC, 0x45, 0x00];
const CUT = [GS, 0x56, 0x00]; // full cut

/**
 * ESC/POS is a single-byte codepage, so anything outside ASCII prints as garbage.
 * Product names carry curly quotes and dashes routinely — fold those to their
 * ASCII equivalents and drop whatever's left rather than emitting mojibake.
 */
function toAscii(text: string): number[] {
  const folded = text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...");
  const out: number[] = [];
  for (const ch of folded) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) out.push(code);
    else if (ch === "\n") out.push(0x0a);
  }
  return out;
}

function line(text = ""): number[] {
  return [...toAscii(text), 0x0a];
}

export type TicketFields = {
  storeName: string;
  addressLine: string;
  orderNumber: string;
  placedAt: Date;
};

function formatStamp(d: Date): string {
  // Deliberately not toLocaleString with options — the kiosk's locale is whatever
  // the tablet was set to, and a receipt reading "30/08/2026" would confuse staff.
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${h}:${m} ${ampm}`;
}

/** The pickup ticket a customer carries to the counter. */
export function buildPickupTicket(f: TicketFields): Uint8Array {
  const bytes: number[] = [
    ...INIT,
    ...ALIGN_CENTER,
    ...BOLD_ON,
    ...line(f.storeName.toUpperCase()),
    ...BOLD_OFF,
    ...line(f.addressLine),
    ...line("-".repeat(32)),
    ...line(),
    ...SIZE_DOUBLE,
    ...line(`#${f.orderNumber}`),
    ...SIZE_NORMAL,
    ...line(),
    ...line(formatStamp(f.placedAt)),
    ...line(),
    ...line("Take this to the counter"),
    ...line("with your ID"),
    ...line(),
    ...line("-".repeat(32)),
    ...line("21+ . Thank you"),
    ...ALIGN_LEFT,
    ...line(),
    ...line(),
    ...line(),
    ...CUT,
  ];
  return new Uint8Array(bytes);
}

/** A short page proving the printer is reachable and cutting correctly. */
export function buildTestPage(storeName: string, now: Date): Uint8Array {
  const bytes: number[] = [
    ...INIT,
    ...ALIGN_CENTER,
    ...BOLD_ON,
    ...line("PRINTER TEST"),
    ...BOLD_OFF,
    ...line(storeName),
    ...line(formatStamp(now)),
    ...line(),
    ...line("If you can read this, the"),
    ...line("kiosk can print."),
    ...ALIGN_LEFT,
    ...line(),
    ...line(),
    ...line(),
    ...CUT,
  ];
  return new Uint8Array(bytes);
}
