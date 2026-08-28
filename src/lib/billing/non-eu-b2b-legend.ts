/**
 * NON_EU_B2B invoice legend boundary (C3.2).
 *
 * Customer-facing legend appears ONLY when outcome is NON_EU_B2B_PLACE_OF_SUPPLY
 * AND legend status is IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2 (or external counsel "approved").
 *
 * IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2 ≠ external tax/legal counsel sign-off.
 * Do not reuse EU reverse-charge wording for this path.
 */

import {
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
  LEGAL_TEXT_PENDING_COUNSEL,
  type ReverseChargeLegendStatus,
  type TaxPolicyOutcome,
} from "@/lib/billing/tax-policy";
import { EXTERNAL_LEGAL_COPY_REQUIRED } from "@/lib/billing/reverse-charge-legend";

/**
 * Exact C3.2 engineering-approved English legend.
 * Not external tax/legal counsel sign-off — P1-002 remains OPEN.
 */
export const NON_EU_B2B_LEGEND_EN =
  "Service not subject to German VAT — place of supply outside Germany pursuant to § 3a(2) German VAT Act (UStG)." as const;

export type NonEuB2bLegendResolution = {
  showOnInvoice: boolean;
  legendText: string | null;
  status: ReverseChargeLegendStatus | typeof EXTERNAL_LEGAL_COPY_REQUIRED;
};

/**
 * Resolve whether the NON_EU_B2B place-of-supply legend may appear on customer invoices.
 */
export function resolveNonEuB2bLegend(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  reverseChargeLegendStatus: ReverseChargeLegendStatus;
  approvedLegendText?: string | null;
}): NonEuB2bLegendResolution {
  if (input.taxPolicyOutcome !== "NON_EU_B2B_PLACE_OF_SUPPLY") {
    return { showOnInvoice: false, legendText: null, status: "n/a" };
  }

  if (input.reverseChargeLegendStatus === IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2) {
    return {
      showOnInvoice: true,
      legendText: NON_EU_B2B_LEGEND_EN,
      status: IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
    };
  }

  if (input.reverseChargeLegendStatus === "approved") {
    const text = input.approvedLegendText?.trim() || null;
    if (!text) {
      return {
        showOnInvoice: false,
        legendText: null,
        status: EXTERNAL_LEGAL_COPY_REQUIRED,
      };
    }
    return { showOnInvoice: true, legendText: text, status: "approved" };
  }

  if (input.reverseChargeLegendStatus === LEGAL_TEXT_PENDING_COUNSEL) {
    return {
      showOnInvoice: false,
      legendText: null,
      status: LEGAL_TEXT_PENDING_COUNSEL,
    };
  }

  return {
    showOnInvoice: false,
    legendText: null,
    status: EXTERNAL_LEGAL_COPY_REQUIRED,
  };
}
