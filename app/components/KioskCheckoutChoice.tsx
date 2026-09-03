"use client";

import { useEffect } from "react";

/**
 * Makes Quick Checkout the obvious choice on the kiosk.
 *
 * ── The problem it solves ────────────────────────────────────────────────────
 * Most High Life customers already exist in Proteus — their ID was scanned at the
 * register on an earlier visit — and those imported records have NO password.
 *
 * JSCart's checkout choice screen leads with "Sign In / Use your existing
 * account", which is exactly what such a customer thinks they want. It is the
 * wrong door: they have no password, so they end up at Create Account, are told
 * the email already exists, and get pushed toward a password reset that emails a
 * link. Standing at a tablet on the shop floor, that is a dead end.
 *
 * Quick Checkout is the right door and it was second in the list. It takes phone
 * and birthdate and nothing else — `submitQuickCheckout()` in the widget reads
 * only those two fields, no password anywhere in the flow.
 *
 * So on the kiosk this moves it first, styles it as the primary action, and
 * relabels it to say what it is FOR rather than what it is called. "Quick
 * Checkout" means nothing to a customer; "Shopped here before?" is the question
 * they can actually answer.
 *
 * Kiosk only. On the website an emailed password link is a perfectly good route
 * and some people genuinely want a full account, so that screen is left alone.
 *
 * Wording and order only — no button's behaviour is touched. The widget rebuilds
 * this modal every time it opens, hence the observer.
 */

const MARK = "data-hl-choice";

export default function KioskCheckoutChoice() {
  useEffect(() => {
    const apply = () => {
      const row = document.querySelector<HTMLElement>(".proteus-choice-buttons");
      if (!row || row.getAttribute(MARK) === "1") return;

      const buttons = Array.from(row.querySelectorAll<HTMLElement>(".proteus-choice-btn"));
      if (buttons.length < 2) return; // nothing to reorder

      const quick = buttons.find((b) =>
        (b.getAttribute("onclick") ?? "").includes("switchAuthTab('quick')"),
      );
      if (!quick) return; // Quick Checkout is off — leave the screen as it is

      // Move it to the top of the flex column and mark it as the primary action.
      row.insertBefore(quick, row.firstChild);
      quick.classList.add("hl-choice-primary");

      // Say what it's for, not what it's called. textContent, never innerHTML —
      // this sits inside the widget's own markup.
      const label = quick.querySelector<HTMLElement>(".proteus-choice-btn-label");
      const sub = quick.querySelector<HTMLElement>(".proteus-choice-btn-sub");
      if (label) label.textContent = "Shopped here before?";
      if (sub) sub.textContent = "Phone number + birthday. No password needed.";

      // Demote Sign In so the two don't compete.
      const signIn = buttons.find((b) =>
        (b.getAttribute("onclick") ?? "").includes("switchAuthTab('login')"),
      );
      if (signIn) {
        signIn.classList.add("hl-choice-secondary");
        const s = signIn.querySelector<HTMLElement>(".proteus-choice-btn-sub");
        if (s) s.textContent = "If you've set a password online";
      }

      row.setAttribute(MARK, "1");
    };

    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return null;
}
