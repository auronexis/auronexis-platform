/**
 * Build mapping + artifact bundle from canonical input / XML / validation.
 */

import {
  buildEInvoiceMappingReportFilename,
  buildEInvoiceValidationReportFilename,
  buildEInvoiceXmlFilename,
} from "@/lib/einvoice/filename";
import { formatValidationReport } from "@/lib/einvoice/validation";
import type {
  CanonicalEInvoiceInput,
  EInvoiceArtifactBundle,
  EInvoiceValidationResult,
} from "@/lib/einvoice/types";
import { EINVOICE_MODULE_DISCLAIMER, ZUGFERD_VERSION, FACTUR_X_VERSION } from "@/lib/einvoice/profile";

export function buildMappingReport(input: CanonicalEInvoiceInput): string {
  const lines = [
    "# E-Invoice Mapping Report",
    "",
    EINVOICE_MODULE_DISCLAIMER,
    "",
    `Target: ZUGFeRD ${ZUGFERD_VERSION} / Factur-X ${FACTUR_X_VERSION} — profile EN 16931`,
    `Guideline: ${input.guidelineId}`,
    `Invoice: ${input.invoiceNumber}`,
    `Issue date (CII 102): ${input.issueDate}`,
    `Tax policy (copied): ${input.taxPolicyOutcome}`,
    `Reverse charge applied (copied): ${input.reverseChargeApplied}`,
    "",
    "## Monetary integrity (source minor → decimal, zero drift)",
    "",
    `| Field | Minor | Decimal |`,
    `| --- | ---: | --- |`,
    `| Net | ${input.sourceMinor.netMinor} | ${input.totals.taxBasisTotalAmount} |`,
    `| VAT | ${input.sourceMinor.vatMinor} | ${input.totals.taxTotalAmount} |`,
    `| Gross | ${input.sourceMinor.grossMinor} | ${input.totals.grandTotalAmount} |`,
    `| VAT rate (bps) | ${input.sourceMinor.vatRateBps} | ${input.taxBreakdown[0]?.vatRatePercent ?? "n/a"}% |`,
    "",
    "## Parties",
    "",
    `- Seller: ${input.seller.name} / ${input.seller.vatId} / ${input.seller.countryCode}`,
    `- Buyer: ${input.buyer.name} / ${input.buyer.vatId ?? "(none)"} / ${input.buyer.countryCode}`,
    "",
    "## Tax category",
    "",
    `- EN 16931 CategoryCode: ${input.taxBreakdown[0]?.vatCategoryCode}`,
    `- Exemption/reason: ${input.taxBreakdown[0]?.exemptionReason ?? "(n/a)"}`,
    "",
    "## Lines",
    "",
  ];
  for (const line of input.lines) {
    lines.push(
      `- Line ${line.lineId}: ${line.name} | qty ${line.quantity} | net ${line.lineNetAmount} | VAT ${line.lineVatAmount} | cat ${line.vatCategoryCode}`,
    );
  }
  lines.push("");
  lines.push("## Architecture note");
  lines.push("");
  lines.push(
    "Source: issued invoice snapshot → READ-ONLY adapter → canonical → CII XML. No second billing/tax/numbering engine. Existing PDF renderer untouched; PDF/A-3 hybrid not produced (would require PDF/A-3 capability outside the frozen sales-invoice PDF path).",
  );
  lines.push("");
  return lines.join("\n");
}

export function buildArtifactBundle(input: {
  canonical: CanonicalEInvoiceInput;
  xml: string;
  validation: EInvoiceValidationResult;
}): EInvoiceArtifactBundle {
  const n = input.canonical.invoiceNumber;
  return {
    xmlFilename: buildEInvoiceXmlFilename(n),
    xml: input.xml,
    validationReportFilename: buildEInvoiceValidationReportFilename(n),
    validationReport: formatValidationReport(input.validation),
    mappingReportFilename: buildEInvoiceMappingReportFilename(n),
    mappingReport: buildMappingReport(input.canonical),
  };
}
