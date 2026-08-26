/**
 * B2B tax *relationship* classification — distinct from final tax *outcome*.
 * Country alone never implies Reverse Charge.
 */

export const B2B_TAX_RELATIONSHIP_CLASSES = [
  "DOMESTIC_B2B",
  "EU_CROSS_BORDER_B2B_CANDIDATE",
  "NON_EU_B2B",
  "REVIEW_REQUIRED",
] as const;

export type B2bTaxRelationshipClass = (typeof B2B_TAX_RELATIONSHIP_CLASSES)[number];

import { EU_VAT_COUNTRY_CODES, SELLER_COUNTRY_CODE } from "@/lib/billing/tax-constants";

export { EU_VAT_COUNTRY_CODES, SELLER_COUNTRY_CODE };

function normalizeCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (trimmed === "GR") return "EL";
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * Classify the commercial tax relationship for evidence / reporting.
 * Does not assign Reverse Charge or VAT rates.
 */
export function classifyB2bTaxRelationship(input: {
  customerCountryCode: string | null | undefined;
  isB2bEntrepreneurConfirmed: boolean;
}): { classification: B2bTaxRelationshipClass; reasonCode: string } {
  if (!input.isB2bEntrepreneurConfirmed) {
    return { classification: "REVIEW_REQUIRED", reasonCode: "b2b_confirmation_required" };
  }

  const country = normalizeCountry(input.customerCountryCode);
  if (!country) {
    return { classification: "REVIEW_REQUIRED", reasonCode: "customer_country_unknown" };
  }

  if (country === SELLER_COUNTRY_CODE) {
    return { classification: "DOMESTIC_B2B", reasonCode: "seller_buyer_same_country" };
  }

  if (EU_VAT_COUNTRY_CODES.has(country)) {
    return {
      classification: "EU_CROSS_BORDER_B2B_CANDIDATE",
      reasonCode: "eu_cross_border_candidate",
    };
  }

  return { classification: "NON_EU_B2B", reasonCode: "non_eu_buyer" };
}
