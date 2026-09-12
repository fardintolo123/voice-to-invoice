"use client";

import { Bot, CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { QuoteForm } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/voice-recorder";
import { documentTypeLabel, fallbackDocumentNumber } from "@/lib/business-profile";
import { createSampleQuote } from "@/lib/quote-defaults";
import type { DocumentType, Quote } from "@/lib/quote-schema";
import { cn } from "@/lib/utils";

const sampleTranscript =
  "Create a quote for Eric Chong at 15 Yarrabung Ave, Thornleigh NSW 2120. Phone 0403 019 717, email ews_chong@yahoo.com.au. Job is external eaves and brick painting. Supply all materials, treat mould affected areas, prime where required, and apply two premium exterior top coats. Total is 13500 dollars GST inclusive. Valid for 14 days.";

const documentTypes: DocumentType[] = [
  "quote",
  "deposit-invoice",
  "final-invoice",
];

export function QuoteWorkspace() {
  const [quote, setQuote] = useState<Quote>(() => createSampleQuote());
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
        ? `Transcript captured as ${quoteNumber}`
        : "Transcript captured",
    );
    setError(null);
  }

  function changeDocumentType(documentType: DocumentType) {
    setQuote((current) => ({
      ...current,
      documentType,
      quoteNumber: current.documentType === documentType
        ? current.quoteNumber
        : fallbackDocumentNumber(documentType),
      lineItems: current.lineItems.map((item, index) =>
        index === 0
          ? { ...item, description: defaultLineItemLabel(documentType) }
          : item,
      ),
      photos: current.photos.map((photo) => ({
        ...photo,
        section: documentType === "quote" ? "site" : "project",
      })),
    }));
    setDraftId(undefined);
    setStatus(`${documentTypeLabel(documentType)} selected`);
  }

  async function extractQuote() {
    if (transcript.trim().split(/\s+/).length < 4) {
      setError("Add a few quote details first, such as the client, job, item, quantity, or price.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          draftId,
          businessId: quote.businessId,
          documentType: quote.documentType,
        }),
      });
      const payload = await readExtractResponse(response);

      const extractedQuote = payload.quote;

      if (!response.ok || !extractedQuote) {
        throw new Error(
          payload.error ?? `Quote extraction failed with status ${response.status}.`,
        );
      }

      setQuote((current) => ({
        ...extractedQuote,
        photos: current.photos,
      }));
      setDraftId(payload.draftId ?? draftId);
      setStatus(`${documentTypeLabel(quote.documentType)} extracted and validated`);
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
    <div className="grid gap-5 lg:grid-cols-[25rem_1fr]">
      <aside className="grid h-fit gap-4">
        <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4">
          <div>
            <h2 className="text-lg font-semibold">Document</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Pick the customer-ready output before extraction.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {documentTypes.map((documentType) => (
              <button
                className={cn(
                  "min-h-12 rounded-md border px-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  quote.documentType === documentType
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)]",
                )}
                key={documentType}
                onClick={() => changeDocumentType(documentType)}
                type="button"
              >
                {shortDocumentLabel(documentType)}
              </button>
            ))}
          </div>
        </section>

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
            Extract {quote.documentType === "quote" ? "quote" : "invoice"}
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
        <div className="flex flex-col gap-3 rounded-lg border border-[#174b4f] bg-[#143d40] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e7b15f]">
              <Sparkles className="h-4 w-4" />
              4 Elements Painting workspace
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {documentTypeLabel(quote.documentType)}
            </h1>
          </div>
          <PdfDownloadButton quote={quote} />
        </div>
        <QuoteForm quote={quote} onChange={setQuote} />
      </section>
    </div>
  );
}

function shortDocumentLabel(documentType: DocumentType) {
  switch (documentType) {
    case "deposit-invoice":
      return "Deposit";
    case "final-invoice":
      return "Final";
    default:
      return "Quote";
  }
}

function defaultLineItemLabel(documentType: DocumentType) {
  switch (documentType) {
    case "deposit-invoice":
      return "20% Deposit";
    case "final-invoice":
      return "Final Invoice";
    default:
      return "Painting works";
  }
}

async function readExtractResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as {
      quote?: Quote;
      draftId?: string;
      error?: string;
    };
  }

  const text = await response.text();
  return {
    error: text.trim()
      ? `Quote extraction failed with status ${response.status}: ${text.slice(0, 180)}`
      : `Quote extraction failed with status ${response.status}.`,
  };
}
