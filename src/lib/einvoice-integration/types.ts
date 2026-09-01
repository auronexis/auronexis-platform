/**
 * Phase 10 — controlled e-invoice production integration types.
 * Isolated from billing write semantics and from generator/archive internals.
 */

export const E_INVOICE_INTEGRATION_AUDIT_EVENTS = {
  integrationFailed: "E_INVOICE_INTEGRATION_FAILED",
} as const;

export type EInvoiceIntegrationFailureCode =
  | "UNAUTHORIZED"
  | "INVOICE_NOT_FOUND"
  | "NOT_ISSUED"
  | "UNSUPPORTED"
  | "GENERATION_FAILED"
  | "VALIDATION_FAILED"
  | "INTEGRITY_CONFLICT"
  | "STORAGE_FAILED"
  | "METADATA_FAILED"
  | "HASH_MISMATCH"
  | "UNEXPECTED";

export type EInvoiceIntegrationSuccess = {
  ok: true;
  reused: boolean;
  archiveId: string;
  salesInvoiceId: string;
};

export type EInvoiceIntegrationFailure = {
  ok: false;
  code: EInvoiceIntegrationFailureCode;
  message: string;
};

export type EInvoiceIntegrationResult = EInvoiceIntegrationSuccess | EInvoiceIntegrationFailure;

export const EINVOICE_INTEGRATION_GENERATOR = {
  module: "src/lib/einvoice",
  pipeline: "generateEInvoiceFromIssuedSnapshot",
  standardVersion: "zugferd-2.5.2",
} as const;
