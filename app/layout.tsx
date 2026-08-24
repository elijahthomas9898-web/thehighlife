import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import AgeGate from "./components/AgeGate";
import WarnBand from "./components/WarnBand";
import { InlineScript } from "./components/InlineScript";

/**
 * The groovy display face. Self-hosted by Next at build time, so it renders
 * BYTE-IDENTICALLY on the kiosk, phones and desktop — no more per-device
 * fallback to Arial Rounded / SF Rounded / Roboto. Baloo 2 is the closest
 * free match to the rounded bold look, and pairs with the bubble logo.
 */
const groovy = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-groovy",
  display: "swap",
});

export const metadata: Metadata = {
  // Canonical domain: makes page/OG/canonical URLs absolute and points them at
  // the real domain (not the *.netlify.app address), so Google attributes all
  // ranking to thehighlifeny.com.
  metadataBase: new URL("https://thehighlifeny.com"),
  title: "The High Life Dispensary | West Babylon, NY",
  description:
    "Licensed New York adult-use dispensary in West Babylon. The brands you love, tested and shelf-ready, with fresh deals every week. Must be 21+.",
};

/**
 * Runs synchronously while the browser parses the HTML — BEFORE first paint.
 * Two jobs, both of which depend on client-only state:
 *   1. data-age="ok"  — hides the 21+ gate for visitors who already confirmed,
 *                       with no flash of the gate (see Next.js "Preventing Flash
 *                       Before Hydration"). Absent = gate shows + scroll locked,
 *                       so it fails CLOSED.
 *   2. data-today="N" — highlights today's row in the hours table, in the STORE's
 *                       timezone (America/New_York), not the visitor's.
 * Both are plain attributes driving CSS, so React never has to reconcile them.
 */
const BOOT_SCRIPT = `(function(){
// Proof-of-life marker: if this attribute is missing on a device, the inline
// boot script never executed there (which would explain a gate that reappears).
// Read by /agecheck.
try{document.documentElement.setAttribute("data-boot","1")}catch(e){}
// In-store signage (/signage) is inside a 21+-verified space — bypass the gate
// before first paint so a TV never shows the "Are you 21?" prompt.
// /agecheck is the age-gate diagnostic — it must be readable without the gate
// covering it, or it can't report what's broken.
try{if(location.pathname.indexOf("/signage")===0||location.pathname.indexOf("/agecheck")===0){document.documentElement.setAttribute("data-age","ok")}}catch(e){}
try{if(localStorage.getItem("hl_age_verified")==="1"){document.documentElement.setAttribute("data-age","ok")}}catch(e){}
try{if(document.cookie.indexOf("hl_age_verified=1")!==-1){document.documentElement.setAttribute("data-age","ok")}}catch(e){}
// Storage-independent safety net for in-app browsers (Instagram/TikTok/FB) that
// wipe localStorage AND cookies between pages: if this page was reached FROM a
// page on our own site, the visitor already cleared the gate (it's a full-screen
// blocker, so internal navigation is impossible before accepting). Only a first
// arrival from outside / a direct hit still shows the gate.
try{if(document.referrer&&document.referrer.indexOf(location.origin+"/")===0){document.documentElement.setAttribute("data-age","ok")}}catch(e){}
try{var d=new Date().toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short"}),
m={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
if(m[d]!==undefined){document.documentElement.setAttribute("data-today",String(m[d]))}}catch(e){}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={groovy.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={BOOT_SCRIPT} />
      </head>
      <body>
        {/* Gate is always in the DOM; CSS decides whether it's visible. */}
        <AgeGate />
        {/* The real cart/checkout is Proteus's JSCart, embedded on /menu. */}
        {children}
        <WarnBand />
      </body>
    </html>
  );
}
