import type { IssuedInvoiceSnapshot } from "@/lib/einvoice/types";
import type { IssuedInvoiceArchiveSource } from "@/lib/einvoice-archive/types";

export function issuedSnapshotToArchiveSource(input: {
  organizationId: string;
  salesInvoiceId: string;
  snapshot: IssuedInvoiceSnapshot;
}): IssuedInvoiceArchiveSource {
  return {
    organizationId: input.organizationId,
    salesInvoiceId: input.salesInvoiceId,
    status: input.snapshot.status,
    invoiceNumber: input.snapshot.invoiceNumber,
    currency: input.snapshot.currency,
    grossMinor: input.snapshot.grossMinor,
    taxPolicyOutcome: input.snapshot.taxPolicyOutcome,
    issueDateIso: input.snapshot.issuedAt,
    sellerCountry: input.snapshot.seller.countryCode,
    buyerCountry: input.snapshot.buyer.countryCode,
    buyerLegalName: input.snapshot.buyer.legalName,
    issuedSnapshot: input.snapshot,
  };
}
