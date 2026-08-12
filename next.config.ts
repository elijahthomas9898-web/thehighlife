import type { NextConfig } from "next";

/**
 * Security + indexing headers live HERE, not in netlify.toml.
 *
 * Netlify's [[headers]] rules don't reliably reach Next.js server-rendered
 * pages — verified against a live deploy, where X-Robots-Tag and
 * X-Frame-Options were silently absent. Next applies these to its own
 * responses, so they work on any host.
 */

/** Site is hidden from search engines until SITE_PUBLIC=true. See README. */
const PREVIEW = process.env.SITE_PUBLIC !== "true";

// Framing headers protect the 21+ gate from being embedded/hidden by another
// site. Split out so the signage route can opt OUT of them.
const noFrame = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];
const baseSecurity = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    const robots = PREVIEW ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : [];
    return [
      // Base security + robots on EVERY path (incl. /signage).
      { source: "/:path*", headers: [...baseSecurity, ...robots] },
      // No-framing on everything EXCEPT /signage. That route is a public in-store
      // menu display with no age gate to protect, so signage players (e.g.
      // OptiSigns) may embed it in an iframe. Negative lookahead excludes it.
      { source: "/((?!signage).*)", headers: noFrame },
    ];
  },
};

export default nextConfig;
