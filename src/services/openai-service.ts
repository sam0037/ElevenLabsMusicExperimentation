// OpenAI API Service

import { API_CONFIG } from "../config/api-config";
import { ApiLogService } from "./api-log-service";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export type TitleContext = "chat" | "plan" | "looplab";

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_CONFIG.openai.apiKey;
    this.baseUrl = API_CONFIG.openai.baseUrl;
  }

  async createChatCompletion(
    messages: ChatMessage[],
    model?: string
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not configured. Please add your API key in /src/config/api-config.ts"
      );
    }

    const startTime = Date.now();
    const requestBody = {
      model: model || API_CONFIG.openai.defaultModel,
      messages,
    };
    let errorLogged = false;
    const requestHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });
      const endTime = Date.now();

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        await ApiLogService.log({
          apiName: "openai",
          operation: "createChatCompletion",
          startTime,
          endTime,
          request: {
            url: `${this.baseUrl}/chat/completions`,
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
              `OpenAI API Error: ${response.status} - ${error.error?.message || response.statusText}`
            ),
            error
          ),
        });
        errorLogged = true;
        throw new Error(
          `OpenAI API Error: ${response.status} - ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      await ApiLogService.log({
        apiName: "openai",
        operation: "createChatCompletion",
        startTime,
        endTime,
        request: {
          url: `${this.baseUrl}/chat/completions`,
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: ApiLogService.headersToObject(response.headers),
          body: data,
        },
      });

      return data;
    } catch (error) {
      if (!errorLogged) {
        await ApiLogService.log({
          apiName: "openai",
          operation: "createChatCompletion",
          startTime,
          endTime: Date.now(),
          request: {
            url: `${this.baseUrl}/chat/completions`,
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

  async listModels(): Promise<any> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not configured. Please add your API key in /src/config/api-config.ts"
      );
    }

    const startTime = Date.now();
    let errorLogged = false;
    const requestHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: requestHeaders,
      });
      const endTime = Date.now();

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        await ApiLogService.log({
          apiName: "openai",
          operation: "listModels",
          startTime,
          endTime,
          request: {
            url: `${this.baseUrl}/models`,
            method: "GET",
            headers: requestHeaders,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: ApiLogService.headersToObject(response.headers),
            body: error,
          },
          error: ApiLogService.buildError(
            new Error(
              `OpenAI API Error: ${response.status} - ${error.error?.message || response.statusText}`
            ),
            error
          ),
        });
        errorLogged = true;
        throw new Error(
          `OpenAI API Error: ${response.status} - ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      await ApiLogService.log({
        apiName: "openai",
        operation: "listModels",
        startTime,
        endTime,
        request: {
          url: `${this.baseUrl}/models`,
          method: "GET",
          headers: requestHeaders,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: ApiLogService.headersToObject(response.headers),
          body: data,
        },
      });

      return data;
    } catch (error) {
      if (!errorLogged) {
        await ApiLogService.log({
          apiName: "openai",
          operation: "listModels",
          startTime,
          endTime: Date.now(),
          request: {
            url: `${this.baseUrl}/models`,
            method: "GET",
            headers: requestHeaders,
          },
          error: ApiLogService.buildError(error),
        });
      }
      throw error;
    }
  }

  async generateTitle(
    sourceText: string,
    context: TitleContext
  ): Promise<string> {
    const contextLabel =
      context === "chat"
        ? "chat conversation"
        : context === "looplab"
          ? "LoopLab sound experiment"
          : "music composition plan";
    const response = await this.createChatCompletion([
      {
        role: "system",
        content:
          "You create concise titles. Return only the title text, no quotes, no punctuation at start/end, max 7 words.",
      },
      {
        role: "user",
        content: `Create a short title for this ${contextLabel}:\n\n${sourceText}`,
      },
    ]);

    const rawTitle = response.choices?.[0]?.message?.content?.trim();
    if (!rawTitle) {
      return "";
    }

    return rawTitle
      .replace(/^["'\s]+|["'\s]+$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 80);
  }
}
