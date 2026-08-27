"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, LineItem, Quotation, QuotationImage } from "./types";
import { DEFAULT_CATEGORY_TITLES, DEFAULT_TERMS } from "./presets";

/** A quotation can be revised up to this many times before you start a new one. */
export const MAX_VERSIONS = 10;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextRef(existing: Quotation[]): string {
  const year = new Date().getFullYear();
  const prefix = `FP-${year}-`;
  const highest = existing
    .map((q) => q.ref)
    .filter((r) => r.startsWith(prefix))
    .map((r) => parseInt(r.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export function emptyItem(partial: Partial<LineItem> = {}): LineItem {
  return {
    id: uid(),
    description: "",
    qty: null,
    unit: "",
    rate: null,
    optional: false,
    ...partial,
  };
}

export function emptyCategory(title = "", withItem = true): Category {
  return {
    id: uid(),
    title,
    priceMode: "itemised",
    lumpSum: null,
    items: withItem ? [emptyItem()] : [],
  };
}

export function newQuotation(ref: string, starter: boolean): Quotation {
  const now = new Date().toISOString();
  return {
    id: uid(),
    familyId: uid(),
    version: 1,
    versionNote: "",
    ref,
    createdAt: now,
    updatedAt: now,
    projectName: "",
    clientName: "",
    clientCompany: "",
    location: "",
    venue: "",
    eventDates: "",
    quoteDate: today(),
    validityDays: 30,
    preparedBy: "",
    preparedByEmail: "",
    preparedByPhone: "",
    currency: "AED",
    vatRate: 5,
    vatLabel: "VAT",
    discountType: "none",
    discountValue: null,
    images: [],
    categories: starter
      ? DEFAULT_CATEGORY_TITLES.slice(0, 4).map((t) => emptyCategory(t, true))
      : [emptyCategory("", true)],
    terms: DEFAULT_TERMS,
    notes: "",
    showSummaryPage: true,
    showItemRates: false,
    showQty: true,
    showTermsPage: true,
    showSignatures: true,
  };
}

interface QuotationState {
  quotations: Quotation[];
  create: (starter?: boolean) => Quotation;
  duplicate: (id: string) => Quotation | undefined;
  remove: (id: string) => void;
  get: (id: string) => Quotation | undefined;
  /** Every version of one quotation, oldest first. */
  versionsOf: (familyId: string) => Quotation[];
  /** Clones a quotation as the next version in its family. Capped at MAX_VERSIONS. */
  createVersion: (id: string) => Quotation | undefined;

  update: (id: string, patch: Partial<Quotation>) => void;

  addCategory: (id: string, title?: string) => void;
  updateCategory: (id: string, catId: string, patch: Partial<Category>) => void;
  removeCategory: (id: string, catId: string) => void;
  moveCategory: (id: string, catId: string, dir: -1 | 1) => void;

  addItem: (id: string, catId: string, partial?: Partial<LineItem>) => void;
  addItems: (id: string, catId: string, items: Array<Partial<LineItem>>) => void;
  updateItem: (id: string, catId: string, itemId: string, patch: Partial<LineItem>) => void;
  removeItem: (id: string, catId: string, itemId: string) => void;
  moveItem: (id: string, catId: string, itemId: string, dir: -1 | 1) => void;

  addImage: (id: string, image: QuotationImage) => void;
  updateImage: (id: string, index: number, patch: Partial<QuotationImage>) => void;
  removeImage: (id: string, index: number) => void;
  moveImage: (id: string, index: number, dir: -1 | 1) => void;
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const useQuotations = create<QuotationState>()(
  persist(
    (set, get) => {
      /** Every mutation funnels through here so updatedAt always stays honest. */
      const patchQuote = (id: string, fn: (q: Quotation) => Quotation) =>
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id ? { ...fn(q), updatedAt: new Date().toISOString() } : q,
          ),
        }));

      const patchCategory = (id: string, catId: string, fn: (c: Category) => Category) =>
        patchQuote(id, (q) => ({
          ...q,
          categories: q.categories.map((c) => (c.id === catId ? fn(c) : c)),
        }));

      return {
        quotations: [],

        get: (id) => get().quotations.find((q) => q.id === id),

        versionsOf: (familyId) =>
          get()
            .quotations.filter((q) => q.familyId === familyId)
            .sort((a, b) => a.version - b.version),

        createVersion: (id) => {
          const source = get().quotations.find((q) => q.id === id);
          if (!source) return undefined;
          const family = get().quotations.filter((q) => q.familyId === source.familyId);
          if (family.length >= MAX_VERSIONS) return undefined;
          const nextVersion = family.reduce((max, q) => Math.max(max, q.version), 0) + 1;
          const now = new Date().toISOString();
          const copy: Quotation = {
            ...structuredClone(source),
            id: uid(),
            version: nextVersion,
            versionNote: "",
            quoteDate: today(),
            createdAt: now,
            updatedAt: now,
          };
          copy.categories = copy.categories.map((c) => ({
            ...c,
            id: uid(),
            items: c.items.map((i) => ({ ...i, id: uid() })),
          }));
          set((state) => ({ quotations: [copy, ...state.quotations] }));
          return copy;
        },

        create: (starter = true) => {
          const quote = newQuotation(nextRef(get().quotations), starter);
          set((state) => ({ quotations: [quote, ...state.quotations] }));
          return quote;
        },

        duplicate: (id) => {
          const source = get().quotations.find((q) => q.id === id);
          if (!source) return undefined;
          const now = new Date().toISOString();
          const copy: Quotation = {
            ...structuredClone(source),
            id: uid(),
            familyId: uid(),
            version: 1,
            versionNote: "",
            ref: nextRef(get().quotations),
            projectName: source.projectName ? `${source.projectName} (copy)` : "",
            quoteDate: today(),
            createdAt: now,
            updatedAt: now,
          };
          copy.categories = copy.categories.map((c) => ({
            ...c,
            id: uid(),
            items: c.items.map((i) => ({ ...i, id: uid() })),
          }));
          set((state) => ({ quotations: [copy, ...state.quotations] }));
          return copy;
        },

        remove: (id) =>
          set((state) => ({ quotations: state.quotations.filter((q) => q.id !== id) })),

        update: (id, patch) => patchQuote(id, (q) => ({ ...q, ...patch })),

        addCategory: (id, title = "") =>
          patchQuote(id, (q) => ({ ...q, categories: [...q.categories, emptyCategory(title)] })),

        updateCategory: (id, catId, patch) => patchCategory(id, catId, (c) => ({ ...c, ...patch })),

        removeCategory: (id, catId) =>
          patchQuote(id, (q) => ({ ...q, categories: q.categories.filter((c) => c.id !== catId) })),

        moveCategory: (id, catId, dir) =>
          patchQuote(id, (q) => ({
            ...q,
            categories: move(
              q.categories,
              q.categories.findIndex((c) => c.id === catId),
              dir,
            ),
          })),

        addItem: (id, catId, partial = {}) =>
          patchCategory(id, catId, (c) => ({ ...c, items: [...c.items, emptyItem(partial)] })),

        addItems: (id, catId, items) =>
          patchCategory(id, catId, (c) => ({
            ...c,
            items: [...c.items, ...items.map((i) => emptyItem(i))],
          })),

        updateItem: (id, catId, itemId, patch) =>
          patchCategory(id, catId, (c) => ({
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
          })),

        removeItem: (id, catId, itemId) =>
          patchCategory(id, catId, (c) => ({
            ...c,
            items: c.items.filter((i) => i.id !== itemId),
          })),

        moveItem: (id, catId, itemId, dir) =>
          patchCategory(id, catId, (c) => ({
            ...c,
            items: move(
              c.items,
              c.items.findIndex((i) => i.id === itemId),
              dir,
            ),
          })),

        addImage: (id, image) => patchQuote(id, (q) => ({ ...q, images: [...q.images, image] })),

        updateImage: (id, index, patch) =>
          patchQuote(id, (q) => ({
            ...q,
            images: q.images.map((im, i) => (i === index ? { ...im, ...patch } : im)),
          })),

        removeImage: (id, index) =>
          patchQuote(id, (q) => ({ ...q, images: q.images.filter((_, i) => i !== index) })),

        moveImage: (id, index, dir) =>
          patchQuote(id, (q) => ({ ...q, images: move(q.images, index, dir) })),
      };
    },
    {
      name: "fairplatz-quotations",
      version: 2,
      migrate: (persisted, from) => {
        const state = persisted as { quotations?: Quotation[] };
        if (from < 2) {
          state.quotations = (state.quotations ?? []).map((q) => ({
            ...q,
            familyId: q.familyId ?? q.id,
            version: q.version ?? 1,
            versionNote: q.versionNote ?? "",
          }));
        }
        return state as QuotationState;
      },
    },
  ),
);

/**
 * True once the persisted quotations have been read back out of localStorage.
 * Rendering the list before that would flash "no quotations yet" on every load.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (listener) => useQuotations.persist.onFinishHydration(listener),
    () => useQuotations.persist.hasHydrated(),
    () => false,
  );
}
