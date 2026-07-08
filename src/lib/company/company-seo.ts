import { COMPANY_INFORMATION } from "@/lib/company/company-information";

export const COMPANY_SEO = {
  productName: COMPANY_INFORMATION.productName,
  companyName: COMPANY_INFORMATION.legalName,
  canonicalBaseUrl: COMPANY_INFORMATION.website,
  defaultTitle: COMPANY_INFORMATION.productName,
  defaultDescription: COMPANY_INFORMATION.shortDescription,
  openGraph: {
    type: "website" as const,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image" as const,
  },
} as const;

export type CompanySeo = typeof COMPANY_SEO;

export function getCanonicalUrl(path: string): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, COMPANY_SEO.canonicalBaseUrl);
}

export function getPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${COMPANY_SEO.productName}`;
}
