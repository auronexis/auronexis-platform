/**
 * Display helpers for viewer warnings / fail-closed UI copy.
 */

import type {
  EInvoiceViewerParseFailure,
  EInvoiceViewModel,
} from "@/lib/einvoice-viewer/types";

export function viewerFailureTitle(_failure: EInvoiceViewerParseFailure): string {
  return "E-Rechnung konnte nicht sicher gelesen werden.";
}

export function viewerFailureDetail(failure: EInvoiceViewerParseFailure): string | null {
  if (!failure.detail) return null;
  // Sanitize: strip absolute Windows/Unix paths and env-like tokens.
  return failure.detail
    .replace(/[A-Za-z]:\\[^\s]+/g, "[path]")
    .replace(/\/(?:home|Users|var|tmp|etc)\/[^\s]+/g, "[path]")
    .replace(/\b[A-Z0-9_]{8,}=[^\s]+/g, "[redacted]");
}

export function unsupportedProfileBanner(model: EInvoiceViewModel): string | null {
  if (model.technical.profileSupported) return null;
  return "Nicht unterstütztes E-Rechnungsprofil";
}

export function consistencyWarnings(model: EInvoiceViewModel): string[] {
  return model.warnings.map((w) => w.message);
}
