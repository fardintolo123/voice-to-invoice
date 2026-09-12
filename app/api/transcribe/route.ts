import { createClient } from "@deepgram/sdk";
import { saveTranscriptDraft } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) return Response.json({ error: "Deepgram API key is not configured." }, { status: 500 });

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json({ error: "A non-empty audio file is required." }, { status: 400 });
    }

    const deepgram = createClient(apiKey);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(await audio.arrayBuffer()),
      { model: "nova-3", smart_format: true, punctuate: true },
    );
    if (error) return Response.json({ error: formatDeepgramError(error.message) }, { status: 502 });

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
    if (!transcript) return Response.json({ error: "Deepgram did not return transcript text." }, { status: 422 });

    const draft = await saveTranscriptDraft({ transcript, audioMimeType: audio.type || "application/octet-stream", audioBytes: audio.size });
    return Response.json({ transcript, draftId: draft.id, quoteNumber: draft.quoteNumber });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? formatDeepgramError(error.message) : "Transcription failed." }, { status: 500 });
  }
}

function formatDeepgramError(message: string) {
  try {
    const parsed = JSON.parse(message) as { err_code?: string; err_msg?: string; error?: string };
    if (parsed.err_code === "INVALID_AUTH") return "Deepgram rejected the API key. Check DEEPGRAM_API_KEY, then restart the dev server.";
    return parsed.err_msg ?? parsed.error ?? message;
  } catch {
    return message;
  }
}
