import OpenAI from "openai";
import {
  buildQuoteFromExtracted,
  createDraftFromExtractedQuote,
  getDraft,
  updateDraftQuote,
} from "@/lib/db";
import {
  extractedQuoteSchema,
  extractRequestSchema,
} from "@/lib/quote-schema";

export const runtime = "nodejs";

const extractionSystemPrompt = `You extract clean quote data from messy trade/service voice transcripts.
Return only a JSON object matching this exact shape:
{
  "clientName": "string",
  "clientEmail": "string",
  "clientAddress": "string",
  "lineItems": [
    { "description": "string", "quantity": number, "unitPrice": number }
  ],
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

    if (!apiKey) {
      return Response.json(
        { error: "DeepSeek API key is not configured." },
        { status: 500 },
      );
    }

    const body = extractRequestSchema.parse(await request.json());
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: extractionSystemPrompt },
        {
          role: "user",
          content: `Transcript:\n${body.transcript}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: "DeepSeek returned an empty response." },
        { status: 502 },
      );
    }

    const extracted = extractedQuoteSchema.parse(JSON.parse(content));
    const existingDraft = body.draftId ? getDraft(body.draftId) : null;
    const quote = buildQuoteFromExtracted(
      extracted,
      existingDraft?.quoteNumber,
    );

    let draftId = body.draftId;
    if (draftId && existingDraft) {
      updateDraftQuote(draftId, quote);
    } else {
      const draft = createDraftFromExtractedQuote(body.transcript, quote);
      draftId = draft.id;
    }

    return Response.json({ quote, draftId });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Quote extraction failed.",
      },
      { status: 400 },
    );
  }
}
