"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PreviewPane } from "@/components/document/PreviewPane";
import { Button } from "@/components/ui/controls";
import { IconEdit, IconPrint, IconWarning } from "@/components/ui/icons";
import { grantSharedEditAccess } from "@/lib/auth";
import { COMPANY } from "@/lib/presets";
import { readShareLink, type SharedQuotationSnapshot } from "@/lib/share";
import { useQuotations } from "@/lib/store";

type ShareState =
  | { status: "loading" }
  | { status: "ready"; snapshot: SharedQuotationSnapshot }
  | { status: "error"; message: string };

export default function SharedQuotationPage() {
  const router = useRouter();
  const importSharedCopy = useQuotations((store) => store.importSharedCopy);
  const [state, setState] = useState<ShareState>({ status: "loading" });

  useEffect(() => {
    const read = () => {
      try {
        const snapshot = readShareLink(window.location.hash);
        setState({ status: "ready", snapshot });
        document.title = `${snapshot.quote.ref} · ${snapshot.quote.projectName || "Shared quotation"}`;
      } catch (caught) {
        setState({
          status: "error",
          message: caught instanceof Error ? caught.message : "This share link could not be opened.",
        });
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-6 text-sm text-ink-soft">
        Opening quotation…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-paper px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-xl">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand">
            <IconWarning className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">This link cannot be opened</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
          <p className="mt-4 text-xs text-ink-soft">
            Ask the quotation author to create and send a new share link.
          </p>
        </div>
      </main>
    );
  }

  const { snapshot } = state;
  const quote = snapshot.quote;
  const recipientEmail = snapshot.recipientEmails[0];
  const canEdit = snapshot.permission === "edit";

  const openEditableCopy = () => {
    const copy = importSharedCopy(quote, recipientEmail);
    grantSharedEditAccess(copy.id);
    router.push(`/quote/${copy.id}`);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-paper print-passthrough">
      <header className="no-print flex flex-none flex-wrap items-center gap-3 border-b border-line bg-white px-3 py-3 shadow-sm sm:px-5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-ink">
          <Image src={COMPANY.markLight} alt="Fairplatz" width={144} height={116} className="h-5 w-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <h1 className="truncate text-sm font-semibold tracking-tight">
              {quote.projectName || "Shared quotation"}
            </h1>
            <span className="rounded-sm bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
              {quote.ref} · V{quote.version}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {recipientEmail ? `Shared with ${recipientEmail}` : `Created by ${snapshot.author.name}`} ·{" "}
            {new Date(snapshot.sharedAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
            canEdit ? "bg-brand-light text-brand" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          Anyone with link · {canEdit ? "Can edit" : "View only"}
        </span>
        {canEdit ? (
          <Button onClick={openEditableCopy}>
            <IconEdit /> <span className="hidden sm:inline">Open editable copy</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        ) : null}
        <Button variant="primary" onClick={() => window.print()}>
          <IconPrint /> <span className="hidden sm:inline">Print or save PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </header>

      {snapshot.omittedImageCount > 0 ? (
        <div className="no-print flex flex-none items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950 sm:justify-center">
          <IconWarning className="mt-px h-4 w-4 flex-none" />
          {snapshot.omittedImageCount} image{snapshot.omittedImageCount === 1 ? " was" : "s were"} excluded from this MVP link. Pricing and written scope are complete.
        </div>
      ) : null}

      {recipientEmail ? (
        <div className="no-print flex flex-none items-start gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-950 sm:justify-center">
          Prepared for <strong>{recipientEmail}</strong> by {snapshot.author.name}. Access is still
          link-based, so forwarded copies can also be opened.
        </div>
      ) : null}

      {canEdit ? (
        <div className="no-print flex flex-none items-start gap-2 border-b border-brand/25 bg-brand-light px-4 py-2 text-xs text-brand sm:justify-center">
          <IconEdit className="mt-px h-4 w-4 flex-none" />
          Edit access creates a full working copy in this browser. Changes do not modify or sync to
          the author&apos;s original quotation yet.
        </div>
      ) : null}

      <main className="min-h-0 flex-1 print-passthrough">
        <PreviewPane quote={quote} />
      </main>
    </div>
  );
}
