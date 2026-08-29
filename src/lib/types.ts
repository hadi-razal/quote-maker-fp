export type CurrencyCode = "AED" | "SAR" | "USD" | "EUR" | "GBP" | "QAR" | "OMR" | "KWD" | "BHD";

export type DiscountType = "none" | "percent" | "amount";

export interface QuotationImage {
  /** base64 data URL — kept inline so the document is fully self-contained. */
  dataUrl: string;
  caption?: string;
  name?: string;
}

export interface LineItem {
  id: string;
  /** Free-text description of the scope of work. Required. */
  description: string;
  /** Quantity. Required. */
  qty: number | null;
  /** Unit of measure — sqm, no, nos, lot, rm... Required. */
  unit: string;
  /** Rate per unit in the quotation currency. Required unless the category is priced as a lump sum. */
  rate: number | null;
  /** Optional extra line printed in small text under the description. */
  note?: string;
  /** Optional photo for this line — a product shot, a finish sample, a reference. */
  image?: QuotationImage;
  /** Optional items are printed with an "Optional" tag and excluded from the totals. */
  optional?: boolean;
}

/** itemised = category total is the sum of its lines. lump = a single agreed price for the category. */
export type CategoryPriceMode = "itemised" | "lump";

export interface Category {
  id: string;
  title: string;
  priceMode: CategoryPriceMode;
  /** Used when priceMode === "lump". */
  lumpSum: number | null;
  items: LineItem[];
}

/** The internal owner who created and maintains the quotation. */
export interface QuotationAuthor {
  /** Stable enough for the local MVP; replace with the database user id later. */
  id: string;
  name: string;
  email: string;
}

export type QuotationShareMethod = "link" | "email";
export type QuotationSharePermission = "view" | "edit";

/** One immutable sharing event, ready to become a database row later. */
export interface QuotationShareRecord {
  id: string;
  snapshotId: string;
  createdAt: string;
  method: QuotationShareMethod;
  recipientEmails: string[];
  quotationVersion: number;
  access: "anyone_with_link";
  permission: QuotationSharePermission;
}

export interface QuotationSharing {
  mode: "private" | "snapshot";
  lastSharedAt: string | null;
  shareCount: number;
  records: QuotationShareRecord[];
}

export interface Quotation {
  id: string;
  /** Shared by every version of the same quotation, so V1…V10 stay together. */
  familyId: string;
  /** 1-based revision number, capped at MAX_VERSIONS. */
  version: number;
  /** Free-text reason for this revision, e.g. "client dropped the mezzanine". */
  versionNote: string;
  ref: string;
  createdAt: string;
  updatedAt: string;

  // ---- Ownership & sharing ------------------------------------------------
  author: QuotationAuthor;
  sharing: QuotationSharing;

  // ---- Header / project details -------------------------------------------
  projectName: string;
  clientName: string;
  clientCompany: string;
  location: string;
  venue: string;
  eventDates: string;
  quoteDate: string;
  validityDays: number | null;
  preparedBy: string;
  preparedByEmail: string;
  preparedByPhone: string;

  // ---- Commercials ---------------------------------------------------------
  currency: CurrencyCode;
  vatRate: number;
  vatLabel: string;
  discountType: DiscountType;
  discountValue: number | null;

  // ---- Content -------------------------------------------------------------
  images: QuotationImage[];
  categories: Category[];
  terms: string;
  notes: string;

  // ---- Print options -------------------------------------------------------
  showSummaryPage: boolean;
  showItemRates: boolean;
  showQty: boolean;
  /** Line photos only print when this is on and at least one line actually has one. */
  showItemPhotos: boolean;
  showTermsPage: boolean;
  showSignatures: boolean;
}

export interface CategoryTotal {
  id: string;
  title: string;
  total: number;
  itemCount: number;
  optionalTotal: number;
}

export interface QuotationTotals {
  categories: CategoryTotal[];
  subtotal: number;
  discount: number;
  netTotal: number;
  vat: number;
  grandTotal: number;
  optionalTotal: number;
}

export interface ValidationIssue {
  /** Where the problem lives, so the UI can deep-link to it. */
  scope: "details" | "commercials" | "items";
  categoryId?: string;
  itemId?: string;
  message: string;
}
