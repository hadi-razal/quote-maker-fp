import type {
  Category,
  CurrencyCode,
  LineItem,
  Quotation,
  QuotationTotals,
  ValidationIssue,
} from "./types";

/** Round to 2 decimals without the usual floating point drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineAmount(item: LineItem): number {
  const qty = item.qty ?? 0;
  const rate = item.rate ?? 0;
  return round2(qty * rate);
}

export function categoryTotal(cat: Category): number {
  if (cat.priceMode === "lump") return round2(cat.lumpSum ?? 0);
  return round2(cat.items.filter((i) => !i.optional).reduce((sum, i) => sum + lineAmount(i), 0));
}

export function categoryOptionalTotal(cat: Category): number {
  if (cat.priceMode === "lump") return 0;
  return round2(cat.items.filter((i) => i.optional).reduce((sum, i) => sum + lineAmount(i), 0));
}

export function computeTotals(q: Quotation): QuotationTotals {
  const categories = q.categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    total: categoryTotal(cat),
    itemCount: cat.items.length,
    optionalTotal: categoryOptionalTotal(cat),
  }));

  const subtotal = round2(categories.reduce((s, c) => s + c.total, 0));

  let discount = 0;
  if (q.discountType === "percent") discount = round2((subtotal * (q.discountValue ?? 0)) / 100);
  if (q.discountType === "amount") discount = round2(q.discountValue ?? 0);
  discount = Math.min(discount, subtotal);

  const netTotal = round2(subtotal - discount);
  const vat = round2((netTotal * (q.vatRate ?? 0)) / 100);
  const grandTotal = round2(netTotal + vat);
  const optionalTotal = round2(categories.reduce((s, c) => s + c.optionalTotal, 0));

  return { categories, subtotal, discount, netTotal, vat, grandTotal, optionalTotal };
}

/** "1-3" — category index and item index, exactly like the Excel BOQ. */
export function itemCode(catIndex: number, itemIndex: number): string {
  return `${catIndex + 1}-${itemIndex + 1}`;
}

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  AED: "en-AE",
  SAR: "en-SA",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  QAR: "en-QA",
  OMR: "en-OM",
  KWD: "en-KW",
  BHD: "en-BH",
};

export function formatMoney(value: number, currency: CurrencyCode, withCode = true): string {
  const digits = ["KWD", "BHD", "OMR"].includes(currency) ? 3 : 2;
  const num = new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
  return withCode ? `${currency} ${num}` : num;
}

/** 2026-08-27 → 27 August 2026. Falls back to the raw string if it isn't a date. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

/**
 * Everything that must be filled in before the quotation can be sent out.
 * Returned as a flat list so the editor can show a single "what's missing" panel.
 */
export function validate(q: Quotation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const req: Array<[keyof Quotation, string]> = [
    ["projectName", "Project name"],
    ["clientName", "Client / attention name"],
    ["location", "Location"],
    ["venue", "Venue"],
    ["eventDates", "Event dates"],
    ["quoteDate", "Quotation date"],
    ["preparedBy", "Prepared by"],
  ];
  for (const [key, label] of req) {
    const value = q[key];
    if (typeof value !== "string" || value.trim() === "") {
      issues.push({ scope: "details", message: `${label} is required` });
    }
  }

  if (q.vatRate === null || !Number.isFinite(q.vatRate) || q.vatRate < 0) {
    issues.push({ scope: "commercials", message: "VAT rate must be a number (use 0 for none)" });
  }
  if (q.discountType !== "none" && !q.discountValue) {
    issues.push({ scope: "commercials", message: "Discount is switched on but has no value" });
  }

  if (q.categories.length === 0) {
    issues.push({ scope: "items", message: "Add at least one category" });
  }

  q.categories.forEach((cat, catIndex) => {
    if (!cat.title.trim()) {
      issues.push({
        scope: "items",
        categoryId: cat.id,
        message: `Category ${catIndex + 1} has no title`,
      });
    }
    if (cat.priceMode === "lump") {
      if (cat.lumpSum === null || !Number.isFinite(cat.lumpSum)) {
        issues.push({
          scope: "items",
          categoryId: cat.id,
          message: `"${cat.title || `Category ${catIndex + 1}`}" is priced as a lump sum but has no price`,
        });
      }
    }
    if (cat.items.length === 0) {
      issues.push({
        scope: "items",
        categoryId: cat.id,
        message: `"${cat.title || `Category ${catIndex + 1}`}" has no line items`,
      });
    }
    cat.items.forEach((item, itemIndex) => {
      const code = itemCode(catIndex, itemIndex);
      if (!item.description.trim()) {
        issues.push({
          scope: "items",
          categoryId: cat.id,
          itemId: item.id,
          message: `${code} — description is required`,
        });
      }
      if (item.qty === null || !Number.isFinite(item.qty) || item.qty <= 0) {
        issues.push({
          scope: "items",
          categoryId: cat.id,
          itemId: item.id,
          message: `${code} — quantity is required`,
        });
      }
      if (!item.unit.trim()) {
        issues.push({
          scope: "items",
          categoryId: cat.id,
          itemId: item.id,
          message: `${code} — unit is required`,
        });
      }
      if (
        cat.priceMode === "itemised" &&
        (item.rate === null || !Number.isFinite(item.rate) || item.rate < 0)
      ) {
        issues.push({
          scope: "items",
          categoryId: cat.id,
          itemId: item.id,
          message: `${code} — rate is required`,
        });
      }
    });
  });

  return issues;
}
