import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { createElement } from "react";
import { QuotePdfDocument } from "@/components/quote-pdf-document";
import { getBusinessProfile } from "@/lib/business-profile";
import { markPdfGenerated } from "@/lib/db";
import { pdfQuoteRequestSchema } from "@/lib/quote-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { quote } = pdfQuoteRequestSchema.parse(await request.json());
    const documentElement = createElement(QuotePdfDocument, { quote }) as Parameters<typeof renderToBuffer>[0];
    const rendered = await renderToBuffer(documentElement);
    const hardened = await normalizePdf(rendered, quote);
    const responseBody = new ArrayBuffer(hardened.byteLength);
    new Uint8Array(responseBody).set(hardened);
    await tryMarkPdfGenerated(quote.quoteNumber);
    return new Response(responseBody, { headers: { "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`, "Content-Type": "application/pdf" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "PDF generation failed." }, { status: 400 });
  }
}

async function tryMarkPdfGenerated(quoteNumber: string) {
  try {
    await markPdfGenerated(quoteNumber);
  } catch (error) {
    console.error("PDF generated marker failed", error);
  }
}

async function normalizePdf(source: Buffer, quote: { businessId: string; quoteNumber: string }) {
  try {
    const profile = getBusinessProfile(quote.businessId);
    const document = await PDFDocument.load(source);
    document.setTitle(`4 Elements document ${quote.quoteNumber}`);
    document.setAuthor(profile.name);
    document.setCreator(profile.name);
    document.setProducer(profile.name);
    document.setSubject("Quote or invoice");
    document.setKeywords([profile.name, "quote", "invoice", "painting"]);
    return await document.save({ useObjectStreams: true });
  } catch {
    return new Uint8Array(source);
  }
}
