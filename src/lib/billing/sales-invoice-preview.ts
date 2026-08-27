/**
 * Operator sales invoice visual acceptance — in-memory only.
 * No DB writes, no Mollie calls, no invoice sequence allocation, no accounting mutation.
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
import { OPERATOR_TEST_DOCUMENT_INDICATOR } from "@/lib/billing/sales-invoice-test-marker";

/** Synthetic org id — never persisted; must not appear in Billing history queries. */
export const PREVIEW_ORGANIZATION_ID = "00000000-0000-4000-8000-000000PREVIEW";

/** Fixed C1.5 Business visual-acceptance invoice number (ephemeral; not from sequence). */
export const OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER = "TEST-ANX-2026-000001";

export const OPERATOR_VISUAL_ACCEPTANCE_BUYER = {
  legalName: "Auroranexis Invoice Test GmbH",
  addressLine1: "Musterstraße 10",
  postalCode: "68159",
  city: "Mannheim",
  countryCode: "DE",
  vatId: "DE123456789",
  billingEmail: "invoice-test@auroranexis.invalid",
} as const;

export const PREVIEW_BUYER_LEGAL_NAME = OPERATOR_VISUAL_ACCEPTANCE_BUYER.legalName;
export const PREVIEW_PAYMENT_REFERENCE = "tr_TEST_VISUAL_ACCEPTANCE_NONPRODUCTION";

export { OPERATOR_TEST_DOCUMENT_INDICATOR };

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

function previewInvoiceNumber(planKey: PreviewSalesInvoicePlanKey): string {
  if (planKey === "business") {
    return OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER;
  }
  return "TEST-ANX-2026-PRO-000001";
}

/**
 * Build an in-memory sales invoice for operator visual acceptance.
 * Never persists to sales_invoices, never allocates production invoice numbers,
 * never calls Mollie, never mutates subscription/entitlement/tax evidence stores.
 */
export function buildPreviewSalesInvoice(
  planKey: PreviewSalesInvoicePlanKey = "business",
): PreviewSalesInvoiceResult {
  const plan = getPlanByKey(planKey);
  const sellerConfig = getSellerTaxConfiguration();
  const sellerSnapshot = buildSellerInvoiceSnapshot();
  const now = new Date().toISOString();
  const period = currentUtcBillingPeriod();
  const buyer = OPERATOR_VISUAL_ACCEPTANCE_BUYER;

  const determination = determineTaxPolicy({
    customerCountryCode: buyer.countryCode,
    vatId: buyer.vatId,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: plan.amountMinor,
    determination,
  });

  const vatTechnicalState = resolveVatIdTechnicalState({
    vatId: buyer.vatId,
    viesStatus: "not_checked",
  });

  const taxDecisionEvidence = buildTaxDecisionEvidenceSnapshot({
    organizationId: PREVIEW_ORGANIZATION_ID,
    decidedAt: now,
    buyerLegalName: buyer.legalName,
    buyerCountryCode: buyer.countryCode,
    buyerVatIdNormalized: buyer.vatId,
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
    id: "preview-ephemeral-visual-acceptance",
    organizationId: PREVIEW_ORGANIZATION_ID,
    invoiceNumber: previewInvoiceNumber(planKey),
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
    buyerLegalName: buyer.legalName,
    buyerVatId: buyer.vatId,
    buyerCountryCode: buyer.countryCode,
    buyerAddressLine1: buyer.addressLine1,
    buyerAddressLine2: null,
    buyerPostalCode: buyer.postalCode,
    buyerCity: buyer.city,
    buyerBillingEmail: buyer.billingEmail,
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
