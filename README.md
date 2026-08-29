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
| Line photos | An extra column beside the description — it only exists when at least one line has a photo |
| Terms & Conditions | The standard Fairplatz text, plus contractor / customer signature blocks |

Pagination is measured, not guessed: every row is rendered off-screen, measured in
real pixels, and only then assigned to a page — which is why nothing ever lands on
top of the footer, and why the preview and the PDF agree.

## Line photos

Any line can carry its own photo — a product shot, a finish sample, a reference.
Use the **Photo** button on that line in step 2. The picture column appears in the
printed table by itself the moment one line has a photo, and disappears again if
they are all removed, so a plain quotation stays plain. **Show line photos** in
step 5 turns the whole column off without deleting anything.

Line photos are stored at 640px and squeezed harder than the full-page visuals,
because dozens of them share the browser's storage with everything else. The
Pictures step shows what a quotation weighs, and if the browser store ever fills
up the editor says so rather than losing the change quietly.

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

## Authors and sharing (local MVP)

Every quotation now has an **author** — the internal owner of the working file.
The author is separate from **Prepared by**, which remains the contact printed in
the client document. New quotations use the signed-in email automatically, while
the Details step lets the owner name and email be corrected.

**Share** creates a snapshot URL for the current version with one of two access
levels. **View only** lets the recipient review, print, or save the quotation as
PDF. **Can edit** also lets them open a complete working copy in their own browser.
The editable copy has a new ID and quotation reference, so it never changes the
author's original. Anyone with the URL can open `/shared` without signing in and
see who created the quotation. The public view never reads the sender's local
storage; the snapshot itself is encoded in the URL fragment, which is not sent to
the web server.

The author can optionally enter one recipient email address before creating the
snapshot. The app labels the share for that recipient, records a local sharing
event, and opens the computer's mail app with a ready-to-review subject, message,
and link. It deliberately says **Open email draft** rather than claiming the
message was delivered. The `/shared` route also has its own no-index page title,
description, Open Graph, and Twitter metadata for clean link previews.

This is deliberately an MVP bridge, not a substitute for database permissions:

- a link is frozen at the moment it is created; later edits need a new link;
- an editable copy is local to the recipient and does not sync changes back to
  the author;
- a link cannot be revoked and anyone it is forwarded to can open it;
- recipient email is descriptive metadata, not an access restriction;
- email sending/delivery status is not tracked until a server email provider is connected;
- images are omitted to keep the URL reliable in email and messaging apps;
- on `localhost`, recipients can only open it on the same computer. After the app
  is deployed, links work across devices;
- set `NEXT_PUBLIC_SHARE_URL` to the public app/subdomain if links should use a
  different origin from the editor.

When Supabase or another backend is connected, `Quotation.author` maps cleanly to
a user/profile row, `Quotation.sharing` to access metadata, and `src/lib/share.ts`
can exchange the encoded snapshot for a short database token without changing
the editor or viewer flow.

## Where the data lives

In the browser's local storage, on the machine that created it. Nothing is
uploaded; pictures are downsized to 1600px and embedded in the quotation. Clearing
site data clears the quotations, so treat a downloaded PDF as the record of
anything you have sent.

## Icons, install and link previews

Everything a browser or phone asks for is generated from the Fairplatz mark:

| File | Used by |
| --- | --- |
| `src/app/favicon.ico` | Browser tabs, bookmarks, older browsers (16/32/48) |
| `src/app/icon.png` | Modern browsers' tab icon |
| `src/app/apple-icon.png` | iPhone / iPad "Add to Home Screen" (180px, solid white — iOS does not honour transparency) |
| `public/icons/icon-192.png`, `icon-512.png` | Android and desktop install icons |
| `public/icons/maskable-512.png` | Android adaptive icons — art sits inside the safe zone so the circular crop doesn't clip it |
| `src/app/manifest.ts` | `/manifest.webmanifest` — name, colours, standalone display, install icons |
| `src/app/opengraph-image.png`, `twitter-image.png` | The 1200×630 card shown when the link is pasted into WhatsApp, Slack, LinkedIn or iMessage |

To regenerate them after a brand change, replace `public/brand/fairplatz-logo.png`
and re-run the scripts in the project history — or just re-crop the mark and
re-export at the sizes in the table.

## SEO

Full metadata is in `src/app/layout.tsx`: title template, description, keywords,
canonical URL, Open Graph and Twitter cards, Apple web-app tags and theme colour.

**Search engines are deliberately blocked.** `SITE.indexable` in `src/lib/site.ts`
is `false`, which sends `noindex, nofollow` and a `Disallow: /` robots.txt. This
is an internal tool behind a sign-in — being findable on Google gains nothing and
would put the company's pricing tool in public results. Flip that one flag to
`true` if it ever needs to be indexed; the robots and sitemap routes follow it
automatically.

Set `NEXT_PUBLIC_SITE_URL` to the real domain so canonical links and preview
images resolve. On Vercel this is filled in automatically unless you use a custom
domain.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand
(localStorage persistence) · Vercel Analytics + Speed Insights.

```
src/lib/types.ts      the quotation model
src/lib/calc.ts       totals, money and date formatting, validation
src/lib/presets.ts    default categories, the scope library, standard terms
src/lib/store.ts      quotation CRUD, versions, persistence
src/lib/auth.ts       the local sign-in gate
src/lib/site.ts       metadata, canonical URL, the indexable flag
src/components/document/  the A4 document and its measured pagination
src/components/editor/    the five editing steps
src/components/ui/confirm.tsx  the in-app confirmation dialog (no browser popups)
```
# quote-maker-fp
