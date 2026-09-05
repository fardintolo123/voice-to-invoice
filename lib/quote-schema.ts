import { z } from "zod";

const optionalEmailSchema = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z.union([z.string().trim().email("Client email must be valid"), z.literal("")]),
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
  })
  .strict();

export const quoteSchema = extractedQuoteSchema
  .extend({
    quoteNumber: z.string().trim().min(1, "Quote number is required"),
    issueDate: z.string().trim().min(1, "Issue date is required"),
    validUntil: z.string().trim().min(1, "Valid-until date is required"),
    includeVat: z.boolean(),
    vatRate: z.number().min(0, "VAT rate cannot be negative").default(20),
  })
  .strict();

export const extractRequestSchema = z
  .object({
    transcript: z.string().trim().min(1, "Transcript is required"),
    draftId: z.string().trim().optional(),
  })
  .strict();

export const pdfQuoteRequestSchema = z
  .object({
    quote: quoteSchema,
  })
  .strict();

export type LineItem = z.infer<typeof lineItemSchema>;
export type ExtractedQuote = z.infer<typeof extractedQuoteSchema>;
export type Quote = z.infer<typeof quoteSchema>;
