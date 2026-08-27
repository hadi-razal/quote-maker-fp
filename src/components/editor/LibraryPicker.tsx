"use client";

import { useMemo, useState } from "react";
import { Button, TextInput, cx } from "@/components/ui/controls";
import { IconClose } from "@/components/ui/icons";
import { ITEM_LIBRARY, type LibraryItem } from "@/lib/presets";

/** Finds the library bucket whose name is closest to the category title. */
function bucketFor(title: string): string | null {
  const t = title.trim().toLowerCase();
  if (!t) return null;
  const keys = Object.keys(ITEM_LIBRARY);
  return (
    keys.find((k) => k.toLowerCase() === t) ??
    keys.find((k) => t.includes(k.toLowerCase().split(" ")[0])) ??
    null
  );
}

export function LibraryPicker({
  categoryTitle,
  onClose,
  onAdd,
}: {
  categoryTitle: string;
  onClose: () => void;
  onAdd: (items: LibraryItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>(() => bucketFor(categoryTitle) ?? "all");
  const [picked, setPicked] = useState<Record<string, LibraryItem>>({});

  const results = useMemo(() => {
    const entries = Object.entries(ITEM_LIBRARY).filter(([k]) => group === "all" || k === group);
    const q = query.trim().toLowerCase();
    return entries
      .map(
        ([key, items]) =>
          [key, items.filter((i) => !q || i.description.toLowerCase().includes(q))] as const,
      )
      .filter(([, items]) => items.length > 0);
  }, [group, query]);

  const count = Object.keys(picked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Add from scope library</h2>
            <p className="text-xs text-ink-soft">
              Standard lines from past Fairplatz BOQs — pick, then set quantities and rates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-soft hover:bg-black/5"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </header>

        <div className="flex gap-2 border-b border-line px-4 py-2">
          <TextInput
            autoFocus
            placeholder="Search scope lines…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="rounded-md border border-line bg-white px-2 text-sm"
          >
            <option value="all">All groups</option>
            {Object.keys(ITEM_LIBRARY).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="scroll-slim flex-1 overflow-auto px-4 py-3">
          {results.map(([key, items]) => (
            <div key={key} className="mb-4">
              <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">
                {key}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => {
                  const id = `${key}::${item.description}`;
                  const on = Boolean(picked[id]);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() =>
                          setPicked((p) => {
                            const next = { ...p };
                            if (on) delete next[id];
                            else next[id] = item;
                            return next;
                          })
                        }
                        className={cx(
                          "flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left text-sm transition",
                          on
                            ? "border-brand bg-brand-light"
                            : "border-line bg-white hover:border-ink/20",
                        )}
                      >
                        <span
                          className={cx(
                            "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-sm border text-white",
                            on ? "border-brand bg-brand" : "border-line",
                          )}
                        >
                          {on ? (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                            >
                              <path d="M3 8.5 6.5 12 13 4.5" />
                            </svg>
                          ) : null}
                        </span>
                        <span className="flex-1">{item.description}</span>
                        <span className="flex-none rounded-sm bg-black/5 px-1.5 py-0.5 text-xs text-ink-soft">
                          {item.unit}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No matching scope lines.</p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-xs text-ink-soft">{count} selected</span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={count === 0}
              onClick={() => {
                onAdd(Object.values(picked));
                onClose();
              }}
            >
              Add {count > 0 ? count : ""} item{count === 1 ? "" : "s"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
