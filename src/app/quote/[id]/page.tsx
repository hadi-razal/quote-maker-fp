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
import { ShareDialog } from "@/components/editor/ShareDialog";
import { TermsTab } from "@/components/editor/TermsTab";
import { VersionMenu } from "@/components/editor/VersionMenu";
import { VisualsTab } from "@/components/editor/VisualsTab";
import { Button, cx } from "@/components/ui/controls";
import {
  IconBack,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconImage,
  IconShare,
  IconWarning,
} from "@/components/ui/icons";
import { computeTotals, formatMoney, validate } from "@/lib/calc";
import { COMPANY } from "@/lib/presets";
import { setLocalFlag, useLocalFlag } from "@/lib/localFlag";
import { useHydrated, useQuotations, useStorageFull } from "@/lib/store";

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
  const recordShare = useQuotations((s) => s.recordShare);
  const hydrated = useHydrated();
  const quote = quotations.find((q) => q.id === id);

  const [step, setStep] = useState<StepId>("details");
  const [leftPct, setLeftPct] = useState(52);
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [showIssues, setShowIssues] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const previewHidden = useLocalFlag(PREVIEW_HIDDEN_KEY);
  const storageFull = useStorageFull();
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

  /** How many outstanding items belong to each step, for the badges in the nav. */
  const stepIssues = useMemo(() => {
    const counts: Partial<Record<StepId, number>> = {};
    for (const issue of issues) {
      const id: StepId = issue.scope === "items" ? "boq" : "details";
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [issues]);

  const lineCount = quote ? quote.categories.reduce((n, c) => n + c.items.length, 0) : 0;
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
      <header className="no-print flex flex-none flex-wrap items-center gap-2 border-b border-line bg-white px-2.5 py-2.5 shadow-[0_1px_10px_rgba(29,29,27,0.04)] sm:gap-3 sm:px-4">
        <Link
          href="/"
          title="Back to all quotations"
          className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
        >
          <IconBack /> <span className="hidden md:inline">All quotations</span>
        </Link>

        <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-ink sm:flex">
          <Image
            src={COMPANY.markLight}
            alt=""
            width={144}
            height={116}
            className="h-5 w-auto"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">
            {quote.projectName || "Untitled project"}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-ink-soft">
            <span>{quote.ref}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saved locally
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden truncate sm:inline">By {quote.author.name}</span>
          </div>
        </div>

        {totals ? (
          <div className="hidden border-r border-line pr-3 text-right xl:block">
            <p className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
              Quote total
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(totals.grandTotal, quote.currency)}
            </p>
          </div>
        ) : null}

        <VersionMenu quote={quote} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIssues((s) => !s)}
            title={
              issues.length > 0
                ? "Some checks still need attention — click to review them"
                : "Everything required is filled in"
            }
            className={cx(
              "flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition",
              issues.length > 0
                ? "bg-brand-light text-brand hover:bg-brand/15"
                : "bg-emerald-50 text-emerald-700",
            )}
          >
            {issues.length > 0 ? <IconWarning /> : <IconCheck />}
            <span className="hidden sm:inline">
              {issues.length > 0
                ? `${issues.length} check${issues.length === 1 ? "" : "s"}`
                : "Ready to send"}
            </span>
            <span className="sm:hidden">{issues.length > 0 ? issues.length : ""}</span>
          </button>

          {showIssues ? (
            <div className="absolute top-full right-0 z-40 mt-2 max-h-80 w-[min(22rem,calc(100vw-1.5rem))] overflow-auto rounded-xl border border-line bg-white p-3 shadow-2xl">
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

        <Button onClick={() => setShowShare(true)} title="Share this version with view or edit access">
          <IconShare />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button variant="primary" onClick={onDownloadClick}>
          <IconDownload />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </header>

      {storageFull ? (
        <div className="no-print flex flex-none items-start gap-2 border-b border-brand/30 bg-brand-light px-4 py-2.5 text-sm text-brand">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none" />
          <p>
            <strong>This browser&apos;s storage is full, so the last change was not saved.</strong>{" "}
            Download the PDF now to be safe, then free some space — remove a few line photos, or
            delete old quotations from the home screen.
          </p>
        </div>
      ) : null}

      <div
        ref={shellRef}
        className={cx(
          "grid min-h-0 flex-1 grid-cols-1 print-passthrough",
          previewHidden
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(0,var(--left))_7px_minmax(0,1fr)]",
        )}
        style={{ ["--left" as string]: `${leftPct}%` }}
      >
        <section
          className={cx(
            "min-h-0 min-w-0 flex-col overflow-hidden bg-paper no-print lg:flex",
            mobilePane === "editor" ? "flex" : "hidden",
          )}
        >
          <nav
            aria-label="Quotation steps"
            className="grid flex-none grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 border-b border-line bg-white px-3 py-2.5 sm:hidden"
          >
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => goToStep(STEPS[stepIndex - 1].id)}
              aria-label="Previous quotation step"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:border-ink/25 hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              <IconBack />
            </button>
            <div className="min-w-0 text-center">
              <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
                Step {stepIndex + 1} of {STEPS.length}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 truncate text-sm font-semibold text-ink">
                <span className="truncate">{STEPS[stepIndex].label}</span>
                {(stepIssues[STEPS[stepIndex].id] ?? 0) > 0 ? (
                  <span className="flex-none rounded-sm bg-brand-light px-1.5 py-0.5 text-[11px] font-bold text-brand tabular-nums">
                    {stepIssues[STEPS[stepIndex].id]}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              disabled={stepIndex === STEPS.length - 1}
              onClick={() => goToStep(STEPS[stepIndex + 1].id)}
              aria-label="Next quotation step"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
            >
              <IconChevronRight />
            </button>
          </nav>

          <nav
            aria-label="Quotation steps"
            className="scroll-hidden hidden flex-none overflow-x-auto border-b border-line bg-white px-3 py-2 sm:flex"
          >
            {STEPS.map((s, i) => {
              const problems = stepIssues[s.id] ?? 0;
              const active = step === s.id;
              const done = problems === 0 && (s.id === "details" || s.id === "boq");
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={cx(
                    "relative flex min-h-10 flex-none items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition sm:px-3",
                    active
                      ? "border-brand/20 bg-brand-light text-brand"
                      : "border-transparent text-ink-soft hover:bg-paper hover:text-ink",
                  )}
                >
                  <span
                    className={cx(
                      "flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
                      active
                        ? "bg-brand text-white"
                        : problems > 0
                          ? "bg-brand-light text-brand"
                          : done
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-paper text-ink-soft",
                    )}
                  >
                    {!active && done ? <IconCheck className="h-3 w-3" /> : i + 1}
                  </span>
                  {s.label}
                  {problems > 0 ? (
                    <span className="rounded-sm bg-brand-light px-1.5 py-0.5 text-xs font-semibold text-brand tabular-nums">
                      {problems}
                    </span>
                  ) : s.id === "boq" ? (
                    <span className="rounded-sm bg-paper px-1.5 py-0.5 text-xs tabular-nums">
                      {lineCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="flex-none border-b border-line bg-white">
            <div className="h-1 bg-paper">
              <div
                className="h-full rounded-r-full bg-brand transition-[width] duration-300"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="bg-white px-3 py-2.5 text-xs leading-relaxed text-ink-soft sm:px-4">
              <span className="font-semibold text-ink">
                Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}.
              </span>{" "}
              {STEPS[stepIndex].hint}
            </p>
          </div>

          <div ref={scrollRef} className="scroll-slim flex-1 overflow-auto p-3 sm:p-5">
            <div
              className={cx(
                "mx-auto w-full",
                previewHidden ? "max-w-5xl" : "max-w-3xl",
              )}
            >
              {step === "details" ? <DetailsTab quote={quote} /> : null}
              {step === "boq" ? <BoqTab quote={quote} /> : null}
              {step === "visuals" ? <VisualsTab quote={quote} /> : null}
              {step === "terms" ? <TermsTab quote={quote} /> : null}
              {step === "options" ? <OptionsTab quote={quote} /> : null}
            </div>
          </div>

          <footer className="flex flex-none items-center justify-between gap-3 border-t border-line bg-white px-3 py-2.5 shadow-[0_-4px_16px_rgba(29,29,27,0.04)] sm:px-4">
            <Button
              disabled={stepIndex === 0}
              onClick={() => goToStep(STEPS[stepIndex - 1].id)}
            >
              <IconBack />
              <span className="hidden sm:inline">
                {stepIndex > 0 ? STEPS[stepIndex - 1].label : "Back"}
              </span>
              <span className="sm:hidden">Back</span>
            </Button>

            <span className="hidden text-xs font-medium text-ink-soft sm:block">
              {stepIndex + 1} / {STEPS.length}
            </span>

            {stepIndex < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => goToStep(STEPS[stepIndex + 1].id)}>
                <span className="hidden sm:inline">Next: {STEPS[stepIndex + 1].label}</span>
                <span className="sm:hidden">Next</span>
                <IconChevronRight />
              </Button>
            ) : (
              <Button variant="primary" onClick={onDownloadClick}>
                <IconDownload /> Download PDF
              </Button>
            )}
          </footer>
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
          <span className="h-8 w-0.5 rounded-sm bg-white/70" />
        </div>

        <section
          className={cx(
            "min-h-0 min-w-0 overflow-hidden print-passthrough",
            mobilePane === "preview" ? "block" : "hidden",
            previewHidden ? "lg:hidden" : "lg:block",
          )}
        >
          <PreviewPane quote={quote} onHide={() => setLocalFlag(PREVIEW_HIDDEN_KEY, true)} />
        </section>
      </div>

      <div
        className="no-print flex flex-none border-t border-line bg-white shadow-[0_-4px_16px_rgba(29,29,27,0.05)] lg:hidden"
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
              "flex-1 py-3 text-sm font-semibold transition",
              mobilePane === pane
                ? "bg-brand-light text-brand"
                : "text-ink-soft hover:bg-paper",
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

      {showShare ? (
        <ShareDialog
          quote={quote}
          onClose={() => setShowShare(false)}
          onShared={(record) => recordShare(quote.id, record)}
        />
      ) : null}
    </div>
  );
}
