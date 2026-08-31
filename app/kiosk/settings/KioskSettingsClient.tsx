"use client";

import { useEffect, useState } from "react";
import {
  KIOSK_DEFAULTS,
  clearKioskSettings,
  loadKioskSettings,
  saveKioskSettings,
  type KioskSettings,
} from "@/lib/kioskSettings";
import { buildTestPage } from "@/lib/escpos";
import { store } from "@/data/site";

/**
 * Staff settings for one kiosk tablet. Reached at /kiosk/settings — not linked
 * from anywhere, because the kiosk runtime covers the screen and a customer has
 * no way to type a URL.
 *
 * Settings are per device (see lib/kioskSettings.ts). The printer section is the
 * reason this page exists: whether these tablets can print at all depends on
 * something we can't determine remotely, and this answers it on the device in
 * question in one tap.
 */

type UsbDevice = {
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  opened: boolean;
  configuration: { interfaces: { interfaceNumber: number; alternate: { endpoints: { direction: string; endpointNumber: number }[] } }[] } | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(endpoint: number, data: Uint8Array): Promise<{ status: string }>;
};

type Diagnostics = {
  webusb: boolean;
  secure: boolean;
  userAgent: string;
  likelyWebView: boolean;
  screen: string;
};

function readDiagnostics(): Diagnostics {
  const ua = navigator.userAgent;
  return {
    webusb: typeof (navigator as { usb?: unknown }).usb !== "undefined",
    secure: window.isSecureContext,
    userAgent: ua,
    // Android WebView reports "; wv)" in its UA. Not authoritative, but it's the
    // difference between a lockdown app and real Chrome, which decides everything
    // in the printer section below.
    likelyWebView: /\bwv\b/.test(ua) || /Version\/[\d.]+ Chrome/.test(ua),
    screen: `${window.innerWidth}×${window.innerHeight}`,
  };
}

export default function KioskSettingsClient() {
  const [settings, setSettings] = useState<KioskSettings>(KIOSK_DEFAULTS);
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [saved, setSaved] = useState<null | string>(null);
  const [printer, setPrinter] = useState<UsbDevice | null>(null);
  const [printerMsg, setPrinterMsg] = useState<string>("");

  useEffect(() => {
    setSettings(loadKioskSettings());
    setDiag(readDiagnostics());
    // A device paired earlier comes back without needing a tap — that's what
    // makes pairing a one-time job per tablet.
    const usb = (navigator as { usb?: { getDevices(): Promise<UsbDevice[]> } }).usb;
    if (!usb) return;
    usb
      .getDevices()
      .then((list) => {
        if (list.length) {
          setPrinter(list[0]);
          setPrinterMsg(`Already paired: ${list[0].productName || "printer"}`);
        }
      })
      .catch(() => {});
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

  const pair = async () => {
    const usb = (navigator as {
      usb?: { requestDevice(o: { filters: { classCode: number }[] }): Promise<UsbDevice> };
    }).usb;
    if (!usb) return;
    setPrinterMsg("");
    try {
      // classCode 7 is the USB printer class. Must be called from a click —
      // browsers refuse the chooser without a user gesture.
      const dev = await usb.requestDevice({ filters: [{ classCode: 7 }] });
      setPrinter(dev);
      setPrinterMsg(`Paired: ${dev.productName || "printer"}. This sticks to this tablet.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPrinterMsg(/cancel|No device selected/i.test(msg) ? "Pairing cancelled." : `Pairing failed: ${msg}`);
    }
  };

  const testPrint = async () => {
    if (!printer) return;
    setPrinterMsg("Printing…");
    try {
      if (!printer.opened) await printer.open();
      if (printer.configuration === null) await printer.selectConfiguration(1);

      const iface = printer.configuration?.interfaces?.[0];
      const endpoint = iface?.alternate?.endpoints?.find((e) => e.direction === "out");
      if (!iface || !endpoint) throw new Error("no output endpoint on this device");

      await printer.claimInterface(iface.interfaceNumber);
      await printer.transferOut(endpoint.endpointNumber, buildTestPage(store.name, new Date()));
      await printer.releaseInterface(iface.interfaceNumber);
      setPrinterMsg("Sent. A test slip should have printed.");
    } catch (e) {
      setPrinterMsg(`Print failed: ${e instanceof Error ? e.message : String(e)}`);
    }
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

      {/* ── printer ─────────────────────────────────────────────── */}
      <section className="kset-card">
        <h2>Receipt printer</h2>

        {diag === null ? (
          <p className="kset-muted">Checking this device…</p>
        ) : !diag.webusb ? (
          <>
            <p className="kset-bad">This tablet cannot print from the browser.</p>
            <p className="kset-muted">
              It has no USB support, which usually means the kiosk is running inside a
              lockdown app rather than Chrome itself. Switching this tablet to Chrome with
              Android screen pinning would enable it.
            </p>
            <p className="kset-muted">
              Printing may still work anyway: Proteus has <em>Server Direct Printing</em>
              switched on, and that prints from their server rather than this browser. Ask
              them what it needs — it doesn&apos;t depend on anything here.
            </p>
          </>
        ) : (
          <>
            <p className="kset-good">This tablet can print.</p>
            <div className="kset-row">
              <button type="button" className="kset-btn" onClick={pair}>
                {printer ? "Pair a different printer" : "Pair printer"}
              </button>
              <button
                type="button"
                className="kset-btn kset-btn-ghost"
                onClick={testPrint}
                disabled={!printer}
              >
                Test print
              </button>
            </div>
            {printerMsg && <p className="kset-note">{printerMsg}</p>}
            <p className="kset-muted">
              Pairing is once per tablet and survives restarts. It is lost if the tablet&apos;s
              site data is cleared.
            </p>
            <p className="kset-warn">
              Nothing prints automatically yet. Proteus&apos;s Server Direct Printing is also
              on, and printing from both places would hand every customer two tickets — so
              this stays manual until we know which one is doing the job.
            </p>
          </>
        )}
      </section>

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
            <dt>Browser USB</dt>
            <dd>{diag.webusb ? "Available" : "Not available"}</dd>
            <dt>Secure connection</dt>
            <dd>{diag.secure ? "Yes" : "No — USB needs HTTPS"}</dd>
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
