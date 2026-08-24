/**
 * Best-effort sales invoice issuance after Mollie payment sync.
 * Never blocks entitlement reconciliation — failures are logged only.
 */

import "server-only";

import { getOrganizationBillingIdentity } from "@/lib/billing/billing-identity";
import { issueSalesInvoice } from "@/lib/billing/sales-invoice";
import { determineTaxPolicy, LEGAL_TEXT_PENDING_COUNSEL } from "@/lib/billing/tax-policy";
import { calculateVatInclusiveBreakdown } from "@/lib/billing/taxes";
import { createAdminClient } from "@/lib/supabase/admin";

export async function maybeIssueSalesInvoiceForPaidMolliePayment(input: {
  organizationId: string;
  paymentId: string;
  amountTotalMinor: number | null;
  currency: string | null;
  productName: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
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

  const identity = await getOrganizationBillingIdentity(input.organizationId);
  const determination = determineTaxPolicy({
    customerCountryCode: identity?.countryCode ?? "DE",
    vatId: identity?.vatId ?? null,
    viesStatus: (identity?.viesStatus as "valid" | "invalid" | "unavailable" | "not_checked" | "skipped" | null) ?? "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });

  // Only auto-issue for self-serve domestic VAT path — never invent reverse-charge legends.
  if (determination.outcome !== "STANDARD_DOMESTIC_VAT" || determination.vatRateBps === null) {
    return;
  }

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: input.amountTotalMinor,
    determination,
  });

  const invoice = await issueSalesInvoice({
    organizationId: input.organizationId,
    currency: input.currency,
    netMinor: breakdown.netMinor,
    vatRateBps: breakdown.vatRateBps,
    vatMinor: breakdown.vatMinor,
    grossMinor: breakdown.grossMinor,
    taxPolicyOutcome: breakdown.outcome,
    billingPeriodStart: input.billingPeriodStart ?? null,
    billingPeriodEnd: input.billingPeriodEnd ?? null,
    molliePaymentId: input.paymentId,
    providerTransactionId: input.paymentId,
    buyerLegalName: identity?.legalName ?? null,
    buyerVatId: identity?.vatId ?? null,
    buyerCountryCode: identity?.countryCode ?? null,
    productName: input.productName,
    reverseChargeLegendStatus: LEGAL_TEXT_PENDING_COUNSEL,
  });

  const adminForUpdate = createAdminClient();
  await adminForUpdate
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
