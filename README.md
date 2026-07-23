# The High Life Dispensary — Website

Custom site for The High Life Dispensary, 1300 N Wellwood Ave, West Babylon NY 11704.
Built with Next.js 16. Licensed NY adult-use retail (NYS OCM# OCM-CAURD-25-000277-D1).

---

## How to run it on your computer

Open a terminal in this folder and run:

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser. Press `Ctrl+C` in the terminal to stop it.

> Note: there's a shortcut folder at `D:\highlife-site` that points to this same folder.
> It exists because some tools can't handle the spaces in "the high life website".
> Don't delete it.

---

## The one file you'll actually edit: `data/site.ts`

Everything you change week-to-week lives in **`data/site.ts`**. You do not need to touch
any other file for normal updates.

| What | Where in that file |
|---|---|
| **Weekly deals** | the `deals` list ← *this is the one you'll change most* |
| Store hours | the `hours` list |
| Address, email, license # | the `store` section |
| Category names/descriptions | the `categories` list |
| The yellow warning text | `WARNING_TEXT` |

### Changing a deal

Find the deal in the `deals` list and edit the text between the quotes. For example, to
change Ounce Fridays from $99 to $89, change `value: "$99"` to `value: "$89"`. Save the
file — if the dev server is running, the site updates instantly.

### ⚠️ Rules when writing deals (New York law)

NY **allows** discounts, coupons, loyalty programs, and bundles — but:

- No **gamification**: no "spin the wheel", scratch-offs, or game-style promos
- Nothing that could **appeal to under-21** (cartoons, toys, candy-brand parodies)
- No pricing **below fair market value**
- **Keep records** of your advertising for compliance

When in doubt, have your compliance person review the wording before it goes live.

---

## What's already built

- **21+ age gate** — blocks the site until the visitor confirms. Remembers them, and
  fails *closed* (stays up) if anything goes wrong.
- **Yellow compliance warning** on every page.
- **Hours table** that auto-highlights today, in *New York* time (not the visitor's).
- **Storefront hero**, deals marquee, pinned sideways-scrolling deals gallery,
  six photo category tiles, stats, location.

## What's NOT built yet

- **The live menu** — needs the Proteus 420 API docs (specifically whether the API can
  *create* a pickup order, not just list products).
- **Online pickup ordering** — pay-at-store, so no payment processing needed.
- **Deals admin page** — deliberately skipped for now; deals live in `data/site.ts`.
  If a staff member ever needs to edit deals without touching code, that's when we add it.

## Images

Live in `public/images/`. Replace a file with the same name to swap a photo.

- `logo.png` — the wordmark (nav + age gate)
- `storefront.jpg` — hero background
- `categories/*.jpg` — the six category tiles

## Security note

When the Proteus 420 API is wired up, the API key goes in `.env.local` (which is never
committed) and is only ever used **server-side**. It must never appear in code the
browser downloads.
