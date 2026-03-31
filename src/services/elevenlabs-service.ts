// Eleven Labs API Service

import { API_CONFIG } from "../config/api-config";
import { ApiLogService } from "./api-log-service";

export interface CompositionPlanPrompt {
  prompt: string; // JSON string containing detailed composition instructions
}

export interface CompositionPlanResponse {
  positive_global_styles: string[];
  negative_global_styles: string[];
  sections: Array<{
    section_name: string;
    positive_local_styles: string[];
    negative_local_styles: string[];
    duration_ms: number;
    lines: any[];
  }>;
}

export interface MusicGenerationFromPromptRequest {
  prompt: string; // JSON string or simple text prompt
  music_length_ms?: number;
  model_id?: string;
  force_instrumental?: boolean;
  respect_sections_durations?: boolean;
  store_for_inpainting?: boolean;
  sign_with_c2pa?: boolean;
}

export interface MusicGenerationFromPlanRequest {
  composition_plan: CompositionPlanResponse | string; // Can be the plan object or JSON string
  model_id?: string;
  seed?: number;
  force_instrumental?: boolean;
  respect_sections_durations?: boolean;
  store_for_inpainting?: boolean;
  sign_with_c2pa?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_CONFIG.elevenLabs.apiKey;
    this.baseUrl = API_CONFIG.elevenLabs.baseUrl;
  }

  /**
   * Generate a composition plan from a prompt
   */
  async createCompositionPlan(
    prompt: string
  ): Promise<CompositionPlanResponse> {
    if (!this.apiKey) {
      throw new Error(
        "Eleven Labs API key not configured. Please add your API key in /src/config/api-config.ts"
      );
    }

    const startTime = Date.now();
    const requestBody = {
      prompt: prompt,
    };
    let errorLogged = false;
    const requestHeaders = {
      "Content-Type": "application/json",
      "xi-api-key": this.apiKey,
    };

    try {
      const response = await fetch(`${this.baseUrl}/music/plan`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      const endTime = Date.now();

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "createCompositionPlan",
          startTime,
          endTime,
          request: {
            url: `${this.baseUrl}/music/plan`,
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: ApiLogService.headersToObject(response.headers),
            body: error,
          },
          error: ApiLogService.buildError(
            new Error(
              `Eleven Labs API Error: ${response.status} - ${error.detail?.message || response.statusText}`
            ),
            error
          ),
        });
        errorLogged = true;
        throw new Error(
          `Eleven Labs API Error: ${response.status} - ${error.detail?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const processingTime = ((endTime - startTime) / 1000).toFixed(1);
      const enrichedResponse = {
        ...data,
        plan: JSON.stringify(data, null, 2), // Format the plan for display
        tokensUsed: Math.floor(Math.random() * 500) + 800, // Mock tokens
        processingTime: `${processingTime}s`,
        confidence: 0.95,
      };

      await ApiLogService.log({
        apiName: "elevenlabs",
        operation: "createCompositionPlan",
        startTime,
        endTime,
        request: {
          url: `${this.baseUrl}/music/plan`,
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: ApiLogService.headersToObject(response.headers),
          body: enrichedResponse,
        },
      });

      return enrichedResponse;
    } catch (error) {
      if (!errorLogged) {
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "createCompositionPlan",
          startTime,
          endTime: Date.now(),
          request: {
            url: `${this.baseUrl}/music/plan`,
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          },
          error: ApiLogService.buildError(error),
        });
      }
      throw error;
    }
  }

  /**
   * Generate music from a text prompt or composition plan
   */
  async generateMusic(
    prompt: string,
    compositionPlan?: CompositionPlanResponse
  ): Promise<{
    audioBlob: Blob;
    format: string;
    duration: string;
    fileSize: string;
    processingTime: string;
  }> {
    if (!this.apiKey) {
      throw new Error(
        "Eleven Labs API key not configured. Please add your API key in /src/config/api-config.ts"
      );
    }

    const startTime = Date.now();
    const requestBody: any = {
      model_id: API_CONFIG.elevenLabs.defaultModel,
      force_instrumental: compositionPlan ? false : true,
      respect_sections_durations: compositionPlan ? true : false,
      store_for_inpainting: false,
      sign_with_c2pa: false,
    };
    let errorLogged = false;
    const requestHeaders = {
      "Content-Type": "application/json",
      "xi-api-key": this.apiKey,
    };

    if (compositionPlan) {
      requestBody.composition_plan = compositionPlan;
    } else {
      requestBody.prompt = prompt;
      requestBody.music_length_ms = 30000;
    }

    try {
      const response = await fetch(`${this.baseUrl}/music`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      const endTime = Date.now();

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "generateMusic",
          startTime,
          endTime,
          request: {
            url: `${this.baseUrl}/music`,
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: ApiLogService.headersToObject(response.headers),
            body: error,
          },
          error: ApiLogService.buildError(
            new Error(
              `Eleven Labs API Error: ${response.status} - ${error.detail?.message || response.statusText}`
            ),
            error
          ),
        });
        errorLogged = true;
        throw new Error(
          `Eleven Labs API Error: ${response.status} - ${error.detail?.message || response.statusText}`
        );
      }

      // The API returns audio data as blob
      const audioBlob = await response.blob();
      const processingTime = ((endTime - startTime) / 1000).toFixed(1);

      // Calculate duration and file size
      const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(1);
      const result = {
        audioBlob,
        format: "mp3",
        duration: "N/A", // Duration would need to be parsed from audio
        fileSize: `${fileSizeMB} MB`,
        processingTime: `${processingTime}s`,
      };

      await ApiLogService.log({
        apiName: "elevenlabs",
        operation: "generateMusic",
        startTime,
        endTime,
        request: {
          url: `${this.baseUrl}/music`,
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: ApiLogService.headersToObject(response.headers),
          body: {
            type: "binary",
            mimeType: audioBlob.type || response.headers.get("content-type") || "audio/mpeg",
            sizeBytes: audioBlob.size,
            derived: {
              format: result.format,
              duration: result.duration,
              fileSize: result.fileSize,
              processingTime: result.processingTime,
            },
          },
        },
      });

      return result;
    } catch (error) {
      if (!errorLogged) {
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "generateMusic",
          startTime,
          endTime: Date.now(),
          request: {
            url: `${this.baseUrl}/music`,
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          },
          error: ApiLogService.buildError(error),
        });
      }
      throw error;
    }
  }
}
