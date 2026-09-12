import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { createElement } from "react";
import { QuotePdfDocument } from "@/components/quote-pdf-document";
import { markPdfGenerated } from "@/lib/db";
import { pdfQuoteRequestSchema } from "@/lib/quote-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { quote } = pdfQuoteRequestSchema.parse(await request.json());
    const documentElement = createElement(QuotePdfDocument, { quote }) as Parameters<typeof renderToBuffer>[0];
    const rendered = await renderToBuffer(documentElement);
    const hardened = await normalizePdf(rendered, quote.quoteNumber);
    const responseBody = new ArrayBuffer(hardened.byteLength);
    new Uint8Array(responseBody).set(hardened);
    await markPdfGenerated(quote.quoteNumber);
    return new Response(responseBody, { headers: { "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`, "Content-Type": "application/pdf" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "PDF generation failed." }, { status: 400 });
  }
}

async function normalizePdf(source: Buffer, quoteNumber: string) {
  try {
    const document = await PDFDocument.load(source);
    document.setTitle(`Quote ${quoteNumber}`);
    document.setAuthor("PlainLaunch Quotes");
    document.setCreator("PlainLaunch Quotes");
    document.setProducer("PlainLaunch Quotes");
    document.setSubject("Draft quote");
    document.setKeywords(["quote", "invoice", "plainlaunch"]);
    return await document.save({ useObjectStreams: true });
  } catch {
    return new Uint8Array(source);
  }
}
