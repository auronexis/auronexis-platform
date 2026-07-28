import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  derivePaymentStatus,
  getBillingHistoryStatusLabel,
  hasPdfAvailableForStatus,
  normalizeBillingHistoryStatus,
  type BillingHistoryItem,
} from "@/lib/billing/history-types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { BillingProviderTransaction } from "@/types/database";

const TRANSACTION_SELECT =
  "id, organization_id, billing_provider, provider_transaction_id, provider_customer_id, provider_subscription_id, provider_price_id, status, amount_total, amount_subtotal, amount_tax, currency, occurred_at, paid_at, invoice_url, invoice_number, product_name, payment_method_summary, billing_period_start, billing_period_end, created_at, updated_at";

function toBillingHistoryItem(row: BillingProviderTransaction): BillingHistoryItem {
  const status = normalizeBillingHistoryStatus(row.status);

  return {
    id: row.id,
    providerTransactionId: row.provider_transaction_id,
    date: row.occurred_at ?? row.created_at,
    productName: row.product_name,
    status,
    statusLabel: getBillingHistoryStatusLabel(status),
    subtotalCents: row.amount_subtotal,
    taxCents: row.amount_tax,
    totalCents: row.amount_total,
    currency: row.currency,
    paymentStatus: derivePaymentStatus(status),
    invoiceNumber: row.invoice_number,
    invoicePdfUrl: row.invoice_url,
    hasPdfAvailable: hasPdfAvailableForStatus(status, row.invoice_url),
  };
}

/**
 * Paginated billing history for the current organization, sourced entirely
 * from locally persisted `billing_provider_transactions` rows (FastSpring
 * webhook sync and legacy Paddle history). Never calls a provider API.
 * Ordered newest-first by when the transaction occurred (falls back to created_at).
 */
export async function listOrganizationBillingTransactions(
  session: SessionContext,
  options: { limit?: number; offset?: number } = {},
): Promise<BillingHistoryItem[]> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_provider_transactions")
    .select(TRANSACTION_SELECT)
    .eq("organization_id", session.organization.id)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as BillingProviderTransaction[]).map(toBillingHistoryItem);
}

/**
 * Load a single billing transaction for the current organization.
 * Returns null when it does not exist or belongs to another organization —
 * callers must treat null as "not found", never fall back to an unscoped lookup.
 */
export async function getOrganizationBillingTransaction(
  session: SessionContext,
  providerTransactionId: string,
): Promise<BillingHistoryItem | null> {
  const trimmedId = providerTransactionId.trim();
  if (!trimmedId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_provider_transactions")
    .select(TRANSACTION_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("provider_transaction_id", trimmedId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return toBillingHistoryItem(data as BillingProviderTransaction);
}
