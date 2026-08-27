"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, cx } from "@/components/ui/controls";
import { IconCopy, IconPlus } from "@/components/ui/icons";
import { computeTotals, formatMoney } from "@/lib/calc";
import { MAX_VERSIONS, useQuotations } from "@/lib/store";
import type { Quotation } from "@/lib/types";

/**
 * Versions of one quotation (V1…V10). Each version is a frozen-in-time copy you
 * can go back to, which is how revised offers actually work: the client asked
 * for a change, the old price still has to be on file.
 */
export function VersionMenu({ quote }: { quote: Quotation }) {
  const router = useRouter();
  const quotations = useQuotations((s) => s.quotations);
  const createVersion = useQuotations((s) => s.createVersion);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const versions = quotations
    .filter((q) => q.familyId === quote.familyId)
    .sort((a, b) => a.version - b.version);
  const atLimit = versions.length >= MAX_VERSIONS;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Switch between versions of this quotation"
        className="flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink transition hover:border-ink/30"
      >
        <span className="rounded-sm bg-ink px-1.5 py-0.5 text-xs font-bold text-white">
          V{quote.version}
        </span>
        <span className="hidden text-ink-soft sm:inline">of {versions.length}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M2 4.5 6 8.5 10 4.5" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-line bg-white shadow-xl">
          <p className="border-b border-line px-3 py-2 text-xs text-ink-soft">
            Each version keeps its own prices and items. Nothing you do in one changes another.
          </p>

          <ul className="max-h-64 overflow-auto p-1.5">
            {versions.map((v) => {
              const totals = computeTotals(v);
              const current = v.id === quote.id;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!current) router.push(`/quote/${v.id}`);
                    }}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition",
                      current ? "bg-brand-light" : "hover:bg-paper",
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-7 w-9 flex-none items-center justify-center rounded-sm text-xs font-bold",
                        current ? "bg-brand text-white" : "bg-paper text-ink-soft",
                      )}
                    >
                      V{v.version}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {formatMoney(totals.grandTotal, v.currency)}
                        {current ? " · editing now" : ""}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {v.versionNote || `Created ${new Date(v.createdAt).toLocaleDateString()}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line p-2">
            <Button
              variant="primary"
              className="w-full"
              disabled={atLimit}
              onClick={() => {
                const next = createVersion(quote.id);
                setOpen(false);
                if (next) router.push(`/quote/${next.id}`);
              }}
            >
              {atLimit ? (
                `Limit of ${MAX_VERSIONS} versions reached`
              ) : (
                <>
                  <IconPlus /> Create version {versions.length + 1}
                </>
              )}
            </Button>
            <p className="mt-1.5 px-1 text-xs text-ink-soft">
              {atLimit ? (
                <>Duplicate the quotation from the home screen to start a fresh set of versions.</>
              ) : (
                <>
                  <IconCopy className="mr-1 inline h-3 w-3" />
                  Copies everything from V{quote.version} so you only change what moved.
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
