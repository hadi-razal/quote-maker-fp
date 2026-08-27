"use client";

import { SectionCard, Toggle } from "@/components/ui/controls";
import { useQuotations } from "@/lib/store";
import type { Quotation } from "@/lib/types";

export function OptionsTab({ quote }: { quote: Quotation }) {
  const update = useQuotations((s) => s.update);
  const set = (patch: Partial<Quotation>) => update(quote.id, patch);
  const photoCount = quote.categories.reduce(
    (n, c) => n + c.items.filter((i) => i.image).length,
    0,
  );

  return (
    <div className="space-y-4">
      <SectionCard
        title="What the client sees"
        description="Rates are often kept internal — the client gets a price per category instead."
      >
        <div className="space-y-2">
          <Toggle
            checked={quote.showItemRates}
            onChange={(v) => set({ showItemRates: v })}
            label="Show rates and amounts per line"
            description="Off: each line shows quantity and unit only, and the price appears on the category row — the way the Excel BOQ prints."
          />
          <Toggle
            checked={quote.showQty}
            onChange={(v) => set({ showQty: v })}
            label="Show the quantity column"
          />
          <Toggle
            checked={quote.showItemPhotos}
            onChange={(v) => set({ showItemPhotos: v })}
            label="Show line photos"
            description={
              photoCount > 0
                ? `${photoCount} line${photoCount === 1 ? " has" : "s have"} a photo. The photo column only appears when at least one line uses it — turn this off to send a plain list.`
                : "No line has a photo yet. Add one from the Photo button on any line in step 2, and the column appears by itself."
            }
          />
          <Toggle
            checked={quote.showSummaryPage}
            onChange={(v) => set({ showSummaryPage: v })}
            label="Include the summary page"
            description="Cover page with project details, the first visual and a category-by-category summary."
          />
          <Toggle
            checked={quote.showTermsPage}
            onChange={(v) => set({ showTermsPage: v })}
            label="Include terms & conditions"
          />
          <Toggle
            checked={quote.showSignatures}
            onChange={(v) => set({ showSignatures: v })}
            label="Include signature blocks"
            description="Contractor and customer sign-off at the end of the terms."
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Getting the PDF out"
        description="One button, then four settings in your browser's own window."
      >
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
          <li>
            Press <strong className="text-ink">Download PDF</strong> at the top of the screen.
          </li>
          <li>
            If anything required is still empty you get one last chance to go back and fill it in.
          </li>
          <li>
            A short panel then shows the exact steps for your device — Windows, Mac, iPhone or
            Android are all a little different.
          </li>
        </ol>
        <p className="mt-3 rounded-md bg-paper p-2.5 text-xs text-ink-soft">
          The PDF comes from the same page you see in the preview, so what you look at is what you
          send — with selectable text, not a screenshot. Want it on paper instead? Same window, just
          pick your printer.
        </p>
      </SectionCard>
    </div>
  );
}
