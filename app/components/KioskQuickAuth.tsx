"use client";

import { useEffect } from "react";

/**
 * Kiosk checkout opens on one screen: phone number and birthday. No choosing.
 *
 * ── Why the choice screen had to go ──────────────────────────────────────────
 * JSCart asks "How would you like to check out?" and offers Sign In / Quick
 * Checkout. A customer standing at a tablet cannot answer that. They came to buy
 * things; they have never thought of themselves as having an account — but most
 * of them DO have one, created when their ID was scanned at the register, with no
 * password on it. So they pick Sign In (wrong door, no password), end up at Create
 * Account, are told the email already exists, and get pushed toward a password
 * reset that emails a link. On a shop-floor tablet, that is where the order dies.
 *
 * Reordering and recolouring those two buttons did not help, because the problem
 * was never which one looked more important — it was being asked to choose at all.
 *
 * Now everyone types the same two things. Known customer -> straight in, no
 * password. New customer -> the error is an invitation to register rather than a
 * full stop. That matches what people already expect: every pharmacy counter asks
 * for a phone number and nobody is confused by the question.
 *
 * ── How, given we cannot edit the widget ─────────────────────────────────────
 * The obvious move — wrap ProteusWidget.showLoginModal so 'choice' becomes
 * 'quick' — DOES NOT WORK, and looks like it should. The one call site that
 * raises the choice screen is inside checkout():
 *
 *     if (config.anonCheckout || config.quickCheckout) {
 *       pendingCheckout = true;
 *       showLoginModal('choice');       // module-local function, not the export
 *
 * It calls the module-local `showLoginModal`, so a wrapper on the public object is
 * simply never consulted. `switchAuthTab` is the lever that does work: the widget
 * exposes it (its own onclick attributes call ProteusWidget.switchAuthTab), and on
 * 'quick' it clears the error and focuses the phone field for us.
 *
 * So: watch for the modal, and if it opened on the choice panel, switch it. The
 * choice panel is hidden by CSS on the kiosk, and MutationObserver callbacks run
 * before paint, so nothing flickers.
 *
 * Kiosk only. On the website the choice screen is fine — email works there, and
 * some people genuinely want a full account with a password.
 *
 * Nothing here changes what any JSCart handler does. It is routing, wording, and
 * two links out.
 */

const MARK = "data-hl-quickauth";

/**
 * Set on <html> while this component is mounted and able to do its job.
 *
 * Every CSS rule that HIDES part of the widget hangs off this flag, so the hiding
 * and the replacing can never get out of sync. If this component doesn't mount,
 * throws, or finds no quick panel to switch to, the flag is absent and JSCart's
 * own choice screen is simply there, exactly as it is today. The rules must never
 * be written against .proteus-kiosk-active alone: that would hide the choice
 * screen on the strength of a promise the JS might not keep, and the failure would
 * be an empty modal in front of a paying customer.
 */
const FLAG = "data-hl-quickauth-on";

/**
 * "No account matched that phone and birthdate."
 *
 * Matched loosely because the text is NOT ours and not even the widget's — it is
 * `data.error` straight from api_auth.cfm, so Proteus can reword it without
 * telling anyone. A miss here is safe: the customer just sees their message with
 * no button, which is exactly today's behaviour.
 *
 * The two errors this must NOT match are the widget's own local ones, "Please
 * enter both your phone number and birthdate" and "Network error. Please try
 * again." — neither means "you are new", and offering to create an account there
 * would be wrong.
 */
const NOT_FOUND = /(no account|not found|couldn'?t find|could not (look up|find)|didn'?t match|check your details)/i;

export default function KioskQuickAuth() {
  useEffect(() => {
    const widget = () =>
      window.ProteusWidget as { switchAuthTab?: (t: string) => void } | undefined;

    /** A link styled like the widget's own footer links. */
    const link = (text: string, cls: string, tab: string) => {
      const a = document.createElement("button");
      a.type = "button";
      a.className = cls;
      a.textContent = text;
      a.addEventListener("click", () => widget()?.switchAuthTab?.(tab));
      return a;
    };

    const apply = () => {
      const panel = document.getElementById("proteus-quick-panel");

      // ── 1. never let the choice screen be the thing on screen ───────────
      const choice = document.getElementById("proteus-choice-panel");
      if (choice?.classList.contains("active")) {
        if (panel) {
          widget()?.switchAuthTab?.("quick");
          // switchAuthTab re-runs this observer; the panel is no longer active,
          // so we fall through to the copy below rather than looping.
        } else {
          // Quick Checkout isn't in this modal at all — config.quickCheckout off,
          // or Proteus restructured the panels. The CSS below is hiding the choice
          // screen on the promise that we'd replace it, and we can't. Take the
          // promise back rather than leave a customer staring at an empty modal.
          document.documentElement.removeAttribute(FLAG);
          return;
        }
      }

      if (!panel) return;

      // ── 2. make it read like a question people can answer ───────────────
      if (panel.getAttribute(MARK) !== "1") {
        // "Sign in with the phone number and birthdate on your existing account"
        // presumes they know they have one. Most don't.
        const help = panel.querySelector<HTMLElement>(".proteus-forgot-help");
        if (help) help.textContent = "Let's find your account.";

        const phone = panel.querySelector<HTMLElement>('label[for="proteus-quick-phone"]');
        if (phone) phone.textContent = "Phone number";
        const bday = panel.querySelector<HTMLElement>('label[for="proteus-quick-birthdate"]');
        if (bday) bday.textContent = "Birthday";

        // The widget ships this panel with NO footer, and we hide its Back button
        // (it returns to the choice screen, which no longer exists here). Without
        // these two links the only ways out are Continue and the × — a genuinely
        // new customer would be stuck. They are the small print under the form,
        // not competition for it.
        if (!panel.querySelector(".hl-auth-footer")) {
          const footer = document.createElement("div");
          footer.className = "hl-auth-footer";

          const first = document.createElement("p");
          first.className = "hl-auth-first";
          first.textContent = "First time here? ";
          first.appendChild(link("Create an account", "hl-auth-link", "register"));
          footer.appendChild(first);

          footer.appendChild(link("Sign in with a password instead", "hl-auth-alt", "login"));
          panel.appendChild(footer);
        }
        panel.setAttribute(MARK, "1");
      }

      // ── 3. turn "we couldn't find you" into a way forward ───────────────
      // Proteus's copy already says to create an account; it just gives no way to
      // do it. Their wording is left alone — we only add the button.
      const err = document.getElementById("proteus-quick-error");
      if (!err || err.style.display === "none") return;
      if (err.querySelector(".hl-auth-newbtn")) return; // already offered
      if (!NOT_FOUND.test(err.textContent ?? "")) return;

      err.appendChild(link("Create an account", "hl-auth-newbtn", "register"));
    };

    // Two observers rather than one, on purpose. Both things we react to are
    // ATTRIBUTE changes — the active panel is a class, the error's visibility is an
    // inline style — and watching attributes across the whole body would fire on
    // every card the product grid renders and every image it lazy-loads. That is a
    // lot of wasted work on a shop-floor tablet.
    //
    // So: a childList-only watch on the body, which is cheap, purely to notice the
    // modal appear; then a narrow watch on the modal itself, which is a small tree
    // that only exists while someone is signing in.
    let inner: MutationObserver | null = null;
    // The NODE being watched, not just whether we're watching something.
    //
    // showLoginModal opens by REPLACING any modal already on screen:
    //     const existingModal = document.getElementById('proteus-login-modal');
    //     if (existingModal) existingModal.remove();
    //     ... document.body.appendChild(overlay);
    //
    // Both mutations land in one observer batch, so a check of "do I already have
    // an observer?" is true — and we'd keep watching the removed node while the
    // live modal goes unpatched. On a kiosk that means the choice screen stays
    // active behind CSS that hides it: an empty modal. Comparing nodes is what
    // makes the swap visible.
    let watched: HTMLElement | null = null;

    const watchModal = () => {
      const modal = document.getElementById("proteus-login-modal");
      if (modal === watched) return;

      inner?.disconnect();
      inner = null;
      watched = null;
      if (!modal) return; // closeLoginModal removed it

      watched = modal;
      inner = new MutationObserver(apply);
      inner.observe(modal, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      apply();
    };

    document.documentElement.setAttribute(FLAG, "");

    watchModal();
    const outer = new MutationObserver(watchModal);
    // subtree, even though the widget appends the overlay straight to document.body
    // today (`document.body.appendChild(overlay)`). That is one line of theirs away
    // from changing, and the cost here is small — childList records are far rarer
    // than the attribute churn we're careful to keep scoped to the modal.
    outer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.documentElement.removeAttribute(FLAG);
      outer.disconnect();
      inner?.disconnect();
    };
  }, []);

  return null;
}
