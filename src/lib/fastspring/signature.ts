import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * FastSpring webhook signature header.
 *
 * Authoritative source: FastSpring Developer docs — Message Security
 * https://developer.fastspring.com/reference/message-security
 *
 * FastSpring HMAC-SHA256-hashes the raw request body with the shared secret,
 * base64-encodes the digest, and sends it in the `X-FS-Signature` header.
 * The header is not case-sensitive (may arrive as `x-fs-signature` etc.).
 */
export const FASTSPRING_SIGNATURE_HEADER = "x-fs-signature";

/**
 * Compute the FastSpring webhook signature for a raw body (base64 HMAC-SHA256).
 */
export function computeFastSpringSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

/**
 * Verify FastSpring `X-FS-Signature` against the raw request body.
 * Uses timing-safe comparison. Never logs the secret or signature values.
 */
export function verifyFastSpringSignature(input: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  secret: string;
}): boolean {
  const provided = input.signatureHeader?.trim();
  if (!provided) {
    return false;
  }

  const expected = computeFastSpringSignature(input.rawBody, input.secret);
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(provided, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Extract the FastSpring signature header from a Fetch Headers object (case-insensitive). */
export function getFastSpringSignatureHeader(headers: Headers): string | null {
  const value = headers.get(FASTSPRING_SIGNATURE_HEADER);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
