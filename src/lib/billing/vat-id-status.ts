/**
 * Technical VAT ID status labels for billing identity.
 * Format checks are not official VIES validation.
 */

import "server-only";

import { normalizeVatId, type ViesValidationStatus } from "@/lib/billing/vies";

export const VAT_ID_TECHNICAL_STATES = [
  "NOT_PROVIDED",
  "FORMAT_VALID",
  "OFFICIALLY_VALIDATED",
  "INVALID",
  "REVIEW_REQUIRED",
] as const;

export type VatIdTechnicalState = (typeof VAT_ID_TECHNICAL_STATES)[number];

/**
 * Map raw VAT input + optional VIES result to a technical status.
 * Never promotes network failure / skip / not_checked to OFFICIALLY_VALIDATED.
 */
export function resolveVatIdTechnicalState(input: {
  vatId: string | null | undefined;
  viesStatus?: ViesValidationStatus | null;
}): VatIdTechnicalState {
  const raw = (input.vatId ?? "").trim();
  if (!raw) {
    return "NOT_PROVIDED";
  }

  const normalized = normalizeVatId(raw);
  if (!normalized) {
    return "INVALID";
  }

  switch (input.viesStatus) {
    case "valid":
      return "OFFICIALLY_VALIDATED";
    case "invalid":
      return "INVALID";
    case "unavailable":
    case "skipped":
    case "not_checked":
      return "REVIEW_REQUIRED";
    default:
      return "FORMAT_VALID";
  }
}
