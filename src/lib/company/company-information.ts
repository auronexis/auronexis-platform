/** Core company and legal entity data — single source of truth. */

export const COMPANY_INFORMATION = {
  legalName: "Auroranexis AI Solutions",
  owner: "István-Tamás Schneller",
  businessFormGerman: "Einzelunternehmen",
  businessFormInternational: "Sole proprietorship",
  businessType: "German B2B SaaS Provider",
  productName: "Auroranexis",
  street: "Im Malerwinkel 4",
  postalCode: "71566",
  city: "Althütte",
  country: "Germany",
  vatId: "DE449657077",
  website: "https://auroranexis.com",
  shortDescription:
    "Auroranexis is an AI-powered B2B SaaS platform for client intelligence, risk monitoring, reports, incidents, and executive operational insights.",
} as const;

export type CompanyInformation = typeof COMPANY_INFORMATION;

/** Product/marketing name — alias for backward compatibility. */
export const COMPANY_NAME = COMPANY_INFORMATION.productName;

/** Legal entity name — alias for backward compatibility. */
export const LEGAL_COMPANY_NAME = COMPANY_INFORMATION.legalName;

export const LEGAL_OWNER = COMPANY_INFORMATION.owner;
export const LEGAL_BUSINESS_FORM = COMPANY_INFORMATION.businessFormGerman;
export const LEGAL_STREET = COMPANY_INFORMATION.street;
export const LEGAL_POSTAL_CODE = COMPANY_INFORMATION.postalCode;
export const LEGAL_CITY = COMPANY_INFORMATION.city;
export const LEGAL_COUNTRY = COMPANY_INFORMATION.country;
export const LEGAL_VAT_ID = COMPANY_INFORMATION.vatId;
