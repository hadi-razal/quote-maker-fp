import type {
  Quotation,
  QuotationAuthor,
  QuotationSharePermission,
  QuotationShareRecord,
} from "./types";

const SHARE_SCHEMA_VERSION = 3;
const SHARE_HASH_KEY = "snapshot";
export const MAX_SHARE_URL_LENGTH = 100_000;

export interface SharedQuotationSnapshot {
  schemaVersion: 1 | 2 | typeof SHARE_SCHEMA_VERSION;
  snapshotId: string;
  sharedAt: string;
  author: QuotationAuthor;
  quote: Quotation;
  omittedImageCount: number;
  recipientEmails: string[];
  access: "anyone_with_link";
  permission: QuotationSharePermission;
}

export interface ShareLinkResult {
  url: string;
  snapshot: SharedQuotationSnapshot;
}

export interface CreateShareLinkOptions {
  recipientEmails?: string[];
  permission?: QuotationSharePermission;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Creates a portable, immutable MVP snapshot. Images are intentionally removed:
 * inline data URLs would make message apps truncate the link. A database-backed
 * version can keep this API and replace the encoded payload with a short token.
 */
export function createShareLink(
  quote: Quotation,
  options: CreateShareLinkOptions = {},
): ShareLinkResult {
  const snapshotQuote = structuredClone(quote);
  const lineImageCount = snapshotQuote.categories.reduce(
    (count, category) => count + category.items.filter((item) => item.image).length,
    0,
  );
  const omittedImageCount = snapshotQuote.images.length + lineImageCount;

  snapshotQuote.images = [];
  snapshotQuote.categories = snapshotQuote.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item, image: undefined })),
  }));
  snapshotQuote.showItemPhotos = false;

  const snapshot: SharedQuotationSnapshot = {
    schemaVersion: SHARE_SCHEMA_VERSION,
    snapshotId: randomId(),
    sharedAt: new Date().toISOString(),
    author: structuredClone(quote.author),
    quote: snapshotQuote,
    omittedImageCount,
    recipientEmails: options.recipientEmails ?? [],
    access: "anyone_with_link",
    permission: options.permission ?? "view",
  };

  const configuredOrigin = process.env.NEXT_PUBLIC_SHARE_URL?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || window.location.origin;
  const url = `${origin}/shared#${SHARE_HASH_KEY}=${toBase64Url(JSON.stringify(snapshot))}`;
  if (url.length > MAX_SHARE_URL_LENGTH) {
    throw new Error("This quotation is too large for an MVP share link. Shorten the terms or notes and try again.");
  }
  return { url, snapshot };
}

export function readShareLink(hash: string): SharedQuotationSnapshot {
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get(SHARE_HASH_KEY);
  if (!raw) throw new Error("The snapshot is missing from this link.");

  const parsed = JSON.parse(fromBase64Url(raw)) as Partial<SharedQuotationSnapshot>;
  if (
    (parsed.schemaVersion !== 1 &&
      parsed.schemaVersion !== 2 &&
      parsed.schemaVersion !== SHARE_SCHEMA_VERSION) ||
    !parsed.snapshotId ||
    !parsed.sharedAt ||
    !parsed.author?.email ||
    !parsed.quote?.id ||
    !Array.isArray(parsed.quote.categories)
  ) {
    throw new Error("This share link is invalid or was created by an unsupported version.");
  }
  const snapshot = parsed as SharedQuotationSnapshot;
  return {
    ...snapshot,
    recipientEmails: snapshot.recipientEmails ?? [],
    access: snapshot.access ?? "anyone_with_link",
    permission: snapshot.permission ?? "view",
    quote: {
      ...snapshot.quote,
      sharing: {
        ...snapshot.quote.sharing,
        records: snapshot.quote.sharing.records ?? [],
      },
    },
  };
}

export function shareRecordFromSnapshot(
  snapshot: SharedQuotationSnapshot,
): QuotationShareRecord {
  return {
    id: snapshot.snapshotId,
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.sharedAt,
    method: snapshot.recipientEmails.length > 0 ? "email" : "link",
    recipientEmails: snapshot.recipientEmails,
    quotationVersion: snapshot.quote.version,
    access: snapshot.access,
    permission: snapshot.permission,
  };
}
