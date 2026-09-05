import "server-only";

import Database from "better-sqlite3";
import path from "node:path";
import type { ExtractedQuote, Quote } from "@/lib/quote-schema";

type DbInstance = Database.Database;

type DraftRow = {
  id: string;
  quote_number: string;
  transcript: string | null;
  quote_json: string | null;
  audio_mime_type: string | null;
  audio_bytes: number | null;
  pdf_generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteDraft = {
  id: string;
  quoteNumber: string;
  transcript: string | null;
  quote: Quote | null;
  audioMimeType: string | null;
  audioBytes: number | null;
  pdfGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

declare global {
  var plainLaunchQuotesDb: DbInstance | undefined;
}

export function saveTranscriptDraft(input: {
  transcript: string;
  audioMimeType: string;
  audioBytes: number;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const quoteNumber = nextQuoteNumber(db);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO quote_drafts (
      id,
      quote_number,
      transcript,
      audio_mime_type,
      audio_bytes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    quoteNumber,
    input.transcript,
    input.audioMimeType,
    input.audioBytes,
    now,
    now,
  );

  return { id, quoteNumber };
}

export function createDraftFromExtractedQuote(
  transcript: string,
  quote: Quote,
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO quote_drafts (
      id,
      quote_number,
      transcript,
      quote_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, quote.quoteNumber, transcript, JSON.stringify(quote), now, now);

  return { id, quoteNumber: quote.quoteNumber };
}

export function updateDraftQuote(id: string, quote: Quote) {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE quote_drafts
       SET quote_number = ?, quote_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(quote.quoteNumber, JSON.stringify(quote), new Date().toISOString(), id);

  return result.changes > 0;
}

export function markPdfGenerated(quoteNumber: string) {
  getDb()
    .prepare(
      `UPDATE quote_drafts
       SET pdf_generated_at = ?, updated_at = ?
       WHERE quote_number = ?`,
    )
    .run(new Date().toISOString(), new Date().toISOString(), quoteNumber);
}

export function buildQuoteFromExtracted(
  extracted: ExtractedQuote,
  quoteNumber?: string,
): Quote {
  const issueDate = new Date().toISOString().slice(0, 10);
  const validUntil = addDays(issueDate, 30);

  return {
    ...extracted,
    quoteNumber: quoteNumber ?? nextQuoteNumber(getDb()),
    issueDate,
    validUntil,
    includeVat: true,
    vatRate: 20,
  };
}

export function getDraft(id: string): QuoteDraft | null {
  const row = getDb()
    .prepare("SELECT * FROM quote_drafts WHERE id = ?")
    .get(id) as DraftRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    quoteNumber: row.quote_number,
    transcript: row.transcript,
    quote: row.quote_json ? (JSON.parse(row.quote_json) as Quote) : null,
    audioMimeType: row.audio_mime_type,
    audioBytes: row.audio_bytes,
    pdfGeneratedAt: row.pdf_generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getDb() {
  if (!globalThis.plainLaunchQuotesDb) {
    globalThis.plainLaunchQuotesDb = new Database(resolveDatabasePath());
    globalThis.plainLaunchQuotesDb.pragma("journal_mode = WAL");
    initialize(globalThis.plainLaunchQuotesDb);
  }

  return globalThis.plainLaunchQuotesDb;
}

function initialize(db: DbInstance) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_drafts (
      id TEXT PRIMARY KEY,
      quote_number TEXT NOT NULL UNIQUE,
      transcript TEXT,
      quote_json TEXT,
      audio_mime_type TEXT,
      audio_bytes INTEGER,
      pdf_generated_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS quote_drafts_created_at_idx
    ON quote_drafts(created_at DESC);
  `);
}

function resolveDatabasePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!url.startsWith("file:")) {
    throw new Error("Only file: SQLite DATABASE_URL values are supported locally");
  }

  const rawPath = url.slice("file:".length);
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/^[./\\]+/, "");
  if (normalizedPath !== "dev.db") {
    throw new Error('Relative DATABASE_URL must resolve to "file:./dev.db"');
  }

  return path.join(process.cwd(), "dev.db");
}

function nextQuoteNumber(db: DbInstance) {
  const year = new Date().getFullYear();
  const row = db
    .prepare(
      `SELECT quote_number
       FROM quote_drafts
       WHERE quote_number LIKE ?
       ORDER BY quote_number DESC
       LIMIT 1`,
    )
    .get(`PLQ-${year}-%`) as { quote_number: string } | undefined;

  const nextNumber = row
    ? Number.parseInt(row.quote_number.split("-").at(-1) ?? "0", 10) + 1
    : 1;

  return `PLQ-${year}-${String(nextNumber).padStart(4, "0")}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
