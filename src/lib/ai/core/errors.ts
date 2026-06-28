/**
 * Shared AI Core — unified error mapping for all server actions.
 * Never expose raw provider messages to clients.
 */

import {
  AI_ACCESS_DENIED_MESSAGE,
  AI_GENERIC_ERROR_MESSAGE,
  AI_PLAN_RESTRICTED_MESSAGE,
  AI_RATE_LIMIT_MESSAGE,
  AI_TIMEOUT_MESSAGE,
  AIUserError,
  type AIErrorCode,
} from "@/lib/ai/errors";
import { AuthorizationError } from "@/lib/rbac/guards";

export type AIActionErrorResult = {
  ok: false;
  error: string;
  code: AIErrorCode;
  retryable: boolean;
};

export type AIActionSuccessResult<T = unknown> = { ok: true } & T;

export const AI_ERROR_MESSAGES: Record<AIErrorCode, string> = {
  plan_restricted: AI_PLAN_RESTRICTED_MESSAGE,
  rate_limit: AI_RATE_LIMIT_MESSAGE,
  provider_error: AI_GENERIC_ERROR_MESSAGE,
  access_denied: AI_ACCESS_DENIED_MESSAGE,
  validation: "Invalid AI request. Please refresh and try again.",
  timeout: AI_TIMEOUT_MESSAGE,
  missing_context: "Not enough verified data available for this analysis.",
  invalid_response: "The AI response could not be used. Please try again.",
  parsing_failed: "Unable to parse the AI response. Please try again.",
  cancelled: "Generation was cancelled.",
  provider_unavailable: "The AI provider is temporarily unavailable. Please try again.",
};

/** Map any thrown value to a safe client-facing error result. */
export function toAIActionError(error: unknown): AIActionErrorResult {
  if (error instanceof AIUserError) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      retryable: error.retryable,
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      ok: false,
      error: AI_PLAN_RESTRICTED_MESSAGE,
      code: "plan_restricted",
      retryable: false,
    };
  }

  if (error instanceof Error) {
    if (error.message === "rate_limit") {
      return {
        ok: false,
        error: AI_RATE_LIMIT_MESSAGE,
        code: "rate_limit",
        retryable: false,
      };
    }

    if (error.message === "plan_restricted") {
      return {
        ok: false,
        error: AI_PLAN_RESTRICTED_MESSAGE,
        code: "plan_restricted",
        retryable: false,
      };
    }

    if (error.message === "timeout" || error.name === "AbortError") {
      return {
        ok: false,
        error: AI_TIMEOUT_MESSAGE,
        code: "timeout",
        retryable: true,
      };
    }

    if (error.message === "cancelled") {
      return {
        ok: false,
        error: AI_ERROR_MESSAGES.cancelled,
        code: "cancelled",
        retryable: true,
      };
    }

    if (error.message === "invalid_response") {
      return {
        ok: false,
        error: AI_ERROR_MESSAGES.invalid_response,
        code: "invalid_response",
        retryable: true,
      };
    }
  }

  return {
    ok: false,
    error: AI_GENERIC_ERROR_MESSAGE,
    code: "provider_error",
    retryable: true,
  };
}

export function createAIUserError(code: AIErrorCode, retryable?: boolean): AIUserError {
  return new AIUserError(AI_ERROR_MESSAGES[code], code, retryable ?? code === "provider_error");
}
