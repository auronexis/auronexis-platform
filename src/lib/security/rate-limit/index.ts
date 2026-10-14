import "server-only";

import { logger } from "@/lib/observability/logger";
import { getUpstashRedisEnv } from "@/lib/security/rate-limit/env";
import { createMemoryRateLimitStore } from "@/lib/security/rate-limit/memory-store";
import { createRedisRateLimitStore } from "@/lib/security/rate-limit/redis-store";
import type {
  RateLimitStore,
  SlidingWindowRateLimitInput,
  SlidingWindowRateLimitResult,
} from "@/lib/security/rate-limit/types";

export type {
  RateLimitDenyReason,
  RateLimitFailurePolicy,
  RateLimitStore,
  SlidingWindowRateLimitInput,
  SlidingWindowRateLimitResult,
} from "@/lib/security/rate-limit/types";

export { hashEmailForRateLimit } from "@/lib/security/rate-limit/hash";
export * from "@/lib/security/rate-limit/keys";
export {
  extractTrustedIpFromHeaders,
  extractTrustedIpFromRequest,
  isTrustedIpPlatform,
} from "@/lib/security/rate-limit/trusted-ip";
export { getUpstashRedisEnv, isUpstashRedisConfigured } from "@/lib/security/rate-limit/env";

const DEFAULT_WINDOW_MS = 60_000;

let testStoreOverride: RateLimitStore | null = null;
let cachedStore: RateLimitStore | null = null;
let cachedStoreKind: "memory" | "redis" | "unavailable" | null = null;

function createUnavailableStore(): RateLimitStore {
  return {
    async checkSlidingWindow(input): Promise<SlidingWindowRateLimitResult> {
      return {
        allowed: false,
        limit: input.limit,
        remaining: 0,
        retryAfterSeconds: 60,
        backendUnavailable: true,
        reason: "backend_unavailable",
      };
    },
  };
}

function resolveProductionStore(): { store: RateLimitStore; kind: "redis" | "unavailable" } {
  const env = getUpstashRedisEnv();
  if (!env) {
    return { store: createUnavailableStore(), kind: "unavailable" };
  }
  return { store: createRedisRateLimitStore(env), kind: "redis" };
}

function getActiveStore(): { store: RateLimitStore; kind: "memory" | "redis" | "unavailable" | "test" } {
  if (testStoreOverride) {
    return { store: testStoreOverride, kind: "test" };
  }

  if (process.env.NODE_ENV === "production") {
    if (!cachedStore || (cachedStoreKind !== "redis" && cachedStoreKind !== "unavailable")) {
      const resolved = resolveProductionStore();
      cachedStore = resolved.store;
      cachedStoreKind = resolved.kind;
    }
    return { store: cachedStore, kind: cachedStoreKind ?? "unavailable" };
  }

  if (!cachedStore || cachedStoreKind !== "memory") {
    cachedStore = createMemoryRateLimitStore();
    cachedStoreKind = "memory";
  }
  return { store: cachedStore, kind: "memory" };
}

function applyFailurePolicy(
  raw: SlidingWindowRateLimitResult,
  failurePolicy: "fail_closed" | "fail_open",
): SlidingWindowRateLimitResult {
  if (!raw.backendUnavailable) {
    return raw;
  }
  if (failurePolicy === "fail_open") {
    return {
      allowed: true,
      limit: raw.limit,
      remaining: raw.limit,
      retryAfterSeconds: 0,
      backendUnavailable: true,
      reason: "backend_unavailable",
    };
  }
  return {
    allowed: false,
    limit: raw.limit,
    remaining: 0,
    retryAfterSeconds: raw.retryAfterSeconds > 0 ? raw.retryAfterSeconds : 60,
    backendUnavailable: true,
    reason: "backend_unavailable",
  };
}

function logDecision(
  input: SlidingWindowRateLimitInput,
  result: SlidingWindowRateLimitResult,
  storeKind: string,
): void {
  const bucketClass = input.bucketClass ?? "generic";
  if (result.backendUnavailable) {
    logger.warn("rate_limit.backend_unavailable", {
      bucketClass,
      storeKind,
      failurePolicy: input.failurePolicy ?? "fail_closed",
      allowed: result.allowed,
    });
    return;
  }
  if (!result.allowed) {
    logger.info("rate_limit.denied", {
      bucketClass,
      storeKind,
      limit: result.limit,
      retryAfterSeconds: result.retryAfterSeconds,
    });
    return;
  }
  logger.debug("rate_limit.allowed", {
    bucketClass,
    storeKind,
    remaining: result.remaining,
    limit: result.limit,
  });
}

/**
 * Shared sliding-window rate limit check.
 * Production uses Upstash Redis when configured; never silently falls back to memory.
 * Dev/test use process-local memory unless a test store is injected.
 */
export async function checkSlidingWindowRateLimit(
  input: SlidingWindowRateLimitInput,
): Promise<SlidingWindowRateLimitResult> {
  const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS;
  const failurePolicy = input.failurePolicy ?? "fail_closed";
  const { store, kind } = getActiveStore();

  let raw: SlidingWindowRateLimitResult;
  try {
    raw = await store.checkSlidingWindow({
      key: input.key,
      limit: input.limit,
      windowMs,
    });
    if (kind === "unavailable") {
      raw = {
        ...raw,
        backendUnavailable: true,
        reason: "backend_unavailable",
      };
    }
  } catch {
    raw = {
      allowed: false,
      limit: input.limit,
      remaining: 0,
      retryAfterSeconds: 60,
      backendUnavailable: true,
      reason: "backend_unavailable",
    };
  }

  const result = applyFailurePolicy(raw, failurePolicy);
  logDecision(input, result, kind);
  return result;
}

/** Inject a store for unit tests — must not point at real Redis. */
export function setRateLimitStoreForTests(store: RateLimitStore | null): void {
  testStoreOverride = store;
  if (store === null) {
    cachedStore = null;
    cachedStoreKind = null;
  }
}

export function resetRateLimitBucketsForTests(): void {
  if (testStoreOverride?.reset) {
    void testStoreOverride.reset();
  }
  if (cachedStore?.reset) {
    void cachedStore.reset();
  }
  cachedStore = null;
  cachedStoreKind = null;
}

export function resetRateLimitRuntimeForTests(): void {
  testStoreOverride = null;
  cachedStore = null;
  cachedStoreKind = null;
}

export { createMemoryRateLimitStore } from "@/lib/security/rate-limit/memory-store";