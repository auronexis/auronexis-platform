import { COMPANY_INFORMATION } from "@/lib/company/company-information";

/** Contact channels — single source of truth. */

export const COMPANY_CONTACT = {
  phone: "+49 7183 4285291",
  supportEmail: "support@auroranexis.com",
  legalEmail: "legal@auroranexis.com",
  salesEmail: "support@auroranexis.com",
  securityEmail: "security@auroranexis.com",
  infoEmail: "info@auroranexis.com",
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
export const NO_REPLY_EMAIL = COMPANY_CONTACT.noReplyEmail;

export const COMPANY_WEBSITE = COMPANY_INFORMATION.website;
