import "server-only";

import {
  checkSlidingWindowRateLimit,
  expensiveExportKey,
} from "@/lib/security/rate-limit";

/** Narrow org+user+op cap for expensive server-side PDF generation (not simple downloads). */
const EXPORT_LIMIT_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

export type ExpensiveExportThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  backendUnavailable?: boolean;
};

export async function checkExpensiveExportThrottle(input: {
  organizationId: string;
  userId: string;
  operation: string;
}): Promise<ExpensiveExportThrottleResult> {
  const result = await checkSlidingWindowRateLimit({
    key: expensiveExportKey(input.organizationId, input.userId, input.operation),
    limit: EXPORT_LIMIT_PER_MINUTE,
    windowMs: WINDOW_MS,
    failurePolicy: "fail_closed",
    bucketClass: "export.expensive",
  });

  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
    backendUnavailable: result.backendUnavailable,
  };
}