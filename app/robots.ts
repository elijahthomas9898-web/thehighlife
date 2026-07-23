import type { MetadataRoute } from "next";

/**
 * ⚠️ PREVIEW MODE — blocks all search engines.
 *
 * Two reasons this matters while testing:
 *   1. A half-finished cannabis site must not surface in search results.
 *   2. It would compete with the live thehighlifeny.com for the same terms.
 *
 * This is the second layer of protection; netlify.toml also sends an
 * X-Robots-Tag header. Belt and braces, because getting de-indexed after the
 * fact is slow and painful.
 *
 * ✏️ ON LAUNCH DAY: set PREVIEW to false (or set SITE_PUBLIC=true in Netlify)
 *    AND delete the [[headers]] block in netlify.toml. Both must change.
 */
const PREVIEW = process.env.SITE_PUBLIC !== "true";

export default function robots(): MetadataRoute.Robots {
  if (PREVIEW) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://thehighlifeny.com/sitemap.xml",
  };
}
