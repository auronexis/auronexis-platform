/**
 * Client/server-safe Cloudflare Turnstile constants.
 *
 * Bot protection is active only when BOTH keys are configured. Without keys, sign-in and
 * registration keep working (rate limits still apply) — a missing key must never lock
 * users out.
 */

export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response" as const;

/** User-facing message when the challenge token is missing, expired, or rejected. */
export const TURNSTILE_RETRY_ERROR = "Security check failed. Please wait a moment and try again.";

/**
 * Public site key. Must be read with a literal `process.env.NEXT_PUBLIC_…` access so Next.js
 * inlines it into the client bundle (dynamic env lookups are undefined in the browser).
 */
export function getTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}
