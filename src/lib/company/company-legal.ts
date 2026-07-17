import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";

/** English UI labels for legal pages — do not use German UI labels. */
export const LEGAL_UI_LABELS = {
  company: "Company",
  owner: "Owner",
  businessForm: "Business form",
  address: "Address",
  phone: "Phone",
  support: "Support",
  legalPrivacy: "Legal / Privacy",
  vatId: "VAT ID",
  website: "Website",
} as const;

export type LegalUiLabels = typeof LEGAL_UI_LABELS;

export function formatBusinessFormDisplay(): string {
  return `${COMPANY_INFORMATION.businessFormInternational} / ${COMPANY_INFORMATION.businessFormGerman}`;
}

export function formatAddressLines(): readonly string[] {
  return [
    COMPANY_INFORMATION.street,
    `${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city}`,
    COMPANY_INFORMATION.country,
  ] as const;
}

/** Inline provider reference for legal prose — English labels only. */
export function formatProviderInlineReference(): string {
  return `${COMPANY_INFORMATION.legalName}, ${LEGAL_UI_LABELS.owner}: ${COMPANY_INFORMATION.owner}, ${COMPANY_INFORMATION.street}, ${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city}, ${COMPANY_INFORMATION.country}`;
}

/** Short provider reference without full address. */
export function formatProviderShortReference(): string {
  return `${COMPANY_INFORMATION.legalName} (${COMPANY_INFORMATION.city}, ${COMPANY_INFORMATION.country})`;
}

export function formatLegalContactLine(): string {
  return `${LEGAL_UI_LABELS.legalPrivacy}: ${COMPANY_CONTACT.legalEmail}`;
}

export function formatSupportContactLine(): string {
  return `${LEGAL_UI_LABELS.support}: ${COMPANY_CONTACT.supportEmail}`;
}

export function formatVatLine(): string {
  return `${LEGAL_UI_LABELS.vatId}: ${COMPANY_INFORMATION.vatId}`;
}

/** Responsible person line for content liability sections. */
export function formatContentResponsibleLine(): string {
  return `${COMPANY_INFORMATION.owner}, ${COMPANY_INFORMATION.street}, ${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city}, ${COMPANY_INFORMATION.country}`;
}

export function formatLegalAddressBlock(): string {
  return `${COMPANY_INFORMATION.legalName}\n${LEGAL_UI_LABELS.owner}: ${COMPANY_INFORMATION.owner}\n${COMPANY_INFORMATION.street}\n${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city}\n${COMPANY_INFORMATION.country}`;
}

export const LEGAL_ADDRESS_BLOCK = formatLegalAddressBlock();

/** Shared last-updated stamp for legal pages. */
export const LEGAL_LAST_UPDATED = "July 17, 2026";
