"use client";

import { useState } from "react";
import { store } from "@/data/site";

const KEY = "hl_age_verified";

/**
 * NY requires digital cannabis advertising to keep under-21 visitors out.
 *
 * Visibility is driven entirely by the `data-age` attribute that the boot
 * script in layout.tsx sets before first paint — NOT by React state. That
 * means: identical server/client render (no hydration mismatch), no flash of
 * the gate for returning visitors, and if the script or storage fails, the
 * attribute is simply absent and the gate stays up (fails closed).
 */
export default function AgeGate() {
  const [denied, setDenied] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked — the cookie below still remembers them */
    }

    let cookieOk = false;
    try {
      // 1-year cookie. This is the flag the SERVER reads to render data-age="ok"
      // into the HTML on every later request (see app/layout.tsx).
      document.cookie = `${KEY}=1; path=/; max-age=31536000; SameSite=Lax`;
      cookieOk = document.cookie.indexOf(`${KEY}=1`) !== -1;
    } catch {
      /* cookies blocked — handled below */
    }

    document.documentElement.setAttribute("data-age", "ok");

    if (cookieOk) {
      // Reload once so the server re-renders with the flag baked in. From here on
      // it's part of React's own tree, so no re-render can drop it — this is what
      // stops the gate reappearing on iOS. Only runs when the cookie actually
      // took, so blocked cookies can't cause a reload loop.
      window.location.reload();
      return;
    }
    // Cookies blocked: nothing will persist, so hide the gate in React state for
    // at least this page rather than trapping the visitor behind it.
    setAccepted(true);
  }

  // Cookies blocked — accepted in memory only (see accept()).
  if (accepted) return null;

  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="gateQ">
      <div className="gate-box">
        {denied ? (
          <>
            <h2 className="gate-q" id="gateQ">
              Come Back
              <br />
              <span className="g">At 21</span>
            </h2>
            <p className="gate-sub">
              You must be 21 or older to enter this site. Thanks for stopping by — see you when
              you&rsquo;re of age.
            </p>
            <p className="gate-legal">
              Concerned about cannabis use? Text HOPENY, call 1-877-8-HOPENY, or visit
              oasas.ny.gov/HOPELine
            </p>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gate-logo" src="/images/logo.png" alt={store.name} />
            <h2 className="gate-q" id="gateQ">
              Are You
              <br />
              <span className="g">21 Or Older?</span>
            </h2>
            <p className="gate-sub">
              You must be 21 years of age or older to enter this site and shop at {store.name}.
            </p>
            <div className="gate-btns">
              <button className="btn primary" type="button" onClick={accept}>
                Yes, I&rsquo;m 21+
              </button>
              <button className="btn ghost" type="button" onClick={() => setDenied(true)}>
                No, I&rsquo;m Under 21
              </button>
            </div>
            <p className="gate-legal">
              By entering, you confirm you are 21 or older and agree to consume responsibly.
              Licensed by the New York State Office of Cannabis Management. NYS OCM# {store.license}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
