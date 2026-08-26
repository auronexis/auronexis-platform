/**
 * Structured E-Invoice capability architecture toward XRechnung / ZUGFeRD.
 *
 * Domain model + capability flags only. No fake EN 16931 XML is generated.
 * Generator implementation is deferred until a maintained library is approved.
 */

export const E_INVOICE_TARGET_PROFILES = ["xrechnung", "zugferd_en16931"] as const;

export type EInvoiceTargetProfile = (typeof E_INVOICE_TARGET_PROFILES)[number];

export type EInvoiceCapabilityStatus =
  | "not_implemented"
  | "domain_model_ready"
  | "generator_deferred"
  | "generator_available";

export type EInvoiceDomainDocument = {
  profile: EInvoiceTargetProfile;
  invoiceNumber: string;
  issueDateIso: string;
  currency: string;
  seller: {
    name: string;
    vatId: string;
    countryCode: string;
    addressLines: string[];
  };
  buyer: {
    name: string;
    vatId: string | null;
    countryCode: string | null;
    addressLines: string[];
  };
  lines: Array<{
    name: string;
    quantity: number;
    netMinor: number;
    vatRateBps: number;
    vatMinor: number;
    grossMinor: number;
  }>;
  totals: {
    netMinor: number;
    vatMinor: number;
    grossMinor: number;
  };
  taxPolicyOutcome: string;
};

export type EInvoiceCapabilityReport = {
  status: EInvoiceCapabilityStatus;
  profilesTargeted: readonly EInvoiceTargetProfile[];
  xmlGenerationEnabled: false;
  reason: string;
};

/** Capability report — generator intentionally deferred (no unsafe/unmaintained library wired). */
export function getEInvoiceCapabilityReport(): EInvoiceCapabilityReport {
  return {
    status: "domain_model_ready",
    profilesTargeted: E_INVOICE_TARGET_PROFILES,
    xmlGenerationEnabled: false,
    reason:
      "Structured seller/buyer/tax/totals domain is ready for future XRechnung/ZUGFeRD. XML generator remains deferred (generator_deferred) — no fake compliant XML is emitted.",
  };
}

export function buildEInvoiceDomainDocument(input: {
  invoiceNumber: string;
  issueDateIso: string;
  currency: string;
  sellerName: string;
  sellerVatId: string;
  sellerCountryCode: string;
  sellerAddressLines: string[];
  buyerName: string;
  buyerVatId: string | null;
  buyerCountryCode: string | null;
  buyerAddressLines: string[];
  lines: EInvoiceDomainDocument["lines"];
  taxPolicyOutcome: string;
}): EInvoiceDomainDocument {
  const netMinor = input.lines.reduce((sum, line) => sum + line.netMinor, 0);
  const vatMinor = input.lines.reduce((sum, line) => sum + line.vatMinor, 0);
  const grossMinor = input.lines.reduce((sum, line) => sum + line.grossMinor, 0);

  return {
    profile: "xrechnung",
    invoiceNumber: input.invoiceNumber,
    issueDateIso: input.issueDateIso,
    currency: input.currency.toUpperCase(),
    seller: {
      name: input.sellerName,
      vatId: input.sellerVatId,
      countryCode: input.sellerCountryCode,
      addressLines: input.sellerAddressLines,
    },
    buyer: {
      name: input.buyerName,
      vatId: input.buyerVatId,
      countryCode: input.buyerCountryCode,
      addressLines: input.buyerAddressLines,
    },
    lines: input.lines,
    totals: { netMinor, vatMinor, grossMinor },
    taxPolicyOutcome: input.taxPolicyOutcome,
  };
}

/**
 * Placeholder export surface — always refuses XML so we never claim E-Invoice compliance.
 */
export function tryGenerateEInvoiceXml(_document: EInvoiceDomainDocument): {
  ok: false;
  code: "GENERATOR_DEFERRED";
  message: string;
} {
  void _document;
  return {
    ok: false,
    code: "GENERATOR_DEFERRED",
    message: getEInvoiceCapabilityReport().reason,
  };
}
