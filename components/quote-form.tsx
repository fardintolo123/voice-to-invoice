"use client";

import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useMemo, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calculateQuoteTotals, formatCurrency } from "@/lib/calculations";
import type { LineItem, Quote } from "@/lib/quote-schema";

type QuoteFormProps = {
  quote: Quote;
  onChange: (quote: Quote) => void;
};

type QuoteKey = keyof Quote;

export function QuoteForm({ quote, onChange }: QuoteFormProps) {
  const totals = useMemo(
    () => calculateQuoteTotals(quote.lineItems, quote.includeVat, quote.vatRate),
    [quote.includeVat, quote.lineItems, quote.vatRate],
  );
  const isQuote = quote.documentType === "quote";

  function updateQuote<K extends QuoteKey>(key: K, value: Quote[K]) {
    onChange({ ...quote, [key]: value });
  }

  function updateLineItem(index: number, key: keyof LineItem, value: string) {
    onChange({
      ...quote,
      lineItems: quote.lineItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]:
                key === "description"
                  ? value
                  : Number.parseFloat(value) || 0,
            }
          : item,
      ),
    });
  }

  function addLineItem() {
    onChange({
      ...quote,
      lineItems: [
        ...quote.lineItems,
        {
          description: "Variation",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  }

  function removeLineItem(index: number) {
    if (quote.lineItems.length === 1) return;
    onChange({
      ...quote,
      lineItems: quote.lineItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  function updateTextList(
    key: "inclusions" | "exclusions" | "terms",
    value: string,
  ) {
    updateQuote(
      key,
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
  }

  function updateWorkProcess(
    index: number,
    key: keyof Quote["workProcess"][number],
    value: string,
  ) {
    onChange({
      ...quote,
      workProcess: quote.workProcess.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    });
  }

  function addWorkProcess() {
    onChange({
      ...quote,
      workProcess: [
        ...quote.workProcess,
        {
          step: String(quote.workProcess.length + 1),
          process: "",
          description: "",
          estimatedDays: "",
        },
      ],
    });
  }

  function removeWorkProcess(index: number) {
    onChange({
      ...quote,
      workProcess: quote.workProcess.filter((_, rowIndex) => rowIndex !== index),
    });
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const photos = await Promise.all(
      files
        .filter((file) => file.type.startsWith("image/") && file.size <= 5_000_000)
        .map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: await readFileAsDataUrl(file),
          caption: file.name.replace(/\.[^.]+$/, ""),
          section: isQuote ? "site" as const : "project" as const,
        })),
    );

    onChange({ ...quote, photos: [...quote.photos, ...photos].slice(0, 6) });
    event.target.value = "";
  }

  function updatePhoto(index: number, key: "caption" | "section", value: string) {
    onChange({
      ...quote,
      photos: quote.photos.map((photo, photoIndex) =>
        photoIndex === index ? { ...photo, [key]: value } : photo,
      ),
    });
  }

  function removePhoto(index: number) {
    onChange({
      ...quote,
      photos: quote.photos.filter((_, photoIndex) => photoIndex !== index),
    });
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
      <Section title="Customer and Dates">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={isQuote ? "Quote number" : "Invoice number"} id="quote-number">
            <Input
              id="quote-number"
              value={quote.quoteNumber}
              onChange={(event) => updateQuote("quoteNumber", event.target.value)}
            />
          </Field>
          <Field label={isQuote ? "Issue date" : "Invoice date"} id="issue-date">
            <Input
              id="issue-date"
              type="date"
              value={quote.issueDate}
              onChange={(event) => updateQuote("issueDate", event.target.value)}
            />
          </Field>
          <Field label={isQuote ? "Valid until" : "Due date"} id="target-date">
            <Input
              id="target-date"
              type="date"
              value={isQuote ? quote.validUntil : quote.dueDate}
              onChange={(event) =>
                updateQuote(isQuote ? "validUntil" : "dueDate", event.target.value)
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Client name" id="client-name">
            <Input
              id="client-name"
              value={quote.clientName}
              onChange={(event) => updateQuote("clientName", event.target.value)}
            />
          </Field>
          <Field label="Client phone" id="client-phone">
            <Input
              id="client-phone"
              value={quote.clientPhone}
              onChange={(event) => updateQuote("clientPhone", event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Client email" id="client-email">
            <Input
              id="client-email"
              type="email"
              value={quote.clientEmail}
              onChange={(event) => updateQuote("clientEmail", event.target.value)}
            />
          </Field>
          {!isQuote ? (
            <Field label="Related quote" id="related-quote">
              <Input
                id="related-quote"
                placeholder="QT-0031"
                value={quote.relatedQuoteNumber}
                onChange={(event) => updateQuote("relatedQuoteNumber", event.target.value)}
              />
            </Field>
          ) : null}
        </div>

        <Field label="Client address" id="client-address">
          <Textarea
            id="client-address"
            value={quote.clientAddress}
            onChange={(event) => updateQuote("clientAddress", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Job Scope">
        <Field label="Job description" id="job-title">
          <Input
            id="job-title"
            value={quote.jobTitle}
            onChange={(event) => updateQuote("jobTitle", event.target.value)}
          />
        </Field>
        <Field label="Scope narrative" id="scope">
          <Textarea
            className="min-h-32"
            id="scope"
            value={quote.scope}
            onChange={(event) => updateQuote("scope", event.target.value)}
          />
        </Field>
      </Section>

      <Section
        action={
          <Button onClick={addLineItem} size="sm" type="button" variant="secondary">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        }
        title={isQuote ? "Quote Total" : "Payment Summary"}
      >
        <div className="grid gap-3">
          {quote.lineItems.map((item, index) => (
            <div
              className="grid gap-3 rounded-md border border-[var(--border)] bg-[#fbfbf7] p-3 md:grid-cols-[1fr_6rem_8rem_2.5rem]"
              key={`${item.description}-${index}`}
            >
              <Field label="Description" id={`description-${index}`}>
                <Input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(event) => updateLineItem(index, "description", event.target.value)}
                />
              </Field>
              <Field label="Qty" id={`quantity-${index}`}>
                <Input
                  id={`quantity-${index}`}
                  min="1"
                  step="0.01"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => updateLineItem(index, "quantity", event.target.value)}
                />
              </Field>
              <Field label="Rate" id={`unit-price-${index}`}>
                <Input
                  id={`unit-price-${index}`}
                  min="0"
                  step="0.01"
                  type="number"
                  value={item.unitPrice}
                  onChange={(event) => updateLineItem(index, "unitPrice", event.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  aria-label="Remove line item"
                  disabled={quote.lineItems.length === 1}
                  onClick={() => removeLineItem(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="ml-auto grid w-full gap-2 rounded-md bg-[var(--muted)] p-4 text-sm sm:w-80">
          <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal, quote.currency, quote.locale)} />
          <TotalRow
            label={quote.taxInclusive ? `${quote.taxLabel} inclusive` : `${quote.taxLabel} ${quote.vatRate}%`}
            value={quote.taxInclusive ? "Included" : formatCurrency(totals.vatAmount, quote.currency, quote.locale)}
          />
          <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-semibold">
            <span>{isQuote ? "Quote total" : "Balance due"}</span>
            <span>{formatCurrency(totals.grandTotal, quote.currency, quote.locale)}</span>
          </div>
        </div>
      </Section>

      {isQuote ? (
        <Section
          action={
            <Button onClick={addWorkProcess} size="sm" type="button" variant="secondary">
              <Plus className="h-4 w-4" />
              Add step
            </Button>
          }
          title="Work Process"
        >
          <div className="grid gap-3">
            {quote.workProcess.map((row, index) => (
              <div
                className="grid gap-3 rounded-md border border-[var(--border)] bg-[#fbfbf7] p-3 md:grid-cols-[4rem_12rem_1fr_6rem_2.5rem]"
                key={`${row.step}-${index}`}
              >
                <Field label="Step" id={`step-${index}`}>
                  <Input
                    id={`step-${index}`}
                    value={row.step}
                    onChange={(event) => updateWorkProcess(index, "step", event.target.value)}
                  />
                </Field>
                <Field label="Process" id={`process-${index}`}>
                  <Input
                    id={`process-${index}`}
                    value={row.process}
                    onChange={(event) => updateWorkProcess(index, "process", event.target.value)}
                  />
                </Field>
                <Field label="Description" id={`process-description-${index}`}>
                  <Textarea
                    id={`process-description-${index}`}
                    value={row.description}
                    onChange={(event) => updateWorkProcess(index, "description", event.target.value)}
                  />
                </Field>
                <Field label="Days" id={`days-${index}`}>
                  <Input
                    id={`days-${index}`}
                    value={row.estimatedDays}
                    onChange={(event) => updateWorkProcess(index, "estimatedDays", event.target.value)}
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    aria-label="Remove work process step"
                    onClick={() => removeWorkProcess(index)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Notes and Terms">
        <Field label="Document note" id="quote-notes">
          <Textarea
            id="quote-notes"
            value={quote.notes}
            onChange={(event) => updateQuote("notes", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Inclusions" id="inclusions">
            <Textarea
              id="inclusions"
              value={quote.inclusions.join("\n")}
              onChange={(event) => updateTextList("inclusions", event.target.value)}
            />
          </Field>
          <Field label="Exclusions" id="exclusions">
            <Textarea
              id="exclusions"
              value={quote.exclusions.join("\n")}
              onChange={(event) => updateTextList("exclusions", event.target.value)}
            />
          </Field>
          <Field label="Terms" id="terms">
            <Textarea
              id="terms"
              value={quote.terms.join("\n")}
              onChange={(event) => updateTextList("terms", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      {!isQuote ? (
        <Section title="Payment Details">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Account name" id="account-name">
              <Input
                id="account-name"
                value={quote.paymentDetails.accountName}
                onChange={(event) =>
                  updateQuote("paymentDetails", {
                    ...quote.paymentDetails,
                    accountName: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="BSB" id="bsb">
              <Input
                id="bsb"
                value={quote.paymentDetails.bsb}
                onChange={(event) =>
                  updateQuote("paymentDetails", {
                    ...quote.paymentDetails,
                    bsb: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Account number" id="account-number">
              <Input
                id="account-number"
                value={quote.paymentDetails.accountNumber}
                onChange={(event) =>
                  updateQuote("paymentDetails", {
                    ...quote.paymentDetails,
                    accountNumber: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Reference" id="reference">
              <Input
                id="reference"
                value={quote.paymentDetails.reference}
                onChange={(event) =>
                  updateQuote("paymentDetails", {
                    ...quote.paymentDetails,
                    reference: event.target.value,
                  })
                }
              />
            </Field>
          </div>
        </Section>
      ) : null}

      <Section title={isQuote ? "Site Photos" : "Project Photos"}>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--border)] bg-white px-4 py-5 text-center text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]">
          <ImagePlus className="h-5 w-5 text-[var(--primary)]" />
          <span className="font-semibold text-[var(--foreground)]">Upload photos</span>
          <span>JPG or PNG, up to 5 MB each. The PDF shows up to 6.</span>
          <input
            accept="image/*"
            className="sr-only"
            multiple
            onChange={addPhotos}
            type="file"
          />
        </label>

        {quote.photos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {quote.photos.map((photo, index) => (
              <div
                className="grid gap-3 rounded-md border border-[var(--border)] bg-[#fbfbf7] p-3"
                key={photo.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={photo.caption || photo.name}
                  className="aspect-[4/3] w-full rounded-md object-cover"
                  src={photo.dataUrl}
                />
                <Field label="Caption" id={`photo-caption-${index}`}>
                  <Input
                    id={`photo-caption-${index}`}
                    value={photo.caption}
                    onChange={(event) => updatePhoto(index, "caption", event.target.value)}
                  />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <select
                    className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(19,95,99,0.16)]"
                    value={photo.section}
                    onChange={(event) => updatePhoto(index, "section", event.target.value)}
                  >
                    <option value="site">Site</option>
                    <option value="project">Project</option>
                  </select>
                  <Button
                    onClick={() => removePhoto(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>
    </form>
  );
}

function Section({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
