"use client";

import { Bot, CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { QuoteForm } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/voice-recorder";
import type { Quote } from "@/lib/quote-schema";

const sampleTranscript =
  "Create a quote for Sarah Ahmed at 18 King Street, Manchester M2 4LG. Her email is sarah@example.com. Add a boiler service and safety inspection for 1 at 120 pounds, and a replacement expansion vessel for 1 at 84 pounds 50. Notes: work can be completed next Tuesday morning.";

const sampleQuote: Quote = {
  quoteNumber: "PLQ-2026-0001",
  issueDate: "2026-08-31",
  validUntil: "2026-09-30",
  clientName: "Sarah Ahmed",
  clientEmail: "sarah@example.com",
  clientAddress: "18 King Street\nManchester M2 4LG",
  lineItems: [
    {
      description: "Boiler service and safety inspection",
      quantity: 1,
      unitPrice: 120,
    },
    {
      description: "Replacement expansion vessel",
      quantity: 1,
      unitPrice: 84.5,
    },
  ],
  notes: "Work can be completed next Tuesday morning.",
  includeVat: true,
  vatRate: 20,
};

export function QuoteWorkspace() {
  const [quote, setQuote] = useState<Quote>(sampleQuote);
  const [transcript, setTranscript] = useState(sampleTranscript);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("Ready");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTranscript(
    nextTranscript: string,
    nextDraftId?: string,
    quoteNumber?: string,
  ) {
    setTranscript(nextTranscript);
    setDraftId(nextDraftId);
    setStatus(
      quoteNumber
        ? `Transcript saved as ${quoteNumber}`
        : "Transcript captured",
    );
    setError(null);
  }

  async function extractQuote() {
    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript, draftId }),
      });
      const payload = (await response.json()) as {
        quote?: Quote;
        draftId?: string;
        error?: string;
      };

      if (!response.ok || !payload.quote) {
        throw new Error(payload.error ?? "Could not extract quote.");
      }

      setQuote(payload.quote);
      setDraftId(payload.draftId ?? draftId);
      setStatus("Quote extracted and validated");
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Could not extract quote.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[24rem_1fr]">
      <aside className="grid h-fit gap-4">
        <VoiceRecorder onTranscript={handleTranscript} />
        <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Transcript</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Review or paste voice text before extraction.
              </p>
            </div>
            <FileText className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <Textarea
            className="min-h-44"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <Button disabled={isExtracting || !transcript.trim()} onClick={extractQuote}>
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            Extract quote
          </Button>
          {error ? (
            <p className="rounded-md border border-[#d78b86] bg-[#fff1ef] px-3 py-2 text-sm text-[#842d26]">
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
            {status}
          </div>
        </section>
      </aside>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[#143d40] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e7b15f]">
              <Sparkles className="h-4 w-4" />
              Validated quote workspace
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              PlainLaunch Quotes
            </h1>
          </div>
          <PdfDownloadButton quote={quote} />
        </div>
        <QuoteForm quote={quote} onChange={setQuote} />
      </section>
    </div>
  );
}
