# The High Life Dispensary — website

Private. 1300 N Wellwood Ave, West Babylon NY 11704 · NYS OCM# OCM-CAURD-25-000277-D1

Run locally:

```bash
npm run dev
```

Deploys automatically to Netlify on every push to `main`.

---

## 🚀 Launch day — two things, both required

The site is currently **hidden from Google on purpose** so it can't compete with
thehighlifeny.com while testing. To go public you must do BOTH:

1. In Netlify, set env var `SITE_PUBLIC` = `true`
2. In `netlify.toml`, delete the `X-Robots-Tag = "noindex, nofollow"` block

Doing only one leaves the site invisible.

---

## Editing the site

Almost everything lives in **`data/site.ts`** — deals, hours, address, category
descriptions, the About copy, and the tax rate. Products and prices are NOT in
there; those come live from Proteus.

### ⚠️ Writing deals — New York rules

NY allows discounts, BOGOs, and loyalty offers, but:

- **No gamification** — no spin-to-win, scratch-offs, or game-style promos
- **Nothing appealing to under-21** — no cartoons, toys, or candy-brand parodies
- **Don't advertise free or penny-priced cannabis.** Two add-on deals run at
  $0.01 in the register but deliberately say "Add-On" here instead of showing
  the price.
- **Keep records** of what you advertise

Have compliance review new deal wording before it goes live.

---

## Notes for whoever works on this next

- **Proteus credentials** live in `.env.local` (never committed) and in Netlify's
  env vars. Server-side only — they must never reach the browser.
- **Never show placeholder products.** If the API fails the menu shows an honest
  "temporarily unavailable" page. Fake stock sends customers in for things we
  don't have. See the comment in `lib/proteus.ts`.
- **Proteus returns auth errors as HTTP 200** with `{"error": "..."}`, so a bad
  key looks like an empty catalog. `call()` throws on that — don't remove it.
- The **21+ age gate fails closed**: it's driven by a `data-age` attribute set
  before first paint, so if scripts or storage fail, the gate stays up.
- `AGENTS.md` — this is Next.js 16; read `node_modules/next/dist/docs/` before
  assuming an API works the way older versions did.
