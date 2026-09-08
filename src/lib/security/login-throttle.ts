import "server-only";

import { isSecurityEnforcementDisabledForE2E } from "@/lib/security/e2e-bypass";
import {
  authLoginEmailKey,
  authLoginIpKey,
  authPasswordResetCooldownEmailKey,
  authPasswordResetEmailKey,
  authPasswordResetIpKey,
  authPortalLoginEmailKey,
  authPortalLoginIpKey,
  authPublicFormEmailKey,
  authPublicFormIpKey,
  authSignupEmailKey,
  authSignupIpKey,
  checkSlidingWindowRateLimit,
  extractTrustedIpFromHeaders,
  type SlidingWindowRateLimitResult,
} from "@/lib/security/rate-limit";

const LOGIN_LIMIT_PER_15_MIN = 10;
const SIGNUP_LIMIT_PER_HOUR = 5;
const FORM_LIMIT_PER_15_MIN = 8;
const PORTAL_LOGIN_LIMIT_PER_15_MIN = 10;
const LOGIN_IP_LIMIT_PER_15_MIN = 50;
const SIGNUP_IP_LIMIT_PER_HOUR = 20;
const RESET_IP_LIMIT_PER_HOUR = 10;
const PORTAL_IP_LIMIT_PER_15_MIN = 50;
const FORM_IP_LIMIT_PER_15_MIN = 30;
const WINDOW_15_MIN = 15 * 60_000;
const WINDOW_1_HOUR = 60 * 60_000;
const RESET_LIMIT_PER_HOUR = 5;
const RESET_COOLDOWN_MS = 30_000;

export type AuthThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  backendUnavailable?: boolean;
};

const RATE_LIMITED_MESSAGE = "Too many attempts. Please try again later.";
const BACKEND_UNAVAILABLE_MESSAGE = "Unable to process this request right now. Please try again.";

export function authThrottleUserMessage(result: AuthThrottleResult): string {
  if (result.backendUnavailable) {
    return BACKEND_UNAVAILABLE_MESSAGE;
  }
  if (result.retryAfterSeconds > 0) {
    return `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`;
  }
  return RATE_LIMITED_MESSAGE;
}

function toThrottleResult(result: SlidingWindowRateLimitResult): AuthThrottleResult {
  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
    backendUnavailable: result.backendUnavailable,
  };
}

async function resolveTrustedIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    return extractTrustedIpFromHeaders(headerStore);
  } catch {
    return null;
  }
}

async function denyIfLimited(
  emailResult: SlidingWindowRateLimitResult,
  ipResult: SlidingWindowRateLimitResult | null,
): Promise<AuthThrottleResult> {
  if (!emailResult.allowed) {
    return toThrottleResult(emailResult);
  }
  if (ipResult && !ipResult.allowed) {
    return toThrottleResult(ipResult);
  }
  return toThrottleResult(emailResult);
}

/** Throttle login attempts by hashed email (fail_closed). Optional trusted-IP companion. */
export async function checkLoginThrottle(email: string): Promise<AuthThrottleResult> {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const emailResult = await checkSlidingWindowRateLimit({
    key: authLoginEmailKey(email),
    limit: LOGIN_LIMIT_PER_15_MIN,
    windowMs: WINDOW_15_MIN,
    failurePolicy: "fail_closed",
    bucketClass: "auth.login.email",
  });

  const ip = await resolveTrustedIp();
  const ipResult = ip
    ? await checkSlidingWindowRateLimit({
        key: authLoginIpKey(ip),
        limit: LOGIN_IP_LIMIT_PER_15_MIN,
        windowMs: WINDOW_15_MIN,
        failurePolicy: "fail_closed",
        bucketClass: "auth.login.ip",
      })
    : null;

  return denyIfLimited(emailResult, ipResult);
}

/** Throttle signup attempts by hashed email (fail_closed). */
export async function checkSignupThrottle(email: string): Promise<AuthThrottleResult> {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const emailResult = await checkSlidingWindowRateLimit({
    key: authSignupEmailKey(email),
    limit: SIGNUP_LIMIT_PER_HOUR,
    windowMs: WINDOW_1_HOUR,
    failurePolicy: "fail_closed",
    bucketClass: "auth.signup.email",
  });

  const ip = await resolveTrustedIp();
  const ipResult = ip
    ? await checkSlidingWindowRateLimit({
        key: authSignupIpKey(ip),
        limit: SIGNUP_IP_LIMIT_PER_HOUR,
        windowMs: WINDOW_1_HOUR,
        failurePolicy: "fail_closed",
        bucketClass: "auth.signup.ip",
      })
    : null;

  return denyIfLimited(emailResult, ipResult);
}

/** Throttle password reset — 30s cooldown + 5/hour (fail_closed). */
export async function checkPasswordResetThrottle(email: string): Promise<AuthThrottleResult> {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const cooldown = await checkSlidingWindowRateLimit({
    key: authPasswordResetCooldownEmailKey(email),
    limit: 1,
    windowMs: RESET_COOLDOWN_MS,
    failurePolicy: "fail_closed",
    bucketClass: "auth.reset.cooldown",
  });

  if (!cooldown.allowed) {
    return toThrottleResult(cooldown);
  }

  const hourly = await checkSlidingWindowRateLimit({
    key: authPasswordResetEmailKey(email),
    limit: RESET_LIMIT_PER_HOUR,
    windowMs: WINDOW_1_HOUR,
    failurePolicy: "fail_closed",
    bucketClass: "auth.reset.hourly",
  });

  if (!hourly.allowed) {
    return toThrottleResult(hourly);
  }

  const ip = await resolveTrustedIp();
  if (ip) {
    const ipResult = await checkSlidingWindowRateLimit({
      key: authPasswordResetIpKey(ip),
      limit: RESET_IP_LIMIT_PER_HOUR,
      windowMs: WINDOW_1_HOUR,
      failurePolicy: "fail_closed",
      bucketClass: "auth.reset.ip",
    });
    if (!ipResult.allowed) {
      return toThrottleResult(ipResult);
    }
  }

  return toThrottleResult(hourly);
}

/** Throttle public contact/support forms by hashed email + route namespace (fail_closed). */
export async function checkPublicFormThrottle(
  email: string,
  route: string,
): Promise<AuthThrottleResult> {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const emailResult = await checkSlidingWindowRateLimit({
    key: authPublicFormEmailKey(route, email),
    limit: FORM_LIMIT_PER_15_MIN,
    windowMs: WINDOW_15_MIN,
    failurePolicy: "fail_closed",
    bucketClass: "auth.public_form.email",
  });

  const ip = await resolveTrustedIp();
  const ipResult = ip
    ? await checkSlidingWindowRateLimit({
        key: authPublicFormIpKey(route, ip),
        limit: FORM_IP_LIMIT_PER_15_MIN,
        windowMs: WINDOW_15_MIN,
        failurePolicy: "fail_closed",
        bucketClass: "auth.public_form.ip",
      })
    : null;

  return denyIfLimited(emailResult, ipResult);
}

/** Throttle client portal login by hashed email (fail_closed) — mandatory FINDING-002 control. */
export async function checkPortalLoginThrottle(email: string): Promise<AuthThrottleResult> {
  if (isSecurityEnforcementDisabledForE2E()) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const emailResult = await checkSlidingWindowRateLimit({
    key: authPortalLoginEmailKey(email),
    limit: PORTAL_LOGIN_LIMIT_PER_15_MIN,
    windowMs: WINDOW_15_MIN,
    failurePolicy: "fail_closed",
    bucketClass: "auth.portal_login.email",
  });

  const ip = await resolveTrustedIp();
  const ipResult = ip
    ? await checkSlidingWindowRateLimit({
        key: authPortalLoginIpKey(ip),
        limit: PORTAL_IP_LIMIT_PER_15_MIN,
        windowMs: WINDOW_15_MIN,
        failurePolicy: "fail_closed",
        bucketClass: "auth.portal_login.ip",
      })
    : null;

  return denyIfLimited(emailResult, ipResult);
}