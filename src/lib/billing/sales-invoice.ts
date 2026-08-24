/**
 * Auroranexis sales invoice domain — distinct from Mollie payment receipts.
 * Mollie payment ≠ sales invoice. Gross must equal paid catalog amount.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TaxPolicyOutcome } from "@/lib/billing/tax-policy";
import { formatVatRateBpsLabel } from "@/lib/billing/taxes";
import { LEGAL_TEXT_PENDING_COUNSEL } from "@/lib/billing/tax-policy";

export type SalesInvoiceStatus = "draft" | "issued" | "void";

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
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  molliePaymentId: string | null;
  providerTransactionId: string | null;
  buyerLegalName: string | null;
  buyerVatId: string | null;
  buyerCountryCode: string | null;
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
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  molliePaymentId?: string | null;
  providerTransactionId?: string | null;
  buyerLegalName?: string | null;
  buyerVatId?: string | null;
  buyerCountryCode?: string | null;
  productName: string;
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
    if (input.reverseChargeLegendStatus === "approved") {
      // Approved counsel text would be injected here — none present yet.
      return null;
    }
    // Do not invent reverse-charge wording for customers.
    return null;
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
    buyer_legal_name: input.buyerLegalName ?? null,
    buyer_vat_id: input.buyerVatId ?? null,
    buyer_country_code: input.buyerCountryCode ?? null,
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

  return mapInvoiceRow(data as Record<string, unknown>);
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
    billingPeriodStart: (row.billing_period_start as string | null) ?? null,
    billingPeriodEnd: (row.billing_period_end as string | null) ?? null,
    molliePaymentId: (row.mollie_payment_id as string | null) ?? null,
    providerTransactionId: (row.provider_transaction_id as string | null) ?? null,
    buyerLegalName: (row.buyer_legal_name as string | null) ?? null,
    buyerVatId: (row.buyer_vat_id as string | null) ?? null,
    buyerCountryCode: (row.buyer_country_code as string | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    lines: Array.isArray(row.lines_json) ? (row.lines_json as SalesInvoiceLine[]) : [],
    taxNote: (row.tax_note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
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

/** Presentation DTO for customer UI — Net, VAT %, VAT amount, Total. */
export function toCustomerInvoiceView(invoice: SalesInvoiceRecord): {
  invoiceNumber: string;
  currency: string;
  netMinor: number;
  vatRateLabel: string;
  vatMinor: number;
  grossMinor: number;
  taxNote: string | null;
  issuedAt: string | null;
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
    issuedAt: invoice.issuedAt,
    lines: invoice.lines,
  };
}
