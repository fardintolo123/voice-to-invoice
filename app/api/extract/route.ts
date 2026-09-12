import OpenAI from "openai";
import { createDraftFromExtractedQuote, getDraft, updateDraftQuote } from "@/lib/db";
import { extractedQuoteSchema, extractRequestSchema, type ExtractedQuote, type Quote } from "@/lib/quote-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const extractionSystemPrompt = `You extract clean quote data from messy trade/service voice transcripts.
Return only a JSON object matching this exact shape:
{
  "clientName": "string",
  "clientEmail": "string",
  "clientAddress": "string",
  "lineItems": [{ "description": "string", "quantity": number, "unitPrice": number }],
  "notes": "string"
}

Rules:
- Ignore non-billable chatter, conversational intros, and background noise.
- Group related labor, services, or materials into single clean line items.
- Extract exact numerical quantities and unit prices.
- If quantity is unspecified, default quantity to 1.
- If a unit price is unspecified, use 0 and mention the missing price in notes.
- Do not calculate subtotal, VAT, grand total, discounts, or taxes.
- Do not fragment one service into many tiny items unless the customer clearly quoted them separately.
- Use pounds as numeric unitPrice values without currency symbols.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return Response.json({ error: "DeepSeek API key is not configured." }, { status: 500 });

    const body = extractRequestSchema.parse(await request.json());
    const openai = new OpenAI({ baseURL: "https://api.deepseek.com", apiKey });
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat", response_format: { type: "json_object" },
      messages: [{ role: "system", content: extractionSystemPrompt }, { role: "user", content: `Transcript:\n${body.transcript}` }],
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) return Response.json({ error: "DeepSeek returned an empty response." }, { status: 502 });

    const extracted = extractedQuoteSchema.parse(JSON.parse(content));
    const existingDraft = body.draftId ? await tryGetDraft(body.draftId) : null;
    const quote = buildQuoteFromExtracted(extracted, existingDraft?.quoteNumber);
    let draftId = body.draftId;
    if (draftId && existingDraft) await tryUpdateDraftQuote(draftId, quote);
    else {
      const draft = await tryCreateDraftFromExtractedQuote(body.transcript, quote);
      draftId = draft?.id;
    }
    return Response.json({ quote, draftId });
  } catch (error) {
    return Response.json({ error: formatExtractionError(error) }, { status: 400 });
  }
}

function buildQuoteFromExtracted(extracted: ExtractedQuote, quoteNumber?: string): Quote {
  const issueDate = new Date().toISOString().slice(0, 10);
  return {
    ...extracted,
    quoteNumber: quoteNumber ?? fallbackQuoteNumber(),
    issueDate,
    validUntil: addDays(issueDate, 30),
    includeVat: true,
    vatRate: 20,
  };
}

async function tryGetDraft(id: string) {
  try {
    return await getDraft(id);
  } catch (error) {
    console.error("Draft lookup failed", error);
    return null;
  }
}

async function tryUpdateDraftQuote(id: string, quote: Quote) {
  try {
    return await updateDraftQuote(id, quote);
  } catch (error) {
    console.error("Draft quote update failed", error);
    return false;
  }
}

async function tryCreateDraftFromExtractedQuote(transcript: string, quote: Quote) {
  try {
    return await createDraftFromExtractedQuote(transcript, quote);
  } catch (error) {
    console.error("Extracted quote draft save failed", error);
    return null;
  }
}

function fallbackQuoteNumber() {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join("");
  return `PLQ-${stamp}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatExtractionError(error: unknown) {
  if (!(error instanceof Error)) return "Quote extraction failed.";

  const message = error.message;
  if (/connection error/i.test(message)) {
    return "Could not connect to DeepSeek. Check the server network connection and DEEPSEEK_API_KEY, then try again.";
  }

  try {
    const parsed = JSON.parse(message) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? message;
  } catch {
    return message;
  }
}
