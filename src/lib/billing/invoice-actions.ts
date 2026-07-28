"use server";

import { requireSession } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import type { BillingHistoryItem } from "@/lib/billing/history-types";
import {
  getOrganizationBillingTransaction,
  listOrganizationBillingTransactions,
} from "@/lib/billing/transactions";

export type GetBillingHistoryActionResult =
  | { ok: true; items: BillingHistoryItem[] }
  | { ok: false; error: string };

/** Paginated billing history for the settings billing history UI. */
export async function getBillingHistoryAction(
  options: { limit?: number; offset?: number } = {},
): Promise<GetBillingHistoryActionResult> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const items = await listOrganizationBillingTransactions(session, options);
    return { ok: true, items };
  } catch (error) {
    return {
      ok: false,
      error: sanitizeBillingCustomerError(error, "Unable to load billing history."),
    };
  }
}

export type OpenInvoicePdfActionResult = { url: string } | { error: string };

/**
 * Returns the persisted invoice/receipt URL for a transaction owned by the
 * caller's organization. Never returns a URL for a transaction it does not
 * own, and never calls a provider API — only what was stored at webhook
 * sync time. Legacy Paddle rows without a stored URL report unavailable.
 */
export async function openInvoicePdfAction(
  providerTransactionId: string,
): Promise<OpenInvoicePdfActionResult> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const trimmedId = providerTransactionId?.trim();
    if (!trimmedId) {
      return { error: "Invoice not found." };
    }

    const transaction = await getOrganizationBillingTransaction(session, trimmedId);
    if (!transaction) {
      return { error: "Invoice not found." };
    }

    if (!transaction.hasPdfAvailable || !transaction.invoicePdfUrl) {
      return { error: "An invoice PDF is not available for this transaction." };
    }

    return { url: transaction.invoicePdfUrl };
  } catch (error) {
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open the invoice PDF."),
    };
  }
}
