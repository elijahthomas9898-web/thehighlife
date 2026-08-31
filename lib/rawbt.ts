/**
 * Hands ESC/POS bytes to RawBT, an Android print-service app.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Direct WebUSB printing does not work on the shop tablets. Android binds
 * printer-class USB devices to its own driver on plug-in, and a browser cannot
 * take an interface the kernel already holds — `claimInterface` is refused even
 * though the device pairs fine and exposes exactly one printer-class interface.
 * A USB reset doesn't shake it loose either.
 *
 * RawBT inverts the problem: the APP owns the printer (over USB, Bluetooth or
 * network), and we pass it a payload by URL. Nothing in the browser ever touches
 * the device, so there is no interface to claim and nothing to conflict over.
 *
 * Scheme confirmed from the app author's own demo source:
 *   rawbt:<utf-8 text>            plain text
 *   rawbt:base64,<base64 bytes>   raw ESC/POS  ← what we use
 * Package: ru.a402d.rawbtprinter
 *
 * ⚠️ Requires the RawBT app installed on the tablet. Without it the URL simply
 * does nothing — the browser can't tell us whether a scheme handler exists, so
 * callers must say so in the UI rather than reporting success.
 */

/** RawBT's package id, for the Play Store link and the intent fallback. */
export const RAWBT_PACKAGE = "ru.a402d.rawbtprinter";

export const RAWBT_PLAY_URL = `https://play.google.com/store/apps/details?id=${RAWBT_PACKAGE}`;

/**
 * Base64 for a byte array, chunked.
 *
 * `btoa(String.fromCharCode(...bytes))` is the usual one-liner and it throws on
 * large inputs — spreading a big array blows the argument limit. Tickets are
 * small today, but a receipt with a logo bitmap would not be.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** The `rawbt:` URL that prints these bytes. */
export function rawbtUrl(bytes: Uint8Array): string {
  return `rawbt:base64,${bytesToBase64(bytes)}`;
}

/**
 * Send bytes to RawBT.
 *
 * Navigation is via a hidden anchor click rather than `location.href`: assigning
 * an unhandled custom scheme to location can leave the page in a broken state in
 * some Android browsers, whereas an ignored anchor click is a no-op.
 *
 * Returns nothing meaningful on purpose — a custom-scheme handoff is fire and
 * forget. The browser will not tell us whether RawBT is installed, whether it
 * opened, or whether paper came out. Never report this as "printed".
 */
export function sendToRawbt(bytes: Uint8Array): void {
  const a = document.createElement("a");
  a.href = rawbtUrl(bytes);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Leave it a tick before removing, or the click may not be dispatched.
  setTimeout(() => a.remove(), 1000);
}
