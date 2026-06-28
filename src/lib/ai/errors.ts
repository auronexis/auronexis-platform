/** User-safe AI errors — never expose raw provider messages to the client. */

export type AIErrorCode =
  | "plan_restricted"
  | "rate_limit"
  | "provider_error"
  | "access_denied"
  | "validation"
  | "timeout"
  | "missing_context"
  | "invalid_response"
  | "parsing_failed"
  | "cancelled"
  | "provider_unavailable";

export class AIUserError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: AIErrorCode, retryable = false) {
    super(message);
    this.name = "AIUserError";
    this.code = code;
    this.retryable = retryable;
  }
}

export const AI_RATE_LIMIT_MESSAGE =
  "Monthly AI usage limit reached. Upgrade your plan to continue.";

export const AI_GENERIC_ERROR_MESSAGE =
  "Unable to generate content right now. Please try again.";

export const AI_TIMEOUT_MESSAGE =
  "The AI provider took too long to respond. Please try again.";

export const AI_ACCESS_DENIED_MESSAGE =
  "You do not have permission to use AI on this report.";

export const AI_PLAN_RESTRICTED_MESSAGE =
  "AI Report Assistant is not available on your current plan.";
