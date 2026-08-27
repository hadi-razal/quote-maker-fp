# Fairplatz Quotation Maker

Build an exhibition-stand quotation the way the Excel BOQ works — categories, line
items, per-category totals, VAT, terms — while an exact A4 preview of the finished
PDF updates beside you as you type.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build && npm start
```

## Signing in

One local account guards the app:

| Email | Password |
| --- | --- |
| `admin@fairplatz.com` | `Fairplatz@2025` |

Change either through environment variables — `NEXT_PUBLIC_FP_EMAIL` and
`NEXT_PUBLIC_FP_PASSWORD` (see `.env.example`, or Vercel → Settings →
Environment Variables). Signing in is remembered on that computer until you press
**Sign out** on the home screen.

> This is a **soft gate, not real authentication.** There is no server to check
> anything, so both values ship inside the JavaScript bundle and anyone who opens
> the browser's developer tools can read them or step around the screen. It keeps
> the app out of the way of someone who stumbles onto the URL; it does not protect
> the quotations from someone determined. Never reuse this password anywhere that
> matters. If the pricing genuinely needs protecting, that means real accounts on a
> server — a bigger change, worth doing separately.

## How it works

**Five steps, left side.** Project details → Items & prices → Pictures → Terms &
notes → Export settings. Each step says what it is for, and Back / Next move you
through. Everything saves to the browser as you type; there is no save button.

**The preview, right side.** The pages you see are the pages that print — same
markup, same millimetres. The `×` in the preview bar hides it on wide screens;
"Show preview" in the top bar brings it back. On phones and small tablets the two
sides become the *Edit* / *See the PDF* tabs at the bottom.

**Download PDF** checks the quotation first. If anything required is still empty
it says so and lists it — every line jumps straight to the box that needs filling
— and you can still choose *Export anyway*. Then a short panel shows the exact
steps for the device you are on: Windows, Mac (Chrome and Safari differ), iPhone /
iPad and Android each get their own instructions, and you can switch between them
if the guess is wrong. Tick "don't show this again" once you know the drill. The
browser does the saving, so the result is a real PDF with selectable text, not a
screenshot — and the same window prints on paper if that is what you want.

## What the document contains

| Page | Contents |
| --- | --- |
| Summary | Logo, project box, the first picture, a category-by-category summary, grand total |
| Visuals | Any further pictures, two to a page |
| Bill of Quantities | Every line, split across as many pages as it takes, with the totals at the end |
| Terms & Conditions | The standard Fairplatz text, plus contractor / customer signature blocks |

Pagination is measured, not guessed: every row is rendered off-screen, measured in
real pixels, and only then assigned to a page — which is why nothing ever lands on
top of the footer, and why the preview and the PDF agree.

## Pricing options

- **Itemised** — the category total is the sum of its lines.
- **Lump sum** — one agreed price for the whole category.
- **Show rates per line** (Print settings) — off by default, so the client sees a
  price per category, exactly like the Excel BOQ. Turn it on to print a rate and
  an amount on every line.
- **Optional** lines print with a tag and stay out of the totals; their value is
  summarised in a note under the grand total.

## Versions

A quotation can hold up to **10 versions** (V1…V10). "Create version N" in the
top-bar version menu copies everything from the current one, so you only change
what moved. Each version keeps its own prices, items and pictures, and prints with
`Rev. N` next to the reference. Older versions stay exactly as they were sent.

Use **Duplicate** on the home screen instead when you want a different job that
happens to start from an old quotation — that begins a fresh V1.

## Where the data lives

In the browser's local storage, on the machine that created it. Nothing is
uploaded; pictures are downsized to 1600px and embedded in the quotation. Clearing
site data clears the quotations, so treat a downloaded PDF as the record of
anything you have sent.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand
(localStorage persistence) · Vercel Analytics + Speed Insights.

```
src/lib/types.ts      the quotation model
src/lib/calc.ts       totals, money and date formatting, validation
src/lib/presets.ts    default categories, the scope library, standard terms
src/lib/store.ts      quotation CRUD, versions, persistence
src/components/document/  the A4 document and its measured pagination
src/components/editor/    the five editing steps
```
# quote-maker-fp
