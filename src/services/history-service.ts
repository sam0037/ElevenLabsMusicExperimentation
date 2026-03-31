const CHAT_KEY = "chat-conversations";
const PLANS_KEY = "composition-plans";
const MUSIC_KEY = "music-generations";
const API_ENDPOINT = "/api/history";

interface HistoryStore {
  chatConversations?: unknown[];
  compositionPlans?: unknown[];
  musicGenerations?: unknown[];
}

async function loadFromApi(): Promise<HistoryStore | null> {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HistoryStore;
  } catch {
    return null;
  }
}

async function saveToApi(partial: HistoryStore): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partial),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveToLocalStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export class HistoryService {
  static async loadChatConversations<T>(): Promise<T[] | null> {
    const apiData = await loadFromApi();
    if (apiData?.chatConversations !== undefined) {
      const data = apiData.chatConversations as T[];
      saveToLocalStorage(CHAT_KEY, data);
      return data;
    }
    return loadFromLocalStorage<T[]>(CHAT_KEY);
  }

  static async saveChatConversations<T>(conversations: T[]): Promise<void> {
    saveToLocalStorage(CHAT_KEY, conversations);
    await saveToApi({ chatConversations: conversations });
  }

  static async loadCompositionPlans<T>(): Promise<T[] | null> {
    const apiData = await loadFromApi();
    if (apiData?.compositionPlans !== undefined) {
      const data = apiData.compositionPlans as T[];
      saveToLocalStorage(PLANS_KEY, data);
      return data;
    }
    return loadFromLocalStorage<T[]>(PLANS_KEY);
  }

  static async saveCompositionPlans<T>(plans: T[]): Promise<void> {
    saveToLocalStorage(PLANS_KEY, plans);
    await saveToApi({ compositionPlans: plans });
  }

  static async loadMusicGenerations<T>(): Promise<T[] | null> {
    const apiData = await loadFromApi();
    if (apiData?.musicGenerations !== undefined) {
      const data = apiData.musicGenerations as T[];
      saveToLocalStorage(MUSIC_KEY, data);
      return data;
    }
    return loadFromLocalStorage<T[]>(MUSIC_KEY);
  }

  static async saveMusicGenerations<T>(music: T[]): Promise<void> {
    saveToLocalStorage(MUSIC_KEY, music);
    await saveToApi({ musicGenerations: music });
  }

  static async persistAudioBlob(
    blob: Blob,
    audioId: string
  ): Promise<{ audioUrl: string; audioPath?: string }> {
    const fallbackUrl = URL.createObjectURL(blob);
    try {
      const requestUrl = `/api/audio?filename=${encodeURIComponent(`${audioId}.mp3`)}`;
      const response = await fetch(
        requestUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": blob.type || "audio/mpeg",
          },
          body: blob,
        }
      );

      if (!response.ok) {
        return { audioUrl: fallbackUrl };
      }

      const payload = (await response.json()) as {
        audioUrl?: string;
        audioPath?: string;
      };

      if (!payload.audioUrl) {
        return { audioUrl: fallbackUrl };
      }

      return {
        audioUrl: payload.audioUrl,
        audioPath: payload.audioPath,
      };
    } catch {
      return { audioUrl: fallbackUrl };
    }
  }
}
