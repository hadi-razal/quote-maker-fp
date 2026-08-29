import type { Quotation, QuotationSharePermission } from "./types";

export function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * No email provider is connected yet, so this prepares an honest mailto draft.
 * A future Resend route can keep the same inputs and return a delivery id.
 */
export function createQuotationEmailDraft({
  recipientEmail,
  quote,
  shareUrl,
  permission,
}: {
  recipientEmail: string;
  quote: Quotation;
  shareUrl: string;
  permission: QuotationSharePermission;
}): string {
  const subject = `${quote.ref} · ${quote.projectName || "Fairplatz quotation"}`;
  const body = [
    "Hello,",
    "",
    `${quote.author.name || "The Fairplatz team"} has shared a quotation with you${
      permission === "edit" ? " with edit access" : " for review"
    }.`,
    "",
    `Project: ${quote.projectName || "Untitled project"}`,
    `Reference: ${quote.ref} · Version ${quote.version}`,
    "",
    "Open the quotation:",
    shareUrl,
    "",
    permission === "edit"
      ? "You can open it without signing in and create a full editable copy in your browser."
      : "You can review it without signing in and print or save it as a PDF.",
  ].join("\n");

  return `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
