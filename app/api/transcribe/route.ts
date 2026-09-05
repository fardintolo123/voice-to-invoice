import { createClient } from "@deepgram/sdk";
import { saveTranscriptDraft } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Deepgram API key is not configured." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json(
        { error: "A non-empty audio file is required." },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const deepgram = createClient(apiKey);
    const { result, error } =
      await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
        model: "nova-3",
        smart_format: true,
        punctuate: true,
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ??
      "";

    if (!transcript) {
      return Response.json(
        { error: "Deepgram did not return transcript text." },
        { status: 422 },
      );
    }

    const draft = saveTranscriptDraft({
      transcript,
      audioMimeType: audio.type || "application/octet-stream",
      audioBytes: audio.size,
    });

    return Response.json({
      transcript,
      draftId: draft.id,
      quoteNumber: draft.quoteNumber,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Transcription failed.",
      },
      { status: 500 },
    );
  }
}
