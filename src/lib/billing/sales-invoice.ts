/**
 * Auroranexis sales invoice domain — distinct from Mollie payment receipts.
 * Mollie payment ≠ sales invoice. Gross must equal paid catalog amount.
 * Issued invoices snapshot seller + tax evidence and must not re-read mutable org fields.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TaxPolicyOutcome } from "@/lib/billing/tax-policy";
import { formatVatRateBpsLabel } from "@/lib/billing/taxes";
import { LEGAL_TEXT_PENDING_COUNSEL } from "@/lib/billing/tax-policy";
import { resolveReverseChargeLegend } from "@/lib/billing/reverse-charge-legend";
import {
  buildSellerInvoiceSnapshot,
  type SellerInvoiceSnapshot,
} from "@/lib/billing/seller-tax-config";
import type { TaxDecisionEvidenceSnapshot } from "@/lib/billing/tax-decision-evidence";
import type { B2bTaxRelationshipClass } from "@/lib/billing/tax-classification";
import type { BuyerInvoiceSnapshot } from "@/lib/billing/buyer-invoice-snapshot";
import { buildBuyerInvoiceSnapshot } from "@/lib/billing/buyer-invoice-snapshot";

export type SalesInvoiceStatus = "draft" | "issued" | "void";

export type { BuyerInvoiceSnapshot };

export type SalesInvoiceLine = {
  description: string;
  quantity: number;
  unitGrossMinor: number;
  lineGrossMinor: number;
  lineNetMinor: number;
  lineVatMinor: number;
};

export type SalesInvoiceRecord = {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  status: SalesInvoiceStatus;
  currency: string;
  netMinor: number;
  vatRateBps: number;
  vatMinor: number;
  grossMinor: number;
  taxPolicyOutcome: TaxPolicyOutcome;
  businessClassification: B2bTaxRelationshipClass | null;
  reverseChargeApplied: boolean;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  molliePaymentId: string | null;
  providerTransactionId: string | null;
  buyerLegalName: string | null;
  buyerVatId: string | null;
  buyerCountryCode: string | null;
  buyerAddressLine1: string | null;
  buyerAddressLine2: string | null;
  buyerPostalCode: string | null;
  buyerCity: string | null;
  buyerBillingEmail: string | null;
  sellerSnapshot: SellerInvoiceSnapshot | null;
  taxDecisionEvidence: TaxDecisionEvidenceSnapshot | null;
  issuedAt: string | null;
  lines: SalesInvoiceLine[];
  /** Customer-safe tax note — never includes LEGAL_TEXT_PENDING_COUNSEL. */
  taxNote: string | null;
  createdAt: string;
};

export type IssueSalesInvoiceInput = {
  organizationId: string;
  currency: string;
  netMinor: number;
  vatRateBps: number;
  vatMinor: number;
  grossMinor: number;
  taxPolicyOutcome: TaxPolicyOutcome;
  businessClassification?: B2bTaxRelationshipClass | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  molliePaymentId?: string | null;
  providerTransactionId?: string | null;
  buyerLegalName?: string | null;
  buyerVatId?: string | null;
  buyerCountryCode?: string | null;
  buyerAddressLine1?: string | null;
  buyerAddressLine2?: string | null;
  buyerPostalCode?: string | null;
  buyerCity?: string | null;
  buyerBillingEmail?: string | null;
  /** Preferred over individual buyer* fields when provided. */
  buyerSnapshot?: BuyerInvoiceSnapshot | null;
  productName: string;
  taxDecisionEvidence?: TaxDecisionEvidenceSnapshot | null;
  sellerSnapshot?: SellerInvoiceSnapshot | null;
  /** When reverse-charge legend is pending counsel, omit customer-facing RC wording. */
  reverseChargeLegendStatus?: typeof LEGAL_TEXT_PENDING_COUNSEL | "approved" | "n/a";
};

function assertMoneyInvariant(input: IssueSalesInvoiceInput): void {
  if (!Number.isInteger(input.grossMinor) || input.grossMinor < 0) {
    throw new Error("grossMinor must be a non-negative integer");
  }
  if (input.netMinor + input.vatMinor !== input.grossMinor) {
    throw new Error("Invoice invariant violated: net + vat must equal gross");
  }
}

function buildTaxNote(input: IssueSalesInvoiceInput): string | null {
  if (input.taxPolicyOutcome === "STANDARD_DOMESTIC_VAT") {
    return formatVatRateBpsLabel(input.vatRateBps);
  }
  if (input.taxPolicyOutcome === "REVERSE_CHARGE") {
    const legend = resolveReverseChargeLegend({
      taxPolicyOutcome: input.taxPolicyOutcome,
      reverseChargeLegendStatus: input.reverseChargeLegendStatus ?? LEGAL_TEXT_PENDING_COUNSEL,
    });
    return legend.showOnInvoice ? legend.legendText : null;
  }
  return null;
}

async function allocateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("allocate_sales_invoice_number" as never, {
    p_organization_id: organizationId,
    p_year: year,
  } as never);

  if (!error && data) {
    return String(data);
  }

  // Fallback when RPC not yet applied in local env — still unique enough for draft issue.
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `ANX-${year}-${suffix}`;
}

export async function issueSalesInvoice(input: IssueSalesInvoiceInput): Promise<SalesInvoiceRecord> {
  assertMoneyInvariant(input);
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const invoiceNumber = await allocateInvoiceNumber(input.organizationId);
  const taxNote = buildTaxNote(input);
  const sellerSnapshot = input.sellerSnapshot ?? buildSellerInvoiceSnapshot();
  const buyerSnapshot =
    input.buyerSnapshot ??
    buildBuyerInvoiceSnapshot({
      organizationId: input.organizationId,
      legalName: input.buyerLegalName ?? null,
      billingEmail: input.buyerBillingEmail ?? null,
      countryCode: input.buyerCountryCode ?? null,
      addressLine1: input.buyerAddressLine1 ?? null,
      addressLine2: input.buyerAddressLine2 ?? null,
      postalCode: input.buyerPostalCode ?? null,
      city: input.buyerCity ?? null,
      vatId: input.buyerVatId ?? null,
      vatIdNormalized: null,
      viesStatus: null,
      viesCheckedAt: null,
      updatedAt: now,
    });
  const reverseChargeApplied = input.taxPolicyOutcome === "REVERSE_CHARGE";
  const businessClassification =
    input.businessClassification ??
    input.taxDecisionEvidence?.businessClassification ??
    null;

  const lines: SalesInvoiceLine[] = [
    {
      description: input.productName,
      quantity: 1,
      unitGrossMinor: input.grossMinor,
      lineGrossMinor: input.grossMinor,
      lineNetMinor: input.netMinor,
      lineVatMinor: input.vatMinor,
    },
  ];

  const payload = {
    organization_id: input.organizationId,
    invoice_number: invoiceNumber,
    status: "issued",
    currency: input.currency.toUpperCase(),
    net_minor: input.netMinor,
    vat_rate_bps: input.vatRateBps,
    vat_minor: input.vatMinor,
    gross_minor: input.grossMinor,
    tax_policy_outcome: input.taxPolicyOutcome,
    tax_note: taxNote,
    billing_period_start: input.billingPeriodStart ?? null,
    billing_period_end: input.billingPeriodEnd ?? null,
    mollie_payment_id: input.molliePaymentId ?? null,
    provider_transaction_id: input.providerTransactionId ?? null,
    buyer_legal_name: buyerSnapshot.legalName,
    buyer_vat_id: buyerSnapshot.vatId,
    buyer_country_code: buyerSnapshot.countryCode,
    buyer_address_line1: buyerSnapshot.addressLine1,
    buyer_address_line2: buyerSnapshot.addressLine2,
    buyer_postal_code: buyerSnapshot.postalCode,
    buyer_city: buyerSnapshot.city,
    buyer_billing_email: buyerSnapshot.billingEmail,
    seller_snapshot: sellerSnapshot,
    tax_decision_evidence: input.taxDecisionEvidence ?? null,
    reverse_charge_applied: reverseChargeApplied,
    business_classification: businessClassification,
    lines_json: lines,
    issued_at: now,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("sales_invoices")
    .insert(payload as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to issue sales invoice: ${error?.message ?? "unknown"}`);
  }

  const invoice = mapInvoiceRow(data as Record<string, unknown>);

  // C2: after ISSUED persist — email failure must never roll back the invoice.
  // Dynamic import avoids a static cycle with sales-invoice-render.
  try {
    const { deliverIssuedSalesInvoiceEmail } = await import("@/lib/billing/sales-invoice-email");
    await deliverIssuedSalesInvoiceEmail(invoice);
  } catch {
    console.error("[billing][sales-invoice-email] unexpected failure (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
    });
  }

  return invoice;
}

function mapInvoiceRow(row: Record<string, unknown>): SalesInvoiceRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    invoiceNumber: String(row.invoice_number),
    status: row.status as SalesInvoiceStatus,
    currency: String(row.currency),
    netMinor: Number(row.net_minor),
    vatRateBps: Number(row.vat_rate_bps),
    vatMinor: Number(row.vat_minor),
    grossMinor: Number(row.gross_minor),
    taxPolicyOutcome: row.tax_policy_outcome as TaxPolicyOutcome,
    businessClassification: (row.business_classification as B2bTaxRelationshipClass | null) ?? null,
    reverseChargeApplied: Boolean(row.reverse_charge_applied),
    billingPeriodStart: (row.billing_period_start as string | null) ?? null,
    billingPeriodEnd: (row.billing_period_end as string | null) ?? null,
    molliePaymentId: (row.mollie_payment_id as string | null) ?? null,
    providerTransactionId: (row.provider_transaction_id as string | null) ?? null,
    buyerLegalName: (row.buyer_legal_name as string | null) ?? null,
    buyerVatId: (row.buyer_vat_id as string | null) ?? null,
    buyerCountryCode: (row.buyer_country_code as string | null) ?? null,
    buyerAddressLine1: (row.buyer_address_line1 as string | null) ?? null,
    buyerAddressLine2: (row.buyer_address_line2 as string | null) ?? null,
    buyerPostalCode: (row.buyer_postal_code as string | null) ?? null,
    buyerCity: (row.buyer_city as string | null) ?? null,
    buyerBillingEmail: (row.buyer_billing_email as string | null) ?? null,
    sellerSnapshot: (row.seller_snapshot as SellerInvoiceSnapshot | null) ?? null,
    taxDecisionEvidence: (row.tax_decision_evidence as TaxDecisionEvidenceSnapshot | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    lines: Array.isArray(row.lines_json) ? (row.lines_json as SalesInvoiceLine[]) : [],
    taxNote: (row.tax_note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/** Buyer snapshot from an issued invoice row — never reads live org identity. */
export function getBuyerSnapshotFromInvoice(invoice: SalesInvoiceRecord): BuyerInvoiceSnapshot {
  return {
    legalName: invoice.buyerLegalName,
    addressLine1: invoice.buyerAddressLine1,
    addressLine2: invoice.buyerAddressLine2,
    postalCode: invoice.buyerPostalCode,
    city: invoice.buyerCity,
    countryCode: invoice.buyerCountryCode,
    vatId: invoice.buyerVatId,
    billingEmail: invoice.buyerBillingEmail,
  };
}

/**
 * Tenant-scoped issued invoice for PDF download.
 * Returns null when missing, wrong org, or not issued — never invents rows.
 */
export function resolveIssuedSalesInvoiceForDownload(input: {
  invoice: SalesInvoiceRecord | null;
  organizationId: string;
}): SalesInvoiceRecord | null {
  const { invoice, organizationId } = input;
  if (!invoice) return null;
  if (invoice.organizationId !== organizationId) return null;
  if (invoice.status !== "issued") return null;
  return invoice;
}

export async function listSalesInvoicesForOrganization(
  organizationId: string,
): Promise<SalesInvoiceRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list sales invoices: ${error.message}`);
  }

  return (data ?? []).map((row) => mapInvoiceRow(row as Record<string, unknown>));
}

export async function getSalesInvoiceForOrganization(input: {
  organizationId: string;
  invoiceId: string;
}): Promise<SalesInvoiceRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_invoices")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("id", input.invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load sales invoice: ${error.message}`);
  }
  if (!data) return null;
  return mapInvoiceRow(data as Record<string, unknown>);
}

export async function getSalesInvoiceByProviderTransactionId(input: {
  organizationId: string;
  providerTransactionId: string;
}): Promise<SalesInvoiceRecord | null> {
  const trimmed = input.providerTransactionId.trim();
  if (!trimmed) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_invoices")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("provider_transaction_id", trimmed)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load sales invoice by payment: ${error.message}`);
  }
  if (!data) return null;
  return mapInvoiceRow(data as Record<string, unknown>);
}

export async function listSalesInvoiceIdsByProviderTransactionIds(input: {
  organizationId: string;
  providerTransactionIds: string[];
}): Promise<Map<string, string>> {
  const ids = [...new Set(input.providerTransactionIds.map((id) => id.trim()).filter(Boolean))];
  const result = new Map<string, string>();
  if (ids.length === 0) return result;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_invoices")
    .select("id, provider_transaction_id")
    .eq("organization_id", input.organizationId)
    .eq("status", "issued")
    .in("provider_transaction_id", ids);

  if (error) {
    throw new Error(`Failed to map sales invoices: ${error.message}`);
  }

  for (const row of data ?? []) {
    const providerId = (row as { provider_transaction_id?: string | null }).provider_transaction_id;
    const invoiceId = (row as { id?: string }).id;
    if (providerId && invoiceId) {
      result.set(providerId, invoiceId);
    }
  }
  return result;
}

/**
 * Presentation DTO for customer UI — Net, VAT %, VAT amount, Total.
 * Uses stored invoice facts only (immutable after issue).
 */
export function toCustomerInvoiceView(invoice: SalesInvoiceRecord): {
  invoiceNumber: string;
  currency: string;
  netMinor: number;
  vatRateLabel: string;
  vatMinor: number;
  grossMinor: number;
  taxNote: string | null;
  reverseChargeApplied: boolean;
  issuedAt: string | null;
  buyerLegalName: string | null;
  buyerCountryCode: string | null;
  buyerAddressLine1: string | null;
  buyerCity: string | null;
  buyerPostalCode: string | null;
  buyerBillingEmail: string | null;
  sellerLegalName: string | null;
  lines: SalesInvoiceLine[];
} {
  return {
    invoiceNumber: invoice.invoiceNumber,
    currency: invoice.currency,
    netMinor: invoice.netMinor,
    vatRateLabel: formatVatRateBpsLabel(invoice.vatRateBps),
    vatMinor: invoice.vatMinor,
    grossMinor: invoice.grossMinor,
    taxNote: invoice.taxNote,
    reverseChargeApplied: invoice.reverseChargeApplied,
    issuedAt: invoice.issuedAt,
    buyerLegalName: invoice.buyerLegalName,
    buyerCountryCode: invoice.buyerCountryCode,
    buyerAddressLine1: invoice.buyerAddressLine1,
    buyerCity: invoice.buyerCity,
    buyerPostalCode: invoice.buyerPostalCode,
    buyerBillingEmail: invoice.buyerBillingEmail,
    sellerLegalName: invoice.sellerSnapshot?.legalName ?? null,
    lines: invoice.lines,
  };
}

/** Credit-note capability — structural gap documented for external accounting design. */
export const SALES_INVOICE_CREDIT_NOTE_STATUS = {
  supported: false as const,
  code: "CREDIT_NOTE_NOT_IMPLEMENTED" as const,
  note: "Refunds must not mutate issued sales invoice totals. Credit-note issuance is deferred.",
};
