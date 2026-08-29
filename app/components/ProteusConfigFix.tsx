"use client";

import { useEffect } from "react";

/**
 * Repairs Proteus's registration config on the way in.
 *
 * JSCart fetches the signup form's rules from
 * dev4.proteuserp.com/<client>/webservices/registration/config.cfm and builds the
 * form from them. Two settings on our account are wrong, and neither can be fixed
 * from our side any other way — `registrationConfig` is private to the widget, so
 * the only seam is the response itself. This wraps fetch and corrects that ONE
 * url. Everything else passes through untouched, and any failure falls back to
 * the original response.
 *
 * Ordering matters: React runs child effects before the parent's, and ProteusShop
 * loads the widget script in its own effect — so mounting this as a child of
 * ProteusShop guarantees the patch is in place before the config is requested.
 *
 * ⚠️ Both of these are MITIGATIONS. The real fixes are settings on Proteus's
 * server; see each one below.
 */
const CONFIG_URL_MARKER = "/webservices/registration/config.cfm";
const REQUIRED_MIN_AGE = 21;

type RegConfig = {
  minimum_age?: number;
  fields?: { required?: string[]; visible?: string[] };
};

/**
 * FIX 1 — minimum age.
 * Proteus serves `"minimum_age": 18`. JSCart uses it for BOTH the hint under the
 * Date of Birth field ("Must be 18+ years old") and the client-side age check, so
 * an 18-year-old could fill the form in. We're a New York adult-use dispensary —
 * it has to be 21. Only ever raises the value, never lowers it.
 *
 * Real fix: Proteus sets minimum_age to 21 on the account. Note this check is
 * client-side either way; their validate.cfm / register.cfm still enforce whatever
 * minimum their server holds.
 */
function fixMinimumAge(cfg: RegConfig): string[] {
  if (typeof cfg.minimum_age === "number" && cfg.minimum_age < REQUIRED_MIN_AGE) {
    const was = cfg.minimum_age;
    cfg.minimum_age = REQUIRED_MIN_AGE;
    return [`minimum_age ${was} -> ${REQUIRED_MIN_AGE}`];
  }
  return [];
}

/**
 * FIX 2 — required fields the form never shows. THIS ONE BLOCKS ALL SIGNUPS.
 *
 * Our account lists `howcontact` in fields.required but NOT in fields.visible.
 * JSCart builds the form from `visible` and collects submitted values with
 * `if (!visible.includes(field)) continue` — so a required-but-invisible field is
 * never rendered, never filled and never sent. validate.cfm then returns
 * 400 {"howcontact":"howcontact is required"}.
 *
 * The customer sees none of that. The widget maps server errors back onto inputs
 * via getElementById, the input doesn't exist, so no inline message appears and it
 * falls through to a bare "Validation failed" with nothing indicating why.
 * Verified against the live endpoint: identical payload minus/plus howcontact
 * returns 400 / 200.
 *
 * Rather than special-case one field, this enforces the invariant: a field the
 * server requires must be one the customer can see. JSCart already ships a
 * finished control for howcontact ("How would you like to be contacted?" —
 * Email / Phone / Text Message / Any), so making it visible is all that's needed.
 * A required field with no render branch in the widget simply stays absent, which
 * is no worse than today.
 *
 * Deliberately NOT done: silently posting a default howcontact. How someone wants
 * to be contacted is their choice to make, not ours to assume.
 *
 * Real fix: Proteus either drops howcontact from required or adds it to visible.
 */
function fixHiddenRequiredFields(cfg: RegConfig): string[] {
  const required = cfg.fields?.required;
  const visible = cfg.fields?.visible;
  if (!Array.isArray(required) || !Array.isArray(visible)) return [];

  const hidden = required.filter((f) => !visible.includes(f));
  if (hidden.length === 0) return [];

  visible.push(...hidden);
  return hidden.map((f) => `revealed required field "${f}"`);
}

export default function ProteusConfigFix() {
  useEffect(() => {
    const original = window.fetch;
    if ((original as { __hlConfigPatched?: boolean }).__hlConfigPatched) return;

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
        const cfg: RegConfig = await response.clone().json();
        const repairs = [...fixMinimumAge(cfg), ...fixHiddenRequiredFields(cfg)];
        if (repairs.length === 0) return response;

        // Leave a trail — when this stops being needed (because Proteus fixed the
        // account) the console says so, and this component can be deleted.
        console.info("[ProteusConfigFix] patched registration config:", repairs.join("; "));

        return new Response(JSON.stringify(cfg), {
          status: response.status,
          statusText: response.statusText,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return response;
      }
    };

    (patched as { __hlConfigPatched?: boolean }).__hlConfigPatched = true;
    window.fetch = patched;
    return () => {
      // Only hand back if nothing else wrapped fetch after us.
      if (window.fetch === patched) window.fetch = original;
    };
  }, []);

  return null;
}
