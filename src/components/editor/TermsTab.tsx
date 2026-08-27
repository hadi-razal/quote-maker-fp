"use client";

import { askConfirm } from "@/components/ui/confirm";
import { Button, SectionCard, Textarea } from "@/components/ui/controls";
import { DEFAULT_TERMS } from "@/lib/presets";
import { useQuotations } from "@/lib/store";
import type { Quotation } from "@/lib/types";

export function TermsTab({ quote }: { quote: Quotation }) {
  const update = useQuotations((s) => s.update);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Notes"
        description="Printed under the totals — exclusions, assumptions, anything the client should read first."
      >
        <Textarea
          rows={4}
          placeholder="e.g. Prices exclude organiser rigging approval fees."
          value={quote.notes}
          onChange={(e) => update(quote.id, { notes: e.target.value })}
        />
      </SectionCard>

      <SectionCard
        title="Terms & conditions"
        description="A line starting with a number and a dash (e.g. “3 - PAYMENT”) prints as a heading. Blank lines separate blocks."
        action={
          <Button
            onClick={async () => {
              const ok = await askConfirm({
                title: "Restore the standard terms?",
                message:
                  "Anything you have written or changed here is replaced by the Fairplatz standard text.",
                confirmLabel: "Restore",
              });
              if (ok) update(quote.id, { terms: DEFAULT_TERMS });
            }}
          >
            Reset to standard
          </Button>
        }
      >
        <Textarea
          rows={26}
          value={quote.terms}
          onChange={(e) => update(quote.id, { terms: e.target.value })}
          className="font-mono text-xs leading-relaxed"
        />
      </SectionCard>
    </div>
  );
}
