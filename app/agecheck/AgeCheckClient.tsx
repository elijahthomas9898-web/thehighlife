"use client";

import { useEffect, useState } from "react";

const KEY = "hl_age_verified";

type Row = { label: string; value: string; ok: boolean | null };

function readCookie(): boolean {
  try {
    return document.cookie.indexOf(`${KEY}=1`) !== -1;
  } catch {
    return false;
  }
}

function readLocal(): string {
  try {
    return String(localStorage.getItem(KEY));
  } catch (e) {
    return `BLOCKED (${(e as Error).name})`;
  }
}

/**
 * Age-gate diagnostic. The gate persists verification three ways (localStorage,
 * a cookie, and a same-site referrer check) and all three test clean here — but
 * it still re-prompts on the owner's iPhone, which we can't reproduce.
 *
 * This runs the SAME test on the real device: step 1 writes the flags, then a
 * genuine full page navigation to step 2 reads them back. Whichever layer comes
 * back "LOST" is the one the device is killing.
 */
export default function AgeCheckClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("step") === "2" ? 2 : 1;
    setStep(s);

    const html = document.documentElement;
    const bootRan = html.getAttribute("data-boot") === "1";
    const ua = navigator.userAgent;
    // In-app browsers (Instagram/Facebook/TikTok) wipe storage between pages.
    const inApp = /(FBAN|FBAV|Instagram|Line|TikTok|Snapchat|Twitter|Pinterest)/i.test(ua);
    const iosSafari = /iPhone|iPad/.test(ua) && !inApp;

    const out: Row[] = [];

    if (s === 1) {
      // ---- STEP 1: write the flags, confirm they took ----
      let lsWrote = false;
      let lsErr = "";
      try {
        localStorage.setItem(KEY, "1");
        lsWrote = localStorage.getItem(KEY) === "1";
      } catch (e) {
        lsErr = (e as Error).name;
      }
      try {
        document.cookie = `${KEY}=1; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        /* blocked */
      }
      const ckWrote = readCookie();

      out.push({
        label: "Boot script ran",
        value: bootRan ? "YES" : "NO — script never executed",
        ok: bootRan,
      });
      out.push({
        label: "Can SAVE to localStorage",
        value: lsWrote ? "YES" : `NO${lsErr ? ` (${lsErr})` : ""}`,
        ok: lsWrote,
      });
      out.push({
        label: "Can SAVE a cookie",
        value: ckWrote ? "YES" : "NO — cookies blocked",
        ok: ckWrote,
      });
    } else {
      // ---- STEP 2: after a REAL page load, did anything survive? ----
      const lsNow = readLocal();
      const lsKept = lsNow === "1";
      const ckKept = readCookie();
      const ref = document.referrer || "(empty)";
      const refOk = !!document.referrer && document.referrer.indexOf(window.location.origin + "/") === 0;
      const ageOk = html.getAttribute("data-age") === "ok";

      out.push({
        label: "Boot script ran",
        value: bootRan ? "YES" : "NO — script never executed",
        ok: bootRan,
      });
      out.push({
        label: "localStorage survived",
        value: lsKept ? "KEPT" : `LOST (${lsNow})`,
        ok: lsKept,
      });
      out.push({ label: "Cookie survived", value: ckKept ? "KEPT" : "LOST", ok: ckKept });
      out.push({
        label: "Referrer recognized",
        value: refOk ? "YES" : `NO — ${ref}`,
        ok: refOk,
      });
      out.push({
        label: "→ Gate would stay DOWN",
        value: lsKept || ckKept || refOk ? "YES ✓" : "NO — this is the bug",
        ok: lsKept || ckKept || refOk,
      });
      out.push({ label: "data-age right now", value: String(html.getAttribute("data-age")), ok: ageOk });
    }

    out.push({
      label: "Browser",
      value: inApp ? "IN-APP browser (wipes storage)" : iosSafari ? "iOS Safari" : "Other",
      ok: inApp ? false : null,
    });

    setRows(out);
    setSummary(
      `step=${s} boot=${bootRan} ls=${readLocal()} cookie=${readCookie()} ref=${document.referrer || "(empty)"} age=${html.getAttribute("data-age")} ua=${ua}`,
    );
  }, []);

  const box: React.CSSProperties = {
    background: "#0d100e",
    border: "1px solid #24302a",
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
  };

  return (
    <div style={{ color: "#f3f7f1", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>
      <p style={{ color: "#9fb3a8", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
        {step === 1
          ? "Step 1 of 2 — saving the 21+ confirmation on this device."
          : "Step 2 of 2 — results after a real page change:"}
      </p>

      <div style={box}>
        {rows === null ? (
          <p style={{ margin: 0, color: "#9fb3a8" }}>Running tests…</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                padding: "11px 0",
                borderBottom: "1px solid #1b241f",
                fontSize: 14,
                alignItems: "baseline",
              }}
            >
              <span style={{ color: "#9fb3a8" }}>{r.label}</span>
              <b
                style={{
                  color: r.ok === null ? "#f3f7f1" : r.ok ? "#40d283" : "#ff6b6b",
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {r.value}
              </b>
            </div>
          ))
        )}
      </div>

      {step === 1 ? (
        <>
          <p style={{ color: "#9fb3a8", fontSize: 15, lineHeight: 1.6, marginTop: 22 }}>
            Now tap the button below. It loads a new page exactly like tapping a category does — then
            tells us what your phone kept.
          </p>
          {/* A real full page load, the same kind that makes the gate reappear. */}
          <a
            href="/agecheck?step=2"
            style={{
              display: "block",
              textAlign: "center",
              background: "#40d283",
              color: "#08120b",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              padding: "16px 18px",
              borderRadius: 12,
              marginTop: 8,
            }}
          >
            Run the page-change test →
          </a>
        </>
      ) : (
        <p style={{ color: "#9fb3a8", fontSize: 15, lineHeight: 1.6, marginTop: 22 }}>
          Screenshot this whole screen and send it over — the red lines show exactly what your phone
          is throwing away.
        </p>
      )}

      <pre
        style={{
          ...box,
          fontSize: 11,
          color: "#7d8f85",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {summary}
      </pre>
    </div>
  );
}
