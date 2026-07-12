export {
  enterpriseOfferJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  pricingPageJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/company/company-schema";

import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { getCanonicalUrl, resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
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
      item: new URL(item.path, resolveCanonicalBaseUrl()).toString(),
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
    url: new URL(input.path, resolveCanonicalBaseUrl()).toString(),
    dateModified: input.dateModified,
    publisher: {
      "@type": "Organization",
      name: COMPANY_SEO.companyName,
    },
  };
}

/** Generic WebPage schema for public marketing surfaces. */
export function webPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.pageType ?? "WebPage",
    name: input.title,
    description: input.description,
    url: getCanonicalUrl(input.path).toString(),
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: COMPANY_INFORMATION.productName,
      url: resolveCanonicalBaseUrl(),
    },
  };
}

/** AboutPage schema for the public company page. */
export function aboutPageJsonLd(input: { title: string; description: string }) {
  return webPageJsonLd({
    ...input,
    path: "/about",
    pageType: "AboutPage",
  });
}

/** ContactPage schema for the public contact surface. */
export function contactPageJsonLd(input: { title: string; description: string }) {
  return webPageJsonLd({
    ...input,
    path: "/contact",
    pageType: "ContactPage",
  });
}

/** TechArticle schema for product documentation pages. */
export function techArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description,
    url: new URL(input.path, resolveCanonicalBaseUrl()).toString(),
    dateModified: input.dateModified,
    publisher: {
      "@type": "Organization",
      name: COMPANY_SEO.companyName,
    },
  };
}
