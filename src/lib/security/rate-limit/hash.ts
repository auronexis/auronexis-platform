import { createHash } from "node:crypto";

/** Normalize then SHA-256 email for Redis/memory keys — never store plaintext email in keys. */
export function hashEmailForRateLimit(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}