# Connecting Proteus 420 — What I Need

**You do NOT need to send anyone the API documentation.** Just find these
answers in the docs and fill them into `lib/proteus.ts`. Each blank in that
file is labelled `◀── BLANK 1`, `◀── BLANK 2`, etc.

Until you fill them in, the menu page shows **sample products** so you can see
the design working. Visit **http://localhost:3100/menu** right now — it already works.

---

## The 6 answers to find

### 1. Base URL
Search the docs for **"Base URL"**, **"Endpoint"**, or **"https://"**.
It's the part before every path.

> Looks like: `https://api.proteus420.com`

---

### 2. How the API key is sent
Search the docs for **"Authentication"** or **"Authorization"**.
You need the **header name** and the **format**.

> Looks like one of these:
> - `Authorization: Bearer YOUR_KEY`
> - `X-API-Key: YOUR_KEY`
> - `apikey: YOUR_KEY`

---

### 3. Client name header — *maybe not needed*
Your API panel said *"Use this client name for API authentication"* with the
value `highlife`. If the docs show that being sent as a header, note the
**header's name**. If it isn't mentioned, skip this one.

> Looks like: `X-Client-Name: highlife`

---

### 4. The endpoint paths
The part **after** the base URL.

| I need | Search the docs for | Required? |
|---|---|---|
| List products | "items", "products", "inventory" | ✅ Yes |
| List categories | "categories" | Optional |
| **Create an order** | "order", "create order", "sale", "cart" | 🔴 **Important** |

> **The order one matters most.** If Proteus can create a pickup order through
> the API, customers can order online and pay in store. If it can't, the menu
> becomes browse-only and people order at the counter. **Just tell me
> yes or no** — that single answer decides how the next phase gets built.

---

### 5. An example response
Find any **example response** in the docs and look at how it's wrapped:

```
{ "data": [ ... ] }      or      { "items": [ ... ] }      or      [ ... ]
```

The code already handles all the common shapes automatically, so you probably
don't need to change anything — just check it isn't something unusual.

---

### 6. The field names
From that same example response, note what Proteus calls each thing:

| The website needs | Proteus might call it |
|---|---|
| product name | `name`, `item_name`, `title` |
| category | `category`, `category_name`, `type` |
| price | `price`, `unit_price`, `retail_price` |
| THC % | `thc`, `thc_percent`, `potency` |
| in stock? | `quantity`, `qty_on_hand`, `stock` |
| brand | `brand`, `vendor`, `manufacturer` |
| size/weight | `size`, `weight`, `unit_size` |

The file already guesses the common names. You only change the ones that differ.

---

## Then: add your API key

1. Copy `.env.example` → rename the copy to `.env.local`
2. Paste your key after `PROTEUS_API_KEY=`
3. Restart the dev server

⚠️ **Make a dedicated key.** In the Proteus panel, create a new key named
`Website` with **only** Items / Inventory / Categories ticked. Don't use the
`all` key — if the website key ever leaks, it can only read products.

Also: the `all` key was visible in a screenshot earlier. **Regenerate it.**

---

## Can't find something?

Don't send the whole document. Just tell me what that one section says —
e.g. *"auth is a header called `apikey`"* — and I'll wire it up.

## Nothing to fill in? Also fine.

If sharing the details is a problem under the MNDA, fill in `lib/proteus.ts`
yourself. Everything else is already built around it — the menu page,
categories, styling and fallbacks all work the moment those blanks are filled.
