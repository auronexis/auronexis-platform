export {
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/company/company-schema";

import { COMPANY_SEO } from "@/lib/company";

type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Safe BreadcrumbList JSON-LD for pages with visible breadcrumb navigation. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, COMPANY_SEO.canonicalBaseUrl).toString(),
    })),
  };
}

/** Article schema for documentation pages with real authored content. */
export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: new URL(input.path, COMPANY_SEO.canonicalBaseUrl).toString(),
    dateModified: input.dateModified,
    publisher: {
      "@type": "Organization",
      name: COMPANY_SEO.companyName,
    },
  };
}
