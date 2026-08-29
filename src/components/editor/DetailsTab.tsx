"use client";

import { Field, SectionCard, Select, TextInput } from "@/components/ui/controls";
import { computeTotals, formatMoney } from "@/lib/calc";
import { CURRENCIES } from "@/lib/presets";
import { useQuotations } from "@/lib/store";
import type { CurrencyCode, DiscountType, Quotation } from "@/lib/types";

export function DetailsTab({ quote }: { quote: Quotation }) {
  const update = useQuotations((s) => s.update);
  const set = <K extends keyof Quotation>(key: K, value: Quotation[K]) =>
    update(quote.id, { [key]: value } as Partial<Quotation>);
  const totals = computeTotals(quote);
  const missing = (value: string) => value.trim() === "";

  return (
    <div className="space-y-4 pb-2">
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
        title="Quotation overview"
        description="Give the quote a clear project name, reference and issue date."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project name" required className="sm:col-span-2">
            <TextInput
              value={quote.projectName}
              invalid={missing(quote.projectName)}
              placeholder="GD OTS @ IDEX 2027"
              onChange={(e) => set("projectName", e.target.value)}
            />
          </Field>
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
        </div>
      </SectionCard>

      <SectionCard
        title="Client & event"
        description="The contact and venue details printed on the first page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
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
          <Field label="Venue" required>
            <TextInput
              value={quote.venue}
              invalid={missing(quote.venue)}
              placeholder="ADNEC Centre"
              onChange={(e) => set("venue", e.target.value)}
            />
          </Field>
          <Field label="City / country" required>
            <TextInput
              value={quote.location}
              invalid={missing(quote.location)}
              placeholder="Abu Dhabi, UAE"
              onChange={(e) => set("location", e.target.value)}
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

      <SectionCard
        title="Author & ownership"
        description="Internal responsibility for this quotation. This is shown on shared links but does not print inside the client document."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Author name" required>
            <TextInput
              value={quote.author.name}
              invalid={missing(quote.author.name)}
              placeholder="Quotation owner"
              onChange={(e) => set("author", { ...quote.author, name: e.target.value })}
            />
          </Field>
          <Field label="Author email" required>
            <TextInput
              type="email"
              value={quote.author.email}
              invalid={missing(quote.author.email)}
              placeholder="name@fairplatz.com"
              onChange={(e) =>
                set("author", {
                  ...quote.author,
                  id: e.target.value.trim().toLowerCase() || quote.author.id,
                  email: e.target.value,
                })
              }
            />
          </Field>
        </div>
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
          Ownership is separate from “Prepared by” below: the author manages the working file;
          Prepared by is the contact printed for the client.
        </p>
      </SectionCard>

      <SectionCard
        title="Prepared by"
        description="The Fairplatz contact the client should reply to."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" required>
            <TextInput
              value={quote.preparedBy}
              invalid={missing(quote.preparedBy)}
              placeholder="Your name"
              onChange={(e) => set("preparedBy", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={quote.preparedByEmail}
              placeholder="name@fairplatz.com"
              onChange={(e) => set("preparedByEmail", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <TextInput
              value={quote.preparedByPhone}
              placeholder="+971 …"
              onChange={(e) => set("preparedByPhone", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Pricing & validity"
        description="Set the currency, tax, validity and any commercial discount."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Currency" required>
            <Select
              value={quote.currency}
              onChange={(e) => set("currency", e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Validity (days)" hint="Shown as valid from the quotation date.">
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
              invalid={!Number.isFinite(quote.vatRate) || quote.vatRate < 0}
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

        <div className="mt-5 overflow-hidden rounded-xl bg-ink text-white shadow-sm">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                Current quote total
              </p>
              <p className="mt-1 text-xs text-white/60">Updates as items and pricing change.</p>
            </div>
            <p className="text-xl font-semibold tracking-tight text-white tabular-nums">
              {formatMoney(totals.grandTotal, quote.currency)}
            </p>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-white/10 px-1 py-3 text-center">
            {[
              ["Subtotal", totals.subtotal],
              ["Discount", totals.discount === 0 ? 0 : -totals.discount],
              [`${quote.vatLabel || "VAT"} ${quote.vatRate}%`, totals.vat],
            ].map(([label, value]) => (
              <div key={label as string} className="min-w-0 px-2">
                <dt className="truncate text-[10px] tracking-wide text-white/50 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums">
                  {formatMoney(value as number, quote.currency, false)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </SectionCard>
    </div>
  );
}
