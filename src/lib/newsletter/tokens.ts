import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, stateless links for newsletter double opt-in and unsubscribe.
 *
 * Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256). The payload carries the email,
 * so confirming or unsubscribing needs no lookup table. Tokens are domain-separated per action:
 * a confirm token can never be used to unsubscribe someone else, and vice versa.
 *
 * Secret: NEWSLETTER_TOKEN_SECRET, falling back to a key derived from SUPABASE_SERVICE_ROLE_KEY
 * (never sent anywhere; only used as HMAC key material).
 */

export type NewsletterTokenAction = "confirm" | "unsubscribe";

type TokenPayload = { a: NewsletterTokenAction; e: string; t: number };

/** Confirmation links expire after 30 days; unsubscribe links never expire. */
export const CONFIRM_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function secretKey(): Buffer {
  const explicit = process.env.NEWSLETTER_TOKEN_SECRET?.trim();
  const base = explicit || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base) {
    throw new Error("Newsletter token secret is not configured.");
  }
  return createHmac("sha256", "auroranexis-newsletter-v1").update(base).digest();
}

function sign(data: string): string {
  return createHmac("sha256", secretKey()).update(data).digest("base64url");
}

export function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createNewsletterToken(
  action: NewsletterTokenAction,
  email: string,
  now: number = Date.now(),
): string {
  const payload: TokenPayload = { a: action, e: normalizeNewsletterEmail(email), t: now };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(`${action}:${data}`)}`;
}

/** Returns the email for a valid token of the expected action, otherwise null. */
export function verifyNewsletterToken(
  action: NewsletterTokenAction,
  token: string | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!token || token.length > 2048) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(`${action}:${data}`));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  if (payload.a !== action || typeof payload.e !== "string" || typeof payload.t !== "number") return null;
  if (action === "confirm" && now - payload.t > CONFIRM_TOKEN_MAX_AGE_MS) return null;
  return payload.e;
}
