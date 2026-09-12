import type { LineItem } from "@/lib/quote-schema";

const MONEY_SCALE = 100;
const QUANTITY_SCALE = 1_000_000;
const RATE_SCALE = 10_000;

export type CalculatedLineItem = LineItem & {
  lineTotal: number;
  lineTotalMinor: number;
};

export type QuoteTotals = {
  includeVat: boolean;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  subtotalMinor: number;
  vatAmountMinor: number;
  grandTotalMinor: number;
  lineItems: CalculatedLineItem[];
};

export function calculateQuoteTotals(
  lineItems: readonly LineItem[],
  includeVat: boolean,
  vatRate = 20,
): QuoteTotals {
  if (!Number.isFinite(vatRate) || vatRate < 0) {
    throw new Error("VAT rate must be a finite non-negative number");
  }

  const calculatedLineItems = lineItems.map((item) => {
    assertValidLineItem(item);

    const quantityScaled = toScaledInteger(item.quantity, QUANTITY_SCALE);
    const unitPriceMinor = toScaledInteger(item.unitPrice, MONEY_SCALE);
    const lineTotalMinor = divideRounded(
      BigInt(quantityScaled) * BigInt(unitPriceMinor),
      BigInt(QUANTITY_SCALE),
    );

    return {
      ...item,
      lineTotalMinor,
      lineTotal: fromMinorUnits(lineTotalMinor),
    };
  });

  const subtotalMinor = calculatedLineItems.reduce(
    (sum, item) => sum + item.lineTotalMinor,
    0,
  );
  const vatRateScaled = toScaledInteger(vatRate, RATE_SCALE / 100);
  const vatAmountMinor = includeVat
    ? divideRounded(
        BigInt(subtotalMinor) * BigInt(vatRateScaled),
        BigInt(RATE_SCALE),
      )
    : 0;
  const grandTotalMinor = subtotalMinor + vatAmountMinor;

  return {
    includeVat,
    vatRate,
    subtotal: fromMinorUnits(subtotalMinor),
    vatAmount: fromMinorUnits(vatAmountMinor),
    grandTotal: fromMinorUnits(grandTotalMinor),
    subtotalMinor,
    vatAmountMinor,
    grandTotalMinor,
    lineItems: calculatedLineItems,
  };
}

function assertValidLineItem(item: LineItem) {
  if (!item.description.trim()) {
    throw new Error("Line item description is required");
  }

  if (!Number.isFinite(item.quantity) || item.quantity < 1) {
    throw new Error("Line item quantity must be a finite number of at least 1");
  }

  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
    throw new Error("Line item unit price must be a finite non-negative number");
  }
}

function toScaledInteger(value: number, scale: number) {
  return Math.round(value * scale);
}

function divideRounded(numerator: bigint, denominator: bigint) {
  return Number((numerator + denominator / BigInt(2)) / denominator);
}

function fromMinorUnits(value: number) {
  return value / MONEY_SCALE;
}

export function formatGbp(value: number) {
  return formatCurrency(value, "GBP", "en-GB");
}

export function formatCurrency(value: number, currency = "AUD", locale = "en-AU") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatAud(value: number) {
  return formatCurrency(value, "AUD", "en-AU");
}
