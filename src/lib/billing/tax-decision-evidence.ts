/**
 * Immutable tax decision evidence attached to checkout / invoice issuance.
 * Never log VAT IDs or addresses into analytics/activity from this structure.
 */

import "server-only";

import type { B2bTaxRelationshipClass } from "@/lib/billing/tax-classification";
import type { TaxDeterminationResult, TaxPolicyOutcome } from "@/lib/billing/tax-policy";
import type { VatIdTechnicalState } from "@/lib/billing/vat-id-status";
import type { SellerInvoiceSnapshot } from "@/lib/billing/seller-tax-config";

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
  planKey: string | null;
  catalogAmountMinor: number | null;
  currency: string | null;
  billingInterval: "month" | null;
  priceVersion: string | null;
  sellerSnapshot: SellerInvoiceSnapshot;
};

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
}): TaxDecisionEvidenceSnapshot {
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
    planKey: input.planKey ?? null,
    catalogAmountMinor: input.catalogAmountMinor ?? null,
    currency: input.currency ?? null,
    billingInterval: "month",
    priceVersion: input.priceVersion ?? null,
    sellerSnapshot: input.sellerSnapshot,
  };
}
