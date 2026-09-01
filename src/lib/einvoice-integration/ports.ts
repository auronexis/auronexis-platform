import "server-only";

import { getSalesInvoiceForOrganization } from "@/lib/billing/sales-invoice";
import { issuedSnapshotToArchiveSource } from "@/lib/einvoice-archive/invoice-source";
import type { EInvoiceArchivePorts } from "@/lib/einvoice-archive/ports";
import { createProductionArchivePorts } from "@/lib/einvoice-archive/supabase-ports";
import { salesInvoiceRecordToIssuedSnapshot } from "@/lib/einvoice-integration/snapshot";

export const supabaseIssuedInvoiceLookup = {
  async findIssued(input: { organizationId: string; salesInvoiceId: string }) {
    const invoice = await getSalesInvoiceForOrganization({
      organizationId: input.organizationId,
      invoiceId: input.salesInvoiceId,
    });
    if (!invoice || invoice.status !== "issued") {
      return null;
    }
    const snapshot = salesInvoiceRecordToIssuedSnapshot(invoice);
    return issuedSnapshotToArchiveSource({
      organizationId: input.organizationId,
      salesInvoiceId: input.salesInvoiceId,
      snapshot,
    });
  },
};

export function createIntegrationArchivePorts(): EInvoiceArchivePorts {
  const production = createProductionArchivePorts();
  return {
    ...production,
    invoices: supabaseIssuedInvoiceLookup,
  };
}
