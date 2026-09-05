"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Quote } from "@/lib/quote-schema";
import { Button } from "@/components/ui/button";

type PdfDownloadButtonProps = {
  quote: Quote;
};

export function PdfDownloadButton({ quote }: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPdf() {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/quote/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quote }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not generate PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quote.quoteNumber || "quote"}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not generate PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button disabled={isDownloading} type="button" onClick={downloadPdf}>
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download PDF
      </Button>
      {error ? <p className="text-sm text-[#842d26]">{error}</p> : null}
    </div>
  );
}
