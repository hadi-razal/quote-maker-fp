"use client";

import { useEffect, useRef, useState } from "react";
import { Button, TextInput } from "@/components/ui/controls";
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconEye,
  IconLink,
  IconMail,
  IconShare,
  IconWarning,
} from "@/components/ui/icons";
import { createQuotationEmailDraft, isEmailAddress } from "@/lib/email";
import { createShareLink, shareRecordFromSnapshot } from "@/lib/share";
import type {
  Quotation,
  QuotationSharePermission,
  QuotationShareRecord,
} from "@/lib/types";

export function ShareDialog({
  quote,
  onClose,
  onShared,
}: {
  quote: Quotation;
  onClose: () => void;
  onShared: (record: QuotationShareRecord) => void;
}) {
  const [url, setUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [permission, setPermission] = useState<QuotationSharePermission>("view");
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedRecipient = recipientEmail.trim().toLowerCase();
  const recipientInvalid = normalizedRecipient !== "" && !isEmailAddress(normalizedRecipient);
  const imageCount =
    quote.images.length +
    quote.categories.reduce(
      (count, category) => count + category.items.filter((item) => item.image).length,
      0,
    );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const generate = () => {
    setError("");
    setCopyState("idle");
    if (recipientInvalid) {
      setError("Enter a valid recipient email address, or leave the field empty to share by link.");
      return;
    }
    try {
      const result = createShareLink(quote, {
        recipientEmails: normalizedRecipient ? [normalizedRecipient] : [],
        permission,
      });
      setUrl(result.url);
      onShared(shareRecordFromSnapshot(result.snapshot));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The link could not be created.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopyState("manual");
    }
  };

  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({
        title: `${quote.ref} · ${quote.projectName || "Quotation"}`,
        text: `Quotation from ${quote.author.name || "Fairplatz"}`,
        url,
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      await copy();
    }
  };

  const openEmailDraft = () => {
    if (!normalizedRecipient || !url) return;
    window.location.href = createQuotationEmailDraft({
      recipientEmail: normalizedRecipient,
      quote,
      shareUrl: url,
      permission,
    });
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] text-brand uppercase">
              {permission === "edit" ? "Editable working copy" : "Read-only snapshot"}
            </p>
            <h2 id="share-dialog-title" className="mt-1 text-lg font-semibold tracking-tight">
              Share this quotation
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Choose what anyone holding this link is allowed to do.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-black/5 hover:text-ink"
          >
            <IconClose />
          </button>
        </header>

        <div className="scroll-slim flex-1 overflow-auto px-5 py-5">
          <div className="rounded-xl border border-line bg-paper/65 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                <IconLink className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {quote.projectName || "Untitled project"}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {quote.ref} · Version {quote.version} · Created by {quote.author.name}
                </p>
              </div>
            </div>
          </div>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-line px-3 py-2.5">
              <dt className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
                Access
              </dt>
              <dd className="mt-1 font-medium">Anyone with the link</dd>
            </div>
            <div className="rounded-lg border border-line px-3 py-2.5">
              <dt className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
                Content
              </dt>
              <dd className="mt-1 font-medium">
                {permission === "edit" ? "Can create an editable copy" : "Frozen, view-only snapshot"}
              </dd>
            </div>
          </dl>

          <fieldset className="mt-4">
            <legend className="text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">
              Access level
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  [
                    "view",
                    "View only",
                    "Review, print and save PDF. The quotation cannot be changed.",
                    IconEye,
                  ],
                  [
                    "edit",
                    "Can edit",
                    "Creates a complete working copy in the recipient’s browser.",
                    IconEdit,
                  ],
                ] as const
              ).map(([value, label, description, Icon]) => (
                <button
                  key={value}
                  type="button"
                  disabled={Boolean(url)}
                  aria-pressed={permission === value}
                  onClick={() => setPermission(value)}
                  className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    permission === value
                      ? "border-brand bg-brand-light/60 ring-2 ring-brand/10"
                      : "border-line bg-white hover:border-ink/25"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Icon className={permission === value ? "text-brand" : "text-ink-soft"} />
                    {label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 rounded-xl border border-line p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-paper text-ink-soft">
                <IconMail className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="share-recipient-email"
                    className="text-sm font-semibold text-ink"
                  >
                    Email to a recipient
                  </label>
                  {url && normalizedRecipient ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUrl("");
                        setCopyState("idle");
                      }}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Change
                    </button>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  Optional. We prepare an email draft with the quotation link; you review and send
                  it from your mail app.
                </p>
                <TextInput
                  id="share-recipient-email"
                  type="email"
                  value={recipientEmail}
                  disabled={Boolean(url)}
                  invalid={recipientInvalid}
                  placeholder="client@company.com"
                  className="mt-3"
                  onChange={(event) => {
                    setRecipientEmail(event.target.value);
                    setError("");
                  }}
                />
                {recipientInvalid ? (
                  <p className="mt-1.5 text-xs text-brand">Enter a complete email address.</p>
                ) : normalizedRecipient ? (
                  <p className="mt-1.5 text-xs text-ink-soft">
                    The snapshot will be labelled for {normalizedRecipient}. The link itself still
                    works for anyone it is forwarded to.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
            <div className="flex items-start gap-2">
              <IconWarning className="mt-0.5 h-4 w-4 flex-none" />
              <p>
                This MVP stores the quotation inside the link. It cannot be revoked, and later edits
                do not update links already sent.
                {permission === "edit"
                  ? " Editing creates a separate browser copy; changes do not sync back to the author's original."
                  : " View-only access does not expose editing controls."}
                {imageCount > 0
                  ? ` ${imageCount} image${imageCount === 1 ? " is" : "s are"} excluded so messaging apps do not truncate it.`
                  : " Images will be supported when cloud storage is connected."}
              </p>
            </div>
          </div>

          {url ? (
            <div className="mt-4">
              <label className="text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">
                Share link
              </label>
              <div className="mt-1.5 flex gap-2">
                <TextInput
                  ref={inputRef}
                  readOnly
                  value={url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 text-xs"
                />
                <Button onClick={copy} className="flex-none">
                  {copyState === "copied" ? <IconCheck /> : <IconLink />}
                  {copyState === "copied" ? "Copied" : "Copy"}
                </Button>
              </div>
              {copyState === "manual" ? (
                <p className="mt-1.5 text-xs text-brand">
                  The link is selected. Press Ctrl+C or Command+C to copy it.
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-light p-3 text-sm text-brand">
              <IconWarning className="mt-0.5 h-4 w-4 flex-none" /> {error}
            </p>
          ) : null}

          {quote.sharing.records.length > 0 ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-soft uppercase">
                Recent sharing
              </p>
              <ul className="mt-2 space-y-2">
                {quote.sharing.records.slice(0, 3).map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-ink">
                      {record.method === "email"
                        ? `Email prepared for ${record.recipientEmails[0]}`
                        : "Share link created"}
                      {` · ${record.permission === "edit" ? "Can edit" : "View only"}`}
                    </span>
                    <span className="flex-none text-ink-soft">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-5 py-3">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft transition hover:bg-black/5 hover:text-ink"
            >
              Open preview ↗
            </a>
          ) : (
            <span className="text-xs text-ink-soft">No database or upload required.</span>
          )}
          {url ? (
            normalizedRecipient ? (
              <Button variant="primary" onClick={openEmailDraft}>
                <IconMail /> Open email draft
              </Button>
            ) : (
              <Button variant="primary" onClick={share}>
                <IconShare /> Share link
              </Button>
            )
          ) : (
            <Button variant="primary" onClick={generate}>
              {normalizedRecipient ? <IconMail /> : <IconLink />}
              {normalizedRecipient
                ? permission === "edit"
                  ? "Prepare editable email"
                  : "Prepare email link"
                : permission === "edit"
                  ? "Create editable link"
                  : "Create share link"}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
