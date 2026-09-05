import { describe, expect, it } from "vitest";
import { calculateQuoteTotals } from "@/lib/calculations";
import type { LineItem } from "@/lib/quote-schema";

describe("calculateQuoteTotals", () => {
  it("calculates subtotal, VAT, and grand total with UK VAT enabled", () => {
    const lineItems: LineItem[] = [
      { description: "Installation labour", quantity: 2, unitPrice: 75 },
      { description: "Materials", quantity: 1, unitPrice: 49.99 },
    ];

    expect(calculateQuoteTotals(lineItems, true)).toMatchObject({
      subtotal: 199.99,
      vatAmount: 40,
      grandTotal: 239.99,
      subtotalMinor: 19999,
      vatAmountMinor: 4000,
      grandTotalMinor: 23999,
    });
  });

  it("sets VAT to zero when VAT is disabled", () => {
    const totals = calculateQuoteTotals(
      [{ description: "Consultation", quantity: 1, unitPrice: 125 }],
      false,
    );

    expect(totals).toMatchObject({
      subtotal: 125,
      vatAmount: 0,
      grandTotal: 125,
    });
  });

  it("rounds fractional quantity totals to the nearest penny", () => {
    const totals = calculateQuoteTotals(
      [{ description: "Hourly labour", quantity: 1.25, unitPrice: 80 }],
      true,
    );

    expect(totals).toMatchObject({
      subtotal: 100,
      vatAmount: 20,
      grandTotal: 120,
    });
  });
});
