/**
 * Display-only view model for the read-only E-Invoice Viewer.
 * Derived exclusively from CII XML — not a billing domain model.
 */

export type EInvoiceViewerParseCode =
  | "EMPTY"
  | "TOO_LARGE"
  | "UNSAFE_XML"
  | "MALFORMED"
  | "UNSUPPORTED_PROFILE"
  | "MISSING_REQUIRED"
  | "NOT_CII";

export type EInvoiceViewerWarningCode =
  | "UNSUPPORTED_PROFILE"
  | "LINE_SUM_MISMATCH"
  | "MISSING_OPTIONAL"
  | "UNKNOWN_UNIT"
  | "UNKNOWN_TAX_CATEGORY";

export type EInvoiceViewerParty = {
  name: string | null;
  street: string | null;
  street2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  vatId: string | null;
  email: string | null;
};

export type EInvoiceViewerLine = {
  lineId: string;
  description: string;
  quantity: string;
  unitCode: string | null;
  unitLabel: string | null;
  netUnitPrice: string | null;
  lineTotal: string | null;
  taxCategoryCode: string | null;
  taxRatePercent: string | null;
  taxLabel: string | null;
};

export type EInvoiceViewerTax = {
  categoryCode: string;
  ratePercent: string | null;
  basisAmount: string | null;
  calculatedAmount: string | null;
  exemptionReason: string | null;
  exemptionReasonCode: string | null;
  typeCode: string | null;
};

export type EInvoiceViewerTotals = {
  lineTotalAmount: string | null;
  taxBasisTotalAmount: string | null;
  taxTotalAmount: string | null;
  taxTotalCurrency: string | null;
  grandTotalAmount: string | null;
  duePayableAmount: string | null;
};

export type EInvoiceViewerServicePeriod = {
  start: string | null;
  end: string | null;
  deliveryDate: string | null;
};

export type EInvoiceViewerTechnical = {
  guidelineId: string | null;
  profileLabel: string;
  standardLabel: string;
  syntaxLabel: string;
  documentTypeCode: string | null;
  currency: string | null;
  taxCategoryCodes: string[];
  exemptionReasonCodes: string[];
  unitCodes: string[];
  sellerVatId: string | null;
  buyerVatId: string | null;
  profileSupported: boolean;
};

export type EInvoiceViewModel = {
  invoiceNumber: string | null;
  issueDate: string | null;
  documentTypeCode: string | null;
  currency: string | null;
  seller: EInvoiceViewerParty;
  buyer: EInvoiceViewerParty;
  lines: EInvoiceViewerLine[];
  taxes: EInvoiceViewerTax[];
  totals: EInvoiceViewerTotals;
  servicePeriod: EInvoiceViewerServicePeriod;
  notes: string[];
  isDemo: boolean;
  isReverseCharge: boolean;
  hasStandardVat: boolean;
  technical: EInvoiceViewerTechnical;
  warnings: Array<{ code: EInvoiceViewerWarningCode; message: string }>;
  /** Exact input bytes (UTF-8 string) for raw display / download identity. */
  rawXml: string;
};

export type EInvoiceViewerParseSuccess = {
  ok: true;
  model: EInvoiceViewModel;
};

export type EInvoiceViewerParseFailure = {
  ok: false;
  code: EInvoiceViewerParseCode;
  message: string;
  /** Sanitized technical detail — no paths/secrets. */
  detail?: string;
};

export type EInvoiceViewerParseResult = EInvoiceViewerParseSuccess | EInvoiceViewerParseFailure;

export const EINVOICE_VIEWER_SUPPORTED_GUIDELINE = "urn:cen.eu:en16931:2017" as const;
export const EINVOICE_VIEWER_MAX_XML_BYTES = 2_000_000;
