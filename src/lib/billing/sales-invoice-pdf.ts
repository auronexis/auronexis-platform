/**
 * On-demand production PDF from issued sales_invoices.
 * Read-only relative to invoice accounting — never issues or mutates invoices.
 */

import "server-only";

import {
  getSalesInvoiceForOrganization,
  resolveIssuedSalesInvoiceForDownload,
  type SalesInvoiceRecord,
} from "@/lib/billing/sales-invoice";
import {
  buildSalesInvoicePdfFilename,
  generateSalesInvoicePdf,
} from "@/lib/billing/sales-invoice-render";

export type SalesInvoicePdfDownloadResult =
  | {
      ok: true;
      invoice: SalesInvoiceRecord;
      pdf: Buffer;
      filename: string;
    }
  | { ok: false; reason: "not_found" | "forbidden" | "not_issued" | "pdf_failed" };

/**
 * Load an issued invoice for the caller's organization and render a production PDF.
 * preview: false is mandatory — operator preview stays on a separate route.
 */
export async function generateIssuedSalesInvoicePdfForOrganization(input: {
  organizationId: string;
  invoiceId: string;
  locale?: "en" | "de";
}): Promise<SalesInvoicePdfDownloadResult> {
  let invoice: SalesInvoiceRecord | null;
  try {
    invoice = await getSalesInvoiceForOrganization({
      organizationId: input.organizationId,
      invoiceId: input.invoiceId,
    });
  } catch {
    return { ok: false, reason: "not_found" };
  }

  const issued = resolveIssuedSalesInvoiceForDownload({
    invoice,
    organizationId: input.organizationId,
  });
  if (!invoice) {
    return { ok: false, reason: "not_found" };
  }
  if (!issued) {
    if (invoice.organizationId !== input.organizationId) {
      return { ok: false, reason: "forbidden" };
    }
    return { ok: false, reason: "not_issued" };
  }

  try {
    const pdf = await generateSalesInvoicePdf(issued, {
      preview: false,
      locale: input.locale ?? "en",
    });
    return {
      ok: true,
      invoice: issued,
      pdf,
      filename: buildSalesInvoicePdfFilename(issued.invoiceNumber),
    };
  } catch {
    return { ok: false, reason: "pdf_failed" };
  }
}

export function salesInvoicePdfResponseHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow",
  };
}
