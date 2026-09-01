import { buildImmutableStorageObjectName } from "@/lib/einvoice-archive/filename";

/**
 * Private object key inside bucket `einvoice-archive`.
 * Example: tenant/<org-id>/year/<year>/<invoice-id>/<sha256>.xml
 */
export function buildEInvoiceArchiveStorageKey(input: {
  organizationId: string;
  issueYear: number;
  salesInvoiceId: string;
  sha256Hex: string;
}): string {
  const year = String(input.issueYear);
  const name = buildImmutableStorageObjectName(input.sha256Hex);
  return `tenant/${input.organizationId}/year/${year}/${input.salesInvoiceId}/${name}`;
}
