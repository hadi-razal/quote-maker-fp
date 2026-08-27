"use client";

import { useRef, useState } from "react";
import { Button, IconButton, Select, TextInput, Textarea, cx } from "@/components/ui/controls";
import {
  IconCopy,
  IconDown,
  IconLibrary,
  IconPlus,
  IconTrash,
  IconUp,
} from "@/components/ui/icons";
import { LibraryPicker } from "./LibraryPicker";
import { categoryTotal, formatMoney, itemCode, lineAmount } from "@/lib/calc";
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
  const set = (patch: Partial<LineItem>) => updateItem(quote.id, cat.id, item.id, patch);
  const amount = lineAmount(item);
  const itemised = cat.priceMode === "itemised";

  return (
    <div
      className={cx(
        "rounded-lg border p-2.5 transition",
        item.optional ? "border-brand/40 bg-brand-light/40" : "border-line bg-white",
      )}
    >
      <div className="flex gap-2">
        <span className="mt-1.5 w-9 flex-none text-center text-xs font-semibold text-ink-soft tabular-nums">
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

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 pl-0 sm:pl-11">
        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-soft">Qty</span>
          <TextInput
            type="number"
            min={0}
            step="any"
            value={item.qty ?? ""}
            invalid={item.qty === null || item.qty <= 0}
            onChange={(e) => set({ qty: numberOrNull(e.target.value) })}
            className="w-20 text-right tabular-nums"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-ink-soft">Unit</span>
          <TextInput
            list="fp-units"
            placeholder="sqm"
            value={item.unit}
            invalid={item.unit.trim() === ""}
            onChange={(e) => set({ unit: e.target.value })}
            className="w-20"
          />
        </div>

        {itemised ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-ink-soft">Rate</span>
            <TextInput
              type="number"
              min={0}
              step="any"
              value={item.rate ?? ""}
              invalid={item.rate === null}
              onChange={(e) => set({ rate: numberOrNull(e.target.value) })}
              className="w-28 text-right tabular-nums"
            />
          </div>
        ) : null}

        {itemised ? (
          <span
            className={cx(
              "rounded-md bg-paper px-2 py-1.5 text-sm font-semibold tabular-nums",
              item.optional ? "text-ink-soft line-through" : "text-ink",
            )}
          >
            {formatMoney(amount, quote.currency, false)}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-0.5">
          {showNote ? null : (
            <button
              type="button"
              onClick={() => {
                setShowNote(true);
                requestAnimationFrame(() => noteRef.current?.focus());
              }}
              className="rounded px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-black/5 hover:text-ink"
              title="Add a small note under this line"
            >
              + Note
            </button>
          )}
          <button
            type="button"
            onClick={() => set({ optional: !item.optional })}
            className={cx(
              "rounded px-2 py-1 text-xs font-medium transition",
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
      </div>

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
    <section className="rounded-xl border border-line bg-paper/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <header className="flex flex-wrap items-center gap-2 rounded-t-xl border-b border-line bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-ink text-xs font-bold text-white"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {index + 1}
        </button>
        <TextInput
          value={cat.title}
          invalid={cat.title.trim() === ""}
          placeholder="Category name (e.g. Carpentry)"
          onChange={(e) => updateCategory(quote.id, cat.id, { title: e.target.value })}
          className="min-w-[9rem] flex-1 basis-full font-semibold sm:basis-auto"
        />

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
            className="w-32 flex-none text-right tabular-nums"
          />
        ) : (
          <span className="rounded-md bg-ink px-2.5 py-1.5 text-sm font-semibold text-white tabular-nums">
            {formatMoney(total, quote.currency, false)}
          </span>
        )}

        <div className="flex items-center gap-0.5">
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
            onClick={() => {
              if (confirm(`Delete "${cat.title || "this category"}" and all of its lines?`))
                removeCategory(quote.id, cat.id);
            }}
          >
            <IconTrash />
          </IconButton>
        </div>
      </header>

      {collapsed ? (
        <p className="px-3 py-2 text-xs text-ink-soft">
          {cat.items.length} line{cat.items.length === 1 ? "" : "s"} · hidden
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
            <p className="rounded-lg border border-dashed border-line py-6 text-center text-sm text-ink-soft">
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

  const used = new Set(quote.categories.map((c) => c.title.trim().toLowerCase()));
  const suggestions = DEFAULT_CATEGORY_TITLES.filter((t) => !used.has(t.toLowerCase()));

  return (
    <div className="space-y-3">
      <datalist id="fp-units">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {quote.categories.map((cat, i) => (
        <CategoryCard
          key={cat.id}
          quote={quote}
          cat={cat}
          index={i}
          count={quote.categories.length}
        />
      ))}

      <div className="rounded-xl border border-dashed border-line bg-white p-3">
        <div className="flex gap-2">
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
                className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-ink-soft transition hover:border-brand hover:text-brand"
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
