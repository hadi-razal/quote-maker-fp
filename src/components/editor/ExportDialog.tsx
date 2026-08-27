"use client";

import { useEffect, useState } from "react";
import { Button, cx } from "@/components/ui/controls";
import { IconClose, IconDownload, IconPrint, IconWarning } from "@/components/ui/icons";
import { readLocalFlag, setLocalFlag } from "@/lib/localFlag";
import {
  PLATFORM_LABELS,
  detectBrowser,
  detectPlatform,
  type Browser,
  type Platform,
} from "@/lib/platform";
import type { ValidationIssue } from "@/lib/types";

const STORAGE_KEY = "fairplatz-skip-print-help";

export function shouldSkipPrintHelp(): boolean {
  return readLocalFlag(STORAGE_KEY);
}

type Step = [label: string, detail: string];

/**
 * The exact clicks for saving a PDF on each platform. These differ enough that
 * generic advice ("choose Save as PDF") leaves people stuck — especially on a
 * phone, where the option is hidden behind the share sheet.
 */
function stepsFor(platform: Platform, browser: Browser): Step[] {
  if (platform === "ios") {
    return [
      ["The print preview opens", "If a paper size is offered, choose A4."],
      [
        "Tap the share icon at the top",
        "Or pinch the page preview outwards to open it full screen.",
      ],
      ["Choose “Save to Files”", "Pick a folder — Downloads or On My iPhone works."],
      ["Attach it from the Files app", "That is where the finished PDF now lives."],
    ];
  }

  if (platform === "android") {
    return [
      ["Tap the destination at the top", "Choose “Save as PDF” instead of a printer."],
      ["Open the options arrow", "Set Paper size to A4."],
      ["Tap the blue PDF / Save button", ""],
      ["Choose a folder and tap Save", "Usually Downloads."],
    ];
  }

  if (platform === "mac" && browser === "safari") {
    return [
      ["Click “Show Details”", "Only if the window looks small — it opens the full options."],
      ["Paper Size: A4", ""],
      ["Tick “Print backgrounds”", "Without it the orange and black bars print white."],
      ["Bottom left: PDF ▾ → “Save as PDF”", "Name the file and choose a folder."],
    ];
  }

  const destination =
    browser === "edge"
      ? ["Printer: “Save as PDF”", "Not “Microsoft Print to PDF” — Save as PDF keeps the colours."]
      : ["Destination: “Save as PDF”", "It is the dropdown at the top of the window."];

  return [
    destination as Step,
    ["Paper size: A4", ""],
    ["Margins: None", "The page already has its own margins built in."],
    [
      "More settings → tick “Background graphics”",
      "Without it the orange and black bars print white.",
    ],
    [
      platform === "mac" ? "Click Save" : "Click Save, then choose a folder",
      "Usually your Downloads folder.",
    ],
  ];
}

function Shell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-soft hover:bg-black/5"
          >
            <IconClose />
          </button>
        </header>
        <div className="scroll-slim flex-1 overflow-auto px-5 py-4">{children}</div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-5 py-3">
          {footer}
        </footer>
      </div>
    </div>
  );
}

export function ExportDialog({
  issues,
  onClose,
  onPrint,
  onFixIssue,
}: {
  issues: ValidationIssue[];
  onClose: () => void;
  onPrint: () => void;
  onFixIssue: (issue: ValidationIssue) => void;
}) {
  const [stage, setStage] = useState<"missing" | "howto">(issues.length > 0 ? "missing" : "howto");
  // The dialog only ever mounts on a click, so it is safe to read the user
  // agent straight away — there is no server render to disagree with.
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [browser] = useState<Browser>(detectBrowser);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goToHowTo = () => {
    if (shouldSkipPrintHelp()) {
      onClose();
      onPrint();
      return;
    }
    setStage("howto");
  };

  if (stage === "missing") {
    const shown = issues.slice(0, 7);
    return (
      <Shell
        title="Some details are still empty"
        subtitle={`${issues.length} thing${issues.length === 1 ? "" : "s"} ${
          issues.length === 1 ? "hasn't" : "haven't"
        } been filled in. You can still export — those spots will simply print blank.`}
        onClose={onClose}
        footer={
          <>
            <Button onClick={goToHowTo}>Export anyway</Button>
            <Button variant="primary" onClick={() => onFixIssue(issues[0])}>
              Fix these first
            </Button>
          </>
        }
      >
        <ul className="space-y-1">
          {shown.map((issue, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onFixIssue(issue)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink transition hover:bg-paper"
              >
                <IconWarning className="mt-0.5 h-4 w-4 flex-none text-brand" />
                <span className="flex-1">{issue.message}</span>
                <span className="flex-none text-brand">→</span>
              </button>
            </li>
          ))}
        </ul>
        {issues.length > shown.length ? (
          <p className="mt-2 px-2 text-xs text-ink-soft">
            and {issues.length - shown.length} more.
          </p>
        ) : null}
      </Shell>
    );
  }

  const steps = stepsFor(platform, browser);

  return (
    <Shell
      title="Saving your PDF"
      subtitle="Your browser does the saving. Here is exactly what to tap in the window that opens next."
      onClose={onClose}
      footer={
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={skip}
              onChange={(e) => setSkip(e.target.checked)}
              className="h-4 w-4 accent-[#ea4e1b]"
            />
            Don&apos;t show this again
          </label>
          <Button
            variant="primary"
            onClick={() => {
              if (skip) setLocalFlag(STORAGE_KEY, true);
              onClose();
              onPrint();
            }}
          >
            <IconDownload /> Open the print window
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1">
        {(["windows", "mac", "ios", "android"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={cx(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition",
              platform === p
                ? "border-brand bg-brand-light text-brand"
                : "border-line text-ink-soft hover:border-ink/25 hover:text-ink",
            )}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      <ol className="space-y-2.5">
        {steps.map(([label, detail], i) => (
          <li key={label} className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm">
              <span className="font-semibold">{label}</span>
              {detail ? <span className="block text-xs text-ink-soft">{detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-paper p-2.5 text-xs text-ink-soft">
        <IconPrint className="mt-0.5 h-4 w-4 flex-none" />
        <span>
          Printing on paper instead? Same window — just pick your printer rather than “Save as PDF”.
        </span>
      </p>
    </Shell>
  );
}
