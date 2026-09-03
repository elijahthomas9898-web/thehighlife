"use client";

import { useEffect } from "react";

/**
 * Turns "that email already exists" into a way forward.
 *
 * Most of our customers already exist in Proteus — their ID was scanned at the
 * register on a previous visit — but that in-store record has no password. When
 * they try to sign up online, JSCart's registration fails with an error under the
 * email field and no next step (registration only branches on contract /
 * verify_email / complete — there's no "you already exist" path).
 *
 * So we watch for that error and offer the real answer, which differs by where
 * they're standing:
 *
 *   kiosk  — sign in with phone + birthday (Quick Checkout). Same account, no
 *            password, no leaving the tablet.
 *   online — email a link that sets a password on the existing record, so the
 *            two are connected for good.
 *
 * The widget rebuilds this modal itself, so we re-check on an interval and guard
 * against duplicate injection (same approach as MenuDealsMore).
 */

// Deliberately broad: Proteus's exact wording isn't documented and could change.
// Requires an "already known" phrase so it can't fire on ordinary validation
// errors like a malformed address.
const EXISTS = /(already|exists|registered|in use|duplicate|on file)/i;

const MARK = "hl-account-link";

export default function AccountLinkPrompt() {
  useEffect(() => {
    const openForgot = (email: string) => {
      window.ProteusWidget?.switchAuthTab?.("forgot");
      // The panel is re-rendered on switch, so fill after it exists.
      let tries = 0;
      const fill = () => {
        const f = document.getElementById("proteus-forgot-email") as HTMLInputElement | null;
        if (f) {
          f.value = email;
          f.focus();
          return;
        }
        if (tries++ < 20) setTimeout(fill, 100);
      };
      setTimeout(fill, 120);
    };

    const check = () => {
      const panel = document.getElementById("proteus-register-panel");
      if (!panel || !panel.classList.contains("active")) return;
      if (panel.querySelector(`.${MARK}`)) return; // already showing

      // Any visible error text in the registration panel.
      const errorEls = [
        panel.querySelector("#proteus-reg-error"),
        ...Array.from(panel.querySelectorAll(".proteus-form-error")),
      ].filter(Boolean) as HTMLElement[];

      const hit = errorEls.find(
        (el) => getComputedStyle(el).display !== "none" && EXISTS.test(el.textContent || ""),
      );
      if (!hit) return;

      const email =
        (document.getElementById("proteus-reg-email") as HTMLInputElement | null)?.value || "";

      // On a shop-floor tablet an emailed link is a dead end: the customer would
      // have to walk away from the kiosk, find their email, click through and come
      // back. Phone + birthday signs them into the SAME account on the spot, with no
      // password involved. On the website email is a fine route, so it stays there.
      const onKiosk = location.pathname.startsWith("/kiosk");

      const box = document.createElement("div");
      box.className = MARK;
      box.innerHTML = `
        <div class="${MARK}-title">Looks like you already shop with us</div>
        <p class="${MARK}-body">${
          onKiosk
            ? "You have an account from shopping in the store. Sign in with your phone number and birthday — no password needed."
            : "You have an account from visiting the store — it just doesn&rsquo;t have a password yet. Add one and you&rsquo;ll be able to order online with the same account."
        }</p>`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `${MARK}-btn`;
      btn.textContent = onKiosk ? "Use my phone number →" : "Set my password →";
      btn.addEventListener("click", () =>
        onKiosk ? window.ProteusWidget?.switchAuthTab?.("quick") : openForgot(email),
      );
      box.appendChild(btn);

      hit.parentElement?.insertBefore(box, hit.nextSibling);
    };

    check();
    const t = setInterval(check, 700);
    return () => clearInterval(t);
  }, []);

  return null;
}
