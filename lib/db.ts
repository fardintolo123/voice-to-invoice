import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildQuoteFromExtracted as buildProfileQuoteFromExtracted } from "@/lib/quote-defaults";
import type { ExtractedQuote, Quote } from "@/lib/quote-schema";

type DraftRow = {
  id: string; quote_number: string; transcript: string | null; quote_json: Quote | null;
  audio_mime_type: string | null; audio_bytes: number | null; pdf_generated_at: string | null;
  created_at: string; updated_at: string;
};

export type QuoteDraft = {
  id: string; quoteNumber: string; transcript: string | null; quote: Quote | null;
  audioMimeType: string | null; audioBytes: number | null; pdfGeneratedAt: string | null;
  createdAt: string; updatedAt: string;
};

let supabase: SupabaseClient | undefined;

export async function saveTranscriptDraft(input: { transcript: string; audioMimeType: string; audioBytes: number }) {
  const client = getSupabase();
  const id = crypto.randomUUID();
  const quoteNumber = await nextQuoteNumber(client);
  const now = new Date().toISOString();
  const { error } = await client.from("quote_drafts").insert({ id, quote_number: quoteNumber, transcript: input.transcript, audio_mime_type: input.audioMimeType, audio_bytes: input.audioBytes, created_at: now, updated_at: now });
  if (error) throw error;
  return { id, quoteNumber };
}

export async function createDraftFromExtractedQuote(transcript: string, quote: Quote) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await getSupabase().from("quote_drafts").insert({ id, quote_number: quote.quoteNumber, transcript, quote_json: quote, created_at: now, updated_at: now });
  if (error) throw error;
  return { id, quoteNumber: quote.quoteNumber };
}

export async function updateDraftQuote(id: string, quote: Quote) {
  const { data, error } = await getSupabase().from("quote_drafts").update({ quote_number: quote.quoteNumber, quote_json: quote, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle<{ id: string }>();
  if (error) throw error;
  return Boolean(data);
}

export async function markPdfGenerated(quoteNumber: string) {
  const now = new Date().toISOString();
  const { error } = await getSupabase().from("quote_drafts").update({ pdf_generated_at: now, updated_at: now }).eq("quote_number", quoteNumber);
  if (error) throw error;
}

export async function buildQuoteFromExtracted(extracted: ExtractedQuote, quoteNumber?: string): Promise<Quote> {
  return buildProfileQuoteFromExtracted(extracted, "quote", quoteNumber ?? (await nextQuoteNumber(getSupabase())));
}

export async function getDraft(id: string): Promise<QuoteDraft | null> {
  const { data, error } = await getSupabase().from("quote_drafts").select("*").eq("id", id).maybeSingle<DraftRow>();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, quoteNumber: data.quote_number, transcript: data.transcript, quote: data.quote_json, audioMimeType: data.audio_mime_type, audioBytes: data.audio_bytes, pdfGeneratedAt: data.pdf_generated_at, createdAt: data.created_at, updatedAt: data.updated_at };
}

function getSupabase() {
  if (!supabase) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    if (!url || !serviceRoleKey) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or QUOTE_SUPABASE_URL and QUOTE_SERVICE_ROLE_KEY.");
    supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabase;
}

export function isSupabaseConfigured() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL ?? process.env.QUOTE_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.QUOTE_SERVICE_ROLE_KEY,
  };
}

async function nextQuoteNumber(client: SupabaseClient) {
  const year = new Date().getFullYear();
  const { data, error } = await client.from("quote_drafts").select("quote_number").like("quote_number", `PLQ-${year}-%`).order("quote_number", { ascending: false }).limit(1).maybeSingle<{ quote_number: string }>();
  if (error) throw error;
  const nextNumber = data ? Number.parseInt(data.quote_number.split("-").at(-1) ?? "0", 10) + 1 : 1;
  return `PLQ-${year}-${String(nextNumber).padStart(4, "0")}`;
}

