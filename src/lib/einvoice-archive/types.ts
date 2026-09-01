/**
 * Immutable e-invoice compliance archive types.
 * Isolated from billing writes and from generator semantics.
 */

export const EINVOICE_ARCHIVE_ARTIFACT_KIND = "cii_xml" as const;
export const EINVOICE_ARCHIVE_PROFILE = "EN16931" as const;
export const EINVOICE_ARCHIVE_FORMAT = "cii_xml" as const;
export const EINVOICE_ARCHIVE_DOCUMENT_TYPE = "380" as const;
export const EINVOICE_ARCHIVE_PROFILE_VERSION = "zugferd-2.5.2-en16931" as const;
export const EINVOICE_ARCHIVE_STANDARD_VERSION = "zugferd-2.5.2" as const;

export const EINVOICE_ARCHIVE_BUCKET = "einvoice-archive" as const;

export const EINVOICE_ARCHIVE_AUDIT_EVENTS = {
  archived: "E_INVOICE_ARCHIVED",
  viewed: "E_INVOICE_VIEWED",
  downloaded: "E_INVOICE_DOWNLOADED",
  integrityVerified: "E_INVOICE_INTEGRITY_VERIFIED",
  integrityFailed: "E_INVOICE_INTEGRITY_FAILED",
} as const;

export type EInvoiceArchiveAuditEvent =
  (typeof EINVOICE_ARCHIVE_AUDIT_EVENTS)[keyof typeof EINVOICE_ARCHIVE_AUDIT_EVENTS];

export type EInvoiceArchiveIntegrityStatus = "stored" | "verified" | "failed";

export type EInvoiceArchiveRetentionPolicy = {
  policyId: string;
  policyVersion: string;
  legalBasis: string;
  jurisdiction: string;
  durationYears: number;
  startAt: string;
  startBasis: string;
  retainUntil: string;
};

export type EInvoiceArchiveGeneratorProvenance = {
  module: string;
  pipeline: string;
  standardVersion: string;
};

export type EInvoiceArchiveRecord = {
  id: string;
  organizationId: string;
  salesInvoiceId: string;
  invoiceNumberSnapshot: string;
  buyerNameSnapshot: string | null;
  documentType: string;
  format: string;
  profile: string;
  standardVersion: string;
  artifactKind: string;
  artifactProfileVersion: string;
  artifactStorageKey: string;
  artifactSha256: string;
  artifactSizeBytes: number;
  currencySnapshot: string;
  grossAmountMinorSnapshot: number;
  issueDateSnapshot: string | null;
  issueYear: number | null;
  sellerCountrySnapshot: string | null;
  buyerCountrySnapshot: string | null;
  taxTreatmentSnapshot: string;
  archivedAt: string;
  createdAt: string;
  retention: EInvoiceArchiveRetentionPolicy;
  legalHold: boolean;
  legalHoldReason: string | null;
  legalHoldUpdatedAt: string | null;
  integrityStatus: EInvoiceArchiveIntegrityStatus;
  lastVerifiedAt: string | null;
  lastVerificationErrorCode: string | null;
  generator: EInvoiceArchiveGeneratorProvenance;
  validationStatus: string;
};

export type IssuedInvoiceArchiveSource = {
  organizationId: string;
  salesInvoiceId: string;
  status: string;
  invoiceNumber: string;
  currency: string;
  grossMinor: number;
  taxPolicyOutcome: string;
  issueDateIso: string | null;
  sellerCountry: string | null;
  buyerCountry: string | null;
  buyerLegalName: string | null;
  /** Read-only snapshot for validation against original XML bytes — never mutated. */
  issuedSnapshot: import("@/lib/einvoice/types").IssuedInvoiceSnapshot;
};

export type ArchiveEInvoiceInput = {
  actorOrganizationId: string;
  actorUserId?: string | null;
  salesInvoiceId: string;
  xmlBytes: Uint8Array;
  generator: EInvoiceArchiveGeneratorProvenance;
  now?: Date;
};

export type ArchiveFailureCode =
  | "UNAUTHORIZED"
  | "INVOICE_NOT_FOUND"
  | "NOT_ISSUED"
  | "VALIDATION_FAILED"
  | "INTEGRITY_CONFLICT"
  | "STORAGE_FAILED"
  | "METADATA_FAILED"
  | "HASH_MISMATCH"
  | "EMPTY_ARTIFACT"
  | "INVALID_UTF8"
  | "TENANT_MISMATCH";

export type ArchiveEInvoiceSuccess = {
  ok: true;
  reused: boolean;
  record: EInvoiceArchiveRecord;
};

export type ArchiveEInvoiceFailure = {
  ok: false;
  code: ArchiveFailureCode;
  message: string;
};

export type ArchiveEInvoiceResult = ArchiveEInvoiceSuccess | ArchiveEInvoiceFailure;

export type EInvoiceArchiveSearchQuery = {
  invoiceNumber?: string;
  customer?: string;
  issueDate?: string;
  year?: string;
  taxTreatment?: string;
  country?: string;
  integrity?: EInvoiceArchiveIntegrityStatus | "";
};

export type ArchiveOperationalPatch = {
  integrityStatus?: EInvoiceArchiveIntegrityStatus;
  lastVerifiedAt?: string | null;
  lastVerificationErrorCode?: string | null;
  legalHold?: boolean;
  legalHoldReason?: string | null;
  legalHoldUpdatedAt?: string | null;
};
