import { useEffect, useMemo, useState } from "react";
import { FileAudio, LoaderCircle, Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isElevenLabsConfigured, isOpenAIConfigured } from "../../config/api-config";
import {
  ElevenLabsService,
  type SoundGenerationRequest,
} from "../../services/elevenlabs-service";
import { OpenAIService } from "../../services/openai-service";
import {
  LoopLabDownloadService,
  type LoopLabReview,
  type LoopLabReviewTag,
  type LoopLabTrackDetailResponse,
  type LoopLabTrackSummary,
} from "../../services/looplab-download-service";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

type LoopLabFormState = {
  title: string;
  text: string;
  outputFormat: string;
  loop: boolean;
  repeatTrack: string;
  durationSeconds: string;
  promptInfluence: string;
  modelId: string;
};

type SavedLoopTrack = LoopLabTrackDetailResponse["track"];
type ReviewDraft = LoopLabReview;

const REVIEW_TAGS: Array<{ value: "all" | LoopLabReviewTag; label: string }> = [
  { value: "all", label: "All tags" },
  { value: "Good", label: "Good" },
  { value: "Ok", label: "Ok" },
  { value: "Bad", label: "Bad" },
];

const DEFAULT_FORM: LoopLabFormState = {
  title: "",
  text: "",
  outputFormat: "mp3_44100_192",
  loop: true,
  repeatTrack: "5",
  durationSeconds: "20",
  promptInfluence: "0.5",
  modelId: "eleven_text_to_sound_v2",
};

function clampRepeatTrack(value: number) {
  if (!Number.isFinite(value)) {
    return 5;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

function formatTimestamp(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function buildFolderName(prompt: string) {
  const slug = prompt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "loop";
  return `${slug}_${Date.now()}`;
}

function buildTrackTitle(track: LoopLabTrackSummary) {
  return track.title || track.folderName;
}

function buildFallbackExperimentTitle(prompt: string) {
  return prompt
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60) || "Loop Experiment";
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function encodeWavFromAudioBuffer(audioBuffer: AudioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + frameCount * blockAlign);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + frameCount * blockAlign, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, frameCount * blockAlign, true);

  let offset = 44;
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = audioBuffer.getChannelData(channelIndex)[frameIndex];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function repeatAudioBlob(blob: Blob, repeatCount: number) {
  if (repeatCount <= 1) {
    return blob;
  }

  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const sourceBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const repeatedBuffer = audioContext.createBuffer(
      sourceBuffer.numberOfChannels,
      sourceBuffer.length * repeatCount,
      sourceBuffer.sampleRate,
    );

    for (let channelIndex = 0; channelIndex < sourceBuffer.numberOfChannels; channelIndex += 1) {
      const sourceChannel = sourceBuffer.getChannelData(channelIndex);
      const targetChannel = repeatedBuffer.getChannelData(channelIndex);

      for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
        targetChannel.set(sourceChannel, repeatIndex * sourceBuffer.length);
      }
    }

    return encodeWavFromAudioBuffer(repeatedBuffer);
  } finally {
    await audioContext.close();
  }
}

export function LoopLabPage() {
  const [form, setForm] = useState<LoopLabFormState>(DEFAULT_FORM);
  const [tracks, setTracks] = useState<LoopLabTrackSummary[]>([]);
  const [trackDetails, setTrackDetails] = useState<Record<string, SavedLoopTrack>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [tagFilter, setTagFilter] = useState<"all" | LoopLabReviewTag>("all");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [loadingTrackDetail, setLoadingTrackDetail] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [savingReviewFolder, setSavingReviewFolder] = useState<string | null>(null);

  const generateExperimentTitle = async (prompt: string) => {
    const fallbackTitle = buildFallbackExperimentTitle(prompt);

    if (!isOpenAIConfigured()) {
      return fallbackTitle;
    }

    try {
      const openAIService = new OpenAIService();
      const generatedTitle = await openAIService.generateTitle(prompt, "looplab");
      return generatedTitle || fallbackTitle;
    } catch (error) {
      console.error("Failed to generate LoopLab title:", error);
      return fallbackTitle;
    }
  };

  const loadTracks = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await LoopLabDownloadService.listTracks();
      setTracks(response.tracks);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load LoopLab history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadTracks();
  }, []);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tracks.filter((track) => {
      if (statusFilter !== "all" && track.status !== statusFilter) {
        return false;
      }

      if (tagFilter !== "all" && track.reviewTag !== tagFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [track.title, track.promptPreview, track.modelId, track.outputFormat]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [searchQuery, statusFilter, tagFilter, tracks]);

  const successCount = tracks.filter((track) => track.status === "success").length;
  const errorCount = tracks.filter((track) => track.status === "error").length;

  const updateForm = <K extends keyof LoopLabFormState>(key: K, value: LoopLabFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTogglePlay = async (folderName: string) => {
    const audioElement = document.getElementById(`looplab-audio-${folderName}`) as HTMLAudioElement | null;
    if (!audioElement) {
      return;
    }

    if (playingTrack && playingTrack !== folderName) {
      const previous = document.getElementById(`looplab-audio-${playingTrack}`) as HTMLAudioElement | null;
      previous?.pause();
    }

    if (audioElement.paused) {
      await audioElement.play();
      setPlayingTrack(folderName);
      return;
    }

    audioElement.pause();
    setPlayingTrack((current) => (current === folderName ? null : current));
  };

  const handleExpandTrack = async (folderName: string) => {
    if (expandedTrack === folderName) {
      setExpandedTrack(null);
      return;
    }

    setExpandedTrack(folderName);
    if (trackDetails[folderName]) {
      return;
    }

    setLoadingTrackDetail(folderName);
    try {
      const response = await LoopLabDownloadService.getTrack(folderName);
      setTrackDetails((current) => ({ ...current, [folderName]: response.track }));
      setReviewDrafts((current) => ({
        ...current,
        [folderName]: response.track.review ?? { notes: "", tag: null },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load LoopLab track");
    } finally {
      setLoadingTrackDetail(null);
    }
  };

  const updateReviewDraft = <K extends keyof ReviewDraft>(folderName: string, key: K, value: ReviewDraft[K]) => {
    setReviewDrafts((current) => ({
      ...current,
      [folderName]: {
        ...(current[folderName] ?? { notes: "", tag: null }),
        [key]: value,
      },
    }));
  };

  const handleSaveReview = async (folderName: string) => {
    const review = reviewDrafts[folderName] ?? { notes: "", tag: null };
    setSavingReviewFolder(folderName);

    try {
      await LoopLabDownloadService.saveReview(folderName, review);
      const savedReview = {
        ...review,
        updatedAt: new Date().toISOString(),
      };

      setTrackDetails((current) => {
        const existing = current[folderName];
        if (!existing) {
          return current;
        }

        return {
          ...current,
          [folderName]: {
            ...existing,
            review: savedReview,
          },
        };
      });
      setTracks((current) => current.map((track) => (
        track.folderName === folderName
          ? { ...track, reviewTag: savedReview.tag ?? null }
          : track
      )));
      toast.success("LoopLab notes saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save LoopLab notes");
    } finally {
      setSavingReviewFolder(null);
    }
  };

  const handleGenerateLoop = async () => {
    if (!form.text.trim()) {
      toast.error("Enter a prompt to generate a loop");
      return;
    }

    if (!isElevenLabsConfigured()) {
      toast.error("ElevenLabs API key is not configured");
      return;
    }

    const requestPayload: SoundGenerationRequest = {
      text: form.text.trim(),
      output_format: form.outputFormat.trim() || DEFAULT_FORM.outputFormat,
      loop: form.loop,
      duration_seconds: Number(form.durationSeconds) || Number(DEFAULT_FORM.durationSeconds),
      prompt_influence: Number(form.promptInfluence) || Number(DEFAULT_FORM.promptInfluence),
      model_id: form.modelId.trim() || DEFAULT_FORM.modelId,
    };
    const repeatTrack = clampRepeatTrack(Number(form.repeatTrack) || Number(DEFAULT_FORM.repeatTrack));
    const userTitle = form.title.trim();
    const experimentTitle = userTitle || await generateExperimentTitle(requestPayload.text);
    const folderName = buildFolderName(experimentTitle);

    setIsGenerating(true);
    try {
      const elevenLabsService = new ElevenLabsService();
      const result = await elevenLabsService.generateSound(requestPayload);
      const generatedAt = new Date().toISOString();
      const stitchedAudioBlob = await repeatAudioBlob(result.audioBlob, repeatTrack);
      const stitchedFileSize = `${(stitchedAudioBlob.size / (1024 * 1024)).toFixed(1)} MB`;
      const stitchedDurationSeconds = requestPayload.duration_seconds
        ? requestPayload.duration_seconds * repeatTrack
        : undefined;
      const audioBase64 = await blobToBase64(stitchedAudioBlob);
      const actualAudioBase64 = await blobToBase64(result.audioBlob);
      const responsePayload = {
        format: repeatTrack > 1 ? "wav" : result.format,
        duration: stitchedDurationSeconds ? `${stitchedDurationSeconds}s` : result.duration,
        fileSize: stitchedFileSize,
        processingTime: result.processingTime,
        mimeType: repeatTrack > 1 ? "audio/wav" : result.mimeType,
        characterCost: result.characterCost,
        repeatTrack,
        generatedAt,
      };
      const savedAttempt = await LoopLabDownloadService.saveAttempt({
        folderName,
        request: {
          ...requestPayload,
          experimentTitle,
          repeatTrack,
        },
        response: responsePayload,
        audioBase64,
        audioFileName: `generated_loop.${repeatTrack > 1 ? "wav" : result.format || "mp3"}`,
        actualAudioBase64,
        actualAudioFileName: `actual_track.${result.format || "mp3"}`,
      });

      setTrackDetails((current) => ({
        ...current,
        [folderName]: {
          folderName,
          audioPath: savedAttempt.audioPath,
          request: {
            ...requestPayload,
            experimentTitle,
            repeatTrack,
          },
          response: responsePayload,
          error: null,
          review: { notes: "", tag: null },
        },
      }));
      setReviewDrafts((current) => ({
        ...current,
        [folderName]: { notes: "", tag: null },
      }));
      setExpandedTrack(folderName);
      setForm((current) => ({ ...current, title: "", text: "", repeatTrack: String(repeatTrack) }));
      await loadTracks();
      toast.success(`Loop generated, stitched ${repeatTrack} times, and archived in data/looplab_downloads`);
    } catch (error) {
      const generatedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : "Failed to generate loop";
      const details = typeof error === "object" && error !== null && "details" in error
        ? (error as { details?: unknown }).details
        : undefined;

      try {
        await LoopLabDownloadService.saveAttempt({
          folderName,
          request: {
            ...requestPayload,
            experimentTitle,
            repeatTrack,
          },
          error: {
            message,
            details,
            generatedAt,
          },
        });
        await loadTracks();
      } catch (archiveError) {
        console.error("Failed to archive LoopLab error:", archiveError);
      }

      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_34%)]" />

      <div className="mx-auto mt-10 mb-10" style={{ width: "90%" }}>
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(240,253,250,0.86))] p-8 shadow-[0_24px_80px_rgba(15,56,112,0.12)] backdrop-blur-xl md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-800">
                  <Sparkles className="h-4 w-4" />
                  <span>LoopLab Sound Loops</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl leading-tight text-foreground md:text-5xl">LoopLab</h1>
                  <p className="text-base leading-7 text-muted-foreground md:text-lg">
                    Generate loopable ambient sound effects with ElevenLabs sound generation, then browse archived request and response history from data/looplab_downloads.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {tracks.length} archived attempts
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {successCount} successful loops
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {errorCount} failed attempts
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-emerald-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.92))] p-6 shadow-[0_18px_50px_rgba(15,56,112,0.08)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(209,250,229,1),rgba(167,243,208,0.96))] text-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.16)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Generate Loop</h2>
                  <p className="text-sm text-muted-foreground">Defaults match the documented sound-generation endpoint.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Title</p>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="Soft Bowl Drone"
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prompt</p>
                  <Textarea
                    value={form.text}
                    onChange={(event) => updateForm("text", event.target.value)}
                    placeholder="48 bpm; D minor drone; deep ambient meditation music; warm sub bass drone, soft singing bowls, airy pad, no percussion, seamless infinite loop"
                    className="min-h-[160px]"
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Output Format</p>
                    <Input
                      value={form.outputFormat}
                      onChange={(event) => updateForm("outputFormat", event.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Duration Seconds</p>
                    <Input
                      type="number"
                      min="0.5"
                      max="22"
                      step="0.5"
                      value={form.durationSeconds}
                      onChange={(event) => updateForm("durationSeconds", event.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prompt Influence</p>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={form.promptInfluence}
                      onChange={(event) => updateForm("promptInfluence", event.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repeat Track</p>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      value={form.repeatTrack}
                      onChange={(event) => updateForm("repeatTrack", event.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Model ID</p>
                    <Input
                      value={form.modelId}
                      onChange={(event) => updateForm("modelId", event.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Loop Output</p>
                    <p className="text-sm text-muted-foreground">Keep the generated sound effect seamless for repeated playback.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{form.loop ? "Enabled" : "Disabled"}</span>
                    <Switch checked={form.loop} onCheckedChange={(checked) => updateForm("loop", checked)} disabled={isGenerating} />
                  </div>
                </div>

                <Button
                  onClick={() => void handleGenerateLoop()}
                  disabled={isGenerating || !form.text.trim()}
                  className="w-full rounded-2xl border-0 bg-[linear-gradient(135deg,#059669_0%,#0d9488_55%,#22c55e_100%)] text-white shadow-[0_18px_36px_rgba(5,150,105,0.28)] hover:shadow-[0_22px_42px_rgba(5,150,105,0.34)] disabled:opacity-90"
                >
                  {isGenerating ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Generating Loop...
                    </span>
                  ) : (
                    "Generate and Archive Loop"
                  )}
                </Button>
              </div>
            </Card>

            <Card className="border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,237,0.92))] p-6 shadow-[0_18px_50px_rgba(15,56,112,0.08)]">
              <h2 className="text-lg font-semibold">Archive Structure</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Every LoopLab attempt is written to its own folder in data/looplab_downloads with request, response or error, and the generated audio file when available.
              </p>

              <div className="mt-5 space-y-3 rounded-2xl border border-amber-100 bg-white/80 p-4 text-sm text-foreground shadow-inner">
                <p className="font-medium">Per-attempt files</p>
                <p>request.json</p>
                <p>response.json or error.json</p>
                <p>generated_loop.mp3 when the API returns audio</p>
              </div>

              <div className="mt-5 rounded-2xl border border-white/80 bg-slate-950 p-4 text-xs text-slate-100 shadow-[0_18px_36px_rgba(15,23,42,0.24)]">
                <pre className="whitespace-pre-wrap break-words">{`data/
  looplab_downloads/
    prompt_slug_timestamp/
      request.json
      response.json
      generated_loop.mp3`}</pre>
              </div>
            </Card>
          </section>

          <section className="rounded-[2rem] border border-white/75 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,56,112,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search History</p>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search prompt, model, or output format..."
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <Select value={statusFilter} onValueChange={(value: "all" | "success" | "error") => setStatusFilter(value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="All attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All attempts</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tag</p>
                  <Select value={tagFilter} onValueChange={(value: "all" | LoopLabReviewTag) => setTagFilter(value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_TAGS.map((tag) => (
                        <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Showing {filteredTracks.length} archived attempts, newest first.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))] p-4">
              <ScrollArea className="h-[560px] pr-3">
                {isLoadingHistory ? (
                  <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading LoopLab archive...
                    </span>
                  </div>
                ) : filteredTracks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTracks.map((track) => {
                      const detail = trackDetails[track.folderName];
                      const isExpanded = expandedTrack === track.folderName;
                      const isPlaying = playingTrack === track.folderName;

                      return (
                        <Card key={track.folderName} className="border-slate-200/70 bg-white/92 p-4 shadow-[0_10px_25px_rgba(20,33,61,0.06)]">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground">{buildTrackTitle(track)}</p>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${track.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                    {track.status}
                                  </span>
                                  {track.reviewTag ? (
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${track.reviewTag === "Good" ? "bg-sky-100 text-sky-800" : track.reviewTag === "Ok" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                                      {track.reviewTag}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground">{track.promptPreview || "No prompt preview stored."}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>{formatTimestamp(track.generatedAt)}</span>
                                  <span>{track.outputFormat}</span>
                                  <span>{track.durationSeconds ? `${track.durationSeconds}s` : "N/A"}</span>
                                  <span>{track.modelId}</span>
                                  {track.repeatTrack ? <span>{`x${track.repeatTrack}`}</span> : null}
                                  <span>{track.size}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {track.audioPath ? (
                                  <Button variant="outline" size="sm" onClick={() => void handleTogglePlay(track.folderName)}>
                                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {isPlaying ? "Pause" : "Play"}
                                  </Button>
                                ) : null}
                                <Button variant="outline" size="sm" onClick={() => void handleExpandTrack(track.folderName)}>
                                  <FileAudio className="h-4 w-4" />
                                  {isExpanded ? "Hide Details" : "Show Details"}
                                </Button>
                              </div>
                            </div>

                            {track.audioPath ? (
                              <audio
                                id={`looplab-audio-${track.folderName}`}
                                src={`/${track.audioPath}`}
                                loop
                                onPlay={() => setPlayingTrack(track.folderName)}
                                onPause={() => setPlayingTrack((current) => current === track.folderName ? null : current)}
                                onEnded={() => setPlayingTrack((current) => current === track.folderName ? null : current)}
                                className={isPlaying ? "w-full" : "hidden"}
                                controls={isPlaying}
                              />
                            ) : null}

                            {isExpanded ? (
                              <div className="space-y-4 border-t border-slate-200/70 pt-4">
                                {loadingTrackDetail === track.folderName && !detail ? (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                      Loading attempt details...
                                    </span>
                                  </div>
                                ) : detail ? (
                                  <>
                                    <div>
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Request</p>
                                      <pre className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(detail.request, null, 2)}</pre>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Response</p>
                                      <pre className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.96))] p-4 text-xs text-slate-800">{JSON.stringify(detail.response, null, 2)}</pre>
                                    </div>
                                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="space-y-2 lg:w-52">
                                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tag</p>
                                          <Select
                                            value={reviewDrafts[track.folderName]?.tag ?? "all"}
                                            onValueChange={(value: "all" | LoopLabReviewTag) => updateReviewDraft(track.folderName, "tag", value === "all" ? null : value)}
                                          >
                                            <SelectTrigger className="bg-white">
                                              <SelectValue placeholder="No tag" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="all">No tag</SelectItem>
                                              <SelectItem value="Good">Good</SelectItem>
                                              <SelectItem value="Ok">Ok</SelectItem>
                                              <SelectItem value="Bad">Bad</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => void handleSaveReview(track.folderName)}
                                          disabled={savingReviewFolder === track.folderName}
                                        >
                                          {savingReviewFolder === track.folderName ? (
                                            <span className="inline-flex items-center gap-2">
                                              <LoaderCircle className="h-4 w-4 animate-spin" />
                                              Saving...
                                            </span>
                                          ) : "Save Notes"}
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">User Notes</p>
                                        <Textarea
                                          value={reviewDrafts[track.folderName]?.notes ?? ""}
                                          onChange={(event) => updateReviewDraft(track.folderName, "notes", event.target.value)}
                                          placeholder="Add observations about seams, clipping, transitions, or mix quality..."
                                          className="min-h-[120px] bg-white"
                                        />
                                      </div>
                                    </div>
                                    {detail.error ? (
                                      <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Error</p>
                                        <pre className="overflow-x-auto rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">{JSON.stringify(detail.error, null, 2)}</pre>
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[500px] items-center justify-center text-center text-muted-foreground">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">No LoopLab history yet</p>
                      <p className="text-sm">Generate a loop to create the first archived request and response set.</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}