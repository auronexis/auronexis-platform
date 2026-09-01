/**
 * Tax-audit export foundation only.
 * Not a Finanzamt protocol, not a public endpoint, not a submission pack.
 */

import type { EInvoiceArchiveRecord } from "@/lib/einvoice-archive/types";

export type TaxAuditExportManifest = {
  kind: "einvoice_archive_tax_audit_foundation";
  protocol: "NOT_FINANZAMT_SUBMISSION";
  generatedAt: string;
  organizationId: string;
  recordCount: number;
  records: Array<{
    archiveId: string;
    invoiceNumberSnapshot: string;
    issueDateSnapshot: string | null;
    taxTreatmentSnapshot: string;
    sellerCountrySnapshot: string | null;
    buyerCountrySnapshot: string | null;
    artifactSha256: string;
    artifactStorageKey: string;
    retainUntil: string;
    legalHold: boolean;
    integrityStatus: string;
  }>;
};

export function buildTaxAuditExportManifest(input: {
  organizationId: string;
  records: EInvoiceArchiveRecord[];
  generatedAt?: Date;
}): TaxAuditExportManifest {
  return {
    kind: "einvoice_archive_tax_audit_foundation",
    protocol: "NOT_FINANZAMT_SUBMISSION",
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    organizationId: input.organizationId,
    recordCount: input.records.length,
    records: input.records.map((row) => ({
      archiveId: row.id,
      invoiceNumberSnapshot: row.invoiceNumberSnapshot,
      issueDateSnapshot: row.issueDateSnapshot,
      taxTreatmentSnapshot: row.taxTreatmentSnapshot,
      sellerCountrySnapshot: row.sellerCountrySnapshot,
      buyerCountrySnapshot: row.buyerCountrySnapshot,
      artifactSha256: row.artifactSha256,
      artifactStorageKey: row.artifactStorageKey,
      retainUntil: row.retention.retainUntil,
      legalHold: row.legalHold,
      integrityStatus: row.integrityStatus,
    })),
  };
}
