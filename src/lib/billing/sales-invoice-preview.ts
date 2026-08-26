/**
 * Ephemeral sales invoice preview — no DB writes, no Mollie calls.
 * Uses the same tax engine and domain record shape as production issuance.
 */

import "server-only";

import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import { buildSellerInvoiceSnapshot, getSellerTaxConfiguration } from "@/lib/billing/seller-tax-config";
import { buildTaxDecisionEvidenceSnapshot } from "@/lib/billing/tax-decision-evidence";
import { determineTaxPolicy, LEGAL_TEXT_PENDING_COUNSEL } from "@/lib/billing/tax-policy";
import { calculateVatInclusiveBreakdown, formatVatRateBpsLabel } from "@/lib/billing/taxes";
import { resolveReverseChargeLegend } from "@/lib/billing/reverse-charge-legend";
import { resolveVatIdTechnicalState } from "@/lib/billing/vat-id-status";

export const PREVIEW_ORGANIZATION_ID = "00000000-0000-4000-8000-000000PREVIEW";
export const PREVIEW_BUYER_LEGAL_NAME =
  "PREVIEW — Internal Verification Buyer GmbH (non-production)";
export const PREVIEW_PAYMENT_REFERENCE = "tr_PREVIEW_NONPRODUCTION";

export type PreviewSalesInvoicePlanKey = Extract<PlanKey, "professional" | "business">;

export type PreviewSalesInvoiceResult = {
  invoice: SalesInvoiceRecord;
  sellerConfig: ReturnType<typeof getSellerTaxConfiguration>;
  isPreview: true;
};

function buildPreviewTaxNote(input: {
  taxPolicyOutcome: SalesInvoiceRecord["taxPolicyOutcome"];
  vatRateBps: number;
}): string | null {
  if (input.taxPolicyOutcome === "STANDARD_DOMESTIC_VAT") {
    return formatVatRateBpsLabel(input.vatRateBps);
  }
  if (input.taxPolicyOutcome === "REVERSE_CHARGE") {
    const legend = resolveReverseChargeLegend({
      taxPolicyOutcome: input.taxPolicyOutcome,
      reverseChargeLegendStatus: LEGAL_TEXT_PENDING_COUNSEL,
    });
    return legend.showOnInvoice ? legend.legendText : null;
  }
  return null;
}

function currentUtcBillingPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function allocatePreviewInvoiceNumber(): string {
  const year = new Date().getUTCFullYear();
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `ANX-PREVIEW-${year}-${suffix}`;
}

/**
 * Build an in-memory sales invoice for operator/dev verification.
 * Never persists to sales_invoices or mutates production financial state.
 */
export function buildPreviewSalesInvoice(
  planKey: PreviewSalesInvoicePlanKey = "professional",
): PreviewSalesInvoiceResult {
  const plan = getPlanByKey(planKey);
  const sellerConfig = getSellerTaxConfiguration();
  const sellerSnapshot = buildSellerInvoiceSnapshot();
  const now = new Date().toISOString();
  const period = currentUtcBillingPeriod();

  const determination = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: plan.amountMinor,
    determination,
  });

  const vatTechnicalState = resolveVatIdTechnicalState({
    vatId: null,
    viesStatus: "not_checked",
  });

  const taxDecisionEvidence = buildTaxDecisionEvidenceSnapshot({
    organizationId: PREVIEW_ORGANIZATION_ID,
    decidedAt: now,
    buyerLegalName: PREVIEW_BUYER_LEGAL_NAME,
    buyerCountryCode: "DE",
    buyerVatIdNormalized: null,
    vatTechnicalState,
    viesStatus: "not_checked",
    viesCheckedAt: null,
    businessClassification: determination.businessClassification,
    determination,
    sellerSnapshot,
    planKey: plan.key,
    catalogAmountMinor: plan.amountMinor,
    currency: plan.currency,
    priceVersion: plan.priceVersion,
  });

  const taxNote = buildPreviewTaxNote({
    taxPolicyOutcome: breakdown.outcome,
    vatRateBps: breakdown.vatRateBps,
  });

  const productName = `${plan.name} — Monthly subscription (${plan.priceVersion})`;

  const invoice: SalesInvoiceRecord = {
    id: "preview-ephemeral",
    organizationId: PREVIEW_ORGANIZATION_ID,
    invoiceNumber: allocatePreviewInvoiceNumber(),
    status: "issued",
    currency: plan.currency,
    netMinor: breakdown.netMinor,
    vatRateBps: breakdown.vatRateBps,
    vatMinor: breakdown.vatMinor,
    grossMinor: breakdown.grossMinor,
    taxPolicyOutcome: breakdown.outcome,
    businessClassification: determination.businessClassification,
    reverseChargeApplied: breakdown.outcome === "REVERSE_CHARGE",
    billingPeriodStart: period.start,
    billingPeriodEnd: period.end,
    molliePaymentId: PREVIEW_PAYMENT_REFERENCE,
    providerTransactionId: PREVIEW_PAYMENT_REFERENCE,
    buyerLegalName: PREVIEW_BUYER_LEGAL_NAME,
    buyerVatId: null,
    buyerCountryCode: "DE",
    sellerSnapshot,
    taxDecisionEvidence,
    issuedAt: now,
    lines: [
      {
        description: productName,
        quantity: 1,
        unitGrossMinor: breakdown.grossMinor,
        lineGrossMinor: breakdown.grossMinor,
        lineNetMinor: breakdown.netMinor,
        lineVatMinor: breakdown.vatMinor,
      },
    ],
    taxNote,
    createdAt: now,
  };

  return { invoice, sellerConfig, isPreview: true };
}
