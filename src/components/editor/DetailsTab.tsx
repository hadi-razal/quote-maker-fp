"use client";

import { Field, SectionCard, Select, TextInput } from "@/components/ui/controls";
import { CURRENCIES } from "@/lib/presets";
import { useQuotations } from "@/lib/store";
import type { CurrencyCode, DiscountType, Quotation } from "@/lib/types";
import { computeTotals, formatMoney } from "@/lib/calc";

export function DetailsTab({ quote }: { quote: Quotation }) {
  const update = useQuotations((s) => s.update);
  const set = <K extends keyof Quotation>(key: K, value: Quotation[K]) =>
    update(quote.id, { [key]: value } as Partial<Quotation>);
  const totals = computeTotals(quote);
  const missing = (value: string) => value.trim() === "";

  return (
    <div className="space-y-4">
      {quote.version > 1 ? (
        <SectionCard
          title={`What changed in version ${quote.version}?`}
          description="A short reminder for you and the team. It is not printed on the quotation."
        >
          <TextInput
            value={quote.versionNote}
            placeholder="e.g. Client removed the mezzanine and asked for a smaller meeting room"
            onChange={(e) => set("versionNote", e.target.value)}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Project details"
        description="These print in the box at the top of page one. Fields marked * are required."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quotation ref" required>
            <TextInput
              value={quote.ref}
              invalid={missing(quote.ref)}
              onChange={(e) => set("ref", e.target.value)}
            />
          </Field>
          <Field label="Quotation date" required>
            <TextInput
              type="date"
              value={quote.quoteDate}
              invalid={missing(quote.quoteDate)}
              onChange={(e) => set("quoteDate", e.target.value)}
            />
          </Field>
          <Field label="Project name" required className="sm:col-span-2">
            <TextInput
              value={quote.projectName}
              invalid={missing(quote.projectName)}
              placeholder="GD OTS @ IDEX 2027"
              onChange={(e) => set("projectName", e.target.value)}
            />
          </Field>
          <Field label="Client company">
            <TextInput
              value={quote.clientCompany}
              placeholder="General Dynamics OTS"
              onChange={(e) => set("clientCompany", e.target.value)}
            />
          </Field>
          <Field label="Attention / contact" required>
            <TextInput
              value={quote.clientName}
              invalid={missing(quote.clientName)}
              placeholder="Shamnad Shareef"
              onChange={(e) => set("clientName", e.target.value)}
            />
          </Field>
          <Field label="Location" required>
            <TextInput
              value={quote.location}
              invalid={missing(quote.location)}
              placeholder="Abu Dhabi, UAE"
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
          <Field label="Venue" required>
            <TextInput
              value={quote.venue}
              invalid={missing(quote.venue)}
              placeholder="ADNEC Centre"
              onChange={(e) => set("venue", e.target.value)}
            />
          </Field>
          <Field label="Event dates" required className="sm:col-span-2">
            <TextInput
              value={quote.eventDates}
              invalid={missing(quote.eventDates)}
              placeholder="25 – 29 January 2027"
              onChange={(e) => set("eventDates", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Prepared by" description="Who the client should reply to.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" required>
            <TextInput
              value={quote.preparedBy}
              invalid={missing(quote.preparedBy)}
              onChange={(e) => set("preparedBy", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={quote.preparedByEmail}
              onChange={(e) => set("preparedByEmail", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={quote.preparedByPhone}
              onChange={(e) => set("preparedByPhone", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Commercials"
        description="Currency, tax and any discount on the subtotal."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Currency" required>
            <Select
              value={quote.currency}
              onChange={(e) => set("currency", e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Validity (days)">
            <TextInput
              type="number"
              min={0}
              value={quote.validityDays ?? ""}
              onChange={(e) =>
                set("validityDays", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Tax label">
            <TextInput
              value={quote.vatLabel}
              placeholder="VAT"
              onChange={(e) => set("vatLabel", e.target.value)}
            />
          </Field>
          <Field label="Tax rate %" required>
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={quote.vatRate ?? ""}
              onChange={(e) => set("vatRate", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </Field>
          <Field label="Discount">
            <Select
              value={quote.discountType}
              onChange={(e) => set("discountType", e.target.value as DiscountType)}
            >
              <option value="none">No discount</option>
              <option value="percent">Percentage of subtotal</option>
              <option value="amount">Fixed amount</option>
            </Select>
          </Field>
          <Field label={quote.discountType === "percent" ? "Discount %" : "Discount amount"}>
            <TextInput
              type="number"
              min={0}
              step="0.01"
              disabled={quote.discountType === "none"}
              value={quote.discountValue ?? ""}
              onChange={(e) =>
                set("discountValue", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-paper p-3 text-sm sm:grid-cols-4">
          {[
            ["Subtotal", totals.subtotal],
            ["Discount", totals.discount === 0 ? 0 : -totals.discount],
            [`${quote.vatLabel || "VAT"} ${quote.vatRate}%`, totals.vat],
            ["Grand total", totals.grandTotal],
          ].map(([label, value], i) => (
            <div key={label as string}>
              <dt className="text-xs text-ink-soft">{label}</dt>
              <dd
                className={
                  i === 3 ? "font-semibold text-brand tabular-nums" : "text-ink tabular-nums"
                }
              >
                {formatMoney(value as number, quote.currency, false)}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  );
}
