/**
 * Immutable tax decision evidence attached to checkout / invoice issuance.
 * Never log VAT IDs or addresses into analytics/activity from this structure.
 *
 * Business evidence methods distinguish self-attestation from VIES verification.
 * Country alone never establishes NON_EU_B2B — B2B confirmation is required upstream.
 */

import "server-only";

import type { B2bTaxRelationshipClass } from "@/lib/billing/tax-classification";
import type { TaxDeterminationResult, TaxPolicyOutcome } from "@/lib/billing/tax-policy";
import type { VatIdTechnicalState } from "@/lib/billing/vat-id-status";
import type { SellerInvoiceSnapshot } from "@/lib/billing/seller-tax-config";

/**
 * How business status was evidenced for this tax decision.
 * SELF_ATTESTED_B2B ≠ externally verified business registration.
 * VIES_VERIFIED applies only when VIES returned valid for EU RC.
 */
export const BUSINESS_EVIDENCE_METHODS = [
  "SELF_ATTESTED_B2B",
  "VIES_VERIFIED",
  "NOT_APPLICABLE",
] as const;

export type BusinessEvidenceMethod = (typeof BUSINESS_EVIDENCE_METHODS)[number];

export type TaxDecisionEvidenceSnapshot = {
  version: "tax-decision-evidence-v1";
  decidedAt: string;
  organizationId: string;
  sellerCountryCode: string;
  buyerLegalName: string | null;
  buyerCountryCode: string | null;
  /** Normalized VAT ID for audit — invoice column also stores buyer_vat_id. */
  buyerVatIdNormalized: string | null;
  vatTechnicalState: VatIdTechnicalState;
  viesStatus: string | null;
  viesCheckedAt: string | null;
  businessClassification: B2bTaxRelationshipClass;
  taxPolicyOutcome: TaxPolicyOutcome;
  vatRateBps: number | null;
  reverseChargeApplied: boolean;
  blocksCheckout: boolean;
  reasonCode: string;
  reverseChargeLegendStatus: string;
  /** Checkout/server B2B entrepreneur confirmation used for this decision. */
  b2bEntrepreneurConfirmed: boolean;
  /** Distinguishes self-attestation from VIES-verified EU B2B. */
  businessEvidenceMethod: BusinessEvidenceMethod;
  planKey: string | null;
  catalogAmountMinor: number | null;
  currency: string | null;
  billingInterval: "month" | null;
  priceVersion: string | null;
  sellerSnapshot: SellerInvoiceSnapshot;
};

export function resolveBusinessEvidenceMethod(input: {
  taxPolicyOutcome: TaxPolicyOutcome;
  viesStatus: string | null;
  isB2bEntrepreneurConfirmed: boolean;
}): BusinessEvidenceMethod {
  if (!input.isB2bEntrepreneurConfirmed) {
    return "NOT_APPLICABLE";
  }
  if (input.taxPolicyOutcome === "REVERSE_CHARGE" && input.viesStatus === "valid") {
    return "VIES_VERIFIED";
  }
  if (
    input.taxPolicyOutcome === "NON_EU_B2B_PLACE_OF_SUPPLY" ||
    input.taxPolicyOutcome === "STANDARD_DOMESTIC_VAT"
  ) {
    return "SELF_ATTESTED_B2B";
  }
  return "SELF_ATTESTED_B2B";
}

export function buildTaxDecisionEvidenceSnapshot(input: {
  organizationId: string;
  decidedAt?: string;
  buyerLegalName: string | null;
  buyerCountryCode: string | null;
  buyerVatIdNormalized: string | null;
  vatTechnicalState: VatIdTechnicalState;
  viesStatus: string | null;
  viesCheckedAt: string | null;
  businessClassification: B2bTaxRelationshipClass;
  determination: TaxDeterminationResult;
  sellerSnapshot: SellerInvoiceSnapshot;
  planKey?: string | null;
  catalogAmountMinor?: number | null;
  currency?: string | null;
  priceVersion?: string | null;
  /** Defaults true when omitted — callers issuing invoices already passed B2B gates. */
  isB2bEntrepreneurConfirmed?: boolean;
}): TaxDecisionEvidenceSnapshot {
  const isB2bEntrepreneurConfirmed = input.isB2bEntrepreneurConfirmed ?? true;
  return {
    version: "tax-decision-evidence-v1",
    decidedAt: input.decidedAt ?? new Date().toISOString(),
    organizationId: input.organizationId,
    sellerCountryCode: input.sellerSnapshot.countryCode,
    buyerLegalName: input.buyerLegalName,
    buyerCountryCode: input.buyerCountryCode,
    buyerVatIdNormalized: input.buyerVatIdNormalized,
    vatTechnicalState: input.vatTechnicalState,
    viesStatus: input.viesStatus,
    viesCheckedAt: input.viesCheckedAt,
    businessClassification: input.businessClassification,
    taxPolicyOutcome: input.determination.outcome,
    vatRateBps: input.determination.vatRateBps,
    reverseChargeApplied: input.determination.outcome === "REVERSE_CHARGE",
    blocksCheckout: input.determination.blocksCheckout,
    reasonCode: input.determination.reasonCode,
    reverseChargeLegendStatus: input.determination.reverseChargeLegendStatus,
    b2bEntrepreneurConfirmed: isB2bEntrepreneurConfirmed,
    businessEvidenceMethod: resolveBusinessEvidenceMethod({
      taxPolicyOutcome: input.determination.outcome,
      viesStatus: input.viesStatus,
      isB2bEntrepreneurConfirmed,
    }),
    planKey: input.planKey ?? null,
    catalogAmountMinor: input.catalogAmountMinor ?? null,
    currency: input.currency ?? null,
    billingInterval: "month",
    priceVersion: input.priceVersion ?? null,
    sellerSnapshot: input.sellerSnapshot,
  };
}
