/** Shared retry helpers for AI panels and server actions. */

import type { AIActionErrorResult } from "@/lib/ai/core/errors";

export type RetryableAIResult = AIActionErrorResult | { ok: true; retryable?: never };

export function isRetryableResult(result: RetryableAIResult): result is AIActionErrorResult {
  return !result.ok && result.retryable;
}

export function shouldShowRetryButton(result: RetryableAIResult | null | undefined): boolean {
  return Boolean(result && !result.ok && result.retryable);
}

export type AIRetryState<TInput> = {
  lastInput: TInput | null;
  attemptCount: number;
};

export function createRetryState<TInput>(): AIRetryState<TInput> {
  return { lastInput: null, attemptCount: 0 };
}

export function recordRetryAttempt<TInput>(
  state: AIRetryState<TInput>,
  input: TInput,
): AIRetryState<TInput> {
  return {
    lastInput: input,
    attemptCount: state.lastInput === input ? state.attemptCount + 1 : 1,
  };
}
