import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shared quotation",
  description:
    "Review a shared Fairplatz exhibition quotation, or open an editable copy when access is granted.",
  alternates: { canonical: "/shared" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: `${SITE.url}/shared`,
    title: "A Fairplatz quotation has been shared with you",
    description: "Open a shared quotation, review the scope and pricing, or save it as a PDF.",
  },
  twitter: {
    card: "summary_large_image",
    title: "A Fairplatz quotation has been shared with you",
    description: "Open a shared Fairplatz quotation and review it online.",
  },
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
