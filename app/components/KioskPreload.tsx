"use client";

import ReactDOM from "react-dom";
import { WIDGET_SRC } from "./ProteusShop";

/**
 * Starts the JSCart download during HTML parse instead of after hydration.
 *
 * ── Why this matters more on the kiosk than anywhere else ────────────────────
 * ProteusShop creates the widget <script> inside a useEffect, so the browser
 * can't begin fetching it until our bundle has downloaded, parsed and hydrated.
 * That's a serial chain in front of a 560KB file.
 *
 * And the kiosk pays it constantly. kioskFullReset() does a HARD RELOAD — after
 * every order and after every idle timeout — and Proteus serves the widget with
 * `Cache-Control: no-store`, so it is re-fetched in full every single time. Not
 * once a day: once per customer.
 *
 * ReactDOM.preload emits <link rel="preload" as="script"> into the head during
 * SSR, so the download starts in parallel with our own JS rather than after it.
 * By the time the effect runs, the script is already in the browser's cache and
 * the <script> tag resolves immediately.
 *
 * Deliberately kiosk-only: on the public site most visitors land on pages that
 * never load JSCart, and preloading 560KB for them would be a large download
 * nobody asked for. /menu and /deals keep the preconnect from the root layout,
 * which costs nothing.
 *
 * The real fix is Proteus making that file cacheable — the URL is already
 * versioned (?v=4), so it safely could be. This narrows the gap meanwhile.
 */
export default function KioskPreload() {
  ReactDOM.preload(WIDGET_SRC, { as: "script" });
  return null;
}
