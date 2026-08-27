"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DocPage, MM } from "./DocPage";
import {
  categoryTotal,
  computeTotals,
  formatDate,
  formatMoney,
  formatNumber,
  itemCode,
} from "@/lib/calc";
import type { Category, LineItem, Quotation, QuotationTotals } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Row model                                                                   */
/* -------------------------------------------------------------------------- */

type DocRow =
  | { kind: "cat"; key: string; cat: Category; catIndex: number; total: number }
  | { kind: "item"; key: string; item: LineItem; code: string }
  | { kind: "sub"; key: string; cat: Category; total: number };

function buildRows(quote: Quotation): DocRow[] {
  const rows: DocRow[] = [];
  quote.categories.forEach((cat, catIndex) => {
    const total = categoryTotal(cat);
    rows.push({ kind: "cat", key: `c-${cat.id}`, cat, catIndex, total });
    if (cat.priceMode === "itemised") {
      cat.items.forEach((item, itemIndex) => {
        rows.push({
          kind: "item",
          key: `i-${item.id}`,
          item,
          code: itemCode(catIndex, itemIndex),
        });
      });
      if (quote.showItemRates) {
        rows.push({ kind: "sub", key: `s-${cat.id}`, cat, total });
      }
    } else {
      cat.items.forEach((item, itemIndex) => {
        rows.push({
          kind: "item",
          key: `i-${item.id}`,
          item,
          code: itemCode(catIndex, itemIndex),
        });
      });
    }
  });
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Table pieces                                                                */
/* -------------------------------------------------------------------------- */

/** Line photos take a column only when the quotation actually uses them. */
function usesItemPhotos(quote: Quotation): boolean {
  return (
    quote.showItemPhotos && quote.categories.some((c) => c.items.some((i) => Boolean(i.image)))
  );
}

/** Printable width of an A4 page with the document's 12mm side margins. */
const CONTENT_WIDTH_MM = 210 - 24;

/** Width of the optional line-photo column. */
const PHOTO_COL_MM = 26;

/**
 * Money columns are sized from the longest number they actually hold, so a
 * seven-figure total never collides with the column border and a small job
 * doesn't waste half the page on white space.
 */
function moneyColumnMm(values: number[], currency: Quotation["currency"], min: number): number {
  const longest = values.reduce(
    (max, v) => Math.max(max, formatMoney(v, currency, false).length),
    0,
  );
  return Math.min(46, Math.max(min, Math.round(longest * 1.75 + 7)));
}

function ColGroup({ quote }: { quote: Quotation }) {
  const amounts: number[] = [];
  const rates: number[] = [];
  for (const cat of quote.categories) {
    amounts.push(categoryTotal(cat));
    for (const item of cat.items) {
      if (quote.showItemRates) {
        amounts.push((item.qty ?? 0) * (item.rate ?? 0));
        rates.push(item.rate ?? 0);
      }
    }
  }

  const qtyLong = quote.categories.some((c) => c.items.some((i) => formatNumber(i.qty).length > 6));
  const qtyMm = quote.showQty ? (qtyLong ? 20 : 15) : 0;
  const photoMm = usesItemPhotos(quote) ? PHOTO_COL_MM : 0;

  let amountMm = moneyColumnMm(amounts, quote.currency, 26);
  let rateMm = quote.showItemRates ? moneyColumnMm(rates, quote.currency, 22) : 0;

  // The description has to keep a workable width, so if the money columns grew
  // wide they give the excess back rather than squeezing the text to nothing.
  const CODE_MM = 13;
  const UNIT_MM = 15;
  const DESCRIPTION_MIN_MM = 62;
  const available = CONTENT_WIDTH_MM - CODE_MM - UNIT_MM - qtyMm - photoMm - DESCRIPTION_MIN_MM;
  const wanted = amountMm + rateMm;
  if (wanted > available) {
    const shrink = available / wanted;
    amountMm = Math.max(24, Math.floor(amountMm * shrink));
    rateMm = rateMm ? Math.max(20, Math.floor(rateMm * shrink)) : 0;
  }

  return (
    <colgroup>
      <col style={{ width: `${CODE_MM}mm` }} />
      {photoMm ? <col style={{ width: `${photoMm}mm` }} /> : null}
      <col />
      {quote.showQty ? <col style={{ width: `${qtyMm}mm` }} /> : null}
      <col style={{ width: `${UNIT_MM}mm` }} />
      {quote.showItemRates ? <col style={{ width: `${rateMm}mm` }} /> : null}
      <col style={{ width: `${amountMm}mm` }} />
    </colgroup>
  );
}

function TableHead({ quote, measure }: { quote: Quotation; measure?: boolean }) {
  return (
    <thead data-measure={measure ? "thead" : undefined}>
      <tr>
        <th className="doc-center">Item</th>
        {usesItemPhotos(quote) ? <th className="doc-center">Photo</th> : null}
        <th>Description</th>
        {quote.showQty ? <th className="doc-center">Qty</th> : null}
        <th className="doc-center">Unit</th>
        {quote.showItemRates ? <th className="doc-num">Rate</th> : null}
        <th className="doc-num">Amount ({quote.currency})</th>
      </tr>
    </thead>
  );
}

function Row({ row, quote }: { row: DocRow; quote: Quotation }) {
  // item code, [photo], description, [qty], unit, [rate], amount
  const photos = usesItemPhotos(quote);
  const columns = 4 + (photos ? 1 : 0) + (quote.showQty ? 1 : 0) + (quote.showItemRates ? 1 : 0);
  // Everything between the item code and the amount.
  const middleSpan = columns - 2;

  if (row.kind === "cat") {
    return (
      <tr className="doc-row-cat">
        <td className="doc-center">{row.catIndex + 1}</td>
        <td colSpan={middleSpan}>
          {row.cat.title || "Untitled category"}
          {row.cat.priceMode === "lump" ? <span className="doc-tag">Lump sum</span> : null}
        </td>
        <td className="doc-num">
          {quote.showItemRates && row.cat.priceMode === "itemised"
            ? ""
            : formatMoney(row.total, quote.currency, false)}
        </td>
      </tr>
    );
  }

  if (row.kind === "sub") {
    return (
      <tr className="doc-row-sub">
        <td />
        <td colSpan={middleSpan} className="doc-num">
          Subtotal — {row.cat.title || "Untitled category"}
        </td>
        <td className="doc-num">{formatMoney(row.total, quote.currency, false)}</td>
      </tr>
    );
  }

  const { item, code } = row;
  const amount = (item.qty ?? 0) * (item.rate ?? 0);
  return (
    <tr>
      <td className="doc-center">{code}</td>
      {photos ? (
        <td className="doc-center doc-photo">
          {item.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image.dataUrl} alt="" />
          ) : null}
        </td>
      ) : null}
      <td>
        {item.description || <span style={{ color: "#c0bdb9" }}>—</span>}
        {item.optional ? <span className="doc-tag">Optional</span> : null}
        {item.note ? <span className="doc-item-note">{item.note}</span> : null}
      </td>
      {quote.showQty ? <td className="doc-center">{formatNumber(item.qty)}</td> : null}
      <td className="doc-center">{item.unit}</td>
      {quote.showItemRates ? (
        <td className="doc-num">
          {item.rate === null ? "" : formatMoney(item.rate, quote.currency, false)}
        </td>
      ) : null}
      <td className="doc-num">
        {quote.showItemRates ? formatMoney(amount, quote.currency, false) : ""}
      </td>
    </tr>
  );
}

function TotalsBlock({
  quote,
  totals,
  title = "Total",
}: {
  quote: Quotation;
  totals: QuotationTotals;
  title?: string;
}) {
  return (
    <table className="doc-totals">
      <tbody>
        <tr>
          <td>{title}</td>
          <td className="doc-num">{formatMoney(totals.subtotal, quote.currency)}</td>
        </tr>
        {totals.discount > 0 ? (
          <tr>
            <td>
              Discount
              {quote.discountType === "percent" ? ` (${quote.discountValue ?? 0}%)` : ""}
            </td>
            <td className="doc-num">− {formatMoney(totals.discount, quote.currency)}</td>
          </tr>
        ) : null}
        {totals.discount > 0 ? (
          <tr>
            <td>Net total</td>
            <td className="doc-num">{formatMoney(totals.netTotal, quote.currency)}</td>
          </tr>
        ) : null}
        <tr>
          <td>
            {quote.vatLabel || "VAT"} @ {quote.vatRate ?? 0}%
          </td>
          <td className="doc-num">{formatMoney(totals.vat, quote.currency)}</td>
        </tr>
        <tr className="doc-totals__grand">
          <td>Grand total</td>
          <td className="doc-num">{formatMoney(totals.grandTotal, quote.currency)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function OptionalNote({ quote, totals }: { quote: Quotation; totals: QuotationTotals }) {
  if (totals.optionalTotal <= 0) return null;
  return (
    <p style={{ marginTop: "3mm", fontSize: "7.6pt", color: "#6b6a66" }}>
      Items marked <strong>Optional</strong> are quoted at{" "}
      <strong>{formatMoney(totals.optionalTotal, quote.currency)}</strong> and are excluded from the
      totals above. They can be added on written confirmation.
    </p>
  );
}

/** Everything that closes the Bill of Quantities: totals, optional note, notes. */
function DocTail({
  quote,
  totals,
  measure,
}: {
  quote: Quotation;
  totals: QuotationTotals;
  measure?: boolean;
}) {
  const hasNotes = quote.notes.trim().length > 0;
  return (
    <div data-measure={measure ? "tail" : undefined}>
      <div style={{ marginTop: "5mm" }}>
        <TotalsBlock quote={quote} totals={totals} />
      </div>
      <OptionalNote quote={quote} totals={totals} />
      {hasNotes ? (
        <div style={{ marginTop: "5mm" }}>
          <div className="doc-section-head">Notes</div>
          <p style={{ whiteSpace: "pre-wrap", marginTop: "2mm" }}>{quote.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                       */
/* -------------------------------------------------------------------------- */

function SummaryBody({ quote, totals }: { quote: Quotation; totals: QuotationTotals }) {
  const cover = quote.images[0];
  const summaryAmountMm = moneyColumnMm(
    totals.categories.map((c) => c.total),
    quote.currency,
    30,
  );
  const meta: Array<[string, string]> = [
    ["Project Name", quote.projectName],
    ["Client", quote.clientCompany || quote.clientName],
    ["Location", quote.location],
    ["Attention", quote.clientName],
    ["Venue", quote.venue],
    ["Prepared by", quote.preparedBy],
    ["Event Dates", quote.eventDates],
    [
      "Validity",
      quote.validityDays
        ? `${quote.validityDays} days from ${formatDate(quote.quoteDate)}`
        : formatDate(quote.quoteDate),
    ],
  ];

  return (
    <>
      <div className="doc-title">Quotation</div>
      <div className="doc-meta">
        {meta.map(([label, value]) => (
          <div className="doc-meta__cell" key={label}>
            <span className="doc-meta__label">{label}</span>
            <span className="doc-meta__value">{value || "—"}</span>
          </div>
        ))}
      </div>

      {cover ? (
        <div className="doc-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.dataUrl} alt={cover.caption || "Stand visual"} />
          {cover.caption ? (
            <p
              style={{
                flex: "none",
                textAlign: "center",
                color: "#6b6a66",
                marginTop: "1.6mm",
                fontSize: "7.6pt",
              }}
            >
              {cover.caption}
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: "6mm" }}>
        <div className="doc-section-head">Bill of Quantities — Summary</div>
        <table className="doc-table">
          <colgroup>
            <col style={{ width: "13mm" }} />
            <col />
            <col style={{ width: `${summaryAmountMm}mm` }} />
          </colgroup>
          <thead>
            <tr>
              <th className="doc-center">#</th>
              <th>Category</th>
              <th className="doc-num">Amount ({quote.currency})</th>
            </tr>
          </thead>
          <tbody>
            {totals.categories.map((cat, i) => (
              <tr key={cat.id}>
                <td className="doc-center">{i + 1}</td>
                <td>{cat.title || "Untitled category"}</td>
                <td className="doc-num">{formatMoney(cat.total, quote.currency, false)}</td>
              </tr>
            ))}
            {totals.categories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ color: "#c0bdb9" }}>
                  No categories yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "5mm" }}>
        <TotalsBlock quote={quote} totals={totals} title="Subtotal" />
      </div>
      <OptionalNote quote={quote} totals={totals} />
    </>
  );
}

function TermsBody({ quote }: { quote: Quotation }) {
  const blocks = quote.terms
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      <div className="doc-section-head">Terms &amp; Conditions</div>
      <div className="doc-terms" style={{ marginTop: "3mm" }}>
        {blocks.map((block, i) => {
          const [first, ...rest] = block.split("\n");
          const isHeading = /^\d+\s*[-–—]/.test(first.trim());
          return (
            <div key={i}>
              {isHeading ? (
                <h4 style={i === 0 ? { marginTop: 0 } : undefined}>{first.trim()}</h4>
              ) : (
                <p>{first}</p>
              )}
              {rest.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          );
        })}
      </div>

      {quote.showSignatures ? (
        <div style={{ marginTop: "10mm" }}>
          <p style={{ fontWeight: 700, marginBottom: "3mm" }}>Read, confirmed and signed</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8mm" }}>
            <div className="doc-sign">
              <span style={{ fontWeight: 700, letterSpacing: "0.08em" }}>CONTRACTOR</span>
              <span style={{ color: "#85837f" }}>Name, signature &amp; stamp / Date</span>
            </div>
            <div className="doc-sign">
              <span style={{ fontWeight: 700, letterSpacing: "0.08em" }}>CUSTOMER</span>
              <span style={{ color: "#85837f" }}>Name, signature &amp; stamp / Date</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_CONTENT_PX = (297 - 12 - 16) * MM; // A4 height minus the page padding
const FOOTER_PX = 13 * MM; // footer strip reserved at the bottom of every page
const SAFETY_PX = 4 * MM; // slack so rounding never spills a row into the footer

/** Two splits are the same when every page holds the same rows in the same order. */
function sameSplit(a: DocRow[][], b: DocRow[][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((page, i) => {
    const other = b[i];
    return page.length === other.length && page.every((row, j) => row.key === other[j].key);
  });
}

interface Measured {
  rows: number[];
  head: number;
  thead: number;
  tail: number;
}

/**
 * Measures the real rendered height of every BOQ row in a hidden, unscaled
 * copy of the table, then slices the rows into A4 pages. This is what keeps the
 * on-screen preview identical to the printed PDF.
 */
function useRowPages(quote: Quotation, rows: DocRow[]) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<DocRow[][]>([rows]);
  const [, remeasure] = useState(0);

  /**
   * A row's height can settle *after* React has finished rendering — a line
   * photo finishes decoding, a web font swaps in, a long description rewraps.
   * Watching the measuring copy for any size change re-runs the page split, so
   * the preview and the PDF catch up on their own instead of showing yesterday's
   * pagination until the next keystroke.
   */
  useEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const observer = new ResizeObserver(() => remeasure((n) => n + 1));
    observer.observe(root);

    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) remeasure((n) => n + 1);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately every render; see setPages below
  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const measured: Measured = {
      rows: Array.from(
        root.querySelectorAll<HTMLTableRowElement>("[data-measure='rows'] > tr"),
      ).map((tr) => tr.offsetHeight),
      head: root.querySelector<HTMLElement>("[data-measure='head']")?.offsetHeight ?? 0,
      thead: root.querySelector<HTMLElement>("[data-measure='thead']")?.offsetHeight ?? 0,
      tail: root.querySelector<HTMLElement>("[data-measure='tail']")?.offsetHeight ?? 0,
    };

    if (measured.rows.length !== rows.length) return;

    const usable = PAGE_CONTENT_PX - FOOTER_PX - measured.head - measured.thead;
    // A few mm of slack: sub-pixel rounding must never push content into the footer.
    const tail = measured.tail + SAFETY_PX;

    const result: DocRow[][] = [];
    let current: DocRow[] = [];
    let used = 0;

    rows.forEach((row, i) => {
      const h = measured.rows[i] ?? 0;
      if (used + h > usable - SAFETY_PX && current.length > 0) {
        // Never leave a category heading stranded at the foot of a page.
        const last = current[current.length - 1];
        if (last?.kind === "cat" && current.length > 1) {
          current.pop();
          result.push(current);
          current = [last, row];
          used = (measured.rows[i - 1] ?? 0) + h;
          return;
        }
        result.push(current);
        current = [row];
        used = h;
        return;
      }
      current.push(row);
      used += h;
    });

    if (current.length) result.push(current);
    if (result.length === 0) result.push([]);

    // The closing block rides on the last page only if it genuinely fits;
    // otherwise it gets a page of its own rather than printing over the footer.
    if (used + tail > usable) result.push([]);

    // Runs after every render and only writes when the split actually moved,
    // so any edit — a longer description, a new column, a wider number — is
    // picked up without having to enumerate what can change a row's height.
    setPages((previous) => (sameSplit(previous, result) ? previous : result));
  });

  const measurer = (
    <div
      ref={measureRef}
      aria-hidden
      style={{
        position: "absolute",
        top: -100000,
        left: 0,
        width: `${210 - 24}mm`,
        visibility: "hidden",
        pointerEvents: "none",
      }}
      className="doc-page-measure"
    >
      <div
        className="doc-page"
        style={{ height: "auto", minHeight: 0, boxShadow: "none", padding: 0, width: "100%" }}
      >
        <div data-measure="head" style={{ marginBottom: "4mm", height: "16mm" }} />
        <table className="doc-table">
          <ColGroup quote={quote} />
          <TableHead quote={quote} measure />
          <tbody data-measure="rows">
            {rows.map((row) => (
              <Row key={row.key} row={row} quote={quote} />
            ))}
          </tbody>
        </table>
        <DocTail quote={quote} totals={computeTotals(quote)} measure />
      </div>
    </div>
  );

  return { pages, measurer };
}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

export function QuotationDocument({ quote }: { quote: Quotation }) {
  const totals = useMemo(() => computeTotals(quote), [quote]);
  const rows = useMemo(() => buildRows(quote), [quote]);
  const { pages: rowPages, measurer } = useRowPages(quote, rows);

  const extraImages = quote.images.slice(1);
  const imagePages: Quotation["images"][] = [];
  for (let i = 0; i < extraImages.length; i += 2) {
    imagePages.push(extraImages.slice(i, i + 2));
  }

  const pageCount =
    (quote.showSummaryPage ? 1 : 0) +
    imagePages.length +
    rowPages.length +
    (quote.showTermsPage ? 1 : 0);

  let pageNo = 0;
  const next = () => ++pageNo;

  return (
    <>
      {measurer}
      <div className="doc-stack" id="doc-stack">
        {quote.showSummaryPage ? (
          <DocPage quote={quote} page={next()} pages={pageCount}>
            <SummaryBody quote={quote} totals={totals} />
          </DocPage>
        ) : null}

        {imagePages.map((group, i) => (
          <DocPage key={`img-${i}`} quote={quote} page={next()} pages={pageCount} compactHeader>
            <div className="doc-section-head">Design visuals</div>
            <div style={{ display: "grid", gap: "6mm", marginTop: "4mm" }}>
              {group.map((img, j) => (
                <figure key={j} style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={img.caption || "Design visual"}
                    style={{
                      width: "100%",
                      maxHeight: "110mm",
                      objectFit: "contain",
                      display: "block",
                      border: "0.6pt solid #d9d6d2",
                    }}
                  />
                  {img.caption ? (
                    <figcaption
                      style={{
                        textAlign: "center",
                        color: "#6b6a66",
                        marginTop: "1.6mm",
                        fontSize: "7.6pt",
                      }}
                    >
                      {img.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </DocPage>
        ))}

        {rowPages.map((pageRows, i) => {
          const isLast = i === rowPages.length - 1;
          // Only pages that carry line items are numbered; a page holding just
          // the totals is labelled for what it is.
          const partCount = rowPages.filter((p) => p.length > 0).length;
          const part = rowPages.slice(0, i + 1).filter((p) => p.length > 0).length;
          return (
            <DocPage key={`rows-${i}`} quote={quote} page={next()} pages={pageCount} compactHeader>
              <div className="doc-section-head">
                {pageRows.length === 0
                  ? "Bill of Quantities — Totals"
                  : `Bill of Quantities${partCount > 1 ? ` (${part}/${partCount})` : ""}`}
              </div>
              {pageRows.length > 0 ? (
                <table className="doc-table" style={{ marginTop: "3mm" }}>
                  <ColGroup quote={quote} />
                  <TableHead quote={quote} />
                  <tbody>
                    {pageRows.map((row) => (
                      <Row key={row.key} row={row} quote={quote} />
                    ))}
                  </tbody>
                </table>
              ) : null}

              {isLast ? <DocTail quote={quote} totals={totals} /> : null}
            </DocPage>
          );
        })}

        {quote.showTermsPage ? (
          <DocPage quote={quote} page={next()} pages={pageCount} compactHeader flow>
            <TermsBody quote={quote} />
          </DocPage>
        ) : null}
      </div>
    </>
  );
}
