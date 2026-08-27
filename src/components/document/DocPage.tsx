"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/calc";
import { COMPANY } from "@/lib/presets";
import type { Quotation } from "@/lib/types";

export const MM = 3.779528; // px per mm at 96dpi — the unit the browser prints with

export function DocPageHeader({ quote, compact }: { quote: Quotation; compact?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "8mm",
        marginBottom: compact ? "4mm" : "6mm",
      }}
    >
      <Image
        src={COMPANY.logo}
        alt="Fairplatz"
        width={639}
        height={182}
        priority
        unoptimized
        style={{ width: compact ? "34mm" : "52mm", height: "auto" }}
      />
      <div style={{ textAlign: "right", fontSize: compact ? "7.4pt" : "8.4pt", lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.08em" }}>
          {quote.ref}
          {quote.version > 1 ? ` · Rev. ${quote.version}` : ""}
        </div>
        <div style={{ color: "#6b6a66" }}>{formatDate(quote.quoteDate)}</div>
        {compact && quote.projectName ? (
          <div style={{ color: "#6b6a66" }}>{quote.projectName}</div>
        ) : null}
      </div>
    </div>
  );
}

export function DocPageFooter({
  quote,
  page,
  pages,
}: {
  quote: Quotation;
  page: number;
  pages: number;
}) {
  return (
    <div className="doc-footer">
      <span>
        {COMPANY.name} — {COMPANY.tagline}
      </span>
      <span>
        {quote.ref}
        {quote.version > 1 ? ` Rev.${quote.version}` : ""}
        {quote.projectName ? ` · ${quote.projectName}` : ""} · Page {page} of {pages}
      </span>
    </div>
  );
}

export function DocPage({
  quote,
  page,
  pages,
  compactHeader,
  flow,
  children,
}: {
  quote: Quotation;
  page: number;
  pages: number;
  compactHeader?: boolean;
  /** Let the content run onto extra sheets instead of clipping at 297mm. */
  flow?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={flow ? "doc-page doc-page--flow" : "doc-page"}>
      <DocPageHeader quote={quote} compact={compactHeader} />
      <div className="doc-page__body">{children}</div>
      <DocPageFooter quote={quote} page={page} pages={pages} />
    </section>
  );
}
