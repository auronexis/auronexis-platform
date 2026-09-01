/**
 * Post-issuance e-invoice integration — invoked only after sales_invoice ISSUED persist.
 * Failures are logged and audited; they never roll back the issued invoice.
 */

import "server-only";

import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";

export async function integrateIssuedSalesInvoiceWithEInvoiceArchive(
  invoice: SalesInvoiceRecord,
): Promise<void> {
  if (invoice.status !== "issued") {
    return;
  }

  try {
    const { archiveEInvoiceForIssuedSalesInvoice } = await import(
      "@/lib/einvoice-integration/service"
    );
    const result = await archiveEInvoiceForIssuedSalesInvoice({
      organizationId: invoice.organizationId,
      salesInvoiceId: invoice.id,
    });
    if (!result.ok) {
      console.error("[einvoice-integration] post-issuance archive refused (invoice retained)", {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        invoiceNumber: invoice.invoiceNumber,
        code: result.code,
      });
    }
  } catch {
    console.error("[einvoice-integration] unexpected post-issuance failure (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
    });
  }
}
