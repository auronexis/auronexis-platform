/**
 * Map existing tax policy outcomes → EN 16931 VAT category codes.
 * Never invents a different tax treatment than the issued snapshot.
 */

import type { En16931VatCategoryCode } from "@/lib/einvoice/types";

export type TaxCategoryMapping = {
  vatCategoryCode: En16931VatCategoryCode;
  /** Required when category is AE/E/O/G with zero rate. */
  exemptionReasonRequired: boolean;
};

/**
 * Fail closed on unsupported / unknown outcomes — no second tax engine.
 */
export function mapTaxPolicyToEn16931Category(
  taxPolicyOutcome: string,
): TaxCategoryMapping | null {
  switch (taxPolicyOutcome) {
    case "STANDARD_DOMESTIC_VAT":
      return { vatCategoryCode: "S", exemptionReasonRequired: false };
    case "REVERSE_CHARGE":
      // AE = VAT Reverse Charge (Steuerschuldnerschaft des Leistungsempfängers)
      return { vatCategoryCode: "AE", exemptionReasonRequired: true };
    case "NON_EU_B2B_PLACE_OF_SUPPLY":
      // O = Not subject to VAT (place of supply outside scope) — from existing snapshot note
      return { vatCategoryCode: "O", exemptionReasonRequired: true };
    default:
      return null;
  }
}
