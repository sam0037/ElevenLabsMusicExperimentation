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

export interface SoundGenerationRequest {
  text: string;
  output_format?: string;
  loop?: boolean;
  duration_seconds?: number;
  prompt_influence?: number;
  model_id?: string;
}

export interface GeneratedAudioResponse {
  audioBlob: Blob;
  format: string;
  duration: string;
  fileSize: string;
  processingTime: string;
  mimeType?: string;
  characterCost?: string;
}

type ElevenLabsErrorBody = {
  detail?: {
    message?: string;
  };
  message?: string;
  error?: string;
};

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_CONFIG.elevenLabs.apiKey;
    this.baseUrl = API_CONFIG.elevenLabs.baseUrl;
  }

  private async parseErrorResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json().catch(() => ({}));
    }

    const responseText = await response.text().catch(() => "");
    return responseText || {};
  }

  private getErrorMessage(status: number, statusText: string, errorBody: unknown): string {
    if (typeof errorBody === "string" && errorBody.trim()) {
      return `Eleven Labs API Error: ${status} - ${errorBody}`;
    }

    const typedError = errorBody as ElevenLabsErrorBody;
    const message = typedError?.detail?.message || typedError?.message || typedError?.error || statusText;
    return `Eleven Labs API Error: ${status} - ${message}`;
  }
  
  /**
   * Create composition plan for meditative music.
   * Use the createCompositionPlan method to generate a composition plan based on a prompt, then modify the plan to ensure it includes meditation-specific styles and sections, and finally call generateMusic with the updated plan to create meditation music.
   * Use the updateCompositionPlanForMeditation method to modify the composition plan 
   */
  async createMeditationCompositionPlan(prompt: string): Promise<CompositionPlanResponse> {
    const plan = await this.createCompositionPlan(prompt);
    return this.updateCompositionPlanForMeditation(plan);
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
  ): Promise<GeneratedAudioResponse> {
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
      loop: true
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
        mimeType: audioBlob.type || response.headers.get("content-type") || "audio/mpeg",
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

  /**
   * Generate ambient sound or soundscape audio from a text prompt.
   */
  async generateSound(request: SoundGenerationRequest): Promise<GeneratedAudioResponse> {
    if (!this.apiKey) {
      throw new Error(
        "Eleven Labs API key not configured. Please add your API key in /src/config/api-config.ts"
      );
    }

    const startTime = Date.now();
    const requestBody = {
      loop: request.loop ?? true,
      duration_seconds: request.duration_seconds ?? 20,
      prompt_influence: request.prompt_influence ?? 0.5,
      model_id: request.model_id ?? "eleven_text_to_sound_v2",
      text: request.text,
    };
    const outputFormat = request.output_format ?? "mp3_44100_192";
    const requestUrl = `${this.baseUrl}/sound-generation?${new URLSearchParams({
      output_format: outputFormat,
    }).toString()}`;
    let errorLogged = false;
    const requestHeaders = {
      "Content-Type": "application/json",
      "xi-api-key": this.apiKey,
    };

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      const endTime = Date.now();

      if (!response.ok) {
        const error = await this.parseErrorResponseBody(response);
        const errorMessage = this.getErrorMessage(response.status, response.statusText, error);
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "generateSound",
          startTime,
          endTime,
          request: {
            url: requestUrl,
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
            new Error(errorMessage),
            error
          ),
        });
        errorLogged = true;
        throw Object.assign(new Error(errorMessage), { details: error });
      }

      const responseContentType = response.headers.get("content-type") || "";
      if (!responseContentType.includes("audio") && !responseContentType.includes("octet-stream")) {
        const responseText = await response.text().catch(() => "");

        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "generateSound",
          startTime,
          endTime,
          request: {
            url: requestUrl,
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: ApiLogService.headersToObject(response.headers),
            body: responseText,
          },
          error: ApiLogService.buildError(
            new Error("Eleven Labs sound-generation returned a non-audio response"),
            responseText
          ),
        });
        errorLogged = true;
        throw Object.assign(new Error("Eleven Labs sound-generation returned a non-audio response"), {
          details: responseText,
        });
      }

      const audioBlob = await response.blob();
      const processingTime = ((endTime - startTime) / 1000).toFixed(1);
      const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(1);
      const result = {
        audioBlob,
        format: outputFormat.split("_")[0] || "mp3",
        duration: `${requestBody.duration_seconds}s`,
        fileSize: `${fileSizeMB} MB`,
        processingTime: `${processingTime}s`,
        mimeType: audioBlob.type || response.headers.get("content-type") || "audio/mpeg",
        characterCost: response.headers.get("character-cost") || undefined,
      };

      await ApiLogService.log({
        apiName: "elevenlabs",
        operation: "generateSound",
        startTime,
        endTime,
        request: {
          url: requestUrl,
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
              characterCost: response.headers.get("character-cost") || undefined,
            },
          },
        },
      });

      return result;
    } catch (error) {
      if (!errorLogged) {
        await ApiLogService.log({
          apiName: "elevenlabs",
          operation: "generateSound",
          startTime,
          endTime: Date.now(),
          request: {
            url: requestUrl,
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
   * Generate musinc for meditation based on a composition plan, ensuring the plan is updated with meditation-specific styles and sections.
   * Call generateMusic with the updated plan to create meditation music.
   */
  async generateMeditationMusic(
    compositionPlan: CompositionPlanResponse
  ): Promise<GeneratedAudioResponse> {
    const updatedPlan = this.updateCompositionPlanForMeditation(compositionPlan);
    return await this.generateMusic("", updatedPlan);
  }

  /**
   * Method to update the eleven lab composition plan with meditation specific details.
   * 1. The last section should have negative style as long silence appended to it
   * 2. positive_global_styles should have "meditative" appended to it if not already present
   */
  updateCompositionPlanForMeditation(
    plan: CompositionPlanResponse,
  ): CompositionPlanResponse {
    const updatedPlan = { ...plan };
    
    if (updatedPlan.sections.length > 0) {
      const lastSection = updatedPlan.sections[updatedPlan.sections.length - 1];
      const must_have_negative_local_styles = ["long silence", "abrupt end"];
      for (const style of must_have_negative_local_styles) {
        if (!lastSection.negative_local_styles.includes(style)) {
          lastSection.negative_local_styles.push(style);
        }
      }

      const must_have_positive_local_styles = ["leading back to start"];
      for (const style of must_have_positive_local_styles) {
        if (!lastSection.positive_local_styles.includes(style)) {
          lastSection.positive_local_styles.push(style);
        }
      }
    }
    
    const must_global_styles = ["meditative", "ambient", "calm", "relaxing", "soulful", "dreamy"];
    for (const style of must_global_styles) {
      if (!updatedPlan.positive_global_styles.includes(style)) {
        updatedPlan.positive_global_styles.push(style);
      }
    }

    const must_negative_global_styles = ["energetic", "aggressive", "harsh", "intense", "high notes", "sudden changes"];
    for (const style of must_negative_global_styles) {
      if (!updatedPlan.negative_global_styles.includes(style)) {
        updatedPlan.negative_global_styles.push(style);
      }
    }
    
    return updatedPlan;
  }
}
