"use client";

import { useEffect } from "react";

/**
 * Forces the signup form to 21+.
 *
 * Proteus serves our registration config from
 * dev4.proteuserp.com/<client>/webservices/registration/config.cfm with
 * `"minimum_age": 18`. JSCart uses that value for BOTH the hint under the Date of
 * Birth field ("Must be 18+ years old") and the client-side age check, so an
 * 18-year-old could complete the form. We're a New York adult-use dispensary —
 * it has to be 21.
 *
 * The value is fetched, not hardcoded, and `registrationConfig` is private to the
 * widget — so the only way to correct it from our side is to fix the response on
 * the way in. This wraps fetch, and for that ONE url rewrites minimum_age before
 * the widget parses it. Everything else passes through untouched, and any failure
 * falls back to the original response.
 *
 * Ordering matters: React runs child effects before the parent's, and ProteusShop
 * loads the widget script in its own effect — so mounting this as a child of
 * ProteusShop guarantees the patch is in place before the config is requested.
 *
 * ⚠️ This is a MITIGATION, not the fix. The check it corrects is client-side;
 * Proteus's own validate.cfm / register.cfm still enforce whatever minimum their
 * server holds. The real fix is Proteus setting minimum_age to 21 on the account.
 */
const CONFIG_URL_MARKER = "/webservices/registration/config.cfm";
const REQUIRED_MIN_AGE = 21;

export default function ProteusAgeFix() {
  useEffect(() => {
    const original = window.fetch;
    if ((original as { __hlAgePatched?: boolean }).__hlAgePatched) return;

    const patched: typeof window.fetch = async (input, init) => {
      const response = await original(input, init);

      let url = "";
      try {
        url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      } catch {
        return response;
      }
      if (!url.includes(CONFIG_URL_MARKER)) return response;

      try {
        // Read a clone so the original body stays usable if anything below fails.
        const text = await response.clone().text();
        const fixed = text.replace(
          /("minimum_age"\s*:\s*)(\d+)/g,
          (whole, prefix: string, value: string) =>
            Number(value) < REQUIRED_MIN_AGE ? `${prefix}${REQUIRED_MIN_AGE}` : whole,
        );
        if (fixed === text) return response;

        return new Response(fixed, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch {
        return response;
      }
    };

    (patched as { __hlAgePatched?: boolean }).__hlAgePatched = true;
    window.fetch = patched;
    return () => {
      // Only hand back if nothing else wrapped fetch after us.
      if (window.fetch === patched) window.fetch = original;
    };
  }, []);

  return null;
}
