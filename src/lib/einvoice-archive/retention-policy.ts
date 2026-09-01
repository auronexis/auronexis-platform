import type { EInvoiceArchiveRetentionPolicy } from "@/lib/einvoice-archive/types";

/**
 * German VAT invoice record retention under UStG §14b is generally 8 years.
 * This is stored as explicit policy metadata — never a hidden "always 10 years" rule.
 * retain_until is informational. Expired ≠ destroy.
 */
export const DE_USTG_14B_VAT_INVOICE_POLICY_ID = "de_ustg_14b_vat_invoice_records" as const;
export const DE_USTG_14B_VAT_INVOICE_POLICY_VERSION = "2026.1" as const;

export const DE_USTG_14B_LEGAL_BASIS =
  "UStG §14b — German VAT invoice records are generally retained for 8 years. This archive stores that duration as policy metadata; it does not assert a 10-year retention rule. Expired retain_until remains informational only.";

export function resolveIssueCalendarYear(issueDateIso: string | null, fallback: Date): number {
  if (issueDateIso) {
    const year = Number.parseInt(issueDateIso.slice(0, 4), 10);
    if (Number.isInteger(year) && year >= 1990 && year <= 2200) {
      return year;
    }
  }
  return fallback.getUTCFullYear();
}

export function buildDeUstg14bRetentionPolicy(input: {
  issueDateIso: string | null;
  archivedAt: Date;
}): EInvoiceArchiveRetentionPolicy {
  const issueYear = resolveIssueCalendarYear(input.issueDateIso, input.archivedAt);
  const durationYears = 8;
  const startAt = `${issueYear}-12-31`;
  const retainUntilYear = issueYear + durationYears;
  return {
    policyId: DE_USTG_14B_VAT_INVOICE_POLICY_ID,
    policyVersion: DE_USTG_14B_VAT_INVOICE_POLICY_VERSION,
    legalBasis: DE_USTG_14B_LEGAL_BASIS,
    jurisdiction: "DE",
    durationYears,
    startAt,
    startBasis: "end_of_calendar_year_of_issue_date",
    retainUntil: `${retainUntilYear}-12-31`,
  };
}
