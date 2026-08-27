import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fairplatz — Quotation Maker",
  description:
    "Build exhibition stand quotations with live category totals and an exact A4 PDF preview.",
  applicationName: "Fairplatz Quotation Maker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ea4e1b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="print-passthrough">
        <AuthGate>{children}</AuthGate>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
