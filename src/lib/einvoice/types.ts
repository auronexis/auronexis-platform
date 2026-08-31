/**
 * Additive e-invoice domain types (ZUGFeRD / Factur-X EN 16931).
 * Independent of billing write paths — snapshots are immutable inputs only.
 */

/** Read-only projection of an issued sales invoice (no live org re-read). */
export type IssuedInvoiceSnapshot = {
  invoiceNumber: string;
  status: "issued" | "draft" | "void" | string;
  currency: string;
  netMinor: number;
  vatRateBps: number;
  vatMinor: number;
  grossMinor: number;
  taxPolicyOutcome: string;
  reverseChargeApplied: boolean;
  businessClassification: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  issuedAt: string | null;
  createdAt: string;
  taxNote: string | null;
  seller: {
    legalName: string | null;
    vatId: string | null;
    countryCode: string | null;
    /** Prefer structured fields when present; else parse addressLines. */
    street: string | null;
    postalCode: string | null;
    city: string | null;
    addressLines: string[];
  };
  buyer: {
    legalName: string | null;
    vatId: string | null;
    countryCode: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    billingEmail: string | null;
  };
  lines: Array<{
    description: string;
    quantity: number;
    unitGrossMinor: number;
    lineGrossMinor: number;
    lineNetMinor: number;
    lineVatMinor: number;
  }>;
  /** Demo / synthetic marker — never set from production issuance. */
  demoNotLegal?: boolean;
};

/** UNCL 5305 VAT category codes used by EN 16931. */
export type En16931VatCategoryCode = "S" | "Z" | "E" | "AE" | "K" | "G" | "O" | "L" | "M";

export type CanonicalEInvoiceParty = {
  name: string;
  vatId: string | null;
  countryCode: string;
  street: string;
  postalCode: string;
  city: string;
  addressLine2: string | null;
  email: string | null;
};

export type CanonicalEInvoiceLine = {
  lineId: string;
  name: string;
  quantity: number;
  /** Unit code UN/ECE Rec 20 — C62 = one unit. */
  unitCode: string;
  /** Net unit price as decimal string (representation only). */
  netUnitPrice: string;
  lineNetAmount: string;
  vatCategoryCode: En16931VatCategoryCode;
  vatRatePercent: string;
  lineVatAmount: string;
  lineGrossAmount: string;
};

export type CanonicalEInvoiceTaxBreakdown = {
  vatCategoryCode: En16931VatCategoryCode;
  vatRatePercent: string;
  taxableAmount: string;
  taxAmount: string;
  /** BT-120 — required for AE/O (and similar) per BR-AE-10 / BR-O. */
  exemptionReason: string | null;
  /** BT-121 — structured exemption code (e.g. VATEX-EU-AE); preferred with AE. */
  exemptionReasonCode: string | null;
};

/**
 * Canonical e-invoice input — copied/normalized from IssuedInvoiceSnapshot.
 * Monetary values are string decimals derived from minor units (no recalculation).
 */
export type CanonicalEInvoiceInput = {
  profile: "EN16931";
  guidelineId: string;
  documentTypeCode: "380";
  invoiceNumber: string;
  issueDate: string;
  currency: string;
  seller: CanonicalEInvoiceParty;
  buyer: CanonicalEInvoiceParty;
  lines: CanonicalEInvoiceLine[];
  taxBreakdown: CanonicalEInvoiceTaxBreakdown[];
  totals: {
    lineTotalAmount: string;
    taxBasisTotalAmount: string;
    taxTotalAmount: string;
    grandTotalAmount: string;
    duePayableAmount: string;
  };
  /** Snapshot tax policy (copied). */
  taxPolicyOutcome: string;
  reverseChargeApplied: boolean;
  taxNote: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  /** Source minor units retained for zero-drift proofs. */
  sourceMinor: {
    netMinor: number;
    vatMinor: number;
    grossMinor: number;
    vatRateBps: number;
  };
  demoNotLegal: boolean;
};

export type EInvoiceAdapterFailure = {
  ok: false;
  code:
    | "NOT_ISSUED"
    | "INCOMPLETE_SELLER"
    | "INCOMPLETE_BUYER"
    | "INCOMPLETE_LINES"
    | "MONEY_INVARIANT"
    | "UNSUPPORTED_TAX_OUTCOME"
    | "REVERSE_CHARGE_VAT_MISSING";
  message: string;
  missingFields?: string[];
};

export type EInvoiceAdapterSuccess = {
  ok: true;
  input: CanonicalEInvoiceInput;
};

export type EInvoiceAdapterResult = EInvoiceAdapterSuccess | EInvoiceAdapterFailure;

export type EInvoiceValidationFinding = {
  ruleId: string;
  severity: "error" | "warning";
  message: string;
};

export type EInvoiceValidationResult = {
  status: "VALID" | "INVALID";
  profile: "EN16931";
  findings: EInvoiceValidationFinding[];
  /** Business-rule layer always runs; full XSD/Schematron packages are optional offline. */
  layers: {
    businessRules: "pass" | "fail";
    xsd: "skipped" | "pass" | "fail";
    schematron: "skipped" | "pass" | "fail";
  };
};

export type EInvoiceArtifactBundle = {
  xmlFilename: string;
  xml: string;
  validationReportFilename: string;
  validationReport: string;
  mappingReportFilename: string;
  mappingReport: string;
};
