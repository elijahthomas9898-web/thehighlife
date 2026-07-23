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

const securityHeaders = [
  // The 21+ gate must not be framable — otherwise another site could embed us
  // and hide it. This is the load-bearing one for compliance.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: PREVIEW
          ? [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }]
          : securityHeaders,
      },
    ];
  },
};

export default nextConfig;
