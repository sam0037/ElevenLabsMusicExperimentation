export type MyPrayersClubExportPayload = {
  folderName: string;
  audioBase64: string;
  audioFileName: string;
  parameters: unknown;
  compositionPlan: unknown;
  elevenLabsPlan: unknown;
  generatedMusic: unknown;
};

export type MyPrayersClubExportResponse = {
  ok: boolean;
  folderPath: string;
  audioPath: string;
  files: string[];
};

export type MyPrayersClubTrackSummary = {
  folderName: string;
  folderPath: string;
  audioPath: string;
  songName: string;
  toolId: string;
  feeling: string;
  key: string;
  bpm: number | null;
  duration: string;
  size: string;
  generatedAt: string;
};

export type MyPrayersClubTrackListResponse = {
  ok: boolean;
  tracks: MyPrayersClubTrackSummary[];
  toolIds: string[];
};

export type MyPrayersClubTrackDetailResponse = {
  ok: boolean;
  track: {
    folderName: string;
    audioPath: string;
    parameters: unknown;
    compositionPlan: unknown;
    elevenLabsPlan: unknown;
    generatedMusic: unknown;
  };
};

export class MyPrayersClubDownloadService {
  static async saveBundle(payload: MyPrayersClubExportPayload): Promise<MyPrayersClubExportResponse> {
    const response = await fetch("/api/myprayersclub-export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error?.error === "string" ? error.error : "Failed to save MyPrayersClub bundle",
      );
    }

    return (await response.json()) as MyPrayersClubExportResponse;
  }

  static async listTracks(toolId?: string): Promise<MyPrayersClubTrackListResponse> {
    const url = new URL("/api/myprayersclub-tracks", window.location.origin);
    if (toolId) {
      url.searchParams.set("toolId", toolId);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load MyPrayersClub tracks");
    }

    return (await response.json()) as MyPrayersClubTrackListResponse;
  }

  static async getTrack(folderName: string): Promise<MyPrayersClubTrackDetailResponse> {
    const url = new URL("/api/myprayersclub-track", window.location.origin);
    url.searchParams.set("folderName", folderName);

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error?.error === "string" ? error.error : "Failed to load MyPrayersClub track",
      );
    }

    return (await response.json()) as MyPrayersClubTrackDetailResponse;
  }
}
