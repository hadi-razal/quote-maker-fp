"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { askConfirm } from "@/components/ui/confirm";
import { Button, IconButton, TextInput, cx } from "@/components/ui/controls";
import {
  IconClose,
  IconCopy,
  IconPlus,
  IconSearch,
  IconShare,
  IconTrash,
} from "@/components/ui/icons";
import { authorFromEmail, signOut, useSession } from "@/lib/auth";
import { computeTotals, formatMoney, validate } from "@/lib/calc";
import { setLocalFlag, useLocalFlag } from "@/lib/localFlag";
import { COMPANY } from "@/lib/presets";
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
  issues: number;
}

type DashboardFilter = "all" | "mine" | "shared" | "needs-review";

export default function DashboardPage() {
  const router = useRouter();
  const quotations = useQuotations((s) => s.quotations);
  const create = useQuotations((s) => s.create);
  const duplicate = useQuotations((s) => s.duplicate);
  const remove = useQuotations((s) => s.remove);
  const recordShare = useQuotations((s) => s.recordShare);
  const hydrated = useHydrated();
  const { email } = useSession();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sharingQuote, setSharingQuote] = useState<Quotation | null>(null);
  const helpDismissed = useLocalFlag(HELP_KEY);
  const sessionAuthor = useMemo(() => authorFromEmail(email), [email]);

  const all = useMemo<Family[]>(() => {
    const byFamily = new Map<string, Quotation[]>();
    for (const q of quotations) {
      const list = byFamily.get(q.familyId) ?? [];
      list.push(q);
      byFamily.set(q.familyId, list);
    }
    return [...byFamily.entries()]
      .map(([familyId, list]) => {
        const versions = [...list].sort((a, b) => b.version - a.version);
        return { familyId, latest: versions[0], versions, issues: validate(versions[0]).length };
      })
      .sort((a, b) => b.latest.updatedAt.localeCompare(a.latest.updatedAt));
  }, [quotations]);

  const families = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(({ latest, issues }) => {
      const matchesQuery =
        !q ||
        [
          latest.ref,
          latest.projectName,
          latest.clientCompany,
          latest.clientName,
          latest.venue,
          latest.author.name,
          latest.author.email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "mine" && latest.author.email.toLowerCase() === email?.toLowerCase()) ||
        (filter === "shared" && latest.sharing.mode === "snapshot") ||
        (filter === "needs-review" && issues > 0);
      return matchesQuery && matchesFilter;
    });
  }, [all, email, filter, query]);

  const ready = all.filter((f) => f.issues === 0).length;
  const shared = all.filter((f) => f.latest.sharing.mode === "snapshot").length;

  const openNew = () => {
    const quote = create(true, sessionAuthor);
    router.push(`/quote/${quote.id}`);
  };

  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 shadow-[0_1px_10px_rgba(29,29,27,0.04)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-9xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <Image
            src={COMPANY.logo}
            alt="Fairplatz"
            width={639}
            height={182}
            priority
            className="h-7 w-auto"
          />
          <span className="hidden border-l border-line pl-3 text-sm font-medium text-ink-soft sm:block">
            Quotation Maker
          </span>

          <div className="ml-auto flex items-center gap-2">
            {email ? <span className="hidden text-xs text-ink-soft md:block">{email}</span> : null}
            <button
              type="button"
              onClick={async () => {
                const ok = await askConfirm({
                  title: "Sign out?",
                  message:
                    "Your quotations stay saved on this computer — you will just need the email and password to get back in.",
                  confirmLabel: "Sign out",
                });
                if (ok) signOut();
              }}
              className="hidden rounded-md px-2.5 py-1.5 text-sm text-ink-soft transition hover:bg-black/5 hover:text-ink sm:block"
            >
              Sign out
            </button>
            <Button variant="primary" onClick={openNew} className="px-4">
              <IconPlus /> <span className="hidden sm:inline">New quotation</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-brand uppercase">
              Sales workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Quotation workspace
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Create, revise, share and export client-ready exhibition quotations. Every change
              saves on this computer automatically.
            </p>
          </div>
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Search quotations</span>
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <TextInput
              placeholder="Search project, client or reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </label>
        </div>

        {hydrated && all.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-1.5" aria-label="Filter quotations">
            {(
              [
                ["all", "All", all.length],
                ["mine", "Owned by me", all.filter((f) => f.latest.author.email.toLowerCase() === email?.toLowerCase()).length],
                ["shared", "Shared", shared],
                ["needs-review", "Needs review", all.length - ready],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  filter === value
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink-soft hover:border-ink/25 hover:text-ink",
                )}
              >
                {label} <span className="ml-1 opacity-70 tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {!helpDismissed ? (
          <section className="relative mb-6 rounded-xl border border-line bg-white p-4 shadow-[0_4px_18px_rgba(29,29,27,0.035)] sm:p-5">
            <button
              type="button"
              onClick={() => setLocalFlag(HELP_KEY, true)}
              aria-label="Hide this"
              className="absolute top-2.5 right-2.5 rounded-md p-1.5 text-ink-soft hover:bg-black/5"
            >
              <IconClose />
            </button>
            <h2 className="text-sm font-semibold">How this works</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Fill in five short steps", "Project details, then your items and prices."],
                ["Watch the PDF build itself", "The A4 page redraws itself as you type."],
                ["Share or download", "Send a view-only or editable link, or save a polished PDF."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3 rounded-lg bg-paper/70 p-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand text-xs font-bold text-white shadow-sm">
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

        {!hydrated ? (
          <p className="py-16 text-center text-sm text-ink-soft">Loading…</p>
        ) : families.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white px-5 py-14 text-center shadow-[0_8px_30px_rgba(29,29,27,0.035)] sm:py-20">
            <Image
              src={COMPANY.mark}
              alt=""
              width={144}
              height={116}
              className="mx-auto mb-4 h-10 w-auto"
            />
            <h2 className="text-lg font-semibold tracking-tight">
              {all.length === 0
                ? "Nothing here yet"
                : filter !== "all"
                  ? "Nothing in this view"
                  : "Nothing matches that search"}
            </h2>
            <p className="mx-auto mt-1.5 mb-5 max-w-md text-sm leading-relaxed text-ink-soft">
              {all.length === 0
                ? "A new quotation starts with the usual Fairplatz categories — carpentry, electrical, AV, graphics — ready to fill in."
                : filter !== "all"
                  ? "Choose another filter or search for a different quotation."
                  : "Try a different project name, client or reference."}
            </p>
            {all.length === 0 ? (
              <Button variant="primary" onClick={openNew}>
                <IconPlus /> Make my first quotation
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_4px_20px_rgba(29,29,27,0.035)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_9rem_7rem_5.5rem] gap-4 border-b border-line bg-paper/70 px-4 py-2 text-xs font-semibold tracking-wide text-ink-soft uppercase lg:grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_9rem_7rem_5.5rem]">
              <span>Project</span>
              <span className="hidden xl:block">Client</span>
              <span className="text-right">Total</span>
              <span className="text-right">Updated</span>
              <span />
            </div>

            <ul className="divide-y divide-line">
              {families.map(({ familyId, latest, versions, issues }) => {
                const totals = computeTotals(latest);
                const isOpen = expanded === familyId;
                const sharedRecipients = [
                  ...new Set(latest.sharing.records.flatMap((record) => record.recipientEmails)),
                ];

                return (
                  <li key={familyId}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition hover:bg-paper/55 lg:grid-cols-[minmax(0,1fr)_9rem_7rem_5.5rem] lg:gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_9rem_7rem_5.5rem]">
                      <button
                        type="button"
                        onClick={() => router.push(`/quote/${latest.id}`)}
                        className="min-w-0 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-ink">
                            {latest.projectName || "Untitled project"}
                          </span>
                          <span className="rounded-sm bg-paper px-1.5 py-0.5 text-xs text-ink-soft tabular-nums">
                            {latest.ref}
                          </span>
                          {versions.length > 1 ? (
                            <span className="rounded-sm bg-ink px-1.5 py-0.5 text-xs font-bold text-white">
                              V{latest.version}
                            </span>
                          ) : null}
                          {issues > 0 ? (
                            <span className="rounded-md bg-brand-light px-2 py-1 text-xs font-semibold text-brand">
                              Needs review
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Ready
                            </span>
                          )}
                          {latest.sharing.mode === "snapshot" ? (
                            <span
                              title={
                                sharedRecipients.length > 0
                                  ? `Shared with ${sharedRecipients.join(", ")}`
                                  : "Shared by link"
                              }
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                            >
                              Shared{sharedRecipients.length > 0 ? ` · ${sharedRecipients.length}` : ""}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block truncate text-xs text-ink-soft xl:hidden">
                          {[
                            latest.clientCompany || latest.clientName,
                            `By ${latest.author.name}`,
                            latest.venue,
                            latest.eventDates,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No client details yet"}
                        </span>
                        <span className="mt-1 hidden truncate text-xs text-ink-soft xl:block">
                          {[`By ${latest.author.name}`, latest.venue, latest.eventDates].filter(Boolean).join(" · ") ||
                            "No venue yet"}
                        </span>
                        <span className="mt-1 block text-xs text-ink-soft lg:hidden">
                          {formatMoney(totals.grandTotal, latest.currency)} ·{" "}
                          {relativeTime(latest.updatedAt)}
                        </span>
                      </button>

                      <span className="hidden min-w-0 xl:block">
                        <span className="block truncate text-sm text-ink">
                          {latest.clientCompany || latest.clientName || "—"}
                        </span>
                        {latest.clientCompany && latest.clientName ? (
                          <span className="block truncate text-xs text-ink-soft">
                            {latest.clientName}
                          </span>
                        ) : null}
                      </span>

                      <span className="hidden text-right text-sm font-semibold tabular-nums lg:block">
                        {formatMoney(totals.grandTotal, latest.currency)}
                      </span>
                      <span className="hidden text-right text-xs text-ink-soft lg:block">
                        {relativeTime(latest.updatedAt)}
                      </span>

                      <span className="flex items-center justify-end gap-0.5">
                        {versions.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : familyId)}
                            className={cx(
                              "rounded-md px-1.5 py-1 text-xs font-medium transition",
                              isOpen
                                ? "bg-ink text-white"
                                : "text-ink-soft hover:bg-black/5 hover:text-ink",
                            )}
                            title="Show every version of this quotation"
                          >
                            {versions.length}v
                          </button>
                        ) : null}
                        <IconButton
                          label="Share with view or edit access"
                          onClick={() => setSharingQuote(latest)}
                        >
                          <IconShare />
                        </IconButton>
                        <IconButton
                          label="Make a copy for a different job"
                          onClick={() => {
                            const copy = duplicate(latest.id, sessionAuthor);
                            if (copy) router.push(`/quote/${copy.id}`);
                          }}
                        >
                          <IconCopy />
                        </IconButton>
                        <IconButton
                          label="Delete"
                          className="hover:bg-brand-light hover:text-brand"
                          onClick={async () => {
                            const ok = await askConfirm({
                              title: `Delete ${latest.ref}?`,
                              message:
                                versions.length > 1
                                  ? `This removes all ${versions.length} versions of this quotation. It cannot be undone.`
                                  : "This cannot be undone.",
                              details: [
                                latest.projectName || "Untitled project",
                                `${latest.categories.reduce((n, c) => n + c.items.length, 0)} line items`,
                              ],
                              confirmLabel: "Delete",
                              tone: "danger",
                            });
                            if (ok) versions.forEach((v) => remove(v.id));
                          }}
                        >
                          <IconTrash />
                        </IconButton>
                      </span>
                    </div>

                    {isOpen ? (
                      <ul className="border-t border-line bg-paper/60 px-4 py-2">
                        {versions.map((v) => {
                          const vTotals = computeTotals(v);
                          return (
                            <li key={v.id}>
                              <button
                                type="button"
                                onClick={() => router.push(`/quote/${v.id}`)}
                                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-white"
                              >
                                <span className="flex h-5 w-7 flex-none items-center justify-center rounded-sm bg-white text-xs font-bold text-ink-soft">
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
          </div>
        )}
      </main>

      {sharingQuote ? (
        <ShareDialog
          quote={sharingQuote}
          onClose={() => setSharingQuote(null)}
          onShared={(record) => recordShare(sharingQuote.id, record)}
        />
      ) : null}
    </div>
  );
}
