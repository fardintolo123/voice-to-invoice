# PlainLaunch Quotes Implementation Plan

## Phase 1: Core Schemas and Deterministic Calculations

- Define strict Zod schemas for extracted quote payloads and line items.
- Infer TypeScript quote types from the schemas.
- Calculate subtotal, VAT, and grand total in application code only.
- Use integer minor units internally so totals are deterministic.

## Phase 2: Editable Review Form and UK VAT Toggle

- Build the mobile-first review form for customer details, address, line items, and notes.
- Add dynamic line item add/remove controls.
- Recalculate subtotal, 20% UK VAT, and grand total immediately when values change.

## Phase 3: Browser Voice Capture

- Add MediaRecorder-based microphone capture.
- Handle permissions, unsupported browsers, playback preview, timer, and re-recording.

## Phase 4: Deepgram Transcription API

- Accept audio blobs through a server route.
- Send audio to Deepgram using a Nova model.
- Return punctuated transcript text to the client.

## Phase 5: DeepSeek Structured Extraction

- Use the OpenAI SDK with DeepSeek's compatible API endpoint.
- Request JSON-only structured quote data.
- Validate model output with the Zod schema before using it.
- Keep all subtotal, VAT, and total calculations out of the LLM.

## Phase 6: PDF Generation, Watermarking, and Security Lock

- Render a branded A4 quote PDF with React PDF.
- Add a rotated semi-transparent `DRAFT QUOTE` watermark.
- Harden exported PDFs with pdf-lib permissions so common PDF viewers cannot easily modify, copy, or annotate them.
