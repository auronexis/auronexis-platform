/**
 * Ephemeral e-invoice pipeline: adapt → generate → validate → artifacts.
 * No persistence, no email, no webhook, no PDF renderer mutation.
 */

import { adaptIssuedInvoiceToCanonical } from "@/lib/einvoice/source-adapter";
import { generateZugferdEn16931Xml } from "@/lib/einvoice/zugferd-generator";
import { validateEInvoice } from "@/lib/einvoice/validation";
import { buildArtifactBundle } from "@/lib/einvoice/artifacts";
import type {
  EInvoiceAdapterFailure,
  EInvoiceArtifactBundle,
  EInvoiceValidationResult,
  IssuedInvoiceSnapshot,
} from "@/lib/einvoice/types";
import type { CanonicalEInvoiceInput } from "@/lib/einvoice/types";

export type EInvoicePipelineSuccess = {
  ok: true;
  canonical: CanonicalEInvoiceInput;
  xml: string;
  validation: EInvoiceValidationResult;
  artifacts: EInvoiceArtifactBundle;
};

export type EInvoicePipelineResult = EInvoicePipelineSuccess | EInvoiceAdapterFailure;

export function generateEInvoiceFromIssuedSnapshot(
  snapshot: IssuedInvoiceSnapshot,
): EInvoicePipelineResult {
  const adapted = adaptIssuedInvoiceToCanonical(snapshot);
  if (!adapted.ok) {
    return adapted;
  }

  const xml = generateZugferdEn16931Xml(adapted.input);
  const validation = validateEInvoice({ canonical: adapted.input, xml });
  const artifacts = buildArtifactBundle({
    canonical: adapted.input,
    xml,
    validation,
  });

  return {
    ok: true,
    canonical: adapted.input,
    xml,
    validation,
    artifacts,
  };
}
