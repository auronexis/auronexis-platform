/**
 * Reverse Charge invoice legend boundary.
 * Customer-facing legend appears ONLY when outcome is Reverse Charge AND counsel copy is approved.
 */

import { LEGAL_TEXT_PENDING_COUNSEL, type TaxPolicyOutcome } from "@/lib/billing/tax-policy";

export const EXTERNAL_LEGAL_COPY_REQUIRED = "EXTERNAL_LEGAL_COPY_REQUIRED" as const;

export type ReverseChargeLegendResolution = {
  showOnInvoice: boolean;
  legendText: string | null;
  status: typeof LEGAL_TEXT_PENDING_COUNSEL | "approved" | "n/a" | typeof EXTERNAL_LEGAL_COPY_REQUIRED;
};

/**
 * Resolve whether a Reverse Charge legend may appear on customer invoices.
 * Never invents counsel-approved wording.
 */
export function resolveReverseChargeLegend(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  reverseChargeLegendStatus: typeof LEGAL_TEXT_PENDING_COUNSEL | "approved" | "n/a";
  /** Optional counsel-approved text — never invent when absent. */
  approvedLegendText?: string | null;
}): ReverseChargeLegendResolution {
  if (input.taxPolicyOutcome !== "REVERSE_CHARGE") {
    return { showOnInvoice: false, legendText: null, status: "n/a" };
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
