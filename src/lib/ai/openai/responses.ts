import "server-only";

import {
  backoffDelayMs,
  classifyOpenAIError,
  isRetryableOpenAIError,
  sleep,
} from "@/lib/ai/openai/errors";
import { getOpenAIClient } from "@/lib/ai/openai/client";
import { getOpenAIPlatformConfig } from "@/lib/ai/openai/config";
import type { OpenAIErrorCode } from "@/lib/ai/openai/types";

export type OpenAIResponseResult = {
  outputText: string;
  model: string;
  latencyMs: number;
  providerRequestId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type OpenAIResponseFailure = {
  ok: false;
  errorCode: OpenAIErrorCode;
  sanitizedMessage: string;
  providerRequestId: string | null;
  latencyMs: number;
};

export type OpenAIResponseSuccess = OpenAIResponseResult & { ok: true };

function extractOutputText(response: {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}): string {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

export async function runOpenAIResponse(input: {
  instructions: string;
  userInput: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  maxAttempts?: number;
}): Promise<OpenAIResponseSuccess | OpenAIResponseFailure> {
  const config = getOpenAIPlatformConfig();
  const client = getOpenAIClient();
  const started = Date.now();

  if (!client || config.state === "disabled") {
    return {
      ok: false,
      errorCode: "disabled",
      sanitizedMessage: "AI is disabled.",
      providerRequestId: null,
      latencyMs: Date.now() - started,
    };
  }

  if (config.state === "not_configured") {
    return {
      ok: false,
      errorCode: "not_configured",
      sanitizedMessage: "OpenAI is not configured.",
      providerRequestId: null,
      latencyMs: Date.now() - started,
    };
  }

  const maxAttempts = input.maxAttempts ?? 2;
  let lastFailure: OpenAIResponseFailure | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await client.responses.create(
        {
          model: config.model,
          instructions: input.instructions,
          input: input.userInput,
          max_output_tokens: input.maxOutputTokens ?? config.maxOutputTokens,
          store: false,
        },
        { signal: input.signal },
      );

      const outputText = extractOutputText(response);
      if (!outputText) {
        return {
          ok: false,
          errorCode: "malformed_output",
          sanitizedMessage: "OpenAI returned an empty response.",
          providerRequestId: response.id ?? null,
          latencyMs: Date.now() - started,
        };
      }

      return {
        ok: true,
        outputText,
        model: response.model ?? config.model,
        latencyMs: Date.now() - started,
        providerRequestId: response.id ?? null,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      };
    } catch (error) {
      const classified = classifyOpenAIError(error);
      lastFailure = {
        ok: false,
        errorCode: classified.code,
        sanitizedMessage: classified.sanitizedMessage,
        providerRequestId: classified.providerRequestId,
        latencyMs: Date.now() - started,
      };

      if (!isRetryableOpenAIError(classified.code) || attempt === maxAttempts - 1) {
        return lastFailure;
      }

      await sleep(backoffDelayMs(attempt));
    }
  }

  return (
    lastFailure ?? {
      ok: false,
      errorCode: "unknown",
      sanitizedMessage: "OpenAI request failed.",
      providerRequestId: null,
      latencyMs: Date.now() - started,
    }
  );
}

/** Minimal no-customer-data connection probe via Responses API. */
export async function runOpenAIConnectionProbe(signal?: AbortSignal) {
  return runOpenAIResponse({
    instructions: "Reply with exactly OK.",
    userInput: "Health check.",
    maxOutputTokens: 16,
    signal,
    maxAttempts: 1,
  });
}

export async function runOpenAIStructuredResponse(input: {
  instructions: string;
  userInput: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}): Promise<OpenAIResponseSuccess | OpenAIResponseFailure> {
  const config = getOpenAIPlatformConfig();
  const client = getOpenAIClient();
  const started = Date.now();

  if (!client || config.state === "disabled") {
    return {
      ok: false,
      errorCode: "disabled",
      sanitizedMessage: "AI is disabled.",
      providerRequestId: null,
      latencyMs: Date.now() - started,
    };
  }

  if (config.state === "not_configured") {
    return {
      ok: false,
      errorCode: "not_configured",
      sanitizedMessage: "OpenAI is not configured.",
      providerRequestId: null,
      latencyMs: Date.now() - started,
    };
  }

  try {
    const response = await client.responses.create(
      {
        model: config.model,
        instructions: input.instructions,
        input: input.userInput,
        max_output_tokens: input.maxOutputTokens ?? config.maxOutputTokens,
        store: false,
        text: {
          format: {
            type: "json_schema",
            name: input.schemaName,
            strict: true,
            schema: input.schema,
          },
        },
      },
      { signal: input.signal },
    );

    const outputText = extractOutputText(response);
    if (!outputText) {
      return {
        ok: false,
        errorCode: "malformed_output",
        sanitizedMessage: "OpenAI returned an empty response.",
        providerRequestId: response.id ?? null,
        latencyMs: Date.now() - started,
      };
    }

    return {
      ok: true,
      outputText,
      model: response.model ?? config.model,
      latencyMs: Date.now() - started,
      providerRequestId: response.id ?? null,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      totalTokens: response.usage?.total_tokens ?? null,
    };
  } catch (error) {
    const classified = classifyOpenAIError(error);
    return {
      ok: false,
      errorCode: classified.code,
      sanitizedMessage: classified.sanitizedMessage,
      providerRequestId: classified.providerRequestId,
      latencyMs: Date.now() - started,
    };
  }
}
