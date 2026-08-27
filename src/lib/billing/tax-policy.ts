/**
 * Tax determination policy outcomes — separate from tax calculation.
 *
 * UNKNOWN must never silently become 0%. Reverse-charge invoice legends remain
 * gated until implementation-approved (C3) or external counsel copy is supplied.
 * IMPLEMENTATION_TEXT_APPROVED_FOR_C3 is not external counsel sign-off.
 *
 * Business relationship classification (DOMESTIC_B2B / EU candidate / NON_EU)
 * is distinct from final tax outcome — country mismatch alone ≠ Reverse Charge.
 */

import {
  classifyB2bTaxRelationship,
  type B2bTaxRelationshipClass,
} from "@/lib/billing/tax-classification";
import { EU_VAT_COUNTRY_CODES, SELLER_COUNTRY_CODE } from "@/lib/billing/tax-constants";

export { EU_VAT_COUNTRY_CODES, SELLER_COUNTRY_CODE };

export const TAX_POLICY_OUTCOMES = [
  "STANDARD_DOMESTIC_VAT",
  "REVERSE_CHARGE",
  "ZERO_RATE_IF_LEGALLY_APPLICABLE",
  "TAX_EXEMPT_IF_LEGALLY_APPLICABLE",
  "MANUAL_REVIEW",
  "UNKNOWN_BLOCK_CHECKOUT",
] as const;

export type TaxPolicyOutcome = (typeof TAX_POLICY_OUTCOMES)[number];

/**
 * Statutory DE standard VAT rate in basis points (19.00% → 1900).
 * External tax adviser confirmation still required for live revenue promote.
 */
export const DE_STANDARD_VAT_RATE_BPS = 1900;

/** INTERNAL ONLY — never expose this marker on customer-facing invoice copy. */
export const LEGAL_TEXT_PENDING_COUNSEL = "LEGAL_TEXT_PENDING_COUNSEL" as const;

/**
 * C3 implementation-approved reverse-charge invoice wording.
 * Not external tax/legal counsel sign-off — P1-002 remains OPEN.
 */
export const IMPLEMENTATION_TEXT_APPROVED_FOR_C3 =
  "IMPLEMENTATION_TEXT_APPROVED_FOR_C3" as const;

/**
 * Legend gate statuses:
 * - IMPLEMENTATION_TEXT_APPROVED_FOR_C3 — engineering C3 wording (not counsel)
 * - "approved" — reserved for external counsel-supplied copy only
 * - LEGAL_TEXT_PENDING_COUNSEL — customer legend withheld
 * - "n/a" — reverse charge not applicable
 */
export type ReverseChargeLegendStatus =
  | typeof LEGAL_TEXT_PENDING_COUNSEL
  | typeof IMPLEMENTATION_TEXT_APPROVED_FOR_C3
  | "approved"
  | "n/a";

export type TaxDeterminationInput = {
  customerCountryCode: string | null | undefined;
  vatId: string | null | undefined;
  viesStatus: "valid" | "invalid" | "unavailable" | "not_checked" | "skipped";
  isB2bEntrepreneurConfirmed: boolean;
};

export type TaxDeterminationResult = {
  outcome: TaxPolicyOutcome;
  /** Relationship class — not a final tax charge decision. */
  businessClassification: B2bTaxRelationshipClass;
  /** Rate in basis points when STANDARD_DOMESTIC_VAT applies; otherwise null. */
  vatRateBps: number | null;
  /** When true, self-serve checkout must not proceed. */
  blocksCheckout: boolean;
  reasonCode: string;
  /** Legend gate — never claim external counsel via IMPLEMENTATION_TEXT_APPROVED_FOR_C3. */
  reverseChargeLegendStatus: ReverseChargeLegendStatus;
};

function normalizeCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

function withClassification(
  input: TaxDeterminationInput,
  result: Omit<TaxDeterminationResult, "businessClassification">,
): TaxDeterminationResult {
  const { classification } = classifyB2bTaxRelationship({
    customerCountryCode: input.customerCountryCode,
    isB2bEntrepreneurConfirmed: input.isB2bEntrepreneurConfirmed,
  });
  return { ...result, businessClassification: classification };
}

/**
 * Determine tax treatment. Does not calculate amounts.
 * Fail-closed: missing country, failed VIES, or uncertain cases block checkout.
 * Reverse Charge requires officially validated VAT — never country mismatch alone.
 */
export function determineTaxPolicy(input: TaxDeterminationInput): TaxDeterminationResult {
  if (!input.isB2bEntrepreneurConfirmed) {
    return withClassification(input, {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "b2b_confirmation_required",
      reverseChargeLegendStatus: "n/a",
    });
  }

  const country = normalizeCountry(input.customerCountryCode);
  if (!country) {
    return withClassification(input, {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "customer_country_unknown",
      reverseChargeLegendStatus: "n/a",
    });
  }

  if (country === SELLER_COUNTRY_CODE) {
    return withClassification(input, {
      outcome: "STANDARD_DOMESTIC_VAT",
      vatRateBps: DE_STANDARD_VAT_RATE_BPS,
      blocksCheckout: false,
      reasonCode: "de_domestic_standard_vat",
      reverseChargeLegendStatus: "n/a",
    });
  }

  if (!EU_VAT_COUNTRY_CODES.has(country === "GR" ? "EL" : country)) {
    return withClassification(input, {
      outcome: "MANUAL_REVIEW",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "non_eu_manual_review",
      reverseChargeLegendStatus: "n/a",
    });
  }

  const vatId = (input.vatId ?? "").trim();
  if (!vatId) {
    return withClassification(input, {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "eu_vat_id_required",
      reverseChargeLegendStatus: "n/a",
    });
  }

  if (input.viesStatus === "valid") {
    // Verified EU B2B reverse charge — C3 implementation legend; not external counsel sign-off.
    return withClassification(input, {
      outcome: "REVERSE_CHARGE",
      vatRateBps: 0,
      blocksCheckout: false,
      reasonCode: "eu_b2b_reverse_charge",
      reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
    });
  }

  if (input.viesStatus === "invalid") {
    return withClassification(input, {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "vies_invalid",
      reverseChargeLegendStatus: "n/a",
    });
  }

  // unavailable / not_checked / skipped → fail closed (fail ≠ valid; format-valid ≠ Reverse Charge)
  return withClassification(input, {
    outcome: "UNKNOWN_BLOCK_CHECKOUT",
    vatRateBps: null,
    blocksCheckout: true,
    reasonCode: "vies_not_validated",
    reverseChargeLegendStatus: "n/a",
  });
}

export function taxOutcomeAllowsSelfServeCheckout(outcome: TaxPolicyOutcome): boolean {
  return outcome === "STANDARD_DOMESTIC_VAT" || outcome === "REVERSE_CHARGE";
}
