import "server-only";

/** Exponential backoff delay in milliseconds for queue retries. */
export function calculateRetryDelayMs(attempt: number, baseMs = 1000, maxMs = 300_000): number {
  const delay = baseMs * 2 ** Math.max(0, attempt - 1);
  return Math.min(delay, maxMs);
}

export function shouldRetry(attempt: number, maxAttempts: number): boolean {
  return attempt < maxAttempts;
}

export function nextRetryScheduledAt(attempt: number): string {
  return new Date(Date.now() + calculateRetryDelayMs(attempt)).toISOString();
}
