"use client";

import { useEffect, useState } from "react";
import {
  KIOSK_DEFAULTS,
  clearKioskSettings,
  loadKioskSettings,
  saveKioskSettings,
  type KioskSettings,
} from "@/lib/kioskSettings";

/**
 * Staff settings for one kiosk tablet. Reached at /kiosk/settings — not linked
 * from anywhere, because the kiosk runtime covers the screen and a customer has
 * no way to type a URL.
 *
 * Settings are per device (see lib/kioskSettings.ts): each tablet is its own
 * machine in its own spot, and the one by the door may want different timings
 * from the one at the counter.
 */

type Diagnostics = {
  secure: boolean;
  userAgent: string;
  likelyWebView: boolean;
  screen: string;
};

function readDiagnostics(): Diagnostics {
  const ua = navigator.userAgent;
  return {
    secure: window.isSecureContext,
    // Android WebView reports "; wv)". Not authoritative, but it distinguishes a
    // lockdown app from real Chrome, which is the first thing worth knowing when
    // a tablet misbehaves.
    likelyWebView: /\bwv\b/.test(ua) || /Version\/[\d.]+ Chrome/.test(ua),
    userAgent: ua,
    screen: `${window.innerWidth}×${window.innerHeight}`,
  };
}

export default function KioskSettingsClient() {
  const [settings, setSettings] = useState<KioskSettings>(KIOSK_DEFAULTS);
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [saved, setSaved] = useState<null | string>(null);

  useEffect(() => {
    setSettings(loadKioskSettings());
    setDiag(readDiagnostics());
  }, []);

  const set = <K extends keyof KioskSettings>(key: K, value: KioskSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(null);
  };

  const onSave = () => {
    const ok = saveKioskSettings(settings);
    setSaved(ok ? "Saved to this tablet." : "Could not save — storage is blocked in this browser.");
  };

  const onReset = () => {
    clearKioskSettings();
    setSettings({ ...KIOSK_DEFAULTS });
    setSaved("Reset to defaults.");
  };

  return (
    <div className="kset">
      <header className="kset-head">
        <h1>Kiosk Settings</h1>
        <p>
          These apply to <strong>this tablet only</strong>. Every device on the floor is
          configured separately.
        </p>
      </header>

      {/* ── timing ──────────────────────────────────────────────── */}
      <section className="kset-card">
        <h2>Timing</h2>

        <label className="kset-field">
          <span>Reset for next customer after</span>
          <div className="kset-input">
            <input
              type="number"
              min={1}
              max={30}
              value={settings.resetMinutes}
              onChange={(e) => set("resetMinutes", Number(e.target.value))}
            />
            <em>minutes idle</em>
          </div>
          <small>Clears the cart and signs the shopper out. Default 3.</small>
        </label>

        <label className="kset-field">
          <span>Show deals screen after</span>
          <div className="kset-input">
            <input
              type="number"
              min={10}
              max={600}
              value={settings.attractIdleSeconds}
              onChange={(e) => set("attractIdleSeconds", Number(e.target.value))}
            />
            <em>seconds idle</em>
          </div>
          <small>Must be shorter than the reset above, or it never appears. Default 45.</small>
        </label>

        <label className="kset-field">
          <span>Change deal every</span>
          <div className="kset-input">
            <input
              type="number"
              min={2}
              max={60}
              value={settings.attractRotateSeconds}
              onChange={(e) => set("attractRotateSeconds", Number(e.target.value))}
            />
            <em>seconds</em>
          </div>
          <small>Default 6.</small>
        </label>

        {settings.attractIdleSeconds >= settings.resetMinutes * 60 && (
          <p className="kset-warn">
            The deals screen is set to appear after the tablet has already reset, so it will
            never show. Lower it below {settings.resetMinutes * 60} seconds.
          </p>
        )}
      </section>

      {/* ── display ─────────────────────────────────────────────── */}
      <section className="kset-card">
        <h2>On screen</h2>

        <label className="kset-toggle">
          <input
            type="checkbox"
            checked={settings.attractEnabled}
            onChange={(e) => set("attractEnabled", e.target.checked)}
          />
          <span>
            <strong>Idle deals screen</strong>
            <small>Takes over when nobody&apos;s using the tablet.</small>
          </span>
        </label>

        <label className="kset-toggle">
          <input
            type="checkbox"
            checked={settings.dealsPanelEnabled}
            onChange={(e) => set("dealsPanelEnabled", e.target.checked)}
          />
          <span>
            <strong>Deals panel</strong>
            <small>The slide-up panel of this week&apos;s deals.</small>
          </span>
        </label>
      </section>

      <div className="kset-actions">
        <button type="button" className="kset-btn" onClick={onSave}>
          Save settings
        </button>
        <button type="button" className="kset-btn kset-btn-ghost" onClick={onReset}>
          Reset to defaults
        </button>
        <a className="kset-btn kset-btn-ghost" href="/kiosk">
          Back to kiosk
        </a>
      </div>
      {saved && <p className="kset-note">{saved}</p>}

      {/* ── diagnostics ─────────────────────────────────────────── */}
      <section className="kset-card kset-diag">
        <h2>This device</h2>
        {diag === null ? (
          <p className="kset-muted">Reading…</p>
        ) : (
          <dl>
            <dt>Secure connection</dt>
            <dd>{diag.secure ? "Yes" : "No"}</dd>
            <dt>Screen</dt>
            <dd>{diag.screen}</dd>
            <dt>Runs inside an app</dt>
            <dd>{diag.likelyWebView ? "Looks like it" : "Looks like a full browser"}</dd>
            <dt>Identifies as</dt>
            <dd className="kset-ua">{diag.userAgent}</dd>
          </dl>
        )}
      </section>
    </div>
  );
}
