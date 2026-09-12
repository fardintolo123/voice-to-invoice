import {
  defaultExclusions,
  defaultInclusions,
  defaultTerms,
  defaultWorkProcess,
  fallbackDocumentNumber,
  getBusinessProfile,
} from "@/lib/business-profile";
import type { DocumentType, ExtractedQuote, Quote } from "@/lib/quote-schema";

export function buildQuoteFromExtracted(
  extracted: ExtractedQuote,
  documentType: DocumentType,
  quoteNumber?: string,
  businessId?: string,
): Quote {
  const profile = getBusinessProfile(businessId);
  const issueDate = new Date().toISOString().slice(0, 10);
  const isQuote = documentType === "quote";

  return {
    ...extracted,
    businessId: profile.id,
    documentType,
    quoteNumber: quoteNumber ?? fallbackDocumentNumber(documentType),
    relatedQuoteNumber: extracted.notes.match(/QT-\d+/i)?.[0] ?? "",
    issueDate,
    validUntil: addDays(issueDate, profile.quoteValidDays),
    dueDate: addDays(issueDate, 7),
    includeVat: false,
    vatRate: profile.taxRate,
    currency: profile.currency,
    locale: profile.locale,
    taxLabel: profile.taxLabel,
    taxInclusive: profile.taxInclusive,
    depositPercent: profile.defaultDepositPercent,
    paymentDetails: profile.paymentDetails,
    photos: [],
    lineItems: normalizeLineItems(extracted, documentType),
    workProcess:
      extracted.workProcess.length > 0
        ? extracted.workProcess
        : isQuote
          ? defaultWorkProcess()
          : [],
    inclusions:
      extracted.inclusions.length > 0
        ? extracted.inclusions
        : defaultInclusions(documentType),
    exclusions:
      extracted.exclusions.length > 0
        ? extracted.exclusions
        : defaultExclusions(documentType),
    terms:
      extracted.terms.length > 0 ? extracted.terms : defaultTerms(documentType),
  };
}

export function createSampleQuote(): Quote {
  const profile = getBusinessProfile();
  return {
    businessId: profile.id,
    documentType: "quote",
    quoteNumber: "QT-0035",
    relatedQuoteNumber: "",
    issueDate: "2026-08-26",
    validUntil: "2026-09-08",
    dueDate: "2026-09-02",
    clientName: "Eric CHONG",
    clientEmail: "ews_chong@yahoo.com.au",
    clientPhone: "0403 019 717",
    clientAddress: "15 Yarrabung Ave, Thornleigh, NSW, 2120",
    jobTitle: "External Eaves & Brick Painting",
    scope:
      "Supply all materials and professionally prepare and repaint the nominated external eaves and brick surfaces. Areas showing signs of mould will be treated and prepared with suitable primer or undercoat where required, followed by premium exterior top coats for a clean, durable and weather-resistant finish.",
    lineItems: [
      {
        description: "External eaves and brick painting",
        quantity: 1,
        unitPrice: 13500,
      },
    ],
    notes:
      "All work will be carried out in accordance with industry best practices and weather conditions permitting.",
    workProcess: defaultWorkProcess(),
    inclusions: defaultInclusions("quote"),
    exclusions: defaultExclusions("quote"),
    terms: defaultTerms("quote"),
    includeVat: false,
    vatRate: profile.taxRate,
    currency: profile.currency,
    locale: profile.locale,
    taxLabel: profile.taxLabel,
    taxInclusive: profile.taxInclusive,
    depositPercent: profile.defaultDepositPercent,
    paymentDetails: profile.paymentDetails,
    photos: [],
  };
}

function normalizeLineItems(extracted: ExtractedQuote, documentType: DocumentType) {
  if (extracted.lineItems.length > 0) return extracted.lineItems;

  if (documentType === "deposit-invoice") {
    return [{ description: "20% Deposit", quantity: 1, unitPrice: 0 }];
  }

  if (documentType === "final-invoice") {
    return [{ description: "Final Invoice", quantity: 1, unitPrice: 0 }];
  }

  return [{ description: extracted.jobTitle || "Painting works", quantity: 1, unitPrice: 0 }];
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
