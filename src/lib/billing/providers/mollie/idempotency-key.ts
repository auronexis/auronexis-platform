/**
 * Mollie outbound Idempotency-Key builder.
 *
 * Mollie rejects keys longer than 100 characters. Concatenating UUIDs + operation
 * names (e.g. upgrade_adjustment) exceeded that limit (observed 104).
 *
 * Scope: one logical outbound create (payment or subscription) for
 * `(surface, organizationId, operation, attemptId)`. Same inputs → same key;
 * different org / attempt / operation / surface → different key.
 *
 * Format: `m:{t|p}:{sha256hex}` — always 68 characters (≤ 100).
 * - `t` = test billing surface (mollie_test_subscriptions / Phase 2 checkout)
 * - `p` = production billing surface (organization_subscriptions)
 *
 * TEST vs LIVE Mollie API credentials are separate provider accounts; key spaces
 * do not need cross-account collision resistance beyond surface + hash material.
 */

import { createHash } from "node:crypto";

/** Mollie API hard limit for Idempotency-Key header value. */
export const MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH = 100;

export type MollieIdempotencySurface = "test" | "prod";

export type MollieIdempotencyKeyInput = {
  surface: MollieIdempotencySurface;
  organizationId: string;
  operation: string;
  attemptId: string;
};

/**
 * Build a deterministic Mollie Idempotency-Key that always fits the 100-char limit.
 * Hash material is stable IDs only — never Math.random / Date.now as sole uniqueness.
 */
export function buildMollieIdempotencyKey(input: MollieIdempotencyKeyInput): string {
  const organizationId = input.organizationId.trim();
  const operation = input.operation.trim();
  const attemptId = input.attemptId.trim();

  if (!organizationId || !operation || !attemptId) {
    throw new Error("Mollie idempotency key requires organizationId, operation, and attemptId");
  }

  const envTag = input.surface === "prod" ? "p" : "t";
  const material = [input.surface, organizationId, operation, attemptId].join("\0");
  const digest = createHash("sha256").update(material, "utf8").digest("hex");
  const key = `m:${envTag}:${digest}`;

  if (key.length > MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new Error(
      `Mollie idempotency key length ${key.length} exceeds ${MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH}`,
    );
  }

  return key;
}
