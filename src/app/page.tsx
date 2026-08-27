"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, IconButton, TextInput, cx } from "@/components/ui/controls";
import { IconClose, IconCopy, IconPlus, IconTrash } from "@/components/ui/icons";
import { signOut, useSession } from "@/lib/auth";
import { computeTotals, formatMoney, validate } from "@/lib/calc";
import { COMPANY } from "@/lib/presets";
import { setLocalFlag, useLocalFlag } from "@/lib/localFlag";
import { useHydrated, useQuotations } from "@/lib/store";
import type { Quotation } from "@/lib/types";

const HELP_KEY = "fairplatz-hide-home-help";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}

interface Family {
  familyId: string;
  latest: Quotation;
  versions: Quotation[];
}

export default function DashboardPage() {
  const router = useRouter();
  const quotations = useQuotations((s) => s.quotations);
  const create = useQuotations((s) => s.create);
  const duplicate = useQuotations((s) => s.duplicate);
  const remove = useQuotations((s) => s.remove);
  const hydrated = useHydrated();
  const { email } = useSession();

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const helpDismissed = useLocalFlag(HELP_KEY);
  const showHelp = !helpDismissed;

  const families = useMemo<Family[]>(() => {
    const byFamily = new Map<string, Quotation[]>();
    for (const q of quotations) {
      const list = byFamily.get(q.familyId) ?? [];
      list.push(q);
      byFamily.set(q.familyId, list);
    }

    const q = query.trim().toLowerCase();
    return [...byFamily.entries()]
      .map(([familyId, list]) => {
        const versions = [...list].sort((a, b) => b.version - a.version);
        return { familyId, latest: versions[0], versions };
      })
      .filter(({ latest }) =>
        !q
          ? true
          : [latest.ref, latest.projectName, latest.clientCompany, latest.clientName, latest.venue]
              .join(" ")
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => b.latest.updatedAt.localeCompare(a.latest.updatedAt));
  }, [quotations, query]);

  const openNew = () => {
    const quote = create(true);
    router.push(`/quote/${quote.id}`);
  };

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src={COMPANY.logo}
              alt="Fairplatz"
              width={639}
              height={182}
              priority
              className="h-7 w-auto sm:h-8"
            />
            <span className="hidden border-l border-line pl-3 text-sm font-medium text-ink-soft sm:block">
              Quotation Maker
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("Sign out of the Quotation Maker on this computer?")) signOut();
              }}
              title={email ? `Signed in as ${email}` : "Sign out"}
              className="hidden rounded-md px-2.5 py-1.5 text-sm text-ink-soft transition hover:bg-black/5 hover:text-ink sm:block"
            >
              Sign out
            </button>
            <Button variant="primary" onClick={openNew}>
              <IconPlus /> <span className="hidden sm:inline">New quotation</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {showHelp ? (
          <section className="relative mb-5 rounded-xl border border-line bg-white p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setLocalFlag(HELP_KEY, true)}
              aria-label="Hide this"
              className="absolute top-3 right-3 rounded-md p-1.5 text-ink-soft hover:bg-black/5"
            >
              <IconClose />
            </button>
            <h2 className="text-sm font-semibold">How this works</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Fill in five short steps", "Project details, then your items and prices."],
                ["Watch the PDF build itself", "The A4 page redraws itself as you type."],
                ["Download and send", "One button. No Excel, no formatting."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-2.5">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{title}</span>
                    <span className="block text-xs text-ink-soft">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Your quotations</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Saved on this computer as you type. Copy an old one to start a new job in seconds.
            </p>
          </div>
          <TextInput
            placeholder="Search project, client or ref…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>

        {!hydrated ? (
          <p className="py-16 text-center text-sm text-ink-soft">Loading…</p>
        ) : families.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white px-5 py-14 text-center sm:py-16">
            <h2 className="text-base font-semibold">
              {quotations.length === 0 ? "Nothing here yet" : "Nothing matches that search"}
            </h2>
            <p className="mx-auto mt-1 mb-4 max-w-sm text-sm text-ink-soft">
              {quotations.length === 0
                ? "A new quotation starts with the usual Fairplatz categories — carpentry, electrical, AV, graphics — ready to fill in."
                : "Try a different project name, client or reference."}
            </p>
            {quotations.length === 0 ? (
              <Button variant="primary" onClick={openNew}>
                <IconPlus /> Make my first quotation
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {families.map(({ familyId, latest, versions }) => {
              const totals = computeTotals(latest);
              const issues = validate(latest);
              const isOpen = expanded === familyId;

              return (
                <li
                  key={familyId}
                  className="overflow-hidden rounded-xl border border-line bg-white transition hover:border-ink/20"
                >
                  <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/quote/${latest.id}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {latest.projectName || "Untitled project"}
                        </span>
                        <span className="rounded bg-paper px-1.5 py-0.5 text-xs text-ink-soft tabular-nums">
                          {latest.ref}
                        </span>
                        {versions.length > 1 ? (
                          <span className="rounded bg-ink px-1.5 py-0.5 text-xs font-bold text-white">
                            V{latest.version}
                          </span>
                        ) : null}
                        {issues.length > 0 ? (
                          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
                            {issues.length} left to fill
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Ready
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-ink-soft">
                        {[
                          latest.clientCompany || latest.clientName,
                          latest.venue,
                          latest.eventDates,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No client details yet"}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft sm:hidden">
                        {formatMoney(totals.grandTotal, latest.currency)} ·{" "}
                        {relativeTime(latest.updatedAt)}
                      </p>
                    </button>

                    <div className="hidden text-right sm:block">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatMoney(totals.grandTotal, latest.currency)}
                      </div>
                      <div className="text-xs text-ink-soft">{relativeTime(latest.updatedAt)}</div>
                    </div>

                    <div className="flex flex-none gap-0.5">
                      {versions.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : familyId)}
                          className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
                          title="Show every version of this quotation"
                        >
                          {versions.length} versions
                        </button>
                      ) : null}
                      <IconButton
                        label="Make a copy for a different job"
                        onClick={() => {
                          const copy = duplicate(latest.id);
                          if (copy) router.push(`/quote/${copy.id}`);
                        }}
                      >
                        <IconCopy />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        className="hover:bg-brand-light hover:text-brand"
                        onClick={() => {
                          const what =
                            versions.length > 1
                              ? `${latest.ref} and all ${versions.length} of its versions`
                              : latest.ref;
                          if (confirm(`Delete ${what}? This cannot be undone.`)) {
                            versions.forEach((v) => remove(v.id));
                          }
                        }}
                      >
                        <IconTrash />
                      </IconButton>
                    </div>
                  </div>

                  {isOpen ? (
                    <ul className="border-t border-line bg-paper/60 p-2">
                      {versions.map((v) => {
                        const vTotals = computeTotals(v);
                        return (
                          <li key={v.id}>
                            <button
                              type="button"
                              onClick={() => router.push(`/quote/${v.id}`)}
                              className={cx(
                                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white",
                              )}
                            >
                              <span className="flex h-6 w-8 flex-none items-center justify-center rounded bg-white text-xs font-bold text-ink-soft">
                                V{v.version}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                                {v.versionNote ||
                                  `Created ${new Date(v.createdAt).toLocaleDateString()}`}
                              </span>
                              <span className="flex-none text-xs font-medium tabular-nums">
                                {formatMoney(vTotals.grandTotal, v.currency)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
