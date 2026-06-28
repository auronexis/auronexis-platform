import "server-only";

import OpenAI from "openai";
import type {
  AIGenerateRequest,
  AIGenerateResponse,
  AIHealthStatus,
  AIImproveRequest,
  AISummarizeRequest,
} from "@/lib/ai/types";
import type { AIProvider } from "@/lib/ai/providers/types";
import {
  AI_GENERIC_ERROR_MESSAGE,
  AI_TIMEOUT_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";

const REQUEST_TIMEOUT_MS = 45_000;

function mapOpenAIError(error: unknown): AIUserError {
  if (error instanceof AIUserError) {
    return error;
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      return new AIUserError(
        "The AI provider rate limit was reached. Please wait a moment and try again.",
        "provider_error",
        true,
      );
    }

    if (error.status === 401 || error.status === 403) {
      return new AIUserError(AI_GENERIC_ERROR_MESSAGE, "provider_error", false);
    }
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new AIUserError(AI_TIMEOUT_MESSAGE, "timeout", true);
  }

  return new AIUserError(AI_GENERIC_ERROR_MESSAGE, "provider_error", true);
}

function toGenerateResponse(
  model: string,
  content: string,
  usage?: { prompt_tokens?: number; completion_tokens?: number },
): AIGenerateResponse {
  return {
    content,
    providerId: "openai",
    model,
    isPlaceholder: false,
    finishReason: "stop",
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
        }
      : undefined,
  };
}

/** OpenAI provider — server-only. Never import from client components. */
export class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const;
  readonly displayName = "OpenAI";

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
    this.model = model;
  }

  private async createCompletion(prompt: string): Promise<AIGenerateResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are a professional report writing assistant for Auroranexis. Follow instructions precisely. Never invent facts, metrics, incidents, risks, revenue, SLA values, or client details. Mark missing information clearly.",
          },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new AIUserError(AI_GENERIC_ERROR_MESSAGE, "provider_error", true);
      }

      return toGenerateResponse(this.model, content, completion.usage);
    } catch (error) {
      throw mapOpenAIError(error);
    }
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    return this.createCompletion(request.prompt);
  }

  async *stream(request: AIGenerateRequest): AsyncIterable<string> {
    const response = await this.createCompletion(request.prompt);
    yield response.content;
  }

  async summarize(request: AISummarizeRequest): Promise<AIGenerateResponse> {
    return this.createCompletion(
      `Summarize the following report text while preserving meaning:\n\n${request.text}`,
    );
  }

  async improve(request: AIImproveRequest): Promise<AIGenerateResponse> {
    return this.createCompletion(
      `${request.instruction}\n\nText to improve:\n${request.text}`,
    );
  }

  async health(): Promise<AIHealthStatus> {
    const started = Date.now();

    try {
      await this.client.models.list();
      return {
        ok: true,
        providerId: "openai",
        message: `OpenAI provider healthy (${this.model}).`,
        latencyMs: Date.now() - started,
      };
    } catch {
      return {
        ok: false,
        providerId: "openai",
        message: "OpenAI provider health check failed.",
        latencyMs: Date.now() - started,
      };
    }
  }
}

export function createOpenAIProvider(apiKey: string, model: string): OpenAIProvider {
  return new OpenAIProvider(apiKey, model);
}
