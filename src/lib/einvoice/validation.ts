/**
 * EN 16931 business-rule validation for generated CII XML + canonical input.
 * Full FeRD XSD/Schematron packages are not vendored here (ephemeral generation);
 * this layer enforces mandatory BT presence and BR-CO monetary integrity.
 */

import { EN16931_GUIDELINE_ID } from "@/lib/einvoice/profile";
import { minorToDecimalString } from "@/lib/einvoice/money";
import type {
  CanonicalEInvoiceInput,
  EInvoiceValidationFinding,
  EInvoiceValidationResult,
} from "@/lib/einvoice/types";

function push(
  findings: EInvoiceValidationFinding[],
  ruleId: string,
  message: string,
  severity: "error" | "warning" = "error",
): void {
  findings.push({ ruleId, severity, message });
}

function requireXmlContains(
  xml: string,
  needle: string,
  findings: EInvoiceValidationFinding[],
  ruleId: string,
  message: string,
): void {
  if (!xml.includes(needle)) {
    push(findings, ruleId, message);
  }
}

/**
 * Validate canonical input + generated XML before marking VALID.
 */
export function validateEInvoice(input: {
  canonical: CanonicalEInvoiceInput;
  xml: string;
}): EInvoiceValidationResult {
  const findings: EInvoiceValidationFinding[] = [];
  const { canonical, xml } = input;

  if (canonical.profile !== "EN16931") {
    push(findings, "PROFILE-01", `Profile must be EN16931, got ${canonical.profile}`);
  }
  if (canonical.guidelineId !== EN16931_GUIDELINE_ID) {
    push(findings, "PROFILE-02", `Unexpected guidelineId: ${canonical.guidelineId}`);
  }
  if (canonical.documentTypeCode !== "380") {
    push(findings, "BT-3", "Document type code must be 380 (commercial invoice)");
  }

  requireXmlContains(xml, "CrossIndustryInvoice", findings, "XSD-ROOT", "Missing CrossIndustryInvoice root");
  requireXmlContains(xml, EN16931_GUIDELINE_ID, findings, "BT-24", "Missing EN 16931 guideline URN in XML");
  requireXmlContains(xml, `<ram:ID>${canonical.invoiceNumber}</ram:ID>`, findings, "BT-1", "Invoice number missing in XML");
  requireXmlContains(xml, canonical.issueDate, findings, "BT-2", "Issue date missing in XML");
  requireXmlContains(xml, `<ram:InvoiceCurrencyCode>${canonical.currency}</ram:InvoiceCurrencyCode>`, findings, "BT-5", "Currency missing in XML");
  requireXmlContains(xml, canonical.seller.name, findings, "BT-27", "Seller name missing in XML");
  requireXmlContains(xml, `schemeID="VA">${canonical.seller.vatId}</ram:ID>`, findings, "BT-31", "Seller VAT ID missing in XML");
  requireXmlContains(xml, canonical.buyer.name, findings, "BT-44", "Buyer name missing in XML");

  if (!/^[A-Z]{3}$/.test(canonical.currency)) {
    push(findings, "BR-CL-04", "Currency must be ISO 4217 alpha-3");
  }

  // BR-CO-10 / BR-CO-15 style integrity using source minor (zero drift)
  const expectedNet = minorToDecimalString(canonical.sourceMinor.netMinor);
  const expectedVat = minorToDecimalString(canonical.sourceMinor.vatMinor);
  const expectedGross = minorToDecimalString(canonical.sourceMinor.grossMinor);

  if (canonical.totals.lineTotalAmount !== expectedNet) {
    push(findings, "BR-CO-10", "LineTotalAmount drifted from source netMinor");
  }
  if (canonical.totals.taxBasisTotalAmount !== expectedNet) {
    push(findings, "BR-CO-13", "TaxBasisTotalAmount drifted from source netMinor");
  }
  if (canonical.totals.taxTotalAmount !== expectedVat) {
    push(findings, "BR-CO-14", "TaxTotalAmount drifted from source vatMinor");
  }
  if (canonical.totals.grandTotalAmount !== expectedGross) {
    push(findings, "BR-CO-15", "GrandTotalAmount drifted from source grossMinor");
  }
  if (
    canonical.sourceMinor.netMinor + canonical.sourceMinor.vatMinor !==
    canonical.sourceMinor.grossMinor
  ) {
    push(findings, "BR-CO-15", "Source minor invariant net+vat≠gross");
  }

  for (const tax of canonical.taxBreakdown) {
    if (tax.vatCategoryCode === "S") {
      if (Number(tax.vatRatePercent) <= 0) {
        push(findings, "BR-S-08", "Standard VAT category requires rate > 0");
      }
      if (canonical.sourceMinor.vatMinor <= 0) {
        push(findings, "BR-S-01", "Standard VAT category expects positive VAT amount");
      }
    }
    if (tax.vatCategoryCode === "AE") {
      if (tax.taxAmount !== "0.00" || tax.vatRatePercent !== "0.00") {
        push(findings, "BR-AE-01", "Reverse charge (AE) must have 0% rate and 0 tax amount");
      }
      if (!tax.exemptionReason) {
        push(findings, "BR-AE-02", "Reverse charge (AE) requires exemption/reason text");
      }
      if (!canonical.buyer.vatId) {
        push(findings, "BR-AE-03", "Reverse charge (AE) requires buyer VAT ID");
      }
      if (!xml.includes("Steuerschuldnerschaft") && !(tax.exemptionReason ?? "").includes("Steuerschuldnerschaft")) {
        push(
          findings,
          "BR-AE-04",
          "Reverse charge semantics (Steuerschuldnerschaft) missing from reason/XML",
          "warning",
        );
      }
    }
    if (tax.vatCategoryCode === "O" && !tax.exemptionReason) {
      push(findings, "BR-O-01", "Category O requires exemption/reason text");
    }
  }

  if (canonical.lines.length === 0) {
    push(findings, "BG-25", "EN 16931 requires at least one invoice line");
  }

  for (const line of canonical.lines) {
    if (!xml.includes(`<ram:LineID>${line.lineId}</ram:LineID>`)) {
      push(findings, "BT-126", `Line ${line.lineId} missing in XML`);
    }
    if (!xml.includes(`<ram:LineTotalAmount>${line.lineNetAmount}</ram:LineTotalAmount>`)) {
      push(findings, "BT-131", `Line ${line.lineId} net amount missing in XML`);
    }
  }

  // Reject MINIMUM / BASIC-WL markers if somehow present
  if (xml.includes("urn:factur-x.eu:1p0:minimum") || xml.includes("basicwl") || xml.includes("BASIC_WL")) {
    push(findings, "PROFILE-03", "MINIMUM/BASIC-WL profile is not allowed");
  }

  const errors = findings.filter((f) => f.severity === "error");
  return {
    status: errors.length === 0 ? "VALID" : "INVALID",
    profile: "EN16931",
    findings,
    layers: {
      businessRules: errors.length === 0 ? "pass" : "fail",
      xsd: "skipped",
      schematron: "skipped",
    },
  };
}

export function formatValidationReport(result: EInvoiceValidationResult): string {
  const lines = [
    "# E-Invoice Validation Report",
    "",
    `Status: ${result.status}`,
    `Profile: ${result.profile}`,
    `Business rules: ${result.layers.businessRules}`,
    `XSD: ${result.layers.xsd} (FeRD package not vendored — business rules enforced in-module)`,
    `Schematron: ${result.layers.schematron} (FeRD package not vendored — business rules enforced in-module)`,
    "",
    "## Findings",
  ];
  if (result.findings.length === 0) {
    lines.push("- (none)");
  } else {
    for (const f of result.findings) {
      lines.push(`- [${f.severity}] ${f.ruleId}: ${f.message}`);
    }
  }
  lines.push("");
  lines.push(
    "Disclaimer: VALID here means in-module EN 16931 business-rule checks passed. Operator must run official FeRD/FNFE XSD+Schematron before production legal use. EXTERNAL_TAX_REVIEW_REQUIRED.",
  );
  lines.push("");
  return lines.join("\n");
}
