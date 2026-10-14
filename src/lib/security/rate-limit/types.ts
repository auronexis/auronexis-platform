/** Shared sliding-window rate-limit contracts (FINDING-002). */

export type RateLimitFailurePolicy = "fail_closed" | "fail_open";

export type RateLimitDenyReason = "rate_limit_exceeded" | "backend_unavailable";

export type SlidingWindowRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  /** True when the shared backend could not be consulted. */
  backendUnavailable?: boolean;
  reason?: RateLimitDenyReason;
};

export type SlidingWindowRateLimitInput = {
  key: string;
  limit: number;
  windowMs?: number;
  /** Defaults to fail_closed for security-sensitive buckets. */
  failurePolicy?: RateLimitFailurePolicy;
  /** Short bucket class for structured logs (no PII). */
  bucketClass?: string;
};

export type RateLimitStore = {
  checkSlidingWindow(input: {
    key: string;
    limit: number;
    windowMs: number;
  }): Promise<SlidingWindowRateLimitResult>;
  reset?(): void | Promise<void>;
};