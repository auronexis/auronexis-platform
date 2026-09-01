import type { EInvoiceArchiveIntegrityStatus, EInvoiceArchiveRecord } from "@/lib/einvoice-archive/types";

export type EInvoiceArchiveArtifactRow = {
  id: string;
  organization_id: string;
  sales_invoice_id: string;
  invoice_number_snapshot: string;
  buyer_name_snapshot: string | null;
  document_type: string;
  format: string;
  profile: string;
  standard_version: string;
  artifact_kind: string;
  artifact_profile_version: string;
  artifact_storage_key: string;
  artifact_sha256: string;
  artifact_size_bytes: number;
  currency_snapshot: string;
  gross_amount_minor_snapshot: number;
  issue_date_snapshot: string | null;
  issue_year: number | null;
  seller_country_snapshot: string | null;
  buyer_country_snapshot: string | null;
  tax_treatment_snapshot: string;
  archived_at: string;
  created_at: string;
  retention_policy_id: string;
  retention_policy_version: string;
  retention_legal_basis: string;
  retention_jurisdiction: string;
  retention_duration_years: number;
  retention_start_at: string;
  retention_start_basis: string;
  retain_until: string;
  legal_hold: boolean;
  legal_hold_reason: string | null;
  legal_hold_updated_at: string | null;
  integrity_status: EInvoiceArchiveIntegrityStatus;
  last_verified_at: string | null;
  last_verification_error_code: string | null;
  generator_module: string;
  generator_pipeline: string;
  generator_standard_version: string;
  validation_status: string;
};

export function mapEInvoiceArchiveRow(row: EInvoiceArchiveArtifactRow): EInvoiceArchiveRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    salesInvoiceId: row.sales_invoice_id,
    invoiceNumberSnapshot: row.invoice_number_snapshot,
    buyerNameSnapshot: row.buyer_name_snapshot,
    documentType: row.document_type,
    format: row.format,
    profile: row.profile,
    standardVersion: row.standard_version,
    artifactKind: row.artifact_kind,
    artifactProfileVersion: row.artifact_profile_version,
    artifactStorageKey: row.artifact_storage_key,
    artifactSha256: row.artifact_sha256,
    artifactSizeBytes: row.artifact_size_bytes,
    currencySnapshot: row.currency_snapshot,
    grossAmountMinorSnapshot: row.gross_amount_minor_snapshot,
    issueDateSnapshot: row.issue_date_snapshot,
    issueYear: row.issue_year,
    sellerCountrySnapshot: row.seller_country_snapshot,
    buyerCountrySnapshot: row.buyer_country_snapshot,
    taxTreatmentSnapshot: row.tax_treatment_snapshot,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    retention: {
      policyId: row.retention_policy_id,
      policyVersion: row.retention_policy_version,
      legalBasis: row.retention_legal_basis,
      jurisdiction: row.retention_jurisdiction,
      durationYears: row.retention_duration_years,
      startAt: row.retention_start_at,
      startBasis: row.retention_start_basis,
      retainUntil: row.retain_until,
    },
    legalHold: row.legal_hold,
    legalHoldReason: row.legal_hold_reason,
    legalHoldUpdatedAt: row.legal_hold_updated_at,
    integrityStatus: row.integrity_status,
    lastVerifiedAt: row.last_verified_at,
    lastVerificationErrorCode: row.last_verification_error_code,
    generator: {
      module: row.generator_module,
      pipeline: row.generator_pipeline,
      standardVersion: row.generator_standard_version,
    },
    validationStatus: row.validation_status,
  };
}
