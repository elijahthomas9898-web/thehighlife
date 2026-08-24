import type { Metadata } from "next";
import AgeCheckClient from "./AgeCheckClient";

export const metadata: Metadata = {
  title: "Age Gate Check",
  robots: { index: false, follow: false },
};

/**
 * Internal support/diagnostic page for the 21+ gate — not linked from anywhere
 * and noindex. The boot script in layout.tsx also bypasses the gate on this path
 * so the results are always readable. Safe to delete once the mobile gate issue
 * is closed out.
 */
export default function AgeCheckPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#060707",
        padding: "34px 18px 60px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1
          style={{
            color: "#f3f7f1",
            fontSize: 24,
            margin: "0 0 6px",
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          Age Gate <span style={{ color: "#40d283" }}>Check</span>
        </h1>
        <AgeCheckClient />
      </div>
    </main>
  );
}
