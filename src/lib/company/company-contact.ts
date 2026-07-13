import { COMPANY_INFORMATION } from "@/lib/company/company-information";

/** Contact channels — single source of truth. */

export const COMPANY_CONTACT = {
  phone: "+49 7183 4285291",
  supportEmail: "support@auroranexis.com",
  legalEmail: "legal@auroranexis.com",
  salesEmail: "sales@auroranexis.com",
  securityEmail: "security@auroranexis.com",
  infoEmail: "info@auroranexis.com",
  privacyEmail: "privacy@auroranexis.com",
  partnersEmail: "partners@auroranexis.com",
  pressEmail: "press@auroranexis.com",
  noReplyEmail: "no-reply@auroranexis.com",
} as const;

export type CompanyContact = typeof COMPANY_CONTACT;

/** Backward-compatible exports. */
export const LEGAL_PHONE = COMPANY_CONTACT.phone;
export const SUPPORT_EMAIL = COMPANY_CONTACT.supportEmail;
export const LEGAL_EMAIL = COMPANY_CONTACT.legalEmail;
export const SALES_EMAIL = COMPANY_CONTACT.salesEmail;
export const SECURITY_EMAIL = COMPANY_CONTACT.securityEmail;
export const INFO_EMAIL = COMPANY_CONTACT.infoEmail;
export const PRIVACY_EMAIL = COMPANY_CONTACT.privacyEmail;
export const PARTNERS_EMAIL = COMPANY_CONTACT.partnersEmail;
export const PRESS_EMAIL = COMPANY_CONTACT.pressEmail;
export const NO_REPLY_EMAIL = COMPANY_CONTACT.noReplyEmail;

export const COMPANY_WEBSITE = COMPANY_INFORMATION.website;
