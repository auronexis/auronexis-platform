/** Enterprise company data architecture — single source of truth. */

export {
  APP_VERSION,
  DASHBOARD_ROUTES,
  DOCS_URL,
  EXTERNAL_LINKS,
  FOOTER_LINKS,
  FOOTER_SECTIONS,
  HELP_LINKS,
  LEGACY_LEGAL_ROUTES,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  PRODUCTION_DOMAIN_LIST,
  PRODUCTION_DOMAINS,
  PUBLIC_DOC_ROUTES,
  PUBLIC_SITEMAP_ROUTES,
  SOLUTION_ROUTES,
  STATUS_URL,
  TEMPLATE_ROUTES,
} from "@/lib/company/company-links";

export {
  COMPANY_CONTACT,
  COMPANY_WEBSITE,
  INFO_EMAIL,
  LEGAL_EMAIL,
  LEGAL_PHONE,
  NO_REPLY_EMAIL,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/company-contact";

export {
  COMPANY_INFORMATION,
  COMPANY_NAME,
  LEGAL_BUSINESS_FORM,
  LEGAL_CITY,
  LEGAL_COMPANY_NAME,
  LEGAL_COUNTRY,
  LEGAL_OWNER,
  LEGAL_POSTAL_CODE,
  LEGAL_STREET,
  LEGAL_VAT_ID,
} from "@/lib/company/company-information";

export {
  COMPANY_SEO,
  getCanonicalUrl,
  getPageTitle,
} from "@/lib/company/company-seo";

export {
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/company/company-schema";

export {
  formatAddressLines,
  formatBusinessFormDisplay,
  formatContentResponsibleLine,
  formatLegalAddressBlock,
  formatLegalContactLine,
  formatProviderInlineReference,
  formatProviderShortReference,
  formatSupportContactLine,
  formatVatLine,
  LEGAL_ADDRESS_BLOCK,
  LEGAL_LAST_UPDATED,
  LEGAL_UI_LABELS,
} from "@/lib/company/company-legal";
