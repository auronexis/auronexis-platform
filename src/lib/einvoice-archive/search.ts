import type {
  EInvoiceArchiveRecord,
  EInvoiceArchiveSearchQuery,
} from "@/lib/einvoice-archive/types";

function includesInsensitive(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  return (haystack ?? "").toLowerCase().includes(needle.trim().toLowerCase());
}

export function filterEInvoiceArchiveRecords(
  records: EInvoiceArchiveRecord[],
  query: EInvoiceArchiveSearchQuery,
): EInvoiceArchiveRecord[] {
  const year = query.year?.trim() ?? "";
  const issueDate = query.issueDate?.trim() ?? "";
  const tax = query.taxTreatment?.trim() ?? "";
  const country = query.country?.trim().toUpperCase() ?? "";
  const integrity = query.integrity ?? "";

  return records.filter((row) => {
    if (!includesInsensitive(row.invoiceNumberSnapshot, query.invoiceNumber ?? "")) {
      return false;
    }
    if (!includesInsensitive(row.buyerNameSnapshot, query.customer ?? "")) {
      return false;
    }
    if (issueDate && row.issueDateSnapshot !== issueDate) {
      return false;
    }
    if (year && String(row.issueYear ?? "") !== year) {
      return false;
    }
    if (tax && row.taxTreatmentSnapshot !== tax) {
      return false;
    }
    if (
      country &&
      row.sellerCountrySnapshot !== country &&
      row.buyerCountrySnapshot !== country
    ) {
      return false;
    }
    if (integrity && row.integrityStatus !== integrity) {
      return false;
    }
    return true;
  });
}

export function parseArchiveSearchQuery(
  params: Record<string, string | string[] | undefined>,
): EInvoiceArchiveSearchQuery {
  const one = (key: string): string => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
  };
  const integrityRaw = one("integrity");
  const integrity =
    integrityRaw === "stored" || integrityRaw === "verified" || integrityRaw === "failed"
      ? integrityRaw
      : "";
  return {
    invoiceNumber: one("invoiceNumber"),
    customer: one("customer"),
    issueDate: one("issueDate"),
    year: one("year"),
    taxTreatment: one("taxTreatment"),
    country: one("country"),
    integrity,
  };
}
