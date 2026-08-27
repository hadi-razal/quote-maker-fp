import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthGate } from "@/components/auth/AuthGate";
import { ConfirmHost } from "@/components/ui/confirm";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — exhibition stand quotations, priced and exported in minutes`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "exhibition stand quotation",
    "bill of quantities",
    "BOQ builder",
    "stand build pricing",
    "quotation generator",
    "exhibition contractor",
    "Fairplatz",
  ],
  authors: [{ name: "Fairplatz" }],
  creator: "Fairplatz",
  publisher: "Fairplatz",
  category: "business",
  alternates: { canonical: "/" },
  robots: SITE.indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    locale: SITE.locale,
    title: `${SITE.name} — quotations that build themselves`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — quotations that build themselves`,
    description: SITE.description,
  },
  // The icon files next to this one (icon.png, apple-icon.png, favicon.ico) and
  // opengraph-image.png / twitter-image.png are picked up automatically.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: SITE.themeColor,
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="print-passthrough">
        <AuthGate>{children}</AuthGate>
        <ConfirmHost />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
