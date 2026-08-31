/**
 * ZUGFeRD 2.5.2 / Factur-X EN 16931 profile constants (authoritative guideline URN).
 * Profile target is EN 16931 (COMFORT) — not MINIMUM / BASIC WL / BASIC.
 */

export const ZUGFERD_VERSION = "2.5.2" as const;
export const FACTUR_X_VERSION = "1.09.2" as const;

/**
 * Factur-X 1.09.2 / ZUGFeRD 2.5.2 EN 16931 guideline identifier (BT-24).
 * Official FeRD/FNFE codedb (cl id=1) enumerates only this URN for the EN16931 profile —
 * not the older `#compliant#urn:factur-x.eu:1p0:en16931` form used by BASIC.
 */
export const EN16931_GUIDELINE_ID = "urn:cen.eu:en16931:2017" as const;

/** VATEX code for VAT reverse charge (BT-121) — EN 16931 / Factur-X codedb. */
export const VATEX_EU_AE = "VATEX-EU-AE" as const;

export const EINVOICE_PROFILE = "EN16931" as const;

/** Commercial invoice (UNCL 1001). */
export const DOCUMENT_TYPE_CODE_INVOICE = "380" as const;

/** Embedded XML attachment name (ZUGFeRD German flavor). */
export const ZUGFERD_XML_ATTACHMENT_NAME = "zugferd-invoice.xml" as const;

/** Factur-X French flavor attachment name (identical XML body). */
export const FACTUR_X_XML_ATTACHMENT_NAME = "factur-x.xml" as const;

export const EINVOICE_MODULE_DISCLAIMER =
  "DEMO/NOT LEGAL — synthetic e-invoice generation for engineering review only. Not a tax adviser opinion. EXTERNAL_TAX_REVIEW_REQUIRED." as const;
