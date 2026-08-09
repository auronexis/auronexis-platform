export {
  enterpriseOfferJsonLd,
  faqJsonLd,
  merchantReturnPolicyJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  pricingPageJsonLd,
  pricingPlanProductsJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/company/company-schema";

import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { getCanonicalUrl, resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import { COMPANY_SEO } from "@/lib/company";
import { GRAPH_ENTITY_IDS } from "@/lib/seo/entity-graph";

type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Safe BreadcrumbList JSON-LD for pages with visible breadcrumb navigation. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: unique.map((item, index) => ({
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
      "@id": GRAPH_ENTITY_IDS.organization,
      name: COMPANY_SEO.companyName,
    },
  };
}

type WebPageSchemaType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "FAQPage"
  | "CollectionPage"
  | "PrivacyPolicy"
  | "TermsOfService";

/** Generic WebPage schema for public marketing surfaces. */
export function webPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  pageType?: WebPageSchemaType;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.pageType ?? "WebPage",
    name: input.title,
    description: input.description,
    url: getCanonicalUrl(input.path).toString(),
    inLanguage: "en",
    isPartOf: {
      "@id": GRAPH_ENTITY_IDS.website,
    },
    about: {
      "@id": GRAPH_ENTITY_IDS.organization,
    },
    publisher: {
      "@id": GRAPH_ENTITY_IDS.organization,
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

/** PrivacyPolicy WebPage schema. */
export function privacyPolicyJsonLd(input: { title: string; description: string }) {
  return webPageJsonLd({
    ...input,
    path: "/privacy",
    pageType: "PrivacyPolicy",
  });
}

/** TermsOfService WebPage schema. */
export function termsOfServiceJsonLd(input: { title: string; description: string }) {
  return webPageJsonLd({
    ...input,
    path: "/terms",
    pageType: "TermsOfService",
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
      "@id": GRAPH_ENTITY_IDS.organization,
      name: COMPANY_SEO.companyName,
    },
    about: {
      "@type": "Thing",
      name: COMPANY_INFORMATION.productName,
    },
  };
}
