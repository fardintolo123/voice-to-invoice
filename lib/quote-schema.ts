import { z } from "zod";

const optionalEmailSchema = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z.union([z.string().trim().email("Client email must be valid"), z.literal("")]),
);

export const documentTypeSchema = z.enum([
  "quote",
  "deposit-invoice",
  "final-invoice",
]);

const optionalTextSchema = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z.string().trim(),
);

export const lineItemSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price cannot be negative"),
  })
  .strict();

export const extractedQuoteSchema = z
  .object({
    clientName: z.string().trim(),
    clientEmail: optionalEmailSchema,
    clientAddress: z.string().trim(),
    lineItems: z.array(lineItemSchema),
    notes: z.string().trim(),
    clientPhone: optionalTextSchema.default(""),
    jobTitle: optionalTextSchema.default(""),
    scope: optionalTextSchema.default(""),
    workProcess: z.array(
      z
        .object({
          step: z.string().trim(),
          process: z.string().trim(),
          description: z.string().trim(),
          estimatedDays: z.string().trim(),
        })
        .strict(),
    ).default([]),
    inclusions: z.array(z.string().trim()).default([]),
    exclusions: z.array(z.string().trim()).default([]),
    terms: z.array(z.string().trim()).default([]),
  })
  .strict();

export const quoteSchema = extractedQuoteSchema
  .extend({
    businessId: z.string().trim().default("4elements"),
    documentType: documentTypeSchema.default("quote"),
    quoteNumber: z.string().trim().min(1, "Quote number is required"),
    relatedQuoteNumber: optionalTextSchema,
    issueDate: z.string().trim().min(1, "Issue date is required"),
    validUntil: z.string().trim().min(1, "Valid-until date is required"),
    dueDate: z.string().trim(),
    includeVat: z.boolean(),
    vatRate: z.number().min(0, "VAT rate cannot be negative").default(20),
    currency: z.string().trim().default("AUD"),
    locale: z.string().trim().default("en-AU"),
    taxLabel: z.string().trim().default("GST"),
    taxInclusive: z.boolean().default(true),
    depositPercent: z.number().min(0).max(100).default(20),
    paymentDetails: z
      .object({
        accountName: z.string().trim(),
        bsb: z.string().trim(),
        accountNumber: z.string().trim(),
        reference: z.string().trim(),
      })
      .strict(),
    photos: z.array(
      z
        .object({
          id: z.string().trim(),
          name: z.string().trim(),
          dataUrl: z.string().trim(),
          caption: z.string().trim(),
          section: z.enum(["site", "project"]).default("site"),
        })
        .strict(),
    ),
  })
  .strict();

export const extractRequestSchema = z
  .object({
    transcript: z.string().trim().min(1, "Transcript is required"),
    businessId: z.string().trim().default("4elements"),
    documentType: documentTypeSchema.default("quote"),
    draftId: z.string().trim().optional(),
  })
  .strict();

export const pdfQuoteRequestSchema = z
  .object({
    quote: quoteSchema,
  })
  .strict();

export type LineItem = z.infer<typeof lineItemSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type ExtractedQuote = z.infer<typeof extractedQuoteSchema>;
export type Quote = z.infer<typeof quoteSchema>;
