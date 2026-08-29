"use client";

import { useRef, useState } from "react";
import { Button, IconButton, Select, TextInput, Textarea, cx } from "@/components/ui/controls";
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDown,
  IconImage,
  IconLibrary,
  IconPlus,
  IconTrash,
  IconUp,
} from "@/components/ui/icons";
import { askConfirm } from "@/components/ui/confirm";
import { LibraryPicker } from "./LibraryPicker";
import { categoryTotal, computeTotals, formatMoney, itemCode, lineAmount } from "@/lib/calc";
import { approxSize, fileToDataUrl } from "@/lib/image";
import { DEFAULT_CATEGORY_TITLES, UNITS } from "@/lib/presets";
import { useQuotations } from "@/lib/store";
import type { Category, LineItem, Quotation } from "@/lib/types";

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ItemRow({
  quote,
  cat,
  item,
  code,
  index,
  count,
}: {
  quote: Quotation;
  cat: Category;
  item: LineItem;
  code: string;
  index: number;
  count: number;
}) {
  const { updateItem, removeItem, moveItem, addItem } = useQuotations();
  const [showNote, setShowNote] = useState(Boolean(item.note?.trim()));
  const noteRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const set = (patch: Partial<LineItem>) => updateItem(quote.id, cat.id, item.id, patch);

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("That file is not an image.");
      return;
    }
    try {
      // Line photos print about 26mm wide, so they are stored small — dozens of
      // them still have to fit in the browser's storage alongside everything else.
      const dataUrl = await fileToDataUrl(file, 640, 0.72);
      set({ image: { dataUrl, name: file.name } });
    } catch {
      setPhotoError("Could not read that image.");
    }
  };
  const amount = lineAmount(item);
  const itemised = cat.priceMode === "itemised";

  return (
    <div
      className={cx(
        "rounded-lg border p-3 transition",
        item.optional ? "border-brand/40 bg-brand-light/40" : "border-line bg-white",
      )}
    >
      <div className="flex gap-2">
        <span className="mt-1.5 flex h-7 w-10 flex-none items-center justify-center rounded-md bg-paper text-xs font-semibold text-ink-soft tabular-nums">
          {code}
        </span>
        <Textarea
          autoGrow
          rows={1}
          placeholder="Describe the scope of work…"
          value={item.description}
          invalid={item.description.trim() === ""}
          onChange={(e) => set({ description: e.target.value })}
          className="text-sm"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 pl-0 sm:grid-cols-4 sm:pl-12">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
            Qty
          </span>
          <TextInput
            type="number"
            min={0}
            step="any"
            value={item.qty ?? ""}
            invalid={item.qty === null || item.qty <= 0}
            onChange={(e) => set({ qty: numberOrNull(e.target.value) })}
            className="text-right tabular-nums"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
            Unit
          </span>
          <TextInput
            list="fp-units"
            placeholder="sqm"
            value={item.unit}
            invalid={item.unit.trim() === ""}
            onChange={(e) => set({ unit: e.target.value })}
          />
        </label>

        {itemised ? (
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
              Rate
            </span>
            <TextInput
              type="number"
              min={0}
              step="any"
              value={item.rate ?? ""}
              invalid={item.rate === null}
              onChange={(e) => set({ rate: numberOrNull(e.target.value) })}
              className="text-right tabular-nums"
            />
          </label>
        ) : null}

        {itemised ? (
          <div
            className={cx(
              "flex min-h-10 flex-col justify-center rounded-lg bg-paper px-3 py-1.5 text-right",
              item.optional ? "text-ink-soft line-through" : "text-ink",
            )}
          >
            <span className="text-[10px] font-semibold tracking-wide text-ink-soft uppercase">
              Amount
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatMoney(amount, quote.currency, false)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-end gap-0.5 border-t border-line/70 pt-2 sm:ml-12">
          {showNote ? null : (
            <button
              type="button"
              onClick={() => {
                setShowNote(true);
                requestAnimationFrame(() => noteRef.current?.focus());
              }}
              className="rounded-sm px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
              title="Add a small note under this line"
            >
              + Note
            </button>
          )}
          {item.image ? null : (
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
              title="Add a photo for this line — it prints in its own column"
            >
              <IconImage className="h-3.5 w-3.5" /> Photo
            </button>
          )}
          <button
            type="button"
            aria-pressed={Boolean(item.optional)}
            onClick={() => set({ optional: !item.optional })}
            className={cx(
              "rounded-sm px-2 py-1 text-xs font-medium transition",
              item.optional
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-black/5 hover:text-ink",
            )}
            title="Optional items print with a tag and stay out of the totals"
          >
            Optional
          </button>
          <IconButton
            label="Move up"
            disabled={index === 0}
            onClick={() => moveItem(quote.id, cat.id, item.id, -1)}
          >
            <IconUp />
          </IconButton>
          <IconButton
            label="Move down"
            disabled={index === count - 1}
            onClick={() => moveItem(quote.id, cat.id, item.id, 1)}
          >
            <IconDown />
          </IconButton>
          <IconButton
            label="Duplicate"
            onClick={() =>
              addItem(quote.id, cat.id, {
                description: item.description,
                qty: item.qty,
                unit: item.unit,
                rate: item.rate,
                note: item.note,
                image: item.image,
                optional: item.optional,
              })
            }
          >
            <IconCopy />
          </IconButton>
          <IconButton
            label="Delete line"
            className="hover:bg-brand-light hover:text-brand"
            onClick={() => removeItem(quote.id, cat.id, item.id)}
          >
            <IconTrash />
          </IconButton>
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void choosePhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {item.image ? (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-line bg-paper/60 p-2 pl-0 sm:ml-11">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image.dataUrl}
            alt=""
            className="h-12 w-16 flex-none rounded-sm border border-line bg-white object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink">
              {item.image.name || "Line photo"}
            </p>
            <p className="text-xs text-ink-soft">
              {approxSize(item.image.dataUrl)} · prints beside this line
            </p>
          </div>
          <Button onClick={() => photoRef.current?.click()} className="px-2 py-1 text-xs">
            Replace
          </Button>
          <IconButton
            label="Remove photo"
            className="hover:bg-brand-light hover:text-brand"
            onClick={() => set({ image: undefined })}
          >
            <IconTrash />
          </IconButton>
        </div>
      ) : null}

      {photoError ? <p className="mt-1.5 text-xs text-brand sm:ml-11">{photoError}</p> : null}

      {showNote ? (
        <div className="mt-2 pl-0 sm:pl-11">
          <TextInput
            ref={noteRef}
            placeholder="Small note printed under this line, e.g. “colour to be confirmed”"
            value={item.note ?? ""}
            onChange={(e) => set({ note: e.target.value })}
            onBlur={() => {
              if (!item.note?.trim()) setShowNote(false);
            }}
            className="text-xs"
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryCard({
  quote,
  cat,
  index,
  count,
}: {
  quote: Quotation;
  cat: Category;
  index: number;
  count: number;
}) {
  const { updateCategory, removeCategory, moveCategory, addItem, addItems } = useQuotations();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const total = categoryTotal(cat);

  return (
    <section className="rounded-xl border border-line bg-paper/60 shadow-[0_4px_18px_rgba(29,29,27,0.035)]">
      <header className="rounded-t-xl border-b border-line bg-white p-3">
        <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${cat.title || "category"}` : `Collapse ${cat.title || "category"}`}
          className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-paper hover:text-ink"
        >
          {collapsed ? <IconChevronRight /> : <IconChevronDown />}
        </button>
          <TextInput
            value={cat.title}
            invalid={cat.title.trim() === ""}
            placeholder="Category name (e.g. Carpentry)"
            onChange={(e) => updateCategory(quote.id, cat.id, { title: e.target.value })}
            className="min-w-0 flex-1 font-semibold"
          />

          <span className="mt-1 flex h-8 min-w-8 flex-none items-center justify-center rounded-lg bg-ink px-2 text-xs font-bold text-white">
            {index + 1}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
          <Select
            value={cat.priceMode}
            onChange={(e) =>
              updateCategory(quote.id, cat.id, {
                priceMode: e.target.value as Category["priceMode"],
              })
            }
            className="w-32 flex-none text-xs"
            title="Itemised: total is the sum of the lines. Lump sum: one agreed price."
          >
            <option value="itemised">Itemised</option>
            <option value="lump">Lump sum</option>
          </Select>

          {cat.priceMode === "lump" ? (
            <TextInput
              type="number"
              min={0}
              step="any"
              placeholder="Category price"
              value={cat.lumpSum ?? ""}
              invalid={cat.lumpSum === null}
              onChange={(e) =>
                updateCategory(quote.id, cat.id, { lumpSum: numberOrNull(e.target.value) })
              }
              className="w-36 flex-none text-right tabular-nums"
            />
          ) : (
            <span className="rounded-lg bg-brand-light px-3 py-2 text-sm font-semibold text-brand tabular-nums">
              {formatMoney(total, quote.currency, false)}
            </span>
          )}

          <span className="text-xs text-ink-soft">
            {cat.items.length} line{cat.items.length === 1 ? "" : "s"}
          </span>

          <div className="ml-auto flex items-center gap-0.5">
          <IconButton
            label="Move category up"
            disabled={index === 0}
            onClick={() => moveCategory(quote.id, cat.id, -1)}
          >
            <IconUp />
          </IconButton>
          <IconButton
            label="Move category down"
            disabled={index === count - 1}
            onClick={() => moveCategory(quote.id, cat.id, 1)}
          >
            <IconDown />
          </IconButton>
          <IconButton
            label="Delete category"
            className="hover:bg-brand-light hover:text-brand"
            onClick={async () => {
              const ok = await askConfirm({
                title: `Delete "${cat.title || "this category"}"?`,
                message:
                  "The category and every line inside it are removed. This cannot be undone.",
                details:
                  cat.items.length > 0
                    ? [
                        `${cat.items.length} line${cat.items.length === 1 ? "" : "s"} will go with it`,
                      ]
                    : undefined,
                confirmLabel: "Delete category",
                tone: "danger",
              });
              if (ok) removeCategory(quote.id, cat.id);
            }}
          >
            <IconTrash />
          </IconButton>
          </div>
        </div>
      </header>

      {collapsed ? (
        <p className="px-4 py-3 text-xs text-ink-soft">
          Lines hidden · {formatMoney(total, quote.currency)}
        </p>
      ) : (
        <div className="space-y-2 p-3">
          {cat.items.map((item, i) => (
            <ItemRow
              key={item.id}
              quote={quote}
              cat={cat}
              item={item}
              index={i}
              count={cat.items.length}
              code={itemCode(index, i)}
            />
          ))}

          {cat.items.length === 0 ? (
            <p className="rounded-md border border-dashed border-line py-6 text-center text-sm text-ink-soft">
              No lines yet.
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button onClick={() => addItem(quote.id, cat.id)}>
              <IconPlus /> Add line
            </Button>
            <Button onClick={() => setPickerOpen(true)}>
              <IconLibrary /> From library
            </Button>
          </div>
        </div>
      )}

      {pickerOpen ? (
        <LibraryPicker
          categoryTitle={cat.title}
          onClose={() => setPickerOpen(false)}
          onAdd={(items) =>
            addItems(
              quote.id,
              cat.id,
              items.map((i) => ({ description: i.description, unit: i.unit, qty: i.qty ?? null })),
            )
          }
        />
      ) : null}
    </section>
  );
}

export function BoqTab({ quote }: { quote: Quotation }) {
  const addCategory = useQuotations((s) => s.addCategory);
  const [newTitle, setNewTitle] = useState("");
  const totals = computeTotals(quote);
  const lineCount = quote.categories.reduce((count, category) => count + category.items.length, 0);
  const optionalCount = quote.categories.reduce(
    (count, category) => count + category.items.filter((item) => item.optional).length,
    0,
  );

  const used = new Set(quote.categories.map((c) => c.title.trim().toLowerCase()));
  const suggestions = DEFAULT_CATEGORY_TITLES.filter((t) => !used.has(t.toLowerCase()));

  return (
    <div className="space-y-3">
      <datalist id="fp-units">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <section className="overflow-hidden rounded-xl bg-ink text-white shadow-sm">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/55 uppercase">
              Bill of quantities
            </p>
            <p className="mt-1 text-xs text-white/60">Everything included in this quotation.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-wide text-white/50 uppercase">Grand total</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">
              {formatMoney(totals.grandTotal, quote.currency)}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-white/10 py-3 text-center">
          {[
            ["Categories", quote.categories.length],
            ["Line items", lineCount],
            ["Optional", optionalCount],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] tracking-wide text-white/50 uppercase">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {quote.categories.map((cat, i) => (
        <CategoryCard
          key={cat.id}
          quote={quote}
          cat={cat}
          index={i}
          count={quote.categories.length}
        />
      ))}

      <div className="rounded-xl border border-dashed border-line bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            placeholder="New category name…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                addCategory(quote.id, newTitle.trim());
                setNewTitle("");
              }
            }}
          />
          <Button
            variant="primary"
            disabled={!newTitle.trim()}
            onClick={() => {
              addCategory(quote.id, newTitle.trim());
              setNewTitle("");
            }}
          >
            <IconPlus /> Add category
          </Button>
        </div>

        {suggestions.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-soft">Quick add:</span>
            {suggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addCategory(quote.id, t)}
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand"
              >
                + {t}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
