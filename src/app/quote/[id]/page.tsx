"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewPane } from "@/components/document/PreviewPane";
import { BoqTab } from "@/components/editor/BoqTab";
import { DetailsTab } from "@/components/editor/DetailsTab";
import { OptionsTab } from "@/components/editor/OptionsTab";
import { ExportDialog, shouldSkipPrintHelp } from "@/components/editor/ExportDialog";
import { TermsTab } from "@/components/editor/TermsTab";
import { VersionMenu } from "@/components/editor/VersionMenu";
import { VisualsTab } from "@/components/editor/VisualsTab";
import { Button, cx } from "@/components/ui/controls";
import { IconBack, IconCheck, IconDownload, IconImage, IconWarning } from "@/components/ui/icons";
import { computeTotals, formatMoney, validate } from "@/lib/calc";
import { COMPANY } from "@/lib/presets";
import { setLocalFlag, useLocalFlag } from "@/lib/localFlag";
import { useHydrated, useQuotations } from "@/lib/store";

const STEPS = [
  {
    id: "details",
    label: "Project details",
    hint: "Who the quotation is for and where the show is. This prints in the box on page one.",
  },
  {
    id: "boq",
    label: "Items & prices",
    hint: "Add a line for everything you will supply. Each category adds up on its own, then the grand total follows.",
  },
  {
    id: "visuals",
    label: "Pictures",
    hint: "Optional. Drop in the stand render if you have one — the quotation prints fine without it.",
  },
  {
    id: "terms",
    label: "Terms & notes",
    hint: "The standard Fairplatz terms are already filled in. Change them only if this job needs it.",
  },
  {
    id: "options",
    label: "Export settings",
    hint: "Choose what the client sees on the finished PDF: a price on every line, or one price per category.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/** Remembers whether the side-by-side preview is open on wide screens. */
const PREVIEW_HIDDEN_KEY = "fairplatz-hide-preview";

export default function QuoteEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const quotations = useQuotations((s) => s.quotations);
  const hydrated = useHydrated();
  const quote = quotations.find((q) => q.id === id);

  const [step, setStep] = useState<StepId>("details");
  const [leftPct, setLeftPct] = useState(52);
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [showIssues, setShowIssues] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const previewHidden = useLocalFlag(PREVIEW_HIDDEN_KEY);
  const dragging = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === step),
  );

  const goToStep = useCallback((next: StepId) => {
    setStep(next);
    setMobilePane("editor");
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const onDragMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(72, Math.max(28, pct)));
  }, []);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [onDragMove]);

  const issues = useMemo(() => (quote ? validate(quote) : []), [quote]);
  const totals = useMemo(() => (quote ? computeTotals(quote) : null), [quote]);

  const openPrintWindow = () => {
    const previousTitle = document.title;
    if (quote) {
      document.title = `${quote.ref}${quote.version > 1 ? ` V${quote.version}` : ""}${
        quote.projectName ? ` - ${quote.projectName}` : ""
      }`;
    }
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  // Straight to the print window only when there is nothing missing and the
  // person has already said they know the print settings.
  const onDownloadClick = () => {
    if (issues.length === 0 && shouldSkipPrintHelp()) openPrintWindow();
    else setShowExport(true);
  };

  if (!hydrated) {
    return <p className="p-10 text-center text-sm text-ink-soft">Loading…</p>;
  }

  if (!quote) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="max-w-sm text-sm text-ink-soft">
          This quotation isn&apos;t saved in this browser. Quotations stay on the computer that
          created them.
        </p>
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          Back to all quotations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col print-passthrough">
      <header className="no-print flex flex-none flex-wrap items-center gap-2 border-b border-line bg-white px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <Link
          href="/"
          title="Back to all quotations"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-soft transition hover:bg-black/5 hover:text-ink"
        >
          <IconBack /> <span className="hidden md:inline">All quotations</span>
        </Link>

        <Image
          src={COMPANY.mark}
          alt=""
          width={144}
          height={116}
          className="hidden h-6 w-auto sm:block"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {quote.projectName || "Untitled project"}
          </div>
          <div className="truncate text-xs text-ink-soft">
            {quote.ref}
            {totals ? ` · ${formatMoney(totals.grandTotal, quote.currency)} incl. tax` : ""}
            <span className="hidden sm:inline"> · saved automatically</span>
          </div>
        </div>

        <VersionMenu quote={quote} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIssues((s) => !s)}
            title={
              issues.length > 0
                ? "Some required boxes are still empty — click to see them"
                : "Everything required is filled in"
            }
            className={cx(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition",
              issues.length > 0
                ? "bg-brand-light text-brand hover:bg-brand/15"
                : "bg-emerald-50 text-emerald-700",
            )}
          >
            {issues.length > 0 ? <IconWarning /> : <IconCheck />}
            <span className="hidden sm:inline">
              {issues.length > 0
                ? `${issues.length} thing${issues.length === 1 ? "" : "s"} left`
                : "Ready to send"}
            </span>
            <span className="sm:hidden">{issues.length > 0 ? issues.length : ""}</span>
          </button>

          {showIssues ? (
            <div className="absolute top-full right-0 z-40 mt-2 max-h-80 w-[min(21rem,calc(100vw-1.5rem))] overflow-auto rounded-xl border border-line bg-white p-3 shadow-xl">
              <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {issues.length > 0 ? "Still to fill in" : "All done"}
              </p>
              {issues.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-ink-soft">
                  Nothing is missing. Download the PDF whenever you are ready.
                </p>
              ) : (
                <ul className="space-y-1">
                  {issues.map((issue, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          goToStep(issue.scope === "items" ? "boq" : "details");
                          setShowIssues(false);
                        }}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-ink transition hover:bg-paper"
                      >
                        {issue.message}
                        <span className="ml-1 text-brand">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {previewHidden ? (
          <Button
            onClick={() => setLocalFlag(PREVIEW_HIDDEN_KEY, false)}
            className="hidden lg:inline-flex"
            title="Show the live PDF preview beside the form"
          >
            <IconImage /> Show preview
          </Button>
        ) : null}

        <Button variant="primary" onClick={onDownloadClick}>
          <IconDownload />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </header>

      <div
        ref={shellRef}
        className={cx(
          "grid min-h-0 flex-1 grid-cols-1 print-passthrough",
          previewHidden ? "lg:grid-cols-1" : "lg:grid-cols-[var(--left)_7px_1fr]",
        )}
        style={{ ["--left" as string]: `${leftPct}%` }}
      >
        <section
          className={cx(
            "min-h-0 flex-col overflow-hidden bg-paper no-print lg:flex",
            mobilePane === "editor" ? "flex" : "hidden",
          )}
        >
          <nav className="scroll-slim flex flex-none gap-1 overflow-x-auto border-b border-line bg-white px-2 sm:px-3">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(s.id)}
                className={cx(
                  "relative flex flex-none items-center gap-1.5 px-2.5 py-2.5 text-sm font-medium whitespace-nowrap transition sm:px-3",
                  step === s.id ? "text-brand" : "text-ink-soft hover:text-ink",
                )}
              >
                <span
                  className={cx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                    step === s.id ? "bg-brand text-white" : "bg-paper text-ink-soft",
                  )}
                >
                  {i + 1}
                </span>
                {s.label}
                {s.id === "boq" ? (
                  <span className="rounded bg-paper px-1.5 py-0.5 text-xs tabular-nums">
                    {quote.categories.reduce((n, c) => n + c.items.length, 0)}
                  </span>
                ) : null}
                {step === s.id ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
                ) : null}
              </button>
            ))}
          </nav>

          <p className="flex-none border-b border-line bg-white/70 px-3 py-2 text-xs text-ink-soft sm:px-4">
            <span className="font-semibold text-ink">
              Step {stepIndex + 1} of {STEPS.length}.
            </span>{" "}
            {STEPS[stepIndex].hint}
          </p>

          <div ref={scrollRef} className="scroll-slim flex-1 overflow-auto p-3 sm:p-4">
            <div className={previewHidden ? "mx-auto w-full max-w-3xl" : ""}>
              {step === "details" ? <DetailsTab quote={quote} /> : null}
              {step === "boq" ? <BoqTab quote={quote} /> : null}
              {step === "visuals" ? <VisualsTab quote={quote} /> : null}
              {step === "terms" ? <TermsTab quote={quote} /> : null}
              {step === "options" ? <OptionsTab quote={quote} /> : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <Button
                  disabled={stepIndex === 0}
                  onClick={() => goToStep(STEPS[stepIndex - 1].id)}
                >
                  <IconBack /> {stepIndex > 0 ? STEPS[stepIndex - 1].label : "Back"}
                </Button>

                {stepIndex < STEPS.length - 1 ? (
                  <Button variant="primary" onClick={() => goToStep(STEPS[stepIndex + 1].id)}>
                    Next: {STEPS[stepIndex + 1].label} →
                  </Button>
                ) : (
                  <Button variant="primary" onClick={onDownloadClick}>
                    <IconDownload /> Download PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          title="Drag to make this side wider or narrower"
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          className={cx(
            "hidden cursor-col-resize items-center justify-center bg-line/60 transition hover:bg-brand no-print",
            previewHidden ? "" : "lg:flex",
          )}
        >
          <span className="h-8 w-0.5 rounded-full bg-white/70" />
        </div>

        <section
          className={cx(
            "min-h-0 print-passthrough",
            mobilePane === "preview" ? "block" : "hidden",
            previewHidden ? "lg:hidden" : "lg:block",
          )}
        >
          <PreviewPane quote={quote} onHide={() => setLocalFlag(PREVIEW_HIDDEN_KEY, true)} />
        </section>
      </div>

      <div
        className="no-print flex flex-none border-t border-line bg-white lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {(
          [
            ["editor", "Edit"],
            ["preview", "See the PDF"],
          ] as const
        ).map(([pane, label]) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={cx(
              "flex-1 py-3 text-sm font-medium transition",
              mobilePane === pane ? "bg-brand-light text-brand" : "text-ink-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showExport ? (
        <ExportDialog
          issues={issues}
          onClose={() => setShowExport(false)}
          onPrint={openPrintWindow}
          onFixIssue={(issue) => {
            setShowExport(false);
            goToStep(issue.scope === "items" ? "boq" : "details");
          }}
        />
      ) : null}
    </div>
  );
}
