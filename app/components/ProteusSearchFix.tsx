"use client";

import { useEffect } from "react";

/**
 * Makes the shop's search box work.
 *
 * JSCart's autocomplete requests suggestions from
 *
 *   {baseUrl}/{client}/jscart2/api_cart_v2.cfm?action=products&search=…
 *
 * but that `jscart2/` segment doesn't exist on this store — it returns a 404 HTML
 * page. Every other call in the widget uses the same file WITHOUT that segment
 * (…/highlife/api_cart_v2.cfm), and that one answers fine: searching "jeeter"
 * there returns 15 products.
 *
 * The reason it looks like nothing happens rather than erroring is their handler
 * ends in `catch(e) { /* silently fail *\/ }` — the 404 is swallowed and the
 * dropdown simply never appears.
 *
 * We can't edit their file, so we correct the URL in flight: wrap fetch and
 * rewrite only that one broken path. Everything else passes through untouched.
 *
 * This is Proteus's bug and worth reporting — it presumably affects every store
 * without a jscart2 mount point.
 */
const BROKEN = "/jscart2/api_cart_v2.cfm";
const FIXED = "/api_cart_v2.cfm";

type PatchedFetch = typeof fetch & { __hlSearchPatched?: true };

export default function ProteusSearchFix() {
  useEffect(() => {
    const original = window.fetch as PatchedFetch;
    if (original.__hlSearchPatched) return; // StrictMode / remount guard

    const patched = ((input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input instanceof Request
                ? input.url
                : "";

        if (url.includes(BROKEN)) {
          const corrected = url.replace(BROKEN, FIXED);
          // Preserve method/headers/body when it's a Request object.
          const next = input instanceof Request ? new Request(corrected, input) : corrected;
          return original(next, init);
        }
      } catch {
        // Never let this wrapper break a request — fall through to the original.
      }
      return original(input, init);
    }) as PatchedFetch;

    patched.__hlSearchPatched = true;
    window.fetch = patched;

    return () => {
      // Only hand back if nobody wrapped fetch after us.
      if (window.fetch === patched) window.fetch = original;
    };
  }, []);

  return null;
}
