"use client";

import { useEffect, useState } from "react";
import {
  KIOSK_DEFAULTS,
  clearKioskSettings,
  loadKioskSettings,
  saveKioskSettings,
  type KioskSettings,
} from "@/lib/kioskSettings";
import { buildPickupTicket, buildTestPage } from "@/lib/escpos";
import { RAWBT_PLAY_URL, sendToRawbt } from "@/lib/rawbt";
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

type UsbEndpoint = {
  direction: string;
  endpointNumber: number;
  type: string; // "bulk" | "interrupt" | "isochronous"
};
type UsbAlternate = {
  alternateSetting: number;
  interfaceClass: number;
  endpoints: UsbEndpoint[];
};
type UsbInterface = {
  interfaceNumber: number;
  alternate: UsbAlternate;
  alternates: UsbAlternate[];
};
type UsbDevice = {
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  opened: boolean;
  configuration: { interfaces: UsbInterface[] } | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  selectAlternateInterface(n: number, alt: number): Promise<void>;
  transferOut(endpoint: number, data: Uint8Array): Promise<{ status: string }>;
  reset(): Promise<void>;
};

/** An interface/endpoint pair we could plausibly print through. */
type PrintTarget = { interfaceNumber: number; alternateSetting: number; endpoint: number; isPrinterClass: boolean };

/**
 * Every route to a bulk OUT endpoint on the device, best candidate first.
 *
 * Taking `interfaces[0]` and hoping is wrong: thermal printers routinely expose
 * several interfaces — a vendor-specific one, a printer-class one, sometimes a
 * composite device's other functions entirely — and only some are claimable.
 * Class 7 (printer) is tried first, then anything else with a bulk OUT.
 */
function findPrintTargets(device: UsbDevice): PrintTarget[] {
  const targets: PrintTarget[] = [];
  for (const iface of device.configuration?.interfaces ?? []) {
    const alts = iface.alternates?.length ? iface.alternates : [iface.alternate];
    for (const alt of alts) {
      if (!alt) continue;
      const out = alt.endpoints?.find((e) => e.direction === "out" && e.type === "bulk");
      if (!out) continue;
      targets.push({
        interfaceNumber: iface.interfaceNumber,
        alternateSetting: alt.alternateSetting ?? 0,
        endpoint: out.endpointNumber,
        isPrinterClass: alt.interfaceClass === 7,
      });
    }
  }
  return targets.sort((a, b) => Number(b.isPrinterClass) - Number(a.isPrinterClass));
}

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
  const [rawbtMsg, setRawbtMsg] = useState<string>("");

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

      const targets = findPrintTargets(printer);
      if (targets.length === 0) {
        throw new Error("this device has no bulk output — it may not be a printer");
      }

      // Claiming can fail because something else already holds the interface, so
      // work down the list instead of giving up on the first refusal.
      let claimed: PrintTarget | null = null;
      let lastError = "";

      const tryClaim = async () => {
        for (const t of targets) {
          try {
            await printer.claimInterface(t.interfaceNumber);
            if (t.alternateSetting > 0) {
              await printer.selectAlternateInterface(t.interfaceNumber, t.alternateSetting);
            }
            return t;
          } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
          }
        }
        return null;
      };

      claimed = await tryClaim();

      // Android binds printer-class devices to its own driver on plug-in, and that
      // driver won't share. A USB-level reset makes some devices re-enumerate and
      // drop that hold, which is the one lever available from a browser.
      if (!claimed && typeof printer.reset === "function") {
        setPrinterMsg("Printer busy — resetting it and retrying…");
        try {
          await printer.reset();
          await new Promise((r) => setTimeout(r, 600)); // let it come back up
          claimed = await tryClaim();
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      }

      if (!claimed) {
        // Almost always another process holding the device: Android's own print
        // service, or the printer vendor's app. The interface list goes in the
        // message so a photo of this screen is enough to diagnose it.
        const detail = targets
          .map((t) => `#${t.interfaceNumber}.${t.alternateSetting}${t.isPrinterClass ? "(printer)" : ""}`)
          .join(", ");
        throw new Error(
          `could not claim the printer, even after a reset. Tried: ${detail}. ` +
            `Android has bound this printer to its own driver and won't release it. ` +
            `Try: Settings → Connected devices → Printing → turn OFF the default print service, ` +
            `then unplug and replug the printer. If that doesn't do it, printing from the browser ` +
            `isn't going to work on this tablet — use Proteus's Server Direct Printing instead. ` +
            `Last error: ${lastError}`,
        );
      }

      await printer.transferOut(claimed.endpoint, buildTestPage(store.name, new Date()));
      await printer.releaseInterface(claimed.interfaceNumber);
      setPrinterMsg(
        `Sent on interface ${claimed.interfaceNumber}, endpoint ${claimed.endpoint}. A test slip should have printed.`,
      );
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

      {/* ── printer: the app route, which is the one that works ── */}
      <section className="kset-card">
        <h2>Receipt printer</h2>
        <p className="kset-muted" style={{ marginTop: 0 }}>
          Printing goes through the <strong>RawBT</strong> app. Android hands USB printers to
          its own driver and won&apos;t let the browser have them, so the app holds the printer
          and we pass it the ticket.
        </p>

        <div className="kset-row">
          <button
            type="button"
            className="kset-btn"
            onClick={() => {
              setRawbtMsg("Sent to RawBT. If nothing prints, the app isn't installed or set up.");
              sendToRawbt(buildTestPage(store.name, new Date()));
            }}
          >
            Test print
          </button>
          <button
            type="button"
            className="kset-btn kset-btn-ghost"
            onClick={() => {
              setRawbtMsg("Sent a sample ticket to RawBT.");
              sendToRawbt(
                buildPickupTicket({
                  storeName: store.name,
                  addressLine: store.addressLine1,
                  orderNumber: "TEST",
                  placedAt: new Date(),
                }),
              );
            }}
          >
            Sample pickup ticket
          </button>
        </div>
        {rawbtMsg && <p className="kset-note">{rawbtMsg}</p>}

        <p className="kset-muted">
          Nothing happened at all? RawBT isn&apos;t installed —{" "}
          <a href={RAWBT_PLAY_URL} target="_blank" rel="noopener noreferrer">
            get it from Google Play
          </a>
          , open it once, and choose your printer inside the app. The browser can&apos;t tell
          whether it worked, so the paper is the only confirmation.
        </p>

        <label className="kset-toggle" style={{ marginTop: 6 }}>
          <input
            type="checkbox"
            checked={settings.autoPrintTickets}
            onChange={(e) => set("autoPrintTickets", e.target.checked)}
          />
          <span>
            <strong>Print a ticket automatically on each order</strong>
            <small>
              RawBT will come to the front, print, and drop back — Android gives a web page
              no way to print without something appearing. Remember to Save below.
            </small>
          </span>
        </label>

        {settings.autoPrintTickets && (
          <p className="kset-warn">
            Turn this OFF if Proteus&apos;s Server Direct Printing starts producing tickets —
            two systems printing hands every customer two copies.
          </p>
        )}
      </section>

      {/* ── printer: direct USB, kept for diagnosis ─────────────── */}
      <details className="kset-card kset-fallback">
        <summary>Direct USB printing (not working on these tablets)</summary>

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
          </>
        )}
      </details>

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
