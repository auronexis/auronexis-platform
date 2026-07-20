/**
 * Client/server-safe Turnstile constants.
 * Keep field names and env var names identical across login, signup, and verify.
 */

export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response" as const;

export const TURNSTILE_SITE_KEY_ENV = "NEXT_PUBLIC_TURNSTILE_SITE_KEY" as const;
export const TURNSTILE_SECRET_KEY_ENV = "TURNSTILE_SECRET_KEY" as const;

/** User-facing retry when a challenge token is missing, expired, or rejected. */
export const TURNSTILE_RETRY_ERROR = "Security verification failed. Please try again.";

/**
 * Precise operational error when production requires Turnstile but keys are missing.
 * Must not be confused with an invalid challenge response.
 */
export const TURNSTILE_MISCONFIGURED_ERROR =
  "Security verification is misconfigured. Sign-in and registration are unavailable until Turnstile site and secret keys are configured and the app is redeployed.";

export function readTurnstileSiteKeyFromEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | null {
  const key = env[TURNSTILE_SITE_KEY_ENV];
  return key && key.trim().length > 0 ? key.trim() : null;
}

export function readTurnstileSecretKeyFromEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | null {
  const key = env[TURNSTILE_SECRET_KEY_ENV];
  return key && key.trim().length > 0 ? key.trim() : null;
}
