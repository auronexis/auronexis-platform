import "server-only";

import { isSecurityEnforcementDisabledForE2E } from "@/lib/security/e2e-bypass";
import { checkSlidingWindowRateLimit } from "@/lib/security/rate-limit";

const LOGIN_LIMIT_PER_15_MIN = 10;
const SIGNUP_LIMIT_PER_HOUR = 5;
const FORM_LIMIT_PER_15_MIN = 8;
const WINDOW_15_MIN = 15 * 60_000;
const WINDOW_1_HOUR = 60 * 60_000;

export type AuthThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function normalizeKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier.trim().toLowerCase()}`;
}

/** Throttle login attempts by email to mitigate credential stuffing. */
export function checkLoginThrottle(email: string): AuthThrottleResult {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const result = checkSlidingWindowRateLimit({
    key: normalizeKey("login", email),
    limit: LOGIN_LIMIT_PER_15_MIN,
    windowMs: WINDOW_15_MIN,
  });
  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

/** Throttle signup attempts by email. */
export function checkSignupThrottle(email: string): AuthThrottleResult {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const result = checkSlidingWindowRateLimit({
    key: normalizeKey("signup", email),
    limit: SIGNUP_LIMIT_PER_HOUR,
    windowMs: WINDOW_1_HOUR,
  });
  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

/** Throttle public contact/support form submissions by email. */
export function checkPublicFormThrottle(email: string): AuthThrottleResult {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const result = checkSlidingWindowRateLimit({
    key: normalizeKey("public-form", email),
    limit: FORM_LIMIT_PER_15_MIN,
    windowMs: WINDOW_15_MIN,
  });
  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
  };
}
