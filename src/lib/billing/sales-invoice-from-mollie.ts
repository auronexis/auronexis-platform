/**
 * Best-effort sales invoice issuance after Mollie payment sync.
 * Never blocks entitlement reconciliation — failures are logged only.
 * Fail-closed: no silent DE country default; Reverse Charge auto-issue only when
 * determination is unblocked with IMPLEMENTATION_TEXT_APPROVED_FOR_C3 legend status.
 */

import "server-only";

import { getOrganizationBillingIdentity } from "@/lib/billing/billing-identity";
import { buildBuyerInvoiceSnapshot } from "@/lib/billing/buyer-invoice-snapshot";
import { issueSalesInvoice } from "@/lib/billing/sales-invoice";
import {
  determineTaxPolicy,
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
} from "@/lib/billing/tax-policy";
import { calculateVatInclusiveBreakdown } from "@/lib/billing/taxes";
import { resolveVatIdTechnicalState } from "@/lib/billing/vat-id-status";
import { normalizeVatId } from "@/lib/billing/vies";
import { buildSellerInvoiceSnapshot, getSellerTaxConfiguration } from "@/lib/billing/seller-tax-config";
import { buildTaxDecisionEvidenceSnapshot } from "@/lib/billing/tax-decision-evidence";
import { createAdminClient } from "@/lib/supabase/admin";

export async function maybeIssueSalesInvoiceForPaidMolliePayment(input: {
  organizationId: string;
  paymentId: string;
  amountTotalMinor: number | null;
  currency: string | null;
  productName: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  planKey?: string | null;
  priceVersion?: string | null;
}): Promise<void> {
  if (input.amountTotalMinor === null || input.amountTotalMinor < 0 || !input.currency) {
    return;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("sales_invoices")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("provider_transaction_id", input.paymentId)
    .maybeSingle();
  if (existing) {
    return;
  }

  const sellerConfig = getSellerTaxConfiguration();
  if (sellerConfig.status === "OPERATOR_INPUT_REQUIRED") {
    console.warn("[billing][sales-invoice] skipped — seller tax configuration incomplete", {
      missingFields: sellerConfig.missingFields,
    });
    return;
  }

  const identity = await getOrganizationBillingIdentity(input.organizationId);
  const countryCode = identity?.countryCode?.trim().toUpperCase() || null;
  if (!countryCode) {
    console.warn("[billing][sales-invoice] skipped — buyer billing country missing (fail-closed)");
    return;
  }

  const viesStatus =
    (identity?.viesStatus as
      | "valid"
      | "invalid"
      | "unavailable"
      | "not_checked"
      | "skipped"
      | null) ?? "not_checked";

  const determination = determineTaxPolicy({
    customerCountryCode: countryCode,
    vatId: identity?.vatId ?? null,
    viesStatus,
    isB2bEntrepreneurConfirmed: true,
  });

  const mayIssueDomestic =
    determination.outcome === "STANDARD_DOMESTIC_VAT" && determination.vatRateBps !== null;
  const mayIssueReverseCharge =
    determination.outcome === "REVERSE_CHARGE" &&
    !determination.blocksCheckout &&
    determination.reverseChargeLegendStatus === IMPLEMENTATION_TEXT_APPROVED_FOR_C3;

  if (!mayIssueDomestic && !mayIssueReverseCharge) {
    return;
  }

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: input.amountTotalMinor,
    determination,
  });

  const sellerSnapshot = buildSellerInvoiceSnapshot();
  const buyerSnapshot = buildBuyerInvoiceSnapshot(identity);
  const vatTechnicalState = resolveVatIdTechnicalState({
    vatId: identity?.vatId,
    viesStatus,
  });

  const taxDecisionEvidence = buildTaxDecisionEvidenceSnapshot({
    organizationId: input.organizationId,
    buyerLegalName: buyerSnapshot.legalName,
    buyerCountryCode: countryCode,
    buyerVatIdNormalized: normalizeVatId(identity?.vatId ?? null),
    vatTechnicalState,
    viesStatus,
    viesCheckedAt: identity?.viesCheckedAt ?? null,
    businessClassification: determination.businessClassification,
    determination,
    sellerSnapshot,
    planKey: input.planKey ?? null,
    catalogAmountMinor: input.amountTotalMinor,
    currency: input.currency,
    priceVersion: input.priceVersion ?? null,
  });

  const invoice = await issueSalesInvoice({
    organizationId: input.organizationId,
    currency: input.currency,
    netMinor: breakdown.netMinor,
    vatRateBps: breakdown.vatRateBps,
    vatMinor: breakdown.vatMinor,
    grossMinor: breakdown.grossMinor,
    taxPolicyOutcome: breakdown.outcome,
    businessClassification: determination.businessClassification,
    billingPeriodStart: input.billingPeriodStart ?? null,
    billingPeriodEnd: input.billingPeriodEnd ?? null,
    molliePaymentId: input.paymentId,
    providerTransactionId: input.paymentId,
    buyerSnapshot,
    productName: input.productName,
    sellerSnapshot,
    taxDecisionEvidence,
    reverseChargeLegendStatus: determination.reverseChargeLegendStatus,
  });

  await admin
    .from("billing_provider_transactions")
    .update({
      invoice_number: invoice.invoiceNumber,
      amount_tax: invoice.vatMinor,
      amount_subtotal: invoice.netMinor,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("billing_provider", "mollie")
    .eq("provider_transaction_id", input.paymentId);
}
