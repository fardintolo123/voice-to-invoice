"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { calculateQuoteTotals, formatGbp } from "@/lib/calculations";
import type { LineItem, Quote } from "@/lib/quote-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type QuoteFormProps = {
  quote: Quote;
  onChange: (quote: Quote) => void;
};

export function QuoteForm({ quote, onChange }: QuoteFormProps) {
  const totals = useMemo(
    () => calculateQuoteTotals(quote.lineItems, quote.includeVat, quote.vatRate),
    [quote.includeVat, quote.lineItems, quote.vatRate],
  );

  function updateQuote<K extends keyof Quote>(key: K, value: Quote[K]) {
    onChange({ ...quote, [key]: value });
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    onChange({
      ...quote,
      lineItems: quote.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    });
  }

  function addLineItem() {
    onChange({
      ...quote,
      lineItems: [
        ...quote.lineItems,
        { description: "New service", quantity: 1, unitPrice: 0 },
      ],
    });
  }

  function removeLineItem(index: number) {
    if (quote.lineItems.length === 1) {
      updateLineItem(index, {
        description: "",
        quantity: 1,
        unitPrice: 0,
      });
      return;
    }

    onChange({
      ...quote,
      lineItems: quote.lineItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Quote Details</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Check the extracted customer and quote fields before exporting.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quote number" id="quote-number">
            <Input
              id="quote-number"
              value={quote.quoteNumber}
              onChange={(event) => updateQuote("quoteNumber", event.target.value)}
            />
          </Field>
          <Field label="Issue date" id="issue-date">
            <Input
              id="issue-date"
              type="date"
              value={quote.issueDate}
              onChange={(event) => updateQuote("issueDate", event.target.value)}
            />
          </Field>
          <Field label="Valid until" id="valid-until">
            <Input
              id="valid-until"
              type="date"
              value={quote.validUntil}
              onChange={(event) => updateQuote("validUntil", event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name" id="client-name">
            <Input
              id="client-name"
              value={quote.clientName}
              onChange={(event) => updateQuote("clientName", event.target.value)}
            />
          </Field>
          <Field label="Client email" id="client-email">
            <Input
              id="client-email"
              type="email"
              value={quote.clientEmail}
              onChange={(event) => updateQuote("clientEmail", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Client address" id="client-address">
          <Textarea
            id="client-address"
            value={quote.clientAddress}
            onChange={(event) => updateQuote("clientAddress", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Line Items</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Edit quantities and prices; totals update immediately.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addLineItem}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="grid gap-3">
          {quote.lineItems.map((item, index) => (
            <div
              className="grid gap-3 rounded-md border border-[var(--border)] bg-[#fbfbf7] p-3 lg:grid-cols-[1fr_7rem_8rem_7rem_2.5rem] lg:items-end"
              key={`${item.description}-${index}`}
            >
              <Field label="Description" id={`item-description-${index}`}>
                <Input
                  id={`item-description-${index}`}
                  value={item.description}
                  onChange={(event) =>
                    updateLineItem(index, { description: event.target.value })
                  }
                />
              </Field>
              <Field label="Qty" id={`item-quantity-${index}`}>
                <Input
                  id={`item-quantity-${index}`}
                  min={1}
                  step="0.01"
                  type="number"
                  value={item.quantity}
                  onChange={(event) =>
                    updateLineItem(index, {
                      quantity: parsePositiveNumber(event.target.value, 1),
                    })
                  }
                />
              </Field>
              <Field label="Unit price" id={`item-price-${index}`}>
                <Input
                  id={`item-price-${index}`}
                  min={0}
                  step="0.01"
                  type="number"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateLineItem(index, {
                      unitPrice: parsePositiveNumber(event.target.value, 0),
                    })
                  }
                />
              </Field>
              <div className="grid gap-2">
                <span className="text-sm font-semibold">Line total</span>
                <div className="flex h-10 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-semibold">
                  {formatGbp(totals.lineItems[index]?.lineTotal ?? 0)}
                </div>
              </div>
              <Button
                aria-label={`Remove line item ${index + 1}`}
                className="lg:self-end"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => removeLineItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="vat-toggle">UK VAT</Label>
            <p className="text-sm text-[var(--muted-foreground)]">
              Toggle 20% VAT for UK taxable quotes.
            </p>
          </div>
          <Switch
            checked={quote.includeVat}
            id="vat-toggle"
            onCheckedChange={(checked) => updateQuote("includeVat", checked)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_18rem] sm:items-start">
          <Field label="Notes" id="quote-notes">
            <Textarea
              id="quote-notes"
              value={quote.notes}
              onChange={(event) => updateQuote("notes", event.target.value)}
            />
          </Field>
          <dl className="grid gap-3 rounded-md bg-[var(--muted)] p-4 text-sm">
            <TotalRow label="Subtotal" value={formatGbp(totals.subtotal)} />
            <TotalRow
              label={`VAT ${quote.includeVat ? `${quote.vatRate}%` : "off"}`}
              value={formatGbp(totals.vatAmount)}
            />
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatGbp(totals.grandTotal)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
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
    <div className="flex items-center justify-between">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
