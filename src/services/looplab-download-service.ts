export type LoopLabExportPayload = {
  folderName: string;
  request: unknown;
  response?: unknown;
  error?: unknown;
  audioBase64?: string;
  audioFileName?: string;
  actualAudioBase64?: string;
  actualAudioFileName?: string;
};

export type LoopLabReviewTag = "Good" | "Ok" | "Bad";

export type LoopLabReview = {
  notes: string;
  tag: LoopLabReviewTag | null;
  updatedAt?: string;
};

export type LoopLabExportResponse = {
  ok: boolean;
  folderPath: string;
  audioPath?: string;
  files: string[];
};

export type LoopLabTrackSummary = {
  folderName: string;
  folderPath: string;
  audioPath?: string;
  title: string;
  promptPreview: string;
  outputFormat: string;
  durationSeconds: number | null;
  promptInfluence: number | null;
  repeatTrack: number | null;
  loop: boolean;
  modelId: string;
  reviewTag: LoopLabReviewTag | null;
  status: "success" | "error";
  size: string;
  generatedAt: string;
};

export type LoopLabTrackListResponse = {
  ok: boolean;
  tracks: LoopLabTrackSummary[];
};

export type LoopLabTrackDetailResponse = {
  ok: boolean;
  track: {
    folderName: string;
    audioPath?: string;
    request: unknown;
    response: unknown;
    error: unknown;
    review: LoopLabReview;
  };
};

export class LoopLabDownloadService {
  static async saveAttempt(payload: LoopLabExportPayload): Promise<LoopLabExportResponse> {
    const response = await fetch("/api/looplab-export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error?.error === "string" ? error.error : "Failed to save LoopLab attempt",
      );
    }

    return (await response.json()) as LoopLabExportResponse;
  }

  static async listTracks(): Promise<LoopLabTrackListResponse> {
    const response = await fetch("/api/looplab-tracks");
    if (!response.ok) {
      throw new Error("Failed to load LoopLab tracks");
    }

    return (await response.json()) as LoopLabTrackListResponse;
  }

  static async getTrack(folderName: string): Promise<LoopLabTrackDetailResponse> {
    const url = new URL("/api/looplab-track", window.location.origin);
    url.searchParams.set("folderName", folderName);

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error?.error === "string" ? error.error : "Failed to load LoopLab track",
      );
    }

    return (await response.json()) as LoopLabTrackDetailResponse;
  }

  static async saveReview(folderName: string, review: LoopLabReview): Promise<{ ok: boolean }> {
    const response = await fetch("/api/looplab-track-review", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folderName, review }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error?.error === "string" ? error.error : "Failed to save LoopLab review",
      );
    }

    return (await response.json()) as { ok: boolean };
  }
}