"use server";

import { requireSession } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import type { BillingHistoryItem } from "@/lib/billing/history-types";
import {
  getPaddleInvoicePdfUrl,
  listOrganizationBillingTransactions,
} from "@/lib/paddle/transactions";

export type GetBillingHistoryActionResult =
  | { ok: true; items: BillingHistoryItem[] }
  | { ok: false; error: string };

/** Paginated Paddle billing history for the settings billing history UI. */
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

export type OpenPaddleInvoicePdfActionResult = { url: string } | { error: string };

/**
 * Returns a temporary Paddle invoice PDF URL for a transaction owned by the
 * caller's organization. Never returns a URL for a transaction it does not own.
 */
export async function openPaddleInvoicePdfAction(
  providerTransactionId: string,
): Promise<OpenPaddleInvoicePdfActionResult> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const trimmedId = providerTransactionId?.trim();
    if (!trimmedId) {
      return { error: "Invoice not found." };
    }

    const url = await getPaddleInvoicePdfUrl(session, trimmedId);
    return { url };
  } catch (error) {
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open the invoice PDF."),
    };
  }
}
