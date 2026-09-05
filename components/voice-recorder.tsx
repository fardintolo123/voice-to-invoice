"use client";

import { Mic, Play, RotateCcw, Square, UploadCloud } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";

type VoiceRecorderProps = {
  onTranscript: (transcript: string, draftId?: string, quoteNumber?: string) => void;
};

type RecorderState =
  | "idle"
  | "recording"
  | "recorded"
  | "transcribing"
  | "error";

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const isUnsupported = hasHydrated && !isRecordingSupported();

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [duration]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }

    const interval = window.setInterval(() => {
      setDuration((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopStream();
    };
  }, [audioUrl, stopStream]);

  async function startRecording() {
    setError(null);

    if (!isRecordingSupported()) {
      setError("This browser does not support in-page audio recording.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          return URL.createObjectURL(blob);
        });
        setState("recorded");
        stopStream();
      };

      mediaRecorderRef.current = recorder;
      setAudioBlob(null);
      setDuration(0);
      setState("recording");
      recorder.start();
    } catch (recordingError) {
      setError(
        recordingError instanceof DOMException &&
          recordingError.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Could not start microphone recording.",
      );
      setState("error");
      stopStream();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function resetRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setState("idle");
  }

  async function transcribeRecording() {
    if (!audioBlob) {
      return;
    }

    setState("transcribing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "plainlaunch-recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        transcript?: string;
        draftId?: string;
        quoteNumber?: string;
        error?: string;
      };

      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error ?? "Transcription failed.");
      }

      onTranscript(payload.transcript, payload.draftId, payload.quoteNumber);
      setState("recorded");
    } catch (transcriptionError) {
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed.",
      );
      setState("recorded");
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Voice Capture</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Record the customer request, preview it, then transcribe it.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-md bg-[var(--muted)] px-3 py-2 text-sm font-semibold">
          {formattedDuration}
        </div>
      </div>

      {isUnsupported ? (
        <div className="rounded-md border border-[#d89b2d] bg-[#fff7e3] px-3 py-2 text-sm text-[#684707]">
          This browser does not support in-page audio recording.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-[#d78b86] bg-[#fff1ef] px-3 py-2 text-sm text-[#842d26]">
          {error}
        </div>
      ) : null}

      {audioUrl ? (
        <audio className="w-full" controls src={audioUrl}>
          <track kind="captions" />
        </audio>
      ) : (
        <div className="flex min-h-16 items-center rounded-md border border-dashed border-[var(--border)] px-3 text-sm text-[var(--muted-foreground)]">
          No recording yet.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {state === "recording" ? (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            <Square className="h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button
            disabled={isUnsupported || state === "transcribing"}
            type="button"
            onClick={startRecording}
          >
            <Mic className="h-4 w-4" />
            Record
          </Button>
        )}
        <Button
          disabled={!audioBlob || state === "transcribing"}
          type="button"
          variant="outline"
          onClick={transcribeRecording}
        >
          {state === "transcribing" ? (
            <UploadCloud className="h-4 w-4 animate-pulse" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Transcribe
        </Button>
        <Button
          disabled={!audioBlob || state === "transcribing"}
          type="button"
          variant="ghost"
          onClick={resetRecording}
        >
          <RotateCcw className="h-4 w-4" />
          Re-record
        </Button>
      </div>
    </section>
  );
}

function subscribeToHydration(onStoreChange: () => void) {
  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function getHydratedSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function getSupportedMimeType() {
  const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/wav"];
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function isRecordingSupported() {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
