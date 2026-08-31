/**
 * Artifact filename helpers for ephemeral e-invoice outputs.
 */

import { ZUGFERD_XML_ATTACHMENT_NAME } from "@/lib/einvoice/profile";

export function buildEInvoiceXmlFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replaceAll(/[^A-Za-z0-9._-]/g, "_");
  return `${safe}.xml`;
}

export function buildEInvoiceValidationReportFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replaceAll(/[^A-Za-z0-9._-]/g, "_");
  return `${safe}.validation-report.md`;
}

export function buildEInvoiceMappingReportFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replaceAll(/[^A-Za-z0-9._-]/g, "_");
  return `${safe}.mapping-report.md`;
}

/** Canonical embedded attachment name for ZUGFeRD hybrid (PDF/A-3 not produced in this module). */
export function zugferdEmbeddedXmlName(): string {
  return ZUGFERD_XML_ATTACHMENT_NAME;
}
