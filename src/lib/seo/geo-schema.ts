import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { getCanonicalUrl } from "@/lib/company/company-seo";
import { GRAPH_ENTITY_IDS, pageEntityId } from "@/lib/seo/entity-graph";
import type { LandingPageContent } from "@/lib/seo/landing-page-types";
import type { SolutionPageContent } from "@/lib/seo/landing-content";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type LandingGraphInput = {
  content: LandingPageContent;
  breadcrumbs: readonly BreadcrumbItem[];
};

type SolutionGraphInput = {
  content: SolutionPageContent;
  breadcrumbs: readonly BreadcrumbItem[];
};

function stripContext(entity: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...entity };
  delete rest["@context"];
  return rest;
}

function breadcrumbList(items: readonly BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path).toString(),
    })),
  };
}

function faqPage(items: ReadonlyArray<{ question: string; answer: string }>) {
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function landingAboutEntity(content: LandingPageContent) {
  const schemaType =
    content.category === "feature"
      ? "SoftwareApplication"
      : content.category === "industry" || content.category === "audience"
        ? "Service"
        : "Thing";

  return {
    "@type": schemaType,
    "@id": `${pageEntityId(content.path)}/topic`,
    name: content.title,
    description: content.metaDescription,
    url: getCanonicalUrl(content.path).toString(),
    provider: { "@id": GRAPH_ENTITY_IDS.organization },
    isPartOf: { "@id": GRAPH_ENTITY_IDS.softwareApplication },
  };
}

/** Linked @graph JSON-LD for feature, audience, and industry landing pages. */
export function landingPageGraphJsonLd(input: LandingGraphInput) {
  const { content, breadcrumbs } = input;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": pageEntityId(content.path),
      name: content.title,
      description: content.metaDescription,
      url: getCanonicalUrl(content.path).toString(),
      inLanguage: "en",
      isPartOf: { "@id": GRAPH_ENTITY_IDS.website },
      about: { "@id": `${pageEntityId(content.path)}/topic` },
      publisher: { "@id": GRAPH_ENTITY_IDS.organization },
    },
    landingAboutEntity(content),
    breadcrumbList(breadcrumbs),
  ];

  const faq = faqPage(content.faq);
  if (faq) graph.push(faq);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Linked @graph JSON-LD for capability solution pages. */
export function solutionPageGraphJsonLd(input: SolutionGraphInput) {
  const { content, breadcrumbs } = input;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": pageEntityId(content.path),
      name: content.title,
      description: content.metaDescription,
      url: getCanonicalUrl(content.path).toString(),
      inLanguage: "en",
      isPartOf: { "@id": GRAPH_ENTITY_IDS.website },
      publisher: { "@id": GRAPH_ENTITY_IDS.organization },
    },
    {
      "@type": "Service",
      "@id": `${pageEntityId(content.path)}/service`,
      name: content.title,
      description: content.metaDescription,
      url: getCanonicalUrl(content.path).toString(),
      provider: { "@id": GRAPH_ENTITY_IDS.organization },
      areaServed: "Worldwide",
    },
    breadcrumbList(breadcrumbs),
  ];

  const faq = faqPage(content.faq);
  if (faq) graph.push(faq);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

type CollectionPageInput = {
  title: string;
  description: string;
  path: string;
  items: ReadonlyArray<{ name: string; path: string; description: string }>;
};

/** CollectionPage + ItemList for hub surfaces (features, docs, FAQ index). */
export function collectionPageGraphJsonLd(input: CollectionPageInput) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageEntityId(input.path),
        name: input.title,
        description: input.description,
        url: getCanonicalUrl(input.path).toString(),
        inLanguage: "en",
        isPartOf: { "@id": GRAPH_ENTITY_IDS.website },
        publisher: { "@id": GRAPH_ENTITY_IDS.organization },
      },
      {
        "@type": "ItemList",
        name: input.title,
        itemListElement: input.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: getCanonicalUrl(item.path).toString(),
          description: item.description,
        })),
      },
    ],
  };
}

type DocPageGraphInput = {
  title: string;
  description: string;
  path: string;
  faq: ReadonlyArray<{ question: string; answer: string }>;
  breadcrumbs: readonly BreadcrumbItem[];
};

/** Documentation page graph with TechArticle, breadcrumb, and visible FAQ. */
export function docPageGraphJsonLd(input: DocPageGraphInput) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "TechArticle",
      "@id": pageEntityId(input.path),
      headline: input.title,
      description: input.description,
      url: getCanonicalUrl(input.path).toString(),
      inLanguage: "en",
      publisher: { "@id": GRAPH_ENTITY_IDS.organization },
      isPartOf: { "@id": GRAPH_ENTITY_IDS.website },
    },
    breadcrumbList(input.breadcrumbs),
  ];

  const faq = faqPage(input.faq);
  if (faq) graph.push(faq);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Homepage knowledge graph linking Organization, WebSite, and SoftwareApplication. */
export function homePageGraphJsonLd(
  faq: ReadonlyArray<{ question: string; answer: string }>,
  organization: Record<string, unknown>,
  website: Record<string, unknown>,
  softwareApplication: Record<string, unknown>,
) {
  const graph: Record<string, unknown>[] = [
    stripContext(organization),
    stripContext(website),
    stripContext(softwareApplication),
  ];
  const faqNode = faqPage(faq);
  if (faqNode) graph.push(faqNode);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function pricingGraphJsonLd(product: Record<string, unknown>) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      stripContext(product),
      {
        "@type": "WebPage",
        "@id": pageEntityId("/pricing"),
        name: "Pricing",
        url: getCanonicalUrl("/pricing").toString(),
        isPartOf: { "@id": GRAPH_ENTITY_IDS.website },
        about: { "@id": GRAPH_ENTITY_IDS.product },
      },
    ],
  };
}

export const PLATFORM_DEFINITION = {
  term: COMPANY_INFORMATION.productName,
  category: "AI Operations Platform",
  definition: COMPANY_INFORMATION.shortDescription,
  audience: "MSPs, IT agencies, consultancies, and automation firms managing multi-client portfolios.",
} as const;
