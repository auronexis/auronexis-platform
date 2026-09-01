"use server";

import { requireSession } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import {
  buildSalesInvoicePdfDownloadPath,
  type BillingHistoryItem,
} from "@/lib/billing/history-types";
import {
  getOrganizationBillingTransaction,
  listOrganizationBillingTransactions,
} from "@/lib/billing/transactions";
import {
  getSalesInvoiceByProviderTransactionId,
  getSalesInvoiceForOrganization,
  resolveIssuedSalesInvoiceForDownload,
} from "@/lib/billing/sales-invoice";

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
 * Returns the Mollie/provider payment receipt URL for a transaction owned by
 * the caller's organization. This is NOT an Auroranexis sales invoice PDF.
 * Prefer downloadSalesInvoicePdfAction / the sales-invoice PDF route for tax invoices.
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

    if (!transaction.hasPaymentReceipt || !transaction.paymentReceiptUrl) {
      return { error: "A payment receipt is not available for this transaction." };
    }

    return { url: transaction.paymentReceiptUrl };
  } catch (error) {
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open the payment receipt."),
    };
  }
}

export type DownloadSalesInvoicePdfActionResult = { url: string } | { error: string };

export type DownloadSalesInvoiceEInvoiceActionResult = { url: string } | { error: string };

export async function downloadSalesInvoiceEInvoiceAction(input: {
  salesInvoiceId?: string | null;
}): Promise<DownloadSalesInvoiceEInvoiceActionResult> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const salesInvoiceId = input.salesInvoiceId?.trim();
    if (!salesInvoiceId) {
      return { error: "E-Invoice is not available for this invoice." };
    }

    const invoice = await getSalesInvoiceForOrganization({
      organizationId: session.organization.id,
      invoiceId: salesInvoiceId,
    });
    const issued = resolveIssuedSalesInvoiceForDownload({
      invoice,
      organizationId: session.organization.id,
    });
    if (!issued) {
      return { error: "E-Invoice is not available for this invoice." };
    }

    const { findEInvoiceArchiveBySalesInvoiceId } = await import(
      "@/lib/einvoice-integration/queries"
    );
    const archive = await findEInvoiceArchiveBySalesInvoiceId({
      organizationId: session.organization.id,
      salesInvoiceId: issued.id,
    });
    if (!archive) {
      return { error: "E-Invoice is not available for this invoice." };
    }

    const { buildSalesInvoiceEInvoiceDownloadPath } = await import("@/lib/billing/history-types");
    return { url: buildSalesInvoiceEInvoiceDownloadPath(issued.id) };
  } catch (error) {
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open the E-Invoice download."),
    };
  }
}

/**
 * Returns the authenticated Auroranexis sales invoice PDF download path.
 * Resolves only invoices belonging to the caller's organization.
 * Does not create invoices or call Mollie.
 */
export async function downloadSalesInvoicePdfAction(input: {
  salesInvoiceId?: string | null;
  providerTransactionId?: string | null;
}): Promise<DownloadSalesInvoicePdfActionResult> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const organizationId = session.organization.id;
    let invoiceId = input.salesInvoiceId?.trim() || null;

    if (!invoiceId && input.providerTransactionId?.trim()) {
      const linked = await getSalesInvoiceByProviderTransactionId({
        organizationId,
        providerTransactionId: input.providerTransactionId.trim(),
      });
      invoiceId = linked?.id ?? null;
    }

    if (!invoiceId) {
      return { error: "An Auroranexis invoice is not available for this payment." };
    }

    const invoice = await getSalesInvoiceForOrganization({
      organizationId,
      invoiceId,
    });
    const issued = resolveIssuedSalesInvoiceForDownload({ invoice, organizationId });
    if (!issued) {
      return { error: "An Auroranexis invoice is not available for this payment." };
    }

    return { url: buildSalesInvoicePdfDownloadPath(issued.id) };
  } catch (error) {
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open the invoice PDF."),
    };
  }
}
