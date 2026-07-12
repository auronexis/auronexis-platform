import "server-only";

import OpenAI from "openai";
import type { OpenAIErrorCode } from "@/lib/ai/openai/types";

export type ClassifiedOpenAIError = {
  code: OpenAIErrorCode;
  retryable: boolean;
  sanitizedMessage: string;
  providerRequestId: string | null;
};

const SAFE_AUTH_MESSAGE = "OpenAI authentication failed. Verify the server API key.";
const SAFE_RATE_LIMIT_MESSAGE = "OpenAI rate limit reached. Please wait and try again.";
const SAFE_QUOTA_MESSAGE = "OpenAI quota or billing limit reached.";
const SAFE_TIMEOUT_MESSAGE = "OpenAI request timed out. Please try again.";
const SAFE_UNAVAILABLE_MESSAGE = "OpenAI is temporarily unavailable. Please try again.";
const SAFE_INVALID_MESSAGE = "OpenAI rejected the request.";
const SAFE_GENERIC_MESSAGE = "OpenAI request failed. Please try again.";

export function classifyOpenAIError(error: unknown): ClassifiedOpenAIError {
  if (error instanceof OpenAI.APIError) {
    const requestId =
      typeof error.headers?.get === "function"
        ? error.headers.get("x-request-id")
        : null;

    if (error.status === 401) {
      return {
        code: "authentication",
        retryable: false,
        sanitizedMessage: SAFE_AUTH_MESSAGE,
        providerRequestId: requestId,
      };
    }
    if (error.status === 403) {
      return {
        code: "permission",
        retryable: false,
        sanitizedMessage: SAFE_AUTH_MESSAGE,
        providerRequestId: requestId,
      };
    }
    if (error.status === 429) {
      const code = /quota|billing/i.test(error.message) ? "quota_or_billing" : "rate_limited";
      return {
        code,
        retryable: true,
        sanitizedMessage: code === "quota_or_billing" ? SAFE_QUOTA_MESSAGE : SAFE_RATE_LIMIT_MESSAGE,
        providerRequestId: requestId,
      };
    }
    if (error.status === 408 || error.status === 504) {
      return {
        code: "timeout",
        retryable: true,
        sanitizedMessage: SAFE_TIMEOUT_MESSAGE,
        providerRequestId: requestId,
      };
    }
    if (error.status && error.status >= 500) {
      return {
        code: "provider_unavailable",
        retryable: true,
        sanitizedMessage: SAFE_UNAVAILABLE_MESSAGE,
        providerRequestId: requestId,
      };
    }
    return {
      code: "invalid_request",
      retryable: false,
      sanitizedMessage: SAFE_INVALID_MESSAGE,
      providerRequestId: requestId,
    };
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return {
        code: "timeout",
        retryable: true,
        sanitizedMessage: SAFE_TIMEOUT_MESSAGE,
        providerRequestId: null,
      };
    }
  }

  return {
    code: "unknown",
    retryable: true,
    sanitizedMessage: SAFE_GENERIC_MESSAGE,
    providerRequestId: null,
  };
}

export function isRetryableOpenAIError(code: OpenAIErrorCode): boolean {
  return (
    code === "rate_limited" ||
    code === "timeout" ||
    code === "provider_unavailable" ||
    code === "unknown"
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function backoffDelayMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 8000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}
