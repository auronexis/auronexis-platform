import "server-only";

import { loadArchivedEInvoiceForDownload } from "@/lib/einvoice-archive";
import { createIntegrationArchivePorts } from "@/lib/einvoice-integration/ports";
import { findEInvoiceArchiveBySalesInvoiceId } from "@/lib/einvoice-integration/queries";
import {
  getSalesInvoiceForOrganization,
  resolveIssuedSalesInvoiceForDownload,
} from "@/lib/billing/sales-invoice";

export type CustomerEInvoiceDownloadResult =
  | {
      ok: true;
      bytes: Uint8Array;
      filename: string;
      contentType: string;
    }
  | { ok: false; reason: "not_found" | "forbidden" | "not_issued" | "not_archived" | "download_failed" };

/**
 * Tenant-scoped customer e-invoice XML from immutable archive only — never regenerated.
 */
export async function loadCustomerEInvoiceXmlForSalesInvoice(input: {
  organizationId: string;
  salesInvoiceId: string;
  actorUserId?: string | null;
}): Promise<CustomerEInvoiceDownloadResult> {
  const invoice = await getSalesInvoiceForOrganization({
    organizationId: input.organizationId,
    invoiceId: input.salesInvoiceId,
  });
  const issued = resolveIssuedSalesInvoiceForDownload({
    invoice,
    organizationId: input.organizationId,
  });
  if (!issued) {
    if (!invoice || invoice.organizationId !== input.organizationId) {
      return { ok: false, reason: "not_found" };
    }
    if (invoice.status !== "issued") {
      return { ok: false, reason: "not_issued" };
    }
    return { ok: false, reason: "forbidden" };
  }

  const archive = await findEInvoiceArchiveBySalesInvoiceId({
    organizationId: input.organizationId,
    salesInvoiceId: issued.id,
  });
  if (!archive) {
    return { ok: false, reason: "not_archived" };
  }

  const downloaded = await loadArchivedEInvoiceForDownload(
    {
      organizationId: input.organizationId,
      archiveId: archive.id,
      actorUserId: input.actorUserId,
    },
    createIntegrationArchivePorts(),
  );

  if (!downloaded.ok) {
    return { ok: false, reason: "download_failed" };
  }

  return {
    ok: true,
    bytes: downloaded.bytes,
    filename: downloaded.filename,
    contentType: downloaded.contentType,
  };
}

export function customerEInvoiceResponseHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "application/xml",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
}
