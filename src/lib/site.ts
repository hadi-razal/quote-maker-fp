/**
 * One place for the things that describe the site to browsers, phones and
 * link previews. Server-safe — no "use client".
 */
function resolveUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Set automatically on Vercel, so previews and production both get real URLs.
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Fairplatz Quotation Maker",
  shortName: "Quotations",
  url: resolveUrl(),
  description:
    "Build exhibition stand quotations for Fairplatz — categories with their own totals, VAT, terms, and an exact A4 PDF that updates as you type.",
  /**
   * This is an internal tool behind a sign-in, so search engines are kept out by
   * default. Flip to true (and the robots rules follow) only if the page is ever
   * meant to be found on Google.
   */
  indexable: false,
  locale: "en_AE",
  themeColor: "#ea4e1b",
  backgroundColor: "#f5f4f2",
} as const;
