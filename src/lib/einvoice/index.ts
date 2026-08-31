/**
 * Additive German B2B e-invoice module (ZUGFeRD 2.5.2 / Factur-X EN 16931).
 *
 * Architecture: issued sales_invoice snapshot → READ-ONLY adapter → CII XML.
 * Does not modify billing issuance, tax, numbering, Mollie, email, RLS, or PDF renderer.
 */

export {
  ZUGFERD_VERSION,
  FACTUR_X_VERSION,
  EN16931_GUIDELINE_ID,
  EINVOICE_PROFILE,
  DOCUMENT_TYPE_CODE_INVOICE,
  ZUGFERD_XML_ATTACHMENT_NAME,
  FACTUR_X_XML_ATTACHMENT_NAME,
  EINVOICE_MODULE_DISCLAIMER,
} from "@/lib/einvoice/profile";

export type {
  IssuedInvoiceSnapshot,
  CanonicalEInvoiceInput,
  CanonicalEInvoiceParty,
  CanonicalEInvoiceLine,
  CanonicalEInvoiceTaxBreakdown,
  En16931VatCategoryCode,
  EInvoiceAdapterResult,
  EInvoiceAdapterFailure,
  EInvoiceAdapterSuccess,
  EInvoiceValidationFinding,
  EInvoiceValidationResult,
  EInvoiceArtifactBundle,
} from "@/lib/einvoice/types";

export {
  adaptIssuedInvoiceToCanonical,
  resolveSellerPostalFields,
} from "@/lib/einvoice/source-adapter";

export {
  minorToDecimalString,
  vatRateBpsToPercentString,
  netUnitPriceFromLine,
  isoToCiiDate102,
  escapeXml,
} from "@/lib/einvoice/money";

export { mapTaxPolicyToEn16931Category } from "@/lib/einvoice/tax-category";
export { generateZugferdEn16931Xml } from "@/lib/einvoice/zugferd-generator";
export { validateEInvoice, formatValidationReport } from "@/lib/einvoice/validation";
export {
  buildEInvoiceXmlFilename,
  buildEInvoiceValidationReportFilename,
  buildEInvoiceMappingReportFilename,
  zugferdEmbeddedXmlName,
} from "@/lib/einvoice/filename";
export { buildMappingReport, buildArtifactBundle } from "@/lib/einvoice/artifacts";
export {
  generateEInvoiceFromIssuedSnapshot,
  type EInvoicePipelineResult,
  type EInvoicePipelineSuccess,
} from "@/lib/einvoice/pipeline";
export {
  buildDemoDomesticIssuedSnapshot,
  buildDemoReverseChargeIssuedSnapshot,
} from "@/lib/einvoice/demo/samples";
