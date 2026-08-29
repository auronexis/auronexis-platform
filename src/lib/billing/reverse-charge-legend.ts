/**
 * Reverse Charge invoice legend boundary.
 *
 * Customer-facing legend appears ONLY when outcome is Reverse Charge AND legend
 * status is implementation-approved for C3 (or external counsel "approved" with copy).
 *
 * IMPLEMENTATION_TEXT_APPROVED_FOR_C3 ≠ external tax/legal counsel sign-off.
 * Do not treat "approved" / IMPLEMENTATION_TEXT_APPROVED_FOR_C3 as COUNSEL_SIGNED_OFF.
 *
 * Canonical bilingual legend is a single constant — no locale-split variants.
 */

import {
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
  LEGAL_TEXT_PENDING_COUNSEL,
  type ReverseChargeLegendStatus,
  type TaxPolicyOutcome,
} from "@/lib/billing/tax-policy";

export const EXTERNAL_LEGAL_COPY_REQUIRED = "EXTERNAL_LEGAL_COPY_REQUIRED" as const;

/**
 * Canonical EU Reverse Charge invoice legend (DE/EN bilingual).
 * TAX_ADVISER_SIGNOFF_REQUIRED / LEGAL_COUNSEL_SIGNOFF_REQUIRED remain open.
 */
export const REVERSE_CHARGE_LEGEND =
  "Steuerschuldnerschaft des Leistungsempfängers / Reverse charge — VAT to be accounted for by the recipient." as const;

/** Aliases — same canonical string (no divergent EN/DE wording). */
export const REVERSE_CHARGE_LEGEND_EN = REVERSE_CHARGE_LEGEND;
export const REVERSE_CHARGE_LEGEND_DE = REVERSE_CHARGE_LEGEND;

export type ReverseChargeLegendResolution = {
  showOnInvoice: boolean;
  legendText: string | null;
  status:
    | ReverseChargeLegendStatus
    | typeof EXTERNAL_LEGAL_COPY_REQUIRED;
};

/** Always returns the canonical bilingual legend (locale retained for call-site compatibility). */
export function reverseChargeLegendTextForLocale(locale: "en" | "de" = "en"): string {
  void locale;
  return REVERSE_CHARGE_LEGEND;
}

/**
 * Resolve whether a Reverse Charge legend may appear on customer invoices.
 * Never invents counsel-approved wording; C3 uses implementation-approved constants only.
 */
export function resolveReverseChargeLegend(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  reverseChargeLegendStatus: ReverseChargeLegendStatus;
  /** Optional counsel-approved text — required only when status is external "approved". */
  approvedLegendText?: string | null;
  /** Existing invoice locale only (`en` | `de`); ignored for canonical bilingual text. */
  locale?: "en" | "de";
}): ReverseChargeLegendResolution {
  if (input.taxPolicyOutcome !== "REVERSE_CHARGE") {
    return { showOnInvoice: false, legendText: null, status: "n/a" };
  }

  if (input.reverseChargeLegendStatus === IMPLEMENTATION_TEXT_APPROVED_FOR_C3) {
    return {
      showOnInvoice: true,
      legendText: REVERSE_CHARGE_LEGEND,
      status: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
    };
  }

  // External counsel path only — distinct from IMPLEMENTATION_TEXT_APPROVED_FOR_C3.
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
