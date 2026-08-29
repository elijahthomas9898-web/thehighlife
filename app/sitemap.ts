import type { MetadataRoute } from "next";

/**
 * The sitemap Google reads to discover every public page. robots.ts already
 * points crawlers here (https://thehighlifeny.com/sitemap.xml).
 *
 * URLs use the canonical domain (thehighlifeny.com) on purpose, so once the
 * domain points at this site, Google indexes the REAL domain — never the
 * temporary *.netlify.app address. /signage is intentionally left out (it's
 * noindex, for in-store screens only).
 *
 * NOTE: this file generates the sitemap, but the site stays hidden from search
 * until SITE_PUBLIC=true (see robots.ts + next.config.ts). Until then robots.txt
 * disallows everything, so the sitemap simply isn't crawled yet.
 */
const BASE = "https://thehighlifeny.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // [path, changeFrequency, priority]
  const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["", "daily", 1], // home
    ["/menu", "daily", 0.9], // live stock — changes constantly
    ["/deals", "daily", 0.9], // this week's deals
    ["/shop", "weekly", 0.7], // browse by category
    ["/merch", "weekly", 0.5],
    ["/about", "monthly", 0.5],
    ["/visit", "monthly", 0.6], // hours / directions — local SEO
    ["/faq", "monthly", 0.6], // long-tail local queries: ID rules, pickup, "dispensary near me"
    ["/privacy", "yearly", 0.2],
    ["/terms", "yearly", 0.2],
  ];

  return pages.map(([path, changeFrequency, priority]) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
