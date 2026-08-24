/**
 * Tax determination policy outcomes — separate from tax calculation.
 *
 * UNKNOWN must never silently become 0%. Reverse-charge invoice legends remain
 * counsel-gated (LEGAL_TEXT_PENDING_COUNSEL) until approved copy is supplied.
 */

export const TAX_POLICY_OUTCOMES = [
  "STANDARD_DOMESTIC_VAT",
  "REVERSE_CHARGE",
  "ZERO_RATE_IF_LEGALLY_APPLICABLE",
  "TAX_EXEMPT_IF_LEGALLY_APPLICABLE",
  "MANUAL_REVIEW",
  "UNKNOWN_BLOCK_CHECKOUT",
] as const;

export type TaxPolicyOutcome = (typeof TAX_POLICY_OUTCOMES)[number];

/** Seller establishment for Auroranexis (DE). */
export const SELLER_COUNTRY_CODE = "DE" as const;

/**
 * Statutory DE standard VAT rate in basis points (19.00% → 1900).
 * External tax adviser confirmation still required for live revenue promote.
 */
export const DE_STANDARD_VAT_RATE_BPS = 1900;

/** INTERNAL ONLY — never expose this marker on customer-facing invoice copy. */
export const LEGAL_TEXT_PENDING_COUNSEL = "LEGAL_TEXT_PENDING_COUNSEL" as const;

export type TaxDeterminationInput = {
  customerCountryCode: string | null | undefined;
  vatId: string | null | undefined;
  viesStatus: "valid" | "invalid" | "unavailable" | "not_checked" | "skipped";
  isB2bEntrepreneurConfirmed: boolean;
};

export type TaxDeterminationResult = {
  outcome: TaxPolicyOutcome;
  /** Rate in basis points when STANDARD_DOMESTIC_VAT applies; otherwise null. */
  vatRateBps: number | null;
  /** When true, self-serve checkout must not proceed. */
  blocksCheckout: boolean;
  reasonCode: string;
  /** Internal counsel gate for reverse-charge legends — not public copy. */
  reverseChargeLegendStatus: typeof LEGAL_TEXT_PENDING_COUNSEL | "approved" | "n/a";
};

function normalizeCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

/** EU member state ISO codes for VAT ID / reverse-charge boundary checks. */
export const EU_VAT_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "EL",
  "ES",
  "FI",
  "FR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "XI",
]);

/**
 * Determine tax treatment. Does not calculate amounts.
 * Fail-closed: missing country, failed VIES, or uncertain cases block checkout.
 */
export function determineTaxPolicy(input: TaxDeterminationInput): TaxDeterminationResult {
  if (!input.isB2bEntrepreneurConfirmed) {
    return {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "b2b_confirmation_required",
      reverseChargeLegendStatus: "n/a",
    };
  }

  const country = normalizeCountry(input.customerCountryCode);
  if (!country) {
    return {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "customer_country_unknown",
      reverseChargeLegendStatus: "n/a",
    };
  }

  if (country === SELLER_COUNTRY_CODE) {
    return {
      outcome: "STANDARD_DOMESTIC_VAT",
      vatRateBps: DE_STANDARD_VAT_RATE_BPS,
      blocksCheckout: false,
      reasonCode: "de_domestic_standard_vat",
      reverseChargeLegendStatus: "n/a",
    };
  }

  if (!EU_VAT_COUNTRY_CODES.has(country === "GR" ? "EL" : country)) {
    return {
      outcome: "MANUAL_REVIEW",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "non_eu_manual_review",
      reverseChargeLegendStatus: "n/a",
    };
  }

  const vatId = (input.vatId ?? "").trim();
  if (!vatId) {
    return {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "eu_vat_id_required",
      reverseChargeLegendStatus: "n/a",
    };
  }

  if (input.viesStatus === "valid") {
    // Determination may be reverse charge; public legend remains counsel-gated.
    return {
      outcome: "REVERSE_CHARGE",
      vatRateBps: 0,
      blocksCheckout: true,
      reasonCode: "eu_b2b_reverse_charge_legend_pending_counsel",
      reverseChargeLegendStatus: LEGAL_TEXT_PENDING_COUNSEL,
    };
  }

  if (input.viesStatus === "invalid") {
    return {
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "vies_invalid",
      reverseChargeLegendStatus: "n/a",
    };
  }

  // unavailable / not_checked / skipped → fail closed (fail ≠ valid)
  return {
    outcome: "UNKNOWN_BLOCK_CHECKOUT",
    vatRateBps: null,
    blocksCheckout: true,
    reasonCode: "vies_not_validated",
    reverseChargeLegendStatus: "n/a",
  };
}

export function taxOutcomeAllowsSelfServeCheckout(outcome: TaxPolicyOutcome): boolean {
  return outcome === "STANDARD_DOMESTIC_VAT";
}
